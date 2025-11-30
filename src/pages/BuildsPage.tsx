import { useMemo, useState } from "react";
import type { BuildInput } from "../types";
import { getBuilds, deleteBuild, resetBuilds, exportBuilds, importBuilds } from "../buildCatalog";
import { cls } from "../ui/styles";

export default function BuildsPage() {
  const [builds, setBuilds] = useState(() => getBuilds());
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return builds;
    return builds.filter(b => b.name.toLowerCase().includes(q));
  }, [builds, filter]);

  const onDelete = (id: string) => {
    deleteBuild(id);
    setBuilds(getBuilds());
  };

  const onReset = () => {
    if (!window.confirm("Supprimer tous les builds sauvegardés ?")) return;
    resetBuilds();
    setBuilds([]);
  };

  const onExport = () => {
    navigator.clipboard.writeText(exportBuilds());
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      try {
        importBuilds(text, "merge");
        setBuilds(getBuilds());
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Import invalide");
      }
    });
  };

  const applyBuild = (b: BuildInput, cat?: string) => {
    localStorage.setItem("lastBuild_v2", JSON.stringify(b));
    if (cat) localStorage.setItem("lastBuildCat_v2", cat);
    window.location.assign("/");
  };

  return (
    <div className={`${cls.page} max-w-4xl space-y-6`}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalogue de builds</h1>
          <p className="text-sm text-muted-foreground">Sauvegardes locales (localStorage) exportables en JSON.</p>
        </div>
        <div className="flex gap-2">
          <label className={cls.btnGhost}>
            Import JSON
            <input type="file" accept="application/json" className="sr-only" onChange={onImport} />
          </label>
          <button className={cls.btnGhost} onClick={onExport}>Exporter (copie)</button>
          <button className={cls.btnGhost} onClick={onReset}>Tout réinitialiser</button>
        </div>
      </header>

      {error && <div className={`${cls.card} border-rose-500 text-rose-500 text-sm`}>{error}</div>}

      <div className="flex items-center gap-3">
        <input
          className={cls.input}
          placeholder="Filtrer par nom..."
          value={filter}
          onChange={e=>setFilter(e.target.value)}
        />
        <div className="text-sm text-muted-foreground">Total : {filtered.length}</div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className={cls.card}>Aucun build enregistré pour le moment.</div>
        )}
        {filtered.map(b => (
          <div key={b.id} className={`${cls.card} flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground">Créé le {new Date(b.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button className={cls.btnGhost} onClick={()=>applyBuild(b.build, b.cat)}>Appliquer</button>
                <button className={cls.btnGhost} onClick={()=>onDelete(b.id)}>Supprimer</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <span>Châssis : <b className="text-foreground">{b.build.chassis}</b></span>
              <span>Matériau : <b className="text-foreground">{b.build.material}</b></span>
              <span>Qualité : <b className="text-foreground">{b.build.quality}</b></span>
              <span>Bouclier : <b className="text-foreground">{b.build.shield}</b></span>
              <span>Enchant : <b className="text-foreground">{b.build.enchantId ?? "—"} ({b.build.enchant})</b></span>
              <span>Renfort : <b className="text-foreground">{b.build.renfort}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
