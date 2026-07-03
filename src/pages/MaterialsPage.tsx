import { useMemo, useState } from "react";
import type { Category, Material } from "../types";
import { useEffect } from "react";
import MaterialBadges from "../components/MaterialBadges";
import CategoryBadge from "../components/CategoryBadge";
import { useCatalogData } from "../catalogContext";
import { cls } from "../ui/styles";
import AccessibleDialog from "../components/AccessibleDialog";

const COMPATS = ["Gambison","Cuir","M\u00E9tal"] as const;
type Compat = typeof COMPATS[number];
type SortKey = "name" | "_compat" | "modPA" | "malusMod" | "extraPen";
type MaterialRow = Material & {
  _catLabel: string;
  _catKey: string;
  _compat: Compat;
};

export default function MaterialsPage(){
  const { materials, categories, chassis } = useCatalogData();
  const [compat, setCompat] = useState<Compat | "Toutes">("Toutes");
  const [cat, setCat] = useState<string>("Toutes");
  const [q, setQ] = useState("");
  const [dense, setDense] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<Material | null>(null);
  const [comparedNames, setComparedNames] = useState<string[]>([]);
  const resetFilters = () => { setCompat("Toutes"); setCat("Toutes"); setQ(""); };
  const compatBadgeTone: Record<string, string> = {
    [COMPATS[0]]: cls.badgeInfo,
    [COMPATS[1]]: cls.badgeWarn,
    [COMPATS[2]]: cls.badgeNeutral,
  };

  const catByKey = useMemo(()=> {
    const m = new Map<string, Category>();
    categories.forEach(c=>m.set(c.key, c));
    return m;
  }, [categories]);

  const catOptions = useMemo(()=>{
    const list = categories
      .filter(c => compat==="Toutes" ? true : c.compat === compat)
      .sort((a,b)=>a.sort-b.sort);
    return ["Toutes", ...list.map(c=>c.key)];
  }, [categories, compat]);

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
    const orderCompat = COMPATS.reduce<Record<string, number>>((acc, label, idx) => {
      acc[label] = idx;
      return acc;
    }, {});

    withLabels.sort((a: MaterialRow,b: MaterialRow)=>{
      const va = key === "_compat" ? orderCompat[a._compat] ?? 99 : a[key] ?? 0;
      const vb = key === "_compat" ? orderCompat[b._compat] ?? 99 : b[key] ?? 0;
      if (typeof va === "number" && typeof vb === "number") return (va - vb)*dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return withLabels;
  }, [materials, compat, cat, q, sort, catByKey]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );
  const compared = useMemo(
    () => comparedNames.map(name => materials.find(material => material.name === name)).filter((material): material is Material => Boolean(material)),
    [comparedNames, materials]
  );

  useEffect(() => setPage(1), [compat, cat, q, sort, pageSize]);
  useEffect(() => setPage(current => Math.min(current, pageCount)), [pageCount]);
  useEffect(() => {
    const available = new Set(materials.map(material => material.name));
    setComparedNames(current => current.filter(name => available.has(name)));
  }, [materials]);

  const toggleCompared = (name: string) => {
    setComparedNames(current => current.includes(name)
      ? current.filter(item => item !== name)
      : current.length < 3 ? [...current, name] : current
    );
  };

  function toggleSort(k: SortKey){
    setSort(s => s.key === k ? { key:k, dir: s.dir==="asc"?"desc":"asc" } : { key:k, dir:"asc" });
  }

  const cellPadding = dense ? "py-1 text-xs" : "py-2 text-sm";

  const toCSV = (rows: Record<string, any>[], headers: { key: string; label: string }[]) => {
    const escape = (v: any) => {
      const s = v === undefined || v === null ? "" : String(v);
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const headerLine = headers.map(h => escape(h.label)).join(",");
    const lines = rows.map(r => headers.map(h => escape(r[h.key])).join(","));
    return [headerLine, ...lines].join("\n");
  };

  const download = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMaterialsCSV = () => {
    const headers = [
      { key: "name", label: "Nom" },
      { key: "category", label: "Categorie" },
      { key: "compat", label: "Compat" },
      { key: "modPA", label: "ModPA" },
      { key: "malusMod", label: "MalusMod" },
      { key: "extraPen", label: "ExtraPen" },
      { key: "penIgnore", label: "PenIgnore" },
      { key: "effects", label: "Effets" },
    ];
    const csv = toCSV(materials, headers);
    download(csv, "materiaux.csv");
  };

  const exportChassisCSV = () => {
    const headers = [
      { key: "name", label: "Nom" },
      { key: "group", label: "Groupe" },
      { key: "category", label: "Compat" },
      { key: "basePA", label: "BasePA" },
      { key: "baseMalus", label: "BaseMalus" },
    ];
    const csv = toCSV(chassis, headers);
    download(csv, "chassis.csv");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Matériaux</h2>

      {/* Filtres */}
      <div className="grid md:grid-cols-5 gap-3 text-sm">
        <div>
          <label className="opacity-70 mb-1 block">Compatibilité (châssis)</label>
          <select className={cls.select} value={compat} onChange={e=>setCompat(e.target.value as any)}>
            <option>Toutes</option>
            {COMPATS.map(c=> <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="opacity-70 mb-1 block">Catégorie (affinage)</label>
          <select className={cls.select} value={cat} onChange={e=>setCat(e.target.value)}>
            {catOptions.map(k => {
              const c = catByKey.get(k);
              return <option key={k} value={k}>{k==="Toutes" ? "Toutes" : (c?.label ?? k)}</option>
            })}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="opacity-70 mb-1 block">Recherche</label>
          <input className={cls.input} placeholder="Rechercher un matériau" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <button className={cls.btnGhost} onClick={resetFilters}>Réinitialiser</button>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={dense} onChange={e=>setDense(e.target.checked)} />
            Densité compacte
          </label>
          <button className={cls.btnGhost} onClick={exportMaterialsCSV} title="Export CSV des matériaux">Export matériaux (CSV)</button>
          <button className={cls.btnGhost} onClick={exportChassisCSV} title="Export CSV des châssis">Export châssis (CSV)</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          <strong className="text-foreground">{items.length}</strong> matériau{items.length > 1 ? "x" : ""}
          {compared.length > 0 && <> — <strong className="text-foreground">{compared.length}</strong>/3 comparé{compared.length > 1 ? "s" : ""}</>}
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="materials-page-size" className="text-muted-foreground">Lignes par page</label>
          <select
            id="materials-page-size"
            className={`${cls.select} w-auto py-1`}
            value={pageSize}
            onChange={event => setPageSize(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {compared.length > 0 && (
        <ComparisonPanel materials={compared} onRemove={name => toggleCompared(name)} onClear={() => setComparedNames([])} />
      )}

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border">
        <table className={`w-full min-w-[920px] ${dense ? "text-xs" : "text-sm"}`}>
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
            <tr>
              <th className={`w-10 px-3 ${dense ? "py-1" : "py-2"}`}><span className="sr-only">Comparer</span></th>
              <Th k="name"     activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} compact={dense}>Matériau</Th>
              <Th k="_compat"  activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} compact={dense}>Compat.</Th>
              <Th k="modPA"    activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} align="right" compact={dense}>Mod&nbsp;PA</Th>
              <Th k="malusMod" activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} align="right" compact={dense}>Malus&nbsp;Mod</Th>
              <Th k="extraPen" activeKey={sort.key} dir={sort.dir} onToggle={toggleSort} align="right" compact={dense}>Usure&nbsp;Pénétration</Th>
              <th className={`px-3 ${dense ? "py-1 text-xs" : "py-2 text-sm"} text-left text-muted-foreground`}>Effets / Résistances</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((m: MaterialRow)=>(
              <tr key={m.name} className="border-t hover:bg-muted/40 focus-within:bg-muted/40 transition-colors odd:bg-muted/30">
                <td className={`px-3 ${cellPadding}`}>
                  <input
                    type="checkbox"
                    checked={comparedNames.includes(m.name)}
                    disabled={!comparedNames.includes(m.name) && comparedNames.length >= 3}
                    onChange={() => toggleCompared(m.name)}
                    aria-label={`Comparer ${m.name}`}
                    title={comparedNames.length >= 3 && !comparedNames.includes(m.name) ? "Maximum 3 matériaux" : "Ajouter au comparateur"}
                  />
                </td>
                <td className={`px-3 ${cellPadding}`}>
                  <div className="flex items-center gap-2">
                    <CategoryBadge keyName={m._catKey} label={m._catLabel} />
                    <button className="font-medium underline-offset-2 hover:underline focus-visible:underline" type="button" onClick={() => setDetail(m)}>
                      {m.name}
                    </button>
                  </div>
                </td>
                <td className={`px-3 ${cellPadding}`}>
                  <span className={`${compatBadgeTone[m._compat] ?? cls.badgeNeutral} uppercase tracking-wide`}>
                    {m._compat}
                  </span>
                </td>
                <td className={`px-3 ${cellPadding} text-right tabular`}>{m.modPA}</td>
                <td className={`px-3 ${cellPadding} text-right tabular`}>{m.malusMod}</td>
                <td className={`px-3 ${cellPadding} text-right tabular`}>{m.extraPen ?? 0}</td>
                <td className={`px-3 ${cellPadding}`}><MaterialBadges mat={m} /></td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">Aucun matériau ne correspond aux filtres.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center justify-center gap-3" aria-label="Pagination des matériaux">
        <button className={cls.btnGhost} type="button" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>
          Précédent
        </button>
        <span className="text-sm tabular-nums text-muted-foreground">Page {page} / {pageCount}</span>
        <button className={cls.btnGhost} type="button" disabled={page >= pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>
          Suivant
        </button>
      </nav>

      <AccessibleDialog
        open={detail !== null}
        title={detail?.name ?? "Détail du matériau"}
        description={detail ? `${catByKey.get(detail.category)?.label ?? detail.category} — compatibilité ${detail.compat}` : undefined}
        onClose={() => setDetail(null)}
        footer={<button className={cls.btnPrimary} type="button" onClick={() => setDetail(null)}>Fermer</button>}
      >
        {detail && <MaterialDetails material={detail} />}
      </AccessibleDialog>

    </div>
  );
}

function ComparisonPanel({ materials, onRemove, onClear }: { materials: Material[]; onRemove: (name: string) => void; onClear: () => void }) {
  const rows: { label: string; render: (material: Material) => React.ReactNode }[] = [
    { label: "Compatibilité", render: material => material.compat },
    { label: "Bonus PA", render: material => material.modPA },
    { label: "Malus", render: material => material.malusMod },
    { label: "Usure pénétration", render: material => material.extraPen ?? 0 },
    { label: "PenIgnore", render: material => material.penIgnore ?? 0 },
    { label: "Demi-malus", render: material => material.halfMalus ? "Oui" : "Non" },
    { label: "Réparation coût", render: material => `×${material.repair?.costMul ?? 1}` },
    { label: "Réparation temps", render: material => `×${material.repair?.timeMul ?? 1}` },
  ];

  return (
    <section className={`${cls.card} space-y-3`} aria-labelledby="materials-comparison-title">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 id="materials-comparison-title" className="font-semibold">Comparateur</h3>
          <p className="text-xs text-muted-foreground">Sélectionne jusqu’à trois matériaux dans le tableau.</p>
        </div>
        <button className={cls.btnGhost} type="button" onClick={onClear}>Effacer</button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-left text-muted-foreground">Critère</th>
              {materials.map(material => (
                <th key={material.name} className="px-2 py-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span>{material.name}</span>
                    <button className={cls.btnGhost} type="button" onClick={() => onRemove(material.name)} aria-label={`Retirer ${material.name} du comparateur`}>×</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(row => (
              <tr key={row.label}>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">{row.label}</th>
                {materials.map(material => <td key={material.name} className="px-2 py-2 tabular-nums">{row.render(material)}</td>)}
              </tr>
            ))}
            <tr>
              <th className="px-2 py-2 text-left font-medium text-muted-foreground">Effets / résistances</th>
              {materials.map(material => <td key={material.name} className="px-2 py-2"><MaterialBadges mat={material} /></td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MaterialDetails({ material }: { material: Material }) {
  const resistances = Object.entries(material.res ?? {}).filter(([, value]) => Boolean(value));
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Bonus PA</dt><dd className="font-semibold tabular-nums">{material.modPA}</dd>
        <dt className="text-muted-foreground">Malus</dt><dd className="font-semibold tabular-nums">{material.malusMod}</dd>
        <dt className="text-muted-foreground">Usure pénétration</dt><dd className="font-semibold tabular-nums">{material.extraPen ?? 0}</dd>
        <dt className="text-muted-foreground">PenIgnore</dt><dd className="font-semibold tabular-nums">{material.penIgnore ?? 0}</dd>
        <dt className="text-muted-foreground">Réparation coût</dt><dd className="font-semibold tabular-nums">×{material.repair?.costMul ?? 1}</dd>
        <dt className="text-muted-foreground">Réparation temps</dt><dd className="font-semibold tabular-nums">×{material.repair?.timeMul ?? 1}</dd>
      </dl>
      <div>
        <h3 className="mb-2 font-semibold">Effets</h3>
        <MaterialBadges mat={material} />
      </div>
      <div>
        <h3 className="mb-1 font-semibold">Résistances détaillées</h3>
        {resistances.length > 0 ? (
          <ul className={cls.noteList}>
            {resistances.map(([key, value]) => <li key={key}>{key} : +{value}</li>)}
          </ul>
        ) : <p className="text-muted-foreground">Aucune résistance spécifique.</p>}
      </div>
    </div>
  );
}

function Th({
  k, children, activeKey, dir, onToggle, align="left", compact=false
}: {
  k: SortKey;
  children:React.ReactNode;
  activeKey:SortKey;
  dir:"asc"|"desc";
  onToggle:(k:SortKey)=>void;
  align?:"left"|"right";
  compact?: boolean;
}){
  const active = activeKey === k;
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(k); }
  };
  const textAlign = align === "right" ? "text-right" : "text-left";
  const sizing = compact ? "py-1 text-xs" : "py-2 text-sm";
  return (
    <th
      role="button"
      tabIndex={0}
      aria-sort={active ? (dir==="asc"?"ascending":"descending") : "none"}
      className={`px-3 ${sizing} cursor-pointer select-none ${textAlign} ${active?"text-foreground":"text-muted-foreground"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
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
