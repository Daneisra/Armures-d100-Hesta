import { useState } from "react";
import type { Category, Enchant, ShieldMaterial } from "../types";
import { cls } from "../ui/styles";

type Entry = Category | Enchant | ShieldMaterial;
export type ExtraDomain = "categories" | "enchants" | "shieldMaterials";
type Field = { key: string; label: string; type?: "number"; options?: string[] };
const fields: Record<ExtraDomain, Field[]> = {
  categories: [
    { key: "key", label: "Clé unique" }, { key: "label", label: "Libellé" },
    { key: "compat", label: "Compatibilité", options: ["Gambison", "Cuir", "Métal"] },
    { key: "sort", label: "Ordre", type: "number" }, { key: "description", label: "Description" },
  ],
  enchants: [
    { key: "id", label: "Identifiant unique" }, { key: "name", label: "Nom" },
    { key: "kind", label: "Effet", options: ["pa_flat", "malus_flat", "res_add", "pen_ignore_add", "extraPen_delta", "pa_pct", "malus_mult"] },
    { key: "target", label: "Cible", options: ["", "global", "feu", "froid", "foudre", "tr", "per", "con", "magie"] },
    { key: "perLevel", label: "Valeur par niveau", type: "number" },
    { key: "factor", label: "Facteur (effets multiplicatifs)", type: "number" },
    { key: "minLevel", label: "Niveau minimum", type: "number" },
    { key: "maxLevel", label: "Niveau maximum", type: "number" },
  ],
  shieldMaterials: [
    { key: "name", label: "Nom" },
    { key: "compat", label: "Compatibilité", options: ["Bois", "Métal", "Cuir", "Mixte"] },
    { key: "paMod", label: "Modificateur de PA", type: "number" },
    { key: "malusMod", label: "Modificateur de malus", type: "number" }, { key: "effects", label: "Effets" },
  ],
};
const empty: Record<ExtraDomain, Entry> = {
  categories: { key: "", label: "", sort: 0, compat: "Métal" },
  enchants: { id: "", name: "", kind: "pa_flat", perLevel: 1 },
  shieldMaterials: { name: "", compat: "Mixte", paMod: 0, malusMod: 0 },
};
const effectLabels: Record<string, string> = {
  pa_flat: "PA par niveau", malus_flat: "Malus par niveau", res_add: "Résistance par niveau",
  pen_ignore_add: "Pénétration ignorée", extraPen_delta: "Usure pénétration", pa_pct: "PA en proportion", malus_mult: "Multiplicateur de malus",
};
const identity = (entry: Entry) => "key" in entry ? entry.key : "id" in entry ? entry.id : entry.name;
const name = (entry: Entry) => "label" in entry ? entry.label : entry.name;

export default function CatalogDomainEditor({ domain, title, items, onChange, onDelete, onReset }: {
  domain: ExtraDomain; title: string; items: Entry[];
  onChange: (items: Entry[]) => boolean; onDelete: (item: Entry) => void; onReset: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...empty[domain] });
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [descending, setDescending] = useState(false);
  const visible = [...items].filter(item => JSON.stringify(item).toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")))
    .sort((a, b) => name(a).localeCompare(name(b), "fr") * (descending ? -1 : 1));
  const change = (key: string, value: unknown) => setDraft(current => {
    const next = { ...current };
    if (value === "") delete next[key];
    else next[key] = value;
    return next;
  });
  const save = () => {
    const entry = draft as Entry;
    if (!onChange([...items.filter(item => identity(item) !== editing), entry])) return;
    setDraft({ ...empty[domain] });
    setEditing(null);
  };
  return (
    <section className={`${cls.card} space-y-4`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <button className={cls.btnGhost} onClick={onReset}>Réinitialiser l’onglet</button>
      </header>
      <div className="flex flex-wrap gap-2">
        <label className="min-w-0 flex-1"><span className="sr-only">Rechercher dans {title}</span><input className={cls.input} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…" /></label>
        <button className={cls.btnGhost} onClick={() => setDescending(value => !value)}>Nom {descending ? "Z–A" : "A–Z"}</button>
      </div>
      <ul className="max-h-[420px] space-y-2 overflow-auto">
        {visible.map(item => (
          <li key={identity(item)} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
            <div className="min-w-0 break-words"><span className="font-medium">{name(item)}</span><p className="text-xs text-muted-foreground">{identity(item)}{"compat" in item ? ` · ${item.compat}` : ` · ${effectLabels[item.kind]}`}</p></div>
            <div className="flex flex-wrap gap-1">
              <button className={cls.btnGhost} onClick={() => { setDraft({ ...item }); setEditing(identity(item)); }}>Éditer</button>
              <button className={cls.btnGhost} onClick={() => {
                const copy = { ...item };
                if ("key" in copy) { copy.key += "_copie"; copy.label += " (copie)"; }
                else { copy.name += " (copie)"; if ("id" in copy) copy.id += "_copie"; }
                setDraft(copy); setEditing(null);
              }}>Dupliquer</button>
              <button className={cls.btnGhost} onClick={() => onDelete(item)}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="text-sm text-muted-foreground">Aucun élément.</p>}
      <form className="space-y-3 border-t border-border pt-3" onSubmit={e => { e.preventDefault(); save(); }}>
        <h3 className="font-semibold">{editing ? "Modifier l’élément" : "Nouvel élément"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields[domain].map(field => <label key={field.key} className="space-y-1 text-sm">
            <span>{field.label}</span>
            {field.options ? <select className={cls.select} value={String(draft[field.key] ?? "")} onChange={e => change(field.key, e.target.value)}>{field.options.map(option => <option key={option} value={option}>{effectLabels[option] ?? (option || "Aucune")}</option>)}</select>
              : <input className={cls.input} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} value={String(draft[field.key] ?? "")} onChange={e => change(field.key, field.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} />}
          </label>)}
        </div>
        <div className="flex gap-2"><button className={cls.btnPrimary} type="submit">{editing ? "Mettre à jour" : "Ajouter"}</button><button className={cls.btnGhost} type="button" onClick={() => { setDraft({ ...empty[domain] }); setEditing(null); }}>Annuler</button></div>
      </form>
    </section>
  );
}
