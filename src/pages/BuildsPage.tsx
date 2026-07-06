import { useMemo, useState } from "react";
import type { BuildInput } from "../types";
import { getBuilds, deleteBuild, resetBuilds, exportBuilds, importBuilds, type SavedBuild } from "../buildCatalog";
import { useNavigate } from "react-router-dom";
import { cls } from "../ui/styles";
import { useCatalogData } from "../catalogContext";
import AccessibleDialog from "../components/AccessibleDialog";
import ImportErrorPanel from "../components/ImportErrorPanel";
import { describeImportFailure, type ImportFailure } from "../lib/importFeedback";

export default function BuildsPage() {
  const [builds, setBuilds] = useState(() => getBuilds());
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importFailure, setImportFailure] = useState<ImportFailure | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedBuild | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const catalog = useCatalogData();
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

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteBuild(pendingDelete.id);
    setBuilds(getBuilds());
    setFlash(`Build « ${pendingDelete.name} » supprimé.`);
    setPendingDelete(null);
  };

  const onReset = () => {
    resetBuilds();
    setBuilds([]);
    setFlash("Catalogue vidé");
    setResetDialogOpen(false);
  };

  const onExport = () => {
    exportToFile();
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;
    setFlash(null);
    let text: string;
    try {
      text = await file.text();
    } catch (err: unknown) {
      setImportFailure(describeImportFailure(err, file.name, "read"));
      input.value = "";
      return;
    }
    try {
      importBuilds(text, "merge", catalog);
      setBuilds(getBuilds());
      setImportFailure(null);
      setError(null);
      setFlash(`Import de « ${file.name} » réussi.`);
    } catch (err: unknown) {
      setImportFailure(describeImportFailure(err, file.name));
    } finally {
      input.value = "";
    }
  };

  const copyErrorReport = async () => {
    if (!importFailure) return;
    try {
      await navigator.clipboard.writeText(importFailure.report);
      setFlash("Rapport d’erreurs copié");
    } catch {
      prompt("Copie le rapport d’erreurs :", importFailure.report);
    }
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalogue de builds</h1>
          <p className="text-sm text-muted-foreground">Sauvegardes locales (localStorage) exportables en JSON.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <label className={cls.btnGhost}>
            Import JSON
            <input type="file" accept="application/json" className="sr-only" onChange={onImport} />
          </label>
          <button className={cls.btnGhost} onClick={onExport}>Exporter (copie)</button>
          <button className={cls.btnGhost} onClick={() => setResetDialogOpen(true)}>Tout réinitialiser</button>
        </div>
      </header>

      {importFailure && (
        <ImportErrorPanel
          failure={importFailure}
          onCopy={copyErrorReport}
          onDismiss={() => setImportFailure(null)}
        />
      )}
      {error && (
        <section className={`${cls.card} border-rose-500 text-sm`} role="alert">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-rose-700 dark:text-rose-200">Action impossible</h2>
              <p className="mt-1 text-muted-foreground">{error}</p>
            </div>
            <button className={cls.btnGhost} type="button" onClick={() => setError(null)}>Fermer</button>
          </div>
        </section>
      )}
      <div aria-live="polite" className="text-sm text-emerald-600">{flash}</div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground">Créé le {new Date(b.createdAt).toLocaleString()}</div>
                {b.cat && <span className={cls.badgeNeutral}>Catégorie {b.cat}</span>}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button className={cls.btnPrimary} onClick={()=>applyBuild(b.build, b.cat, b.name)}>Appliquer</button>
                <button
                  className={cls.btnGhost}
                  onClick={() => navigate(`/print?buildId=${encodeURIComponent(b.id)}`, { state: { build: b.build, cat: b.cat, name: b.name, source: "saved" } })}
                >
                  Voir la fiche
                </button>
                <button className={cls.btnGhost} onClick={()=>onCopyLink(b.build, b.cat, b.name)}>Partager</button>
                <button className={cls.btnGhost} onClick={()=>exportSingleJSON(b.build, b.cat, b.name)}>Exporter JSON</button>
                <button className={`${cls.btnGhost} border border-rose-200 text-rose-600`} onClick={()=>setPendingDelete(b)}>Supprimer</button>
              </div>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 md:grid-cols-3">
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

      <AccessibleDialog
        open={Boolean(pendingDelete)}
        title="Supprimer ce build ?"
        description={pendingDelete ? `Le build « ${pendingDelete.name} » sera supprimé du catalogue local.` : undefined}
        onClose={() => setPendingDelete(null)}
        footer={(
          <>
            <button className={cls.btnGhost} type="button" onClick={() => setPendingDelete(null)}>Annuler</button>
            <button className={`${cls.btnPrimary} bg-rose-600 hover:bg-rose-700`} type="button" onClick={confirmDelete}>
              Supprimer
            </button>
          </>
        )}
      >
        <p className="text-sm text-muted-foreground">Cette action est définitive.</p>
      </AccessibleDialog>

      <AccessibleDialog
        open={resetDialogOpen}
        title="Vider tout le catalogue ?"
        description="Tous les builds sauvegardés localement seront supprimés."
        onClose={() => setResetDialogOpen(false)}
        footer={(
          <>
            <button className={cls.btnGhost} type="button" onClick={() => setResetDialogOpen(false)}>Annuler</button>
            <button className={`${cls.btnPrimary} bg-rose-600 hover:bg-rose-700`} type="button" onClick={onReset}>
              Tout supprimer
            </button>
          </>
        )}
      >
        <p className="text-sm text-muted-foreground">Pense à exporter les builds que tu souhaites conserver.</p>
      </AccessibleDialog>
    </div>
  );
}
