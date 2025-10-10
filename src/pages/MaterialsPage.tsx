import { useMemo, useState } from "react";
import { materials, categories } from "../data";
import type { Category, Material } from "../types";
import MaterialBadges from "../components/MaterialBadges";
import CategoryBadge from "../components/CategoryBadge";

const COMPATS = ["Gambison","Cuir","Métal"] as const;
type Compat = typeof COMPATS[number];
type SortKey = "name" | "_compat" | "modPA" | "malusMod" | "extraPen";

export default function MaterialsPage(){
  const [compat, setCompat] = useState<Compat | "Toutes">("Toutes");
  const [cat, setCat] = useState<string>("Toutes");
  const [q, setQ] = useState("");

  const catByKey = useMemo(()=> {
    const m = new Map<string, Category>();
    categories.forEach(c=>m.set(c.key, c));
    return m;
  }, []);

  const catOptions = useMemo(()=>{
    const list = categories
      .filter(c => compat==="Toutes" ? true : c.compat === compat)
      .sort((a,b)=>a.sort-b.sort);
    return ["Toutes", ...list.map(c=>c.key)];
  }, [compat]);

  const [sort, setSort] = useState<{key:SortKey; dir:"asc"|"desc"}>({key:"name", dir:"asc"});

  const items = useMemo(()=>{
    const qlc = q.trim().toLowerCase();
    let arr = materials as Material[];
    if (compat !== "Toutes") arr = arr.filter(m => m.compat === compat);
    if (cat !== "Toutes")    arr = arr.filter(m => m.category === cat);
    if (qlc)                 arr = arr.filter(m => m.name.toLowerCase().includes(qlc));

    const withLabels = arr.map(m => ({
      ...m,
      _catLabel: catByKey.get(m.category)?.label ?? m.category,
      _catKey:   m.category,
      _compat:   m.compat
    }));

    const dir = sort.dir === "asc" ? 1 : -1;
    const key = sort.key;
    const orderCompat: Record<string, number> = { Gambison:0, Cuir:1, Métal:2 };

    withLabels.sort((a:any,b:any)=>{
      const va = key === "_compat" ? orderCompat[a._compat] ?? 99 : a[key];
      const vb = key === "_compat" ? orderCompat[b._compat] ?? 99 : b[key];
      if (typeof va === "number" && typeof vb === "number") return (va - vb)*dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return withLabels;
  }, [compat, cat, q, sort, catByKey]);

  function toggleSort(k: SortKey){ setSort(s => s.key === k ? { key:k, dir: s.dir==="asc"?"desc":"asc" } : { key:k, dir:"asc" }); }
  const ariaSort = (k:SortKey) => sort.key!==k ? "none" : (sort.dir==="asc"?"ascending":"descending");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Matériaux</h2>

      {/* Filtres */}
      <div className="grid md:grid-cols-4 gap-3 text-sm">
        <div>
          <label className="opacity-70 mb-1 block">Compatibilité (châssis)</label>
          <select className="input" value={compat} onChange={e=>setCompat(e.target.value as any)}>
            <option>Toutes</option>
            {COMPATS.map(c=> <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="opacity-70 mb-1 block">Catégorie (affinage)</label>
          <select className="input" value={cat} onChange={e=>setCat(e.target.value)}>
            {catOptions.map(k => {
              const c = catByKey.get(k);
              return <option key={k} value={k}>{k==="Toutes" ? "Toutes" : (c?.label ?? k)}</option>
            })}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="opacity-70 mb-1 block">Recherche</label>
          <input className="input" placeholder="Rechercher un matériau…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <Th k="name"     activeKey={sort.key} dir={sort.dir} onToggle={toggleSort}>Matériau</Th>
              <Th k="_compat"  activeKey={sort.key} dir={sort.dir} onToggle={toggleSort}>Compat.</Th>
              <Th k="modPA"    activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} align="right">Mod&nbsp;PA</Th>
              <Th k="malusMod" activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} align="right">Malus&nbsp;Mod</Th>
              <Th k="extraPen" activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} align="right">Usure&nbsp;Pénétration</Th>
              <th className="px-3 py-2 text-left">Effets / Résistances</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m:any)=>(
              <tr key={m.name} className="border-t hover:bg-slate-50 focus-within:bg-slate-50">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge keyName={m._catKey} label={m._catLabel} />
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                {/* colonne Catégorie supprimée */}
                <td className="px-3 py-2">{m._compat}</td>
                <td className="px-3 py-2 text-right tabular">{m.modPA}</td>
                <td className="px-3 py-2 text-right tabular">{m.malusMod}</td>
                <td className="px-3 py-2 text-right tabular">{m.extraPen ?? 0}</td>
                <td className="px-3 py-2"><MaterialBadges mat={m} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  k, children, activeKey, dir, onToggle, align="left"
}: {k: SortKey; children:React.ReactNode; activeKey:SortKey; dir:"asc"|"desc"; onToggle:(k:SortKey)=>void; align?:"left"|"right" }){
  const active = activeKey === k;
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(k); }
  };
  return (
    <th
      role="button"
      tabIndex={0}
      aria-sort={active ? (dir==="asc"?"ascending":"descending") : "none"}
      className={`px-3 py-2 cursor-pointer select-none text-${align} ${active?"text-slate-900":"text-slate-600"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
      onClick={()=>onToggle(k)}
      onKeyDown={onKeyDown}
      title="Trier"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <span className="opacity-60">{active ? (dir==="asc" ? "▲" : "▼") : "↕"}</span>
      </span>
    </th>
  );
}
