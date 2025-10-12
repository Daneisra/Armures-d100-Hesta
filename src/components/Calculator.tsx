import { useEffect, useMemo, useState } from "react";
import { chassis, materials, qualities, shields, params, categories, enchants, shieldMaterials } from "../data";
import { computeBuild } from "../lib/calc";
import type { BuildInput, Category } from "../types";
import InputRow from "./InputRow";
import RatioPill from "./RatioPill";
import { validateChassis, validateCategories, validateMaterials } from "../lib/validate";
import CompatBadge from "./CompatBadge";
import WearWidget from "./WearWidget";
import RepairWidget from "./RepairWidget";

// --- validations runtime (1x) ---
validateChassis(chassis);
validateCategories(categories);
validateMaterials(materials);

// --- localStorage versionning ---
const SCHEMA = 2;
const STORAGE_KEY = `lastBuild_v${SCHEMA}`;
const LEGACY_KEYS = ["lastBuild"];

// --- helpers ---
const defaults: BuildInput = {
  chassis: chassis[0].name,
  material: materials[0].name,
  quality:  qualities[1]?.name ?? qualities[0].name,
  renfort:  0,
  enchant:  0,
  enchantId: "protection",
  shield:   shields[0].name,
  shieldMaterial: shieldMaterials?.[0]?.name ?? "",
};

function sanitize(b: BuildInput): BuildInput {
  const safe = { ...b };
  const has = (name: string, list: {name:string}[]) => list.some(x => x.name === name);

  if (!has(safe.chassis,   chassis))   safe.chassis   = chassis[0].name;
  if (!has(safe.material,  materials)) safe.material  = materials[0].name;
  if (!qualities.some(q=>q.name===safe.quality)) safe.quality = qualities[0].name;
  if (!has(safe.shield,    shields))   safe.shield    = shields[0].name;

  if (safe.shield !== "Aucun") {
    const okShieldMat = (shieldMaterials||[]).some(m => m.name === safe.shieldMaterial);
    if (!okShieldMat) safe.shieldMaterial = shieldMaterials?.[0]?.name ?? "";
  } else {
    safe.shieldMaterial = "";
  }

  if (!safe.enchantId) safe.enchantId = "protection";
  if (typeof safe.enchant !== "number") safe.enchant = 0;
  return safe;
}

export default function Calculator(){
  // --- état principal (avec migration + fallback sûr) ---
  const [inp, setInp] = useState<BuildInput>(() => {
    try {
      const rawNew = localStorage.getItem(STORAGE_KEY);
      const rawLegacy = LEGACY_KEYS.map(k => localStorage.getItem(k)).find(Boolean) ?? null;
      const base = rawNew ?? rawLegacy;
      const init = base ? sanitize(JSON.parse(base)) : sanitize(defaults);
      // migrate legacy -> new key
      if (!rawNew && rawLegacy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
        LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
      }
      return init;
    } catch {
      return sanitize(defaults);
    }
  });

  // sauvegarde versionnée
  useEffect(()=> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inp));
  }, [inp]);

  // reset local config (bouton)
  const resetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_KEYS.forEach(k=>localStorage.removeItem(k));
    location.reload();
  };

  // --- filtre catégorie piloté par châssis ---
  const [cat, setCat] = useState<string>("");

  const expectedCompat = useMemo(
    () => chassis.find(c => c.name === inp.chassis)?.category,
    [inp.chassis]
  );

  const categoriesSorted = useMemo(
    () => [...categories].sort((a: Category, b: Category) => a.sort - b.sort),
    []
  );

  const categoriesForChassis = useMemo(
    () => categoriesSorted.filter(c => !expectedCompat || c.compat === expectedCompat),
    [categoriesSorted, expectedCompat]
  );

  useEffect(() => {
    if (!categoriesForChassis.length) return;
    if (!cat || !categoriesForChassis.find(c => c.key === cat)) {
      setCat(categoriesForChassis[0].key);
    }
  }, [categoriesForChassis]); // (pas "cat" pour éviter boucle)

  const mats = useMemo(() => {
    const byCompat = expectedCompat ? materials.filter(m => m.compat === expectedCompat) : materials;
    const byCat    = cat ? byCompat.filter(m => m.category === cat) : byCompat;
    return byCat.sort((a, b) => a.name.localeCompare(b.name));
  }, [expectedCompat, cat]);

  useEffect(() => {
    if (!mats.find(m => m.name === inp.material) && mats.length > 0) {
      setInp(s => ({ ...s, material: mats[0].name }));
    }
  }, [mats, inp.material]);

  const res = useMemo(
    () => computeBuild(inp, { chassis, materials, qualities, shields, params, enchants, shieldMaterials }),
    [inp]
  );

  const chCurrent  = useMemo(() => chassis.find(c => c.name === inp.chassis), [inp.chassis]);
  const matCurrent = useMemo(() => materials.find(m => m.name === inp.material), [inp.material]);
  const qCurrent   = useMemo(() => qualities.find(q => q.name === inp.quality), [inp.quality]);
  const enchCurrent= useMemo(() => enchants.find(e => e.id === (inp.enchantId ?? "protection")), [inp.enchantId]);

  const onNum = (k: keyof Pick<BuildInput, "renfort" | "enchant">) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setInp(s => ({ ...s, [k]: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }));

  const materialForWear = useMemo(() => {
    if (!matCurrent || !enchCurrent || (inp.enchant ?? 0) <= 0) return matCurrent;
    if (enchCurrent.kind !== "extraPen_delta") return matCurrent;
    const delta = (enchCurrent.perLevel ?? 0) * (inp.enchant ?? 0);
    return { ...matCurrent, extraPen: Math.max(0, (matCurrent.extraPen ?? 0) + delta) };
  }, [matCurrent, enchCurrent, inp.enchant]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Calculateur d'armure <span className="text-sm opacity-60">v{__APP_VERSION__}</span></h1>
        <button className="btn" onClick={resetLocal} title="Efface la configuration locale et recharge">
          Réinitialiser la config locale
        </button>
      </div>
      <p className="text-sm opacity-80 mb-4">
        D100 inversé — objectif : ratio PA/Malus ≥ {params.sweetSpotRatio}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Entrées</h2>

          <InputRow label="Châssis">
            <select className="input" value={inp.chassis} onChange={e => setInp({ ...inp, chassis: e.target.value })}>
              {chassis.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Catégorie (affinage)">
            <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
              {categoriesForChassis.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </InputRow>

          <InputRow label="Matériau">
            <select className="input" value={inp.material} onChange={e => setInp({ ...inp, material: e.target.value })}>
              {mats.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Qualité">
            <select className="input" value={inp.quality} onChange={e => setInp({ ...inp, quality: e.target.value })}>
              {qualities.map(q => <option key={q.name} value={q.name}>{q.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Renfort">
            <input className="input" type="number" min={0} max={params.renfortMax} value={inp.renfort} onChange={onNum("renfort")} />
          </InputRow>

          <InputRow label="Enchantement">
            <select className="input" value={inp.enchantId ?? "protection"} onChange={e => setInp({ ...inp, enchantId: e.target.value })}>
              {enchants.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Niveau d'enchant">
            <input className="input" type="number" min={0} max={params.enchantMax} value={inp.enchant}
              onChange={e => setInp(s => ({ ...s, enchant: Math.max(0, Math.min(params.enchantMax, parseInt(e.target.value||"0",10)||0)) }))} />
          </InputRow>

          <InputRow label="Bouclier">
            <select className="input" value={inp.shield} onChange={e => setInp({ ...inp, shield: e.target.value })}>
              {shields.map(s => <option key={s.name}>{s.name}</option>)}
            </select>
          </InputRow>

          {inp.shield !== "Aucun" && (
            <InputRow label="Matériau de bouclier">
              <select className="input" value={inp.shieldMaterial ?? ""} onChange={e => setInp({ ...inp, shieldMaterial: e.target.value })}>
                {shieldMaterials.map(sm => <option key={sm.name} value={sm.name}>{sm.name}</option>)}
              </select>
            </InputRow>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Résumé</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>PA final</span><b className="tabular">{res.paFinal}</b></div>
            <div className="flex items-center justify-between"><span>Malus final</span><b className="tabular">{res.malusFinal}</b></div>
            <div className="flex items-center justify-between">
              <span>Compatibilité</span>
              <CompatBadge chassis={chCurrent} material={matCurrent} />
            </div>
            <div className="flex items-center justify-between">
              <span>Efficacité</span>
              <div className="flex items-center gap-2">
                <RatioPill ratio={res.effic} />
                <span className={`text-xs px-2 py-1 rounded ${res.sweet ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>
                  {res.sweet ? "Bon équilibre" : "—"}
                </span>
              </div>
            </div>

            {res.notes.length > 0 && (
              <div className="pt-2 border-t mt-2">
                <div className="opacity-70 mb-1">Effets</div>
                <ul className="list-disc pl-5">
                  {res.notes.map((n, i) => (<li key={i}>{n}</li>))}
                </ul>
              </div>
            )}

            <WearWidget paFinal={res.paFinal} material={materialForWear} params={params} />
            <RepairWidget paMax={res.paFinal} material={matCurrent} quality={qCurrent} params={params} />
          </div>
        </div>
      </div>
    </div>
  );
}
