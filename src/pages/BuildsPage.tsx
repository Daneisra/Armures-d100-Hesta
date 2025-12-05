import { useMemo, useState } from "react";
import type { BuildInput } from "../types";
import { getBuilds, deleteBuild, resetBuilds, exportBuilds, importBuilds } from "../buildCatalog";
import { useNavigate } from "react-router-dom";
import { cls } from "../ui/styles";

export default function BuildsPage() {
  const [builds, setBuilds] = useState(() => getBuilds());
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const navigate = useNavigate();

  const exportToFile = () => {
    const data = exportBuilds();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "builds.json";
    a.click();
    URL.revokeObjectURL(url);
    setFlash("Export JSON généré (builds.json)");
  };

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
    setFlash("Catalogue vidé");
  };

  const onExport = () => {
    exportToFile();
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(text => {
      try {
        importBuilds(text, "merge");
        setBuilds(getBuilds());
        setError(null);
        setFlash("Import réussi");
      } catch (err: any) {
        setError(err?.message || "Import invalide");
      }
    });
  };

  const encodeBuildParam = (build: BuildInput) => {
    try {
      return btoa(encodeURIComponent(JSON.stringify(build)));
    } catch {
      return "";
    }
  };

  const shareLink = (b: BuildInput, cat?: string) => {
    const encoded = encodeBuildParam(b);
    if (!encoded) return "";
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.search = `?build=${encoded}${cat ? `&cat=${encodeURIComponent(cat)}` : ""}`;
    return url.toString();
  };

  const onCopyLink = (b: BuildInput, cat?: string, label?: string) => {
    const url = shareLink(b, cat);
    if (!url) {
      setError("Impossible de générer le lien de partage.");
      return;
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => setFlash(`Lien copié pour "${label ?? ""}"`));
    } else {
      prompt("Copie le lien de partage :", url);
    }
  };

  const exportSingleJSON = (b: BuildInput, cat?: string, label?: string) => {
    const json = JSON.stringify({ build: b, cat }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-${(label ?? "partage").replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFlash(`JSON exporté pour "${label ?? ""}"`);
  };

  const applyBuild = (build: BuildInput, cat?: string, label?: string) => {
    localStorage.setItem("lastBuild_v2", JSON.stringify(build));
    if (cat) localStorage.setItem("lastBuildCat_v2", cat);
    navigate("/", { state: { build, cat } });
    setFlash(`Build "${label ?? ""}" appliqué`);
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
      <div aria-live="polite" className="text-sm text-emerald-600">{flash}</div>

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
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground">Créé le {new Date(b.createdAt).toLocaleString()}</div>
                {b.cat && <span className={cls.badgeNeutral}>Catégorie {b.cat}</span>}
              </div>
              <div className="flex gap-2">
                <button className={cls.btnPrimary} onClick={()=>applyBuild(b.build, b.cat, b.name)}>Appliquer</button>
                <button className={cls.btnGhost} onClick={()=>onCopyLink(b.build, b.cat, b.name)}>Partager</button>
                <button className={cls.btnGhost} onClick={()=>exportSingleJSON(b.build, b.cat, b.name)}>Exporter JSON</button>
                <button className={`${cls.btnGhost} border border-rose-200 text-rose-600`} onClick={()=>onDelete(b.id)}>Supprimer</button>
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
