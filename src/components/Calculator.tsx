import { useEffect, useMemo, useState } from "react";
import { chassis, materials, qualities, shields, params, categories } from "../data";
import { computeBuild } from "../lib/calc";
import type { BuildInput, Category } from "../types";
import InputRow from "./InputRow";
import RatioPill from "./RatioPill";
import { validateChassis, validateCategories, validateMaterials } from "../lib/validate";
import CompatBadge from "./CompatBadge";

// Validations runtime (une seule fois)
validateChassis(chassis);
validateCategories(categories);
validateMaterials(materials);

export default function Calculator(){
  const [cat, setCat] = useState<string>("");

  // Compat attendue par le châssis (Gambison | Cuir | Métal)
  const [inp, setInp] = useState<BuildInput>(() => {
    const last = localStorage.getItem("lastBuild");
    return last ? JSON.parse(last) : {
      chassis: chassis[0].name,
      material: materials[0].name,
      quality:  qualities[1].name, // Standard
      renfort:  0,
      enchant:  0,
      shield:   shields[0].name
    };
  });
  useEffect(() => localStorage.setItem("lastBuild", JSON.stringify(inp)), [inp]);

  const expectedCompat = useMemo(
    () => chassis.find(c => c.name === inp.chassis)?.category,
    [inp.chassis]
  );

  // Catégories triées (label humain + compat) — **déclarée une seule fois**
  const categoriesSorted = useMemo(
    () => [...categories].sort((a: Category, b: Category) => a.sort - b.sort),
    [categories]
  );

  // Seulement les catégories compatibles avec le châssis
  const categoriesForChassis = useMemo(
    () => categoriesSorted.filter(c => !expectedCompat || c.compat === expectedCompat),
    [categoriesSorted, expectedCompat]
  );

  // Forcer la catégorie si invalide / au changement de châssis
  useEffect(() => {
    if (!categoriesForChassis.length) return;
    if (!cat || !categoriesForChassis.find(c => c.key === cat)) {
      setCat(categoriesForChassis[0].key);
    }
  }, [categoriesForChassis]); // ne pas mettre "cat" pour éviter boucle

  // Matériaux filtrés : 1) compat châssis (obligatoire) 2) categorie d’affinage (sélectionnée)
  const mats = useMemo(() => {
    const byCompat = expectedCompat ? materials.filter(m => m.compat === expectedCompat) : materials;
    const byCat    = cat ? byCompat.filter(m => m.category === cat) : byCompat;
    return byCat.sort((a, b) => a.name.localeCompare(b.name));
  }, [expectedCompat, cat]);

  // Garde-fou si le matériau devient invalide
  useEffect(() => {
    if (!mats.find(m => m.name === inp.material)) {
      if (mats.length > 0) setInp(s => ({ ...s, material: mats[0].name }));
    }
  }, [mats, inp.material]);

  const res = useMemo(
    () => computeBuild(inp, { chassis, materials, qualities, shields, params }),
    [inp]
  );

  // objets sélectionnés (pour le badge)
  const chCurrent  = useMemo(() => chassis.find(c => c.name === inp.chassis), [inp.chassis]);
  const matCurrent = useMemo(() => materials.find(m => m.name === inp.material), [inp.material]);


  const onNum = (k: keyof Pick<BuildInput, "renfort" | "enchant">) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setInp(s => ({ ...s, [k]: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }));

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Calculateur d'armure (v10.3.7)</h1>
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
            <input className="input" type="number" min={0} max={3} value={inp.renfort} onChange={onNum("renfort")} />
          </InputRow>

          <InputRow label="Enchant">
            <input className="input" type="number" min={0} max={3} value={inp.enchant} onChange={onNum("enchant")} />
          </InputRow>

          <InputRow label="Bouclier">
            <select className="input" value={inp.shield} onChange={e => setInp({ ...inp, shield: e.target.value })}>
              {shields.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </InputRow>
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
                <RatioPill ratio={res.effic} ok={res.sweet} />
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
          </div>
        </div>
      </div>
    </div>
  );
}
