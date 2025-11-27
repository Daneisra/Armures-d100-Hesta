import { useMemo, useState } from "react";
import { useCatalog } from "../catalogContext";
import type { Chassis, Material, Quality, Shield, Params } from "../types";
import { cls } from "../ui/styles";

type TabKey = "chassis" | "materials" | "qualities" | "shields" | "params";

const tabs: { key: TabKey; label: string }[] = [
  { key: "chassis", label: "Châssis" },
  { key: "materials", label: "Matériaux" },
  { key: "qualities", label: "Qualités" },
  { key: "shields", label: "Boucliers" },
  { key: "params", label: "Params" },
];

export default function EditorPage() {
  const { catalog, updateDomain, resetDomain, resetAll, exportAll, importAll } = useCatalog();
  const [tab, setTab] = useState<TabKey>("chassis");
  const [importError, setImportError] = useState<string | null>(null);

  const onImport = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      try {
        importAll(text, "replace");
        setImportError(null);
      } catch (e: any) {
        setImportError(e?.message || "Import invalide");
      }
    });
  };

  return (
    <div className={`${cls.page} max-w-6xl space-y-6`}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Éditeur de catalogue <span className="text-sm opacity-60">local</span></h1>
          <p className="text-sm text-muted-foreground">Ces changements restent sur ton navigateur (localStorage). Exporte pour partager.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className={cls.btnGhost}>
            Import JSON
            <input type="file" accept="application/json" className="sr-only" onChange={onImport} />
          </label>
          <button className={cls.btnGhost} onClick={()=> navigator.clipboard.writeText(exportAll())}>Exporter (copie)</button>
          <button className={cls.btnGhost} onClick={resetAll}>Reset global</button>
        </div>
      </header>

      {importError && <div className={`${cls.card} border-rose-500 text-rose-500`}>{importError}</div>}

      <nav className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${cls.btnGhost} ${tab === t.key ? "bg-primary/10 text-primary" : ""}`}
            onClick={()=>setTab(t.key)}
            aria-current={tab===t.key?"page":undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "chassis" && (
        <ChassisEditor items={catalog.chassis} onChange={list => updateDomain("chassis", list)} onReset={()=>resetDomain("chassis")} />
      )}
      {tab === "materials" && (
        <MaterialsEditor items={catalog.materials} onChange={list => updateDomain("materials", list)} onReset={()=>resetDomain("materials")} />
      )}
      {tab === "qualities" && (
        <QualitiesEditor items={catalog.qualities} onChange={list => updateDomain("qualities", list)} onReset={()=>resetDomain("qualities")} />
      )}
      {tab === "shields" && (
        <ShieldsEditor items={catalog.shields as Shield[]} onChange={list => updateDomain("shields", list)} onReset={()=>resetDomain("shields")} />
      )}
      {tab === "params" && (
        <ParamsEditor value={catalog.params} onChange={p => updateDomain("params", p)} onReset={()=>resetDomain("params")} />
      )}
    </div>
  );
}

/* ---------------- Chassis ---------------- */
function ChassisEditor({ items, onChange, onReset }: { items: Chassis[]; onChange: (v: Chassis[])=>void; onReset: ()=>void; }) {
  const empty: Chassis = { name: "", basePA: 0, baseMalus: 0, group: "Légère" as any, category: "Gambison" as any };
  const [draft, setDraft] = useState<Chassis>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = () => {
    if (!draft.name.trim()) return;
    const list = items.filter(c => c.name !== editing);
    onChange([...list, draft]);
    setDraft(empty);
    setEditing(null);
  };
  const dup = (c: Chassis) => setDraft({ ...c, name: `${c.name} (copie)` });
  const edit = (c: Chassis) => { setDraft(c); setEditing(c.name); };

  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Châssis</h2>
        <div className="flex gap-2">
          <button className={cls.btnGhost} onClick={onReset}>Reset onglet</button>
        </div>
      </header>
      <div className="grid md:grid-cols-[1.2fr_1fr_1fr_1fr] text-sm font-semibold text-muted-foreground px-2">
        <span>Nom</span><span>Groupe</span><span>Compat</span><span>PA / Malus</span>
      </div>
      <div className="space-y-1">
        {items.map(c => (
          <div key={c.name} className="grid md:grid-cols-[1.2fr_1fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{c.name}</span>
            <span>{c.group}</span>
            <span>{c.category}</span>
            <span className="tabular">{c.basePA} / {c.baseMalus}</span>
            <div className="flex gap-1 md:col-span-4">
              <button className={cls.btnGhost} onClick={()=>edit(c)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(c)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onChange(items.filter(x=>x.name!==c.name))}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-2">
        <h3 className="font-semibold text-sm">Nouvel élément</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Nom</div>
            <input className={cls.input} value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
          </label>
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Groupe</div>
            <select className={cls.select} value={draft.group} onChange={e=>setDraft({...draft, group:e.target.value as any})}>
              <option>Légère</option><option>Intermédiaire</option><option>Lourde</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Compat</div>
            <select className={cls.select} value={draft.category} onChange={e=>setDraft({...draft, category:e.target.value as any})}>
              <option>Gambison</option><option>Cuir</option><option>Métal</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">PA</div>
              <input className={cls.input} type="number" value={draft.basePA} onChange={e=>setDraft({...draft, basePA:Number(e.target.value)||0})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Malus</div>
              <input className={cls.input} type="number" value={draft.baseMalus} onChange={e=>setDraft({...draft, baseMalus:Number(e.target.value)||0})}/>
            </label>
          </div>
        </div>
        <button className={cls.btnPrimary} onClick={save}>{editing ? "Mettre à jour" : "Ajouter"}</button>
      </div>
    </section>
  );
}

/* ---------------- Materials ---------------- */
function MaterialsEditor({ items, onChange, onReset }: { items: Material[]; onChange:(v:Material[])=>void; onReset:()=>void; }) {
  const empty: Material = { name:"", category:"", compat:"Gambison" as any, modPA:0, malusMod:0, extraPen:0, penIgnore:0, effects:"", res:{} };
  const [draft, setDraft] = useState<Material>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = () => {
    if (!draft.name.trim()) return;
    const list = items.filter(m => m.name !== editing);
    onChange([...list, draft]);
    setDraft(empty);
    setEditing(null);
  };
  const edit = (m: Material) => { setDraft({ ...m }); setEditing(m.name); };
  const dup = (m: Material) => setDraft({ ...m, name: `${m.name} (copie)` });

  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Matériaux</h2>
        <div className="flex gap-2">
          <button className={cls.btnGhost} onClick={onReset}>Reset onglet</button>
        </div>
      </header>
      <div className="space-y-1 max-h-[420px] overflow-auto pr-1">
        {items.map(m => (
          <div key={m.name} className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{m.name}</span>
            <span>{m.category}</span>
            <span>{m.compat}</span>
            <span className="tabular">{m.modPA} / {m.malusMod}</span>
            <span className="tabular">extraPen {m.extraPen ?? 0}</span>
            <div className="flex gap-1 md:col-span-5">
              <button className={cls.btnGhost} onClick={()=>edit(m)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(m)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onChange(items.filter(x=>x.name!==m.name))}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-2">
        <h3 className="font-semibold text-sm">Nouvel élément</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Nom</div>
            <input className={cls.input} value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
          </label>
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Catégorie</div>
            <input className={cls.input} value={draft.category} onChange={e=>setDraft({...draft, category:e.target.value})}/>
          </label>
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Compat</div>
            <select className={cls.select} value={draft.compat} onChange={e=>setDraft({...draft, compat:e.target.value as any})}>
              <option>Gambison</option><option>Cuir</option><option>Métal</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Mod PA</div>
              <input className={cls.input} type="number" value={draft.modPA} onChange={e=>setDraft({...draft, modPA:Number(e.target.value)||0})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Malus Mod</div>
              <input className={cls.input} type="number" value={draft.malusMod} onChange={e=>setDraft({...draft, malusMod:Number(e.target.value)||0})}/>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Extra Pen</div>
              <input className={cls.input} type="number" value={draft.extraPen ?? 0} onChange={e=>setDraft({...draft, extraPen:Number(e.target.value)||0})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Ignore Pen</div>
              <input className={cls.input} type="number" value={draft.penIgnore ?? 0} onChange={e=>setDraft({...draft, penIgnore:Number(e.target.value)||0})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Effets</div>
              <input className={cls.input} value={draft.effects ?? ""} onChange={e=>setDraft({...draft, effects:e.target.value})}/>
            </label>
          </div>
        </div>
        <button className={cls.btnPrimary} onClick={save}>{editing ? "Mettre à jour" : "Ajouter"}</button>
      </div>
    </section>
  );
}

/* ---------------- Qualities ---------------- */
function QualitiesEditor({ items, onChange, onReset }: { items: Quality[]; onChange:(v:Quality[])=>void; onReset:()=>void; }) {
  const empty: Quality = { name:"", bonusPA:0, malusMod:0, repair:{ costMul:1, timeMul:1 } };
  const [draft, setDraft] = useState<Quality>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = () => {
    if (!draft.name.trim()) return;
    const list = items.filter(q=>q.name!==editing);
    onChange([...list, draft]);
    setDraft(empty);
    setEditing(null);
  };

  const edit = (q: Quality) => { setDraft({ ...q }); setEditing(q.name); };
  const dup = (q: Quality) => setDraft({ ...q, name: `${q.name} (copie)` });

  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Qualités</h2>
        <div className="flex gap-2">
          <button className={cls.btnGhost} onClick={onReset}>Reset onglet</button>
        </div>
      </header>
      <div className="space-y-1">
        {items.map(q=>(
          <div key={q.name} className="grid md:grid-cols-[1.5fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{q.name}</span>
            <span className="tabular">PA +{q.bonusPA} / Malus {q.malusMod}</span>
            <span className="text-xs text-muted-foreground">Repair x{q.repair?.costMul ?? 1} / x{q.repair?.timeMul ?? 1}</span>
            <div className="flex gap-1 md:col-span-3">
              <button className={cls.btnGhost} onClick={()=>edit(q)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(q)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onChange(items.filter(x=>x.name!==q.name))}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-2">
        <h3 className="font-semibold text-sm">Nouvel élément</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Nom</div>
            <input className={cls.input} value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Bonus PA</div>
              <input className={cls.input} type="number" value={draft.bonusPA} onChange={e=>setDraft({...draft, bonusPA:Number(e.target.value)||0})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Malus Mod</div>
              <input className={cls.input} type="number" value={draft.malusMod} onChange={e=>setDraft({...draft, malusMod:Number(e.target.value)||0})}/>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Repair coût x</div>
              <input className={cls.input} type="number" value={draft.repair?.costMul ?? 1} onChange={e=>setDraft({...draft, repair:{...draft.repair, costMul:Number(e.target.value)||1}})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Repair temps x</div>
              <input className={cls.input} type="number" value={draft.repair?.timeMul ?? 1} onChange={e=>setDraft({...draft, repair:{...draft.repair, timeMul:Number(e.target.value)||1}})}/>
            </label>
          </div>
        </div>
        <button className={cls.btnPrimary} onClick={save}>{editing ? "Mettre à jour" : "Ajouter"}</button>
      </div>
    </section>
  );
}

/* ---------------- Shields ---------------- */
function ShieldsEditor({ items, onChange, onReset }: { items: Shield[]; onChange:(v:Shield[])=>void; onReset:()=>void; }) {
  const empty: Shield = { name:"", pa:0, malus:0 };
  const [draft, setDraft] = useState<Shield>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = () => {
    if (!draft.name.trim()) return;
    const list = items.filter(s=>s.name!==editing);
    onChange([...list, draft]);
    setDraft(empty);
    setEditing(null);
  };

  const edit = (s: Shield) => { setDraft({ ...s }); setEditing(s.name); };
  const dup = (s: Shield) => setDraft({ ...s, name: `${s.name} (copie)` });

  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Boucliers</h2>
        <div className="flex gap-2">
          <button className={cls.btnGhost} onClick={onReset}>Reset onglet</button>
        </div>
      </header>
      <div className="space-y-1">
        {items.map(s=>(
          <div key={s.name} className="grid md:grid-cols-[1.5fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{s.name}</span>
            <span className="tabular">PA {s.pa}</span>
            <span className="tabular">Malus {s.malus}</span>
            <div className="flex gap-1 md:col-span-3">
              <button className={cls.btnGhost} onClick={()=>edit(s)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(s)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onChange(items.filter(x=>x.name!==s.name))}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-2">
        <h3 className="font-semibold text-sm">Nouvel élément</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Nom</div>
            <input className={cls.input} value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
          </label>
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">PA</div>
            <input className={cls.input} type="number" value={draft.pa} onChange={e=>setDraft({...draft, pa:Number(e.target.value)||0})}/>
          </label>
          <label className="text-sm">
            <div className="text-muted-foreground text-xs mb-1">Malus</div>
            <input className={cls.input} type="number" value={draft.malus} onChange={e=>setDraft({...draft, malus:Number(e.target.value)||0})}/>
          </label>
        </div>
        <button className={cls.btnPrimary} onClick={save}>{editing ? "Mettre à jour" : "Ajouter"}</button>
      </div>
    </section>
  );
}

/* ---------------- Params ---------------- */
function ParamsEditor({ value, onChange, onReset }: { value: Params; onChange:(v:Params)=>void; onReset:()=>void; }) {
  const draftState = useMemo(()=>value, [value]);
  const [draft, setDraft] = useState<Params>(draftState);

  const save = () => onChange(draft);

  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Params</h2>
        <div className="flex gap-2">
          <button className={cls.btnGhost} onClick={onReset}>Reset onglet</button>
          <button className={cls.btnPrimary} onClick={save}>Sauvegarder</button>
        </div>
      </header>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm">
          <div className="text-muted-foreground text-xs mb-1">Sweet spot ratio</div>
          <input className={cls.input} type="number" value={draft.sweetSpotRatio} onChange={e=>setDraft({...draft, sweetSpotRatio:Number(e.target.value)||0})}/>
        </label>
        <label className="text-sm">
          <div className="text-muted-foreground text-xs mb-1">Renfort max</div>
          <input className={cls.input} type="number" value={draft.renfortMax} onChange={e=>setDraft({...draft, renfortMax:Number(e.target.value)||0})}/>
        </label>
        <label className="text-sm">
          <div className="text-muted-foreground text-xs mb-1">Enchant max</div>
          <input className={cls.input} type="number" value={draft.enchantMax} onChange={e=>setDraft({...draft, enchantMax:Number(e.target.value)||0})}/>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <div className="text-muted-foreground text-xs mb-1">Base usure</div>
          <input className={cls.input} type="number" value={draft.baseWear} onChange={e=>setDraft({...draft, baseWear:Number(e.target.value)||0})}/>
        </label>
        <label className="text-sm">
          <div className="text-muted-foreground text-xs mb-1">Cap usure / coup</div>
          <input className={cls.input} type="number" value={draft.capWearPerHit} onChange={e=>setDraft({...draft, capWearPerHit:Number(e.target.value)||0})}/>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className={`${cls.card} bg-muted/20 space-y-2`}>
          <div className="font-semibold text-sm">Réparation (coût par PA)</div>
          {["Gambison","Cuir","Métal"].map(k=>(
            <label key={k} className="text-sm block">
              <div className="text-muted-foreground text-xs mb-1">{k}</div>
              <input className={cls.input} type="number" value={(draft.repair.costPerPA as any)[k]} onChange={e=>setDraft({
                ...draft, repair:{ ...draft.repair, costPerPA:{ ...draft.repair.costPerPA, [k]: Number(e.target.value)||0 } }
              })}/>
            </label>
          ))}
        </div>
        <div className={`${cls.card} bg-muted/20 space-y-2`}>
          <div className="font-semibold text-sm">Réparation (temps par PA)</div>
          {["Gambison","Cuir","Métal"].map(k=>(
            <label key={k} className="text-sm block">
              <div className="text-muted-foreground text-xs mb-1">{k}</div>
              <input className={cls.input} type="number" value={(draft.repair.timePerPA as any)[k]} onChange={e=>setDraft({
                ...draft, repair:{ ...draft.repair, timePerPA:{ ...draft.repair.timePerPA, [k]: Number(e.target.value)||0 } }
              })}/>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
