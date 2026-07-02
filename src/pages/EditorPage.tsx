import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "../catalogContext";
import type { Chassis, Material, Quality, Shield, Params } from "../types";
import { cls } from "../ui/styles";
import AccessibleDialog from "../components/AccessibleDialog";

type TabKey = "chassis" | "materials" | "qualities" | "shields" | "params";
type ListTabKey = Exclude<TabKey, "params">;
type NamedItem = Chassis | Material | Quality | Shield;

type TrashEntry = {
  id: string;
  key: ListTabKey;
  item: NamedItem;
};

type UndoEntry = {
  key: TabKey;
  previous: unknown;
  hadOverride: boolean;
  label: string;
  removeTrashId?: string;
  restoreTrash?: TrashEntry;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "chassis", label: "Châssis" },
  { key: "materials", label: "Matériaux" },
  { key: "qualities", label: "Qualités" },
  { key: "shields", label: "Boucliers" },
  { key: "params", label: "Params" },
];

export default function EditorPage() {
  const {
    catalog,
    overrides,
    defaults,
    autosave,
    dirty,
    setAutosave,
    saveNow,
    discardPending,
    updateDomain,
    resetDomain,
    resetAll,
    exportAll,
    importAll,
  } = useCatalog();
  const [tab, setTab] = useState<TabKey>("chassis");
  const [importError, setImportError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [history, setHistory] = useState<UndoEntry[]>([]);
  const [trash, setTrash] = useState<TrashEntry[]>([]);

  const snapshot = (key: TabKey, label: string, extras: Partial<UndoEntry> = {}): UndoEntry => {
    const hadOverride = Object.prototype.hasOwnProperty.call(overrides, key);
    const previous = hadOverride
      ? JSON.parse(JSON.stringify(overrides[key as keyof typeof overrides]))
      : undefined;
    return { key, previous, hadOverride, label, ...extras };
  };

  const pushHistory = (entry: UndoEntry) => {
    setHistory(current => [...current.slice(-19), entry]);
  };

  const applyDomainChange = (key: TabKey, value: unknown, label: string, extras: Partial<UndoEntry> = {}) => {
    pushHistory(snapshot(key, label, extras));
    updateDomain(key, value);
    setFlash(label);
  };

  const resetEditorDomain = (key: TabKey) => {
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) return;
    pushHistory(snapshot(key, `Réinitialisation de l’onglet ${key}`));
    resetDomain(key);
    setFlash("Onglet réinitialisé aux données officielles.");
  };

  const undoLast = () => {
    const entry = history[history.length - 1];
    if (!entry) return;
    if (entry.hadOverride) updateDomain(entry.key, entry.previous);
    else resetDomain(entry.key);
    if (entry.removeTrashId) setTrash(current => current.filter(item => item.id !== entry.removeTrashId));
    if (entry.restoreTrash) setTrash(current => [...current, entry.restoreTrash!]);
    setHistory(current => current.slice(0, -1));
    setFlash(`Annulé : ${entry.label}`);
  };

  const deleteItem = (key: ListTabKey, item: NamedItem) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${item.name}`;
    const entry: TrashEntry = { id, key, item: JSON.parse(JSON.stringify(item)) };
    const next = (catalog[key] as NamedItem[]).filter(candidate => candidate.name !== item.name);
    applyDomainChange(key, next, `Suppression de « ${item.name} »`, { removeTrashId: id });
    setTrash(current => [entry, ...current]);
  };

  const restoreTrash = (entry: TrashEntry) => {
    const current = catalog[entry.key] as NamedItem[];
    if (current.some(item => item.name === entry.item.name)) {
      setFlash(`Impossible de restaurer « ${entry.item.name} » : ce nom existe déjà.`);
      return;
    }
    applyDomainChange(entry.key, [...current, entry.item], `Restauration de « ${entry.item.name} »`, { restoreTrash: entry });
    setTrash(items => items.filter(item => item.id !== entry.id));
  };

  const exportToFile = () => {
    const data = exportAll();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog-overrides.json";
    a.click();
    URL.revokeObjectURL(url);
    setFlash("Export JSON généré (catalog-overrides.json)");
  };

  const onImport = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      try {
        importAll(text, "replace");
        setHistory([]);
        setTrash([]);
        setImportError(null);
        setFlash("Import overrides appliqué");
      } catch (error: unknown) {
        setImportError(error instanceof Error ? error.message : "Import invalide");
      }
    });
  };

  const copyImportReport = async () => {
    if (!importError) return;
    try {
      await navigator.clipboard.writeText(importError);
      setFlash("Rapport d’erreurs copié");
    } catch {
      prompt("Copie le rapport d’erreurs :", importError);
    }
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
          <button className={cls.btnGhost} onClick={exportToFile}>Exporter (JSON)</button>
          <button className={cls.btnGhost} onClick={() => setResetDialogOpen(true)}>Reset global</button>
        </div>
      </header>

      <section className={`${cls.card} flex flex-wrap items-center justify-between gap-3 py-3`}>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={autosave}
            onChange={event => {
              setAutosave(event.target.checked);
              setFlash(event.target.checked ? "Sauvegarde automatique activée." : "Sauvegarde automatique désactivée.");
            }}
          />
          Sauvegarde automatique
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className={cls.badgeWarn}>Modifications non enregistrées</span>}
          <button className={cls.btnGhost} type="button" onClick={undoLast} disabled={history.length === 0}>
            Annuler{history.length > 0 ? ` (${history.length})` : ""}
          </button>
          {!autosave && (
            <>
              <button
                className={cls.btnGhost}
                type="button"
                disabled={!dirty}
                onClick={() => {
                  discardPending();
                  setHistory([]);
                  setTrash([]);
                  setFlash("Modifications non enregistrées abandonnées.");
                }}
              >
                Abandonner
              </button>
              <button
                className={cls.btnPrimary}
                type="button"
                disabled={!dirty}
                onClick={() => {
                  saveNow();
                  setFlash("Catalogue local enregistré.");
                }}
              >
                Enregistrer
              </button>
            </>
          )}
        </div>
      </section>

      {importError && (
        <section className={`${cls.card} border-rose-500 text-sm`} role="alert">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="font-semibold text-rose-600 dark:text-rose-300">Import refusé</h2>
            <button className={cls.btnGhost} onClick={copyImportReport}>Copier le rapport d’erreurs</button>
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-rose-700 dark:text-rose-200">{importError}</pre>
        </section>
      )}
      <div aria-live="polite" className="text-sm text-emerald-600">{flash}</div>

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
      <DiffCard tab={tab} overrides={overrides} defaults={defaults} />
      <TrashCard entries={trash} onRestore={restoreTrash} onClear={() => setTrash([])} />

      {tab === "chassis" && (
        <ChassisEditor items={catalog.chassis} onChange={list => applyDomainChange("chassis", list, "Châssis modifiés")} onDelete={item => deleteItem("chassis", item)} onReset={()=>resetEditorDomain("chassis")} />
      )}
      {tab === "materials" && (
        <MaterialsEditor items={catalog.materials} onChange={list => applyDomainChange("materials", list, "Matériaux modifiés")} onDelete={item => deleteItem("materials", item)} onReset={()=>resetEditorDomain("materials")} />
      )}
      {tab === "qualities" && (
        <QualitiesEditor items={catalog.qualities} onChange={list => applyDomainChange("qualities", list, "Qualités modifiées")} onDelete={item => deleteItem("qualities", item)} onReset={()=>resetEditorDomain("qualities")} />
      )}
      {tab === "shields" && (
        <ShieldsEditor items={catalog.shields as Shield[]} onChange={list => applyDomainChange("shields", list, "Boucliers modifiés")} onDelete={item => deleteItem("shields", item)} onReset={()=>resetEditorDomain("shields")} />
      )}
      {tab === "params" && (
        <ParamsEditor value={catalog.params} onChange={p => applyDomainChange("params", p, "Paramètres modifiés")} onReset={()=>resetEditorDomain("params")} />
      )}

      <AccessibleDialog
        open={resetDialogOpen}
        title="Réinitialiser tout le catalogue local ?"
        description="Tous les overrides locaux seront supprimés et les données officielles du repo seront restaurées."
        onClose={() => setResetDialogOpen(false)}
        footer={(
          <>
            <button className={cls.btnGhost} type="button" onClick={() => setResetDialogOpen(false)}>Annuler</button>
            <button
              className={`${cls.btnPrimary} bg-rose-600 hover:bg-rose-700`}
              type="button"
              onClick={() => {
                resetAll();
                setHistory([]);
                setTrash([]);
                setResetDialogOpen(false);
                setFlash("Catalogue local réinitialisé.");
              }}
            >
              Réinitialiser
            </button>
          </>
        )}
      >
        <p className="text-sm text-muted-foreground">Exporte d’abord le catalogue si tu souhaites conserver ces personnalisations.</p>
      </AccessibleDialog>
    </div>
  );
}

function useFilteredItems<T extends { name: string }>(items: T[]) {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return [...items]
      .filter(item => !normalizedQuery || JSON.stringify(item).toLocaleLowerCase("fr").includes(normalizedQuery))
      .sort((left, right) => left.name.localeCompare(right.name, "fr") * (direction === "asc" ? 1 : -1));
  }, [direction, items, query]);
  return { query, setQuery, direction, setDirection, visibleItems };
}

function EditorListToolbar({
  query,
  onQueryChange,
  direction,
  onDirectionChange,
  visibleCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  direction: "asc" | "desc";
  onDirectionChange: (value: "asc" | "desc") => void;
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="min-w-0 flex-1 text-sm">
        <span className="sr-only">Rechercher dans cet onglet</span>
        <input
          className={cls.input}
          type="search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="Rechercher…"
        />
      </label>
      <button
        className={cls.btnGhost}
        type="button"
        onClick={() => onDirectionChange(direction === "asc" ? "desc" : "asc")}
        aria-label={`Trier par nom, ordre ${direction === "asc" ? "décroissant" : "croissant"}`}
      >
        Nom {direction === "asc" ? "A–Z" : "Z–A"}
      </button>
      <span className="text-xs text-muted-foreground tabular-nums">{visibleCount} / {totalCount}</span>
    </div>
  );
}

function TrashCard({ entries, onRestore, onClear }: { entries: TrashEntry[]; onRestore: (entry: TrashEntry) => void; onClear: () => void }) {
  if (entries.length === 0) return null;
  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Corbeille de session</h2>
          <p className="text-xs text-muted-foreground">Les éléments restent récupérables tant que cette page reste ouverte.</p>
        </div>
        <button className={cls.btnGhost} type="button" onClick={onClear}>Vider</button>
      </header>
      <div className="flex flex-wrap gap-2">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span><span className="text-muted-foreground">{tabs.find(item => item.key === entry.key)?.label} :</span> {entry.item.name}</span>
            <button className={cls.btnGhost} type="button" onClick={() => onRestore(entry)}>Restaurer</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiffCard({ tab, overrides, defaults }: { tab: TabKey; overrides: any; defaults: any; }) {
  const ov = overrides[tab];
  if (tab !== "params" && (!Array.isArray(ov) || ov.length === 0)) return null;
  if (tab === "params" && !ov) return null;

  const isArrayTab = tab !== "params";
  const baseList = isArrayTab ? (defaults as any)[tab] ?? [] : [];

  const rows = isArrayTab ? (ov as any[]).map(item => {
    const base = baseList.find((b: any) => b.name === item.name);
    const status = base ? "Override" : "Ajout";
    const changedKeys = base
      ? Object.keys(item).filter(k => JSON.stringify((base as any)[k]) !== JSON.stringify((item as any)[k]))
      : [];
    return { name: item.name ?? "(sans nom)", status, changedKeys, item };
  }) : [];

  const paramChanges = tab === "params" ? Object.entries(ov as Record<string, any>).map(([k,v]) => {
    const baseVal = (defaults as any).params?.[k];
    const changed = JSON.stringify(baseVal) !== JSON.stringify(v);
    return changed ? { key:k, from: baseVal, to:v } : null;
  }).filter(Boolean) as {key:string; from:any; to:any}[] : [];

  return (
    <section className={`${cls.card} space-y-2`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Diff overrides vs canon ({tab})</h2>
        <span className="text-xs text-muted-foreground">
          {tab === "params" ? `${paramChanges.length} champ(s) modifié(s)` : `${rows.length} override(s)`}
        </span>
      </div>
      {tab === "params" ? (
        paramChanges.length === 0
          ? <p className="text-sm text-muted-foreground">Aucun override sur les paramètres.</p>
          : (
            <ul className="text-sm space-y-1">
              {paramChanges.map(ch => (
                <li key={ch.key}>
                  <span className="font-medium">{ch.key}</span> :{" "}
                  <span className="text-muted-foreground">canon</span> <code>{JSON.stringify(ch.from)}</code>{" "}
                  <span className="text-muted-foreground">→</span> <code>{JSON.stringify(ch.to)}</code>
                </li>
              ))}
            </ul>
          )
      ) : (
        <div className="space-y-1 max-h-60 overflow-auto pr-1">
          {rows.map(row => (
            <div key={row.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded border px-3 py-2 text-sm">
              <div>
                <div className="font-semibold">{row.name}</div>
                <div className="text-xs text-muted-foreground">
                  {row.status}{row.changedKeys.length ? ` — champs modifiés: ${row.changedKeys.join(", ")}` : ""}
                </div>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded mt-1 sm:mt-0 whitespace-pre-wrap max-w-xl overflow-hidden text-ellipsis">
                {JSON.stringify(row.item)}
              </code>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Chassis ---------------- */
function ChassisEditor({ items, onChange, onDelete, onReset }: { items: Chassis[]; onChange: (v: Chassis[])=>void; onDelete: (item: Chassis)=>void; onReset: ()=>void; }) {
  const empty: Chassis = { name: "", basePA: 0, baseMalus: 0, group: "Légère" as any, category: "Gambison" as any };
  const [draft, setDraft] = useState<Chassis>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const filtered = useFilteredItems(items);

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
          <button className={`${cls.btnGhost} disabled:opacity-50`} onClick={onReset} disabled={items.length === 0}>Reset onglet</button>
        </div>
      </header>
      <EditorListToolbar query={filtered.query} onQueryChange={filtered.setQuery} direction={filtered.direction} onDirectionChange={filtered.setDirection} visibleCount={filtered.visibleItems.length} totalCount={items.length} />
      <div className="grid md:grid-cols-[1.2fr_1fr_1fr_1fr] text-sm font-semibold text-muted-foreground px-2">
        <span>Nom</span><span>Groupe</span><span>Compat</span><span>PA / Malus</span>
      </div>
      <div className="space-y-1">
        {filtered.visibleItems.map(c => (
          <div key={c.name} className="grid md:grid-cols-[1.2fr_1fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{c.name}</span>
            <span>{c.group}</span>
            <span>{c.category}</span>
            <span className="tabular">{c.basePA} / {c.baseMalus}</span>
            <div className="flex gap-1 md:col-span-4">
              <button className={cls.btnGhost} onClick={()=>edit(c)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(c)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onDelete(c)}>Supprimer</button>
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
function MaterialsEditor({ items, onChange, onDelete, onReset }: { items: Material[]; onChange:(v:Material[])=>void; onDelete:(item:Material)=>void; onReset:()=>void; }) {
  const empty: Material = { name:"", category:"", compat:"Gambison" as any, modPA:0, malusMod:0, extraPen:0, penIgnore:0, effects:"", res:{} };
  const [draft, setDraft] = useState<Material>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const filtered = useFilteredItems(items);

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
          <button className={`${cls.btnGhost} disabled:opacity-50`} onClick={onReset} disabled={items.length === 0}>Reset onglet</button>
        </div>
      </header>
      <EditorListToolbar query={filtered.query} onQueryChange={filtered.setQuery} direction={filtered.direction} onDirectionChange={filtered.setDirection} visibleCount={filtered.visibleItems.length} totalCount={items.length} />
      <div className="space-y-1 max-h-[420px] overflow-auto pr-1">
        {filtered.visibleItems.map(m => (
          <div key={m.name} className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{m.name}</span>
            <span>{m.category}</span>
            <span>{m.compat}</span>
            <span className="tabular">{m.modPA} / {m.malusMod}</span>
            <span className="tabular">extraPen {m.extraPen ?? 0}</span>
            <div className="flex gap-1 md:col-span-5">
              <button className={cls.btnGhost} onClick={()=>edit(m)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(m)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onDelete(m)}>Supprimer</button>
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
function QualitiesEditor({ items, onChange, onDelete, onReset }: { items: Quality[]; onChange:(v:Quality[])=>void; onDelete:(item:Quality)=>void; onReset:()=>void; }) {
  const empty: Quality = { name:"", bonusPA:0, malusMod:0, repair:{ costMul:1, timeMul:1 } };
  const [draft, setDraft] = useState<Quality>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const filtered = useFilteredItems(items);

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
          <button className={`${cls.btnGhost} disabled:opacity-50`} onClick={onReset} disabled={items.length === 0}>Reset onglet</button>
        </div>
      </header>
      <EditorListToolbar query={filtered.query} onQueryChange={filtered.setQuery} direction={filtered.direction} onDirectionChange={filtered.setDirection} visibleCount={filtered.visibleItems.length} totalCount={items.length} />
      <div className="space-y-1">
        {filtered.visibleItems.map(q=>(
          <div key={q.name} className="grid md:grid-cols-[1.5fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{q.name}</span>
            <span className="tabular">PA +{q.bonusPA} / Malus {q.malusMod}</span>
            <span className="text-xs text-muted-foreground">Repair x{q.repair?.costMul ?? 1} / x{q.repair?.timeMul ?? 1}</span>
            <div className="flex gap-1 md:col-span-3">
              <button className={cls.btnGhost} onClick={()=>edit(q)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(q)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onDelete(q)}>Supprimer</button>
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
              <div className="text-muted-foreground text-xs mb-1">Réparation coût x</div>
              <input className={cls.input} type="number" value={draft.repair?.costMul ?? 1} onChange={e=>setDraft({...draft, repair:{...draft.repair, costMul:Number(e.target.value)||1}})}/>
            </label>
            <label className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Réparation temps x</div>
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
function ShieldsEditor({ items, onChange, onDelete, onReset }: { items: Shield[]; onChange:(v:Shield[])=>void; onDelete:(item:Shield)=>void; onReset:()=>void; }) {
  const empty: Shield = { name:"", pa:0, malus:0 };
  const [draft, setDraft] = useState<Shield>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const filtered = useFilteredItems(items);

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
          <button className={`${cls.btnGhost} disabled:opacity-50`} onClick={onReset} disabled={items.length === 0}>Reset onglet</button>
        </div>
      </header>
      <EditorListToolbar query={filtered.query} onQueryChange={filtered.setQuery} direction={filtered.direction} onDirectionChange={filtered.setDirection} visibleCount={filtered.visibleItems.length} totalCount={items.length} />
      <div className="space-y-1">
        {filtered.visibleItems.map(s=>(
          <div key={s.name} className="grid md:grid-cols-[1.5fr_1fr_1fr] items-center text-sm px-2 py-1 rounded hover:bg-muted/40">
            <span className="font-medium">{s.name}</span>
            <span className="tabular">PA {s.pa}</span>
            <span className="tabular">Malus {s.malus}</span>
            <div className="flex gap-1 md:col-span-3">
              <button className={cls.btnGhost} onClick={()=>edit(s)}>Éditer</button>
              <button className={cls.btnGhost} onClick={()=>dup(s)}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={()=>onDelete(s)}>Supprimer</button>
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
  const [draft, setDraft] = useState<Params>(value);

  useEffect(() => setDraft(value), [value]);

  const save = () => onChange(draft);

  return (
    <section className={`${cls.card} space-y-3`}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">Params</h2>
        <div className="flex gap-2">
          <button className={`${cls.btnGhost} disabled:opacity-50`} onClick={onReset}>Reset onglet</button>
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
