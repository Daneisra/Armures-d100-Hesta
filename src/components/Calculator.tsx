import { useCallback, useEffect, useMemo, useState } from "react";
import { computeBuild } from "../lib/calc";
import type { BuildInput, Category } from "../types";
import InputRow from "./InputRow";
import RatioPill from "./RatioPill";
import CompatBadge from "./CompatBadge";
import WearWidget from "./WearWidget";
import RepairWidget from "./RepairWidget";
import { addBuild } from "../buildCatalog";
import { useCatalogData } from "../catalogContext";
import { cls } from "../ui/styles";
import { useLocation, useNavigate } from "react-router-dom";

// --- localStorage versionning ---
const SCHEMA = 2;
const STORAGE_KEY = `lastBuild_v${SCHEMA}`;
const LEGACY_KEYS = ["lastBuild"];
const CAT_KEY = "lastBuildCat_v2";

export default function Calculator(){
  const { chassis, materials, qualities, shields, params, categories, enchants, shieldMaterials } = useCatalogData();
  const location = useLocation();
  const navigate = useNavigate();

  const sanitize = useCallback((b: BuildInput): BuildInput => {
    const safe = { ...b } as BuildInput;
    const has = (name: string, list: {name:string}[]) => list.some(x => x.name === name);

    if (!has(safe.chassis,   chassis))   safe.chassis   = chassis[0]?.name ?? "";
    if (!has(safe.material,  materials)) safe.material  = materials[0]?.name ?? "";
    if (!qualities.some(q=>q.name===safe.quality)) safe.quality = qualities[0]?.name ?? "";
    if (!has(safe.shield,    shields))   safe.shield    = shields[0]?.name ?? "";

    if (safe.shield !== "Aucun") {
      const okShieldMat = (shieldMaterials||[]).some(m => m.name === safe.shieldMaterial);
      if (!okShieldMat) safe.shieldMaterial = shieldMaterials?.[0]?.name ?? "";
    } else {
      safe.shieldMaterial = "";
    }

    if (!safe.enchantId) safe.enchantId = "protection";
    if (typeof safe.enchant !== "number") safe.enchant = 0;
    return safe;
  }, [chassis, materials, qualities, shields, shieldMaterials]);

  const defaults = useMemo<BuildInput>(() => ({
    chassis: chassis[0]?.name ?? "",
    material: materials[0]?.name ?? "",
    quality:  qualities[1]?.name ?? qualities[0]?.name ?? "",
    renfort:  0,
    enchant:  0,
    enchantId: "protection",
    shield:   shields[0]?.name ?? "",
    shieldMaterial: shieldMaterials?.[0]?.name ?? "",
    cat: localStorage.getItem(CAT_KEY) ?? "",
  }), [chassis, materials, qualities, shields, shieldMaterials]);

  // --- �tat principal (avec migration + fallback s�r) ---
  const [inp, setInp] = useState<BuildInput>(() => {
    try {
      const rawNew = localStorage.getItem(STORAGE_KEY);
      const rawLegacy = LEGACY_KEYS.map(k => localStorage.getItem(k)).find(Boolean) ?? null;
      const base = rawNew ?? rawLegacy;
      const init = base ? sanitize(JSON.parse(base)) : sanitize(defaults);
      if (!rawNew && rawLegacy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
        LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
      }
      return init;
    } catch {
      return sanitize(defaults);
    }
  });

  // Hydrate depuis un build appliqué via navigation state (sans reload)
  useEffect(() => {
    const state = location.state as { build?: BuildInput; cat?: string } | null;
    if (state?.build) {
      const next = sanitize(state.build);
      setInp(next);
      if (state.cat) setCat(state.cat);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (state.cat) localStorage.setItem(CAT_KEY, state.cat);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, sanitize, navigate, location.pathname]);

  // sauvegarde versionn�e
  useEffect(()=> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inp));
  }, [inp]);

  // reset local config (bouton)
  const resetLocal = () => {
    if (!window.confirm("Effacer la configuration locale et recharger ?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CAT_KEY);
    LEGACY_KEYS.forEach(k=>localStorage.removeItem(k));
    window.location.reload();
  };

  // --- filtre catégorie pilotée par châssis ---
  const [cat, setCat] = useState<string>(() => localStorage.getItem(CAT_KEY) ?? defaults.cat ?? "");

  const expectedCompat = useMemo(
    () => chassis.find(c => c.name === inp.chassis)?.category,
    [chassis, inp.chassis]
  );

  const categoriesSorted = useMemo(
    () => [...categories].sort((a: Category, b: Category) => a.sort - b.sort),
    [categories]
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
  }, [categoriesForChassis]);

  useEffect(() => {
    if (cat) localStorage.setItem(CAT_KEY, cat);
  }, [cat]);

  const mats = useMemo(() => {
    const byCompat = expectedCompat ? materials.filter(m => m.compat === expectedCompat) : materials;
    const byCat    = cat ? byCompat.filter(m => m.category === cat) : byCompat;
    return byCat.sort((a, b) => a.name.localeCompare(b.name));
  }, [expectedCompat, cat, materials]);

  useEffect(() => {
    if (!mats.find(m => m.name === inp.material) && mats.length > 0) {
      setInp(s => ({ ...s, material: mats[0].name }));
    }
  }, [mats, inp.material]);

  const res = useMemo(
    () => computeBuild(inp, { chassis, materials, qualities, shields, params, enchants, shieldMaterials }),
    [inp, chassis, materials, qualities, shields, params, enchants, shieldMaterials]
  );
  const cardFx = "animate-in fade-in slide-in-from-bottom-2 duration-200";

  const chCurrent  = useMemo(() => chassis.find(c => c.name === inp.chassis), [chassis, inp.chassis]);
  const matCurrent = useMemo(() => materials.find(m => m.name === inp.material), [materials, inp.material]);
  const qCurrent   = useMemo(() => qualities.find(q => q.name === inp.quality), [qualities, inp.quality]);
  const enchCurrent= useMemo(() => enchants.find(e => e.id === (inp.enchantId ?? "protection")), [enchants, inp.enchantId]);
  const compatOk = Boolean(chCurrent && matCurrent && matCurrent.compat === chCurrent.category);

  const onNum = (k: keyof Pick<BuildInput, "renfort" | "enchant">) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setInp(s => ({ ...s, [k]: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }));

  const materialForWear = useMemo(() => {
    if (!matCurrent || !enchCurrent || (inp.enchant ?? 0) <= 0) return matCurrent;
    if (enchCurrent.kind !== "extraPen_delta") return matCurrent;
    const delta = (enchCurrent.perLevel ?? 0) * (inp.enchant ?? 0);
    return { ...matCurrent, extraPen: Math.max(0, (matCurrent.extraPen ?? 0) + delta) };
  }, [matCurrent, enchCurrent, inp.enchant]);

  const ratioValue = res.malusFinal <= 0 ? Infinity : res.paFinal / res.malusFinal;
  const ratioSpoken = Number.isFinite(ratioValue) ? ratioValue.toFixed(2) : "infini";

  return (
    <div className={`${cls.page} max-w-4xl space-y-6`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calculateur d'armure <span className="text-sm opacity-60">v{__APP_VERSION__}</span></h1>
        <button className={cls.btnGhost} onClick={resetLocal} title="Efface la configuration locale et recharge">
          Réinitialiser la config locale
        </button>
      </div>
      <p className="text-sm opacity-80">
        D100 inversé - objectif : ratio PA/Malus ˜ {params.sweetSpotRatio}
      </p>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
        <section className={`${cls.card} ${cardFx}`}>
          <h2 className="text-base font-semibold mb-3">Entrées</h2>

          <InputRow label="Châssis" id="calc-chassis">
            <select
              id="calc-chassis"
              className={cls.select}
              value={inp.chassis}
              onChange={e => setInp({ ...inp, chassis: e.target.value })}
            >
              {chassis.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Catégorie (affinage)" id="calc-category">
            <select id="calc-category" className={cls.select} value={cat} onChange={e => setCat(e.target.value)}>
              {categoriesForChassis.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </InputRow>

          <InputRow label="Matériau" id="calc-material">
            <select
              id="calc-material"
              className={cls.select}
              value={inp.material}
              onChange={e => setInp({ ...inp, material: e.target.value })}
            >
              {mats.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Qualité" id="calc-quality">
            <select
              id="calc-quality"
              className={cls.select}
              value={inp.quality}
              onChange={e => setInp({ ...inp, quality: e.target.value })}
            >
              {qualities.map(q => <option key={q.name} value={q.name}>{q.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Renfort" id="calc-renfort">
            <div>
              <input
                id="calc-renfort"
                className={cls.input}
                type="number"
                min={0}
                max={params.renfortMax}
                value={inp.renfort}
                onChange={onNum("renfort")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Chaque niveau ajoute +1 PA mais aussi +1 malus.
              </p>
            </div>
          </InputRow>

          <InputRow label="Enchantement" id="calc-enchant">
            <div>
              <select
                id="calc-enchant"
                className={cls.select}
                value={inp.enchantId ?? "protection"}
                onChange={e => setInp({ ...inp, enchantId: e.target.value })}
              >
                {enchants.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Choisis l'effet appliqué avant de fixer son niveau.
              </p>
            </div>
          </InputRow>

          <InputRow label="Niveau d'enchant" id="calc-enchant-level">
            <div>
              <input
                id="calc-enchant-level"
                className={cls.input}
                type="number"
                min={0}
                max={params.enchantMax}
                value={inp.enchant}
                onChange={e => setInp(s => ({
                  ...s,
                  enchant: Math.max(0, Math.min(params.enchantMax, parseInt(e.target.value||"0",10)||0)),
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limité à {params.enchantMax} niveaux selon tes règles.
              </p>
            </div>
          </InputRow>

          <InputRow label="Bouclier" id="calc-shield">
            <select
              id="calc-shield"
              className={cls.select}
              value={inp.shield}
              onChange={e => setInp({ ...inp, shield: e.target.value })}
            >
              {shields.map(s => <option key={s.name}>{s.name}</option>)}
            </select>
          </InputRow>

          {inp.shield !== "Aucun" && (
            <InputRow label="Matériau de bouclier" id="calc-shield-material">
              <select
                id="calc-shield-material"
                className={cls.select}
                value={inp.shieldMaterial ?? ""}
                onChange={e => setInp({ ...inp, shieldMaterial: e.target.value })}
              >
                {shieldMaterials.map(sm => <option key={sm.name} value={sm.name}>{sm.name}</option>)}
              </select>
            </InputRow>
          )}
        </section>

        <div className="space-y-4">
          <section className={`${cls.card} ${cardFx}`}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Résumé</h3>
            <div className="space-y-3 text-sm">
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
                  <span className={res.sweet ? cls.badgeGood : cls.badgeBad}>
                    {res.sweet ? "Bon équilibre" : "-"}
                  </span>
                </div>
              </div>

              {res.notes.length > 0 && (
                <div className="pt-2 border-t mt-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Effets</div>
                  <ul className={cls.noteList}>
                    {res.notes.map((n, i) => (<li key={i}>{n}</li>))}
                  </ul>
                </div>
              )}
            </div>
            <div aria-live="polite" className="sr-only">
              {`PA ${res.paFinal}, malus ${res.malusFinal}, ratio ${ratioSpoken}, ${compatOk ? "châssis et matériau compatibles." : "châssis et matériau incompatibles."} ${res.sweet ? "Bon équilibre." : ""}`}
            </div>
            <div className="pt-3 border-t mt-3 flex gap-2">
              <button
                className={cls.btnPrimary}
                onClick={() => {
                  const name = prompt("Nom du build à sauvegarder ?")?.trim();
                  if (!name) return;
                  addBuild({ name, build: { ...inp, cat }, cat });
                  alert("Build sauvegardé dans le catalogue local.");
                }}
              >
                Enregistrer ce build
              </button>
              <button
                className={cls.btnGhost}
                onClick={() => {
                  localStorage.setItem("lastBuild_v2", JSON.stringify({ ...inp, cat }));
                  localStorage.setItem("lastBuildCat_v2", cat);
                  alert("Build appliqué pour chargement rapide.");
                }}
              >
                Charger ce build
              </button>
            </div>
          </section>

          <section className={cls.card}>
            <h2 className="font-semibold mb-2">Légende</h2>
            <ul className={cls.noteList}>
              <li className="flex items-center">
                <span className={`${cls.badgeGood}`}>Compatible</span>
                <span className="ml-2 text-sm text-muted-foreground">→ châssis et matériau alignés.</span>
              </li>
              <li className="flex items-center">
                <span className={`${cls.badgeBad}`}>Incompatible</span>
                <span className="ml-2 text-sm text-muted-foreground">→ combinaison à éviter.</span>
              </li>
              <li className="flex items-center">
                <span className={`${cls.badgeWarn}`}>Sweet spot</span>
                <span className="ml-2 text-sm text-muted-foreground">→ ratio PA/malus favorable.</span>
              </li>
            </ul>
          </section>

          <WearWidget
            paFinal={res.paFinal}
            material={materialForWear}
            params={params}
            className={`${cls.card} ${cardFx}`}
          />
          <RepairWidget
            paMax={res.paFinal}
            material={matCurrent}
            quality={qCurrent}
            params={params}
            className={`${cls.card} ${cardFx}`}
          />
        </div>
      </div>
    </div>
  );
}
