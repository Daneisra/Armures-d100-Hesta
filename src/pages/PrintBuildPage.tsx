import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import type { BuildInput } from "../types";
import { useCatalogData } from "../catalogContext";
import { computeBuild } from "../lib/calc";
import { computeRepair, formatHours } from "../lib/repair";
import MaterialBadges from "../components/MaterialBadges";
import { cls } from "../ui/styles";
import { getBuilds } from "../buildCatalog";

type PrintLocationState = {
  build?: BuildInput;
  cat?: string;
  name?: string;
  source?: "current" | "saved";
};

const BUILD_STORAGE_KEY = "lastBuild_v2";
const CATEGORY_STORAGE_KEY = "lastBuildCat_v2";

export default function PrintBuildPage() {
  const catalog = useCatalogData();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as PrintLocationState | null;
  const savedBuildId = searchParams.get("buildId");
  const compact = searchParams.get("mode") === "compact";
  const savedBuild = useMemo(
    () => savedBuildId ? getBuilds().find(item => item.id === savedBuildId) : undefined,
    [savedBuildId]
  );
  const sheetName = state?.name ?? savedBuild?.name;
  const fromSavedBuild = state?.source === "saved" || Boolean(savedBuildId);

  const build = useMemo(() => {
    const fallback: BuildInput = {
      chassis: catalog.chassis[0]?.name ?? "",
      material: catalog.materials[0]?.name ?? "",
      quality: catalog.qualities[0]?.name ?? "",
      renfort: 0,
      enchant: 0,
      enchantId: "protection",
      shield: catalog.shields[0]?.name ?? "",
      shieldMaterial: catalog.shieldMaterials[0]?.name ?? "",
      cat: state?.cat ?? savedBuild?.cat ?? localStorage.getItem(CATEGORY_STORAGE_KEY) ?? "",
    };

    let candidate = state?.build ?? savedBuild?.build;
    if (!candidate) {
      try {
        const stored = localStorage.getItem(BUILD_STORAGE_KEY);
        candidate = stored ? JSON.parse(stored) as BuildInput : undefined;
      } catch {
        candidate = undefined;
      }
    }

    const next = { ...fallback, ...candidate, cat: state?.cat ?? savedBuild?.cat ?? candidate?.cat ?? fallback.cat };
    if (!catalog.chassis.some(item => item.name === next.chassis)) next.chassis = fallback.chassis;
    if (!catalog.materials.some(item => item.name === next.material)) next.material = fallback.material;
    if (!catalog.qualities.some(item => item.name === next.quality)) next.quality = fallback.quality;
    if (!catalog.shields.some(item => item.name === next.shield)) next.shield = fallback.shield;
    if (!catalog.enchants.some(item => item.id === next.enchantId)) next.enchantId = fallback.enchantId;
    if (!catalog.shieldMaterials.some(item => item.name === next.shieldMaterial)) next.shieldMaterial = fallback.shieldMaterial;
    return next;
  }, [catalog, savedBuild, state]);

  const result = useMemo(() => computeBuild(build, catalog), [build, catalog]);
  const chassis = catalog.chassis.find(item => item.name === build.chassis) ?? catalog.chassis[0];
  const material = catalog.materials.find(item => item.name === build.material) ?? catalog.materials[0];
  const quality = catalog.qualities.find(item => item.name === build.quality) ?? catalog.qualities[0];
  const shield = catalog.shields.find(item => item.name === build.shield) ?? catalog.shields[0];
  const enchant = catalog.enchants.find(item => item.id === build.enchantId);
  const category = catalog.categories.find(item => item.key === build.cat);
  const compatible = Boolean(chassis && material && chassis.category === material.compat);
  const ratio = result.malusFinal === 0 ? "∞" : (result.paFinal / result.malusFinal).toFixed(2);
  const repairPerPa = material && quality ? computeRepair(1, material, quality, catalog.params) : null;

  const toggleCompact = () => {
    const next = new URLSearchParams(searchParams);
    if (compact) next.delete("mode");
    else next.set("mode", "compact");
    setSearchParams(next, { replace: true, state: location.state });
  };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Fiche ${sheetName ?? build.chassis} — Système PA`;
    return () => { document.title = previousTitle; };
  }, [build.chassis, sheetName]);

  return (
    <div className={`mx-auto max-w-4xl ${compact ? "space-y-3" : "space-y-5"}`}>
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fiche d’armure</p>
          <h1 className={`${compact ? "text-2xl" : "text-3xl"} font-bold`}>{sheetName ?? build.chassis}</h1>
          <p className="text-sm text-muted-foreground">
            {sheetName ? `${build.chassis} · ` : ""}{build.material} · {build.quality}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={cls.btnGhost} type="button" onClick={toggleCompact} aria-pressed={compact}>
            {compact ? "Mode standard" : "Mode compact"}
          </button>
          <Link className={cls.btnGhost} to={fromSavedBuild ? "/builds" : "/"}>
            {fromSavedBuild ? "Retour au catalogue" : "Retour au calculateur"}
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Résultats principaux">
        <Metric label="PA final" value={result.paFinal} compact={compact} />
        <Metric label="Malus final" value={result.malusFinal} compact={compact} />
        <Metric label="Ratio PA/Malus" value={ratio} compact={compact} />
      </section>

      {compact ? (
        <section className={`${cls.card} space-y-4`} aria-labelledby="compact-sheet-title">
          <h2 id="compact-sheet-title" className="sr-only">Résumé compact</h2>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <CompactItem label="Châssis" value={build.chassis} />
            <CompactItem label="Matériau" value={build.material} />
            <CompactItem label="Qualité" value={build.quality} />
            <CompactItem label="Renfort" value={`Niveau ${build.renfort}`} />
            <CompactItem label="Enchantement" value={`${enchant?.name ?? build.enchantId ?? "Aucun"} (${build.enchant})`} />
            <CompactItem label="Bouclier" value={shield?.name ?? build.shield} />
            <CompactItem label="Compatibilité" value={compatible ? "Compatible" : "Incompatible"} />
            <CompactItem label="Groupe" value={chassis?.group ?? "—"} />
            <CompactItem label="Sweet spot" value={result.sweet ? "Atteint" : "Non atteint"} />
            <CompactItem label="Usure" value={`${catalog.params.baseWear} + ${material?.extraPen ?? 0} si pénétration`} />
            <CompactItem label="Pénétration ignorée" value={material?.penIgnore ?? 0} />
            <CompactItem label="Réparation / PA" value={repairPerPa ? `${repairPerPa.cost} po · ${formatHours(repairPerPa.hours)}` : "—"} />
          </div>
          <div className="border-t border-border pt-3">
            {material && <MaterialBadges mat={material} />}
          </div>
        </section>
      ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${cls.card} space-y-3`}>
          <h2 className="text-lg font-semibold">Composition</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <Term label="Châssis" value={build.chassis} />
            <Term label="Catégorie" value={category?.label ?? build.cat ?? "—"} />
            <Term label="Matériau" value={build.material} />
            <Term label="Qualité" value={build.quality} />
            <Term label="Renfort" value={`Niveau ${build.renfort}`} />
            <Term label="Enchantement" value={`${enchant?.name ?? build.enchantId ?? "Aucun"} (${build.enchant})`} />
            <Term label="Bouclier" value={shield?.name ?? build.shield} />
            {build.shield !== "Aucun" && <Term label="Matériau bouclier" value={build.shieldMaterial || "—"} />}
          </dl>
        </section>

        <section className={`${cls.card} space-y-3`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Évaluation</h2>
            <span className={compatible ? cls.badgeGood : cls.badgeBad}>{compatible ? "Compatible" : "Incompatible"}</span>
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
            <Term label="Groupe" value={chassis?.group ?? "—"} />
            <Term label="Sweet spot" value={result.sweet ? "Atteint" : "Non atteint"} />
            <Term label="Usure de base" value={catalog.params.baseWear} />
            <Term label="Usure pénétration" value={`+${material?.extraPen ?? 0}`} />
            <Term label="Pénétration ignorée" value={material?.penIgnore ?? 0} />
            <Term label="Cap d’usure par coup" value={catalog.params.capWearPerHit} />
          </dl>
        </section>

        <section className={`${cls.card} space-y-3`}>
          <h2 className="text-lg font-semibold">Effets et résistances</h2>
          {material && <MaterialBadges mat={material} />}
          {result.notes.length > 0 && <ul className={cls.noteList}>{result.notes.map(note => <li key={note}>{note}</li>)}</ul>}
        </section>

        <section className={`${cls.card} space-y-3`}>
          <h2 className="text-lg font-semibold">Réparation par PA</h2>
          {repairPerPa ? (
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
              <Term label="Coût estimé" value={`${repairPerPa.cost} po`} />
              <Term label="Temps estimé" value={formatHours(repairPerPa.hours)} />
              <Term label="Multiplicateur matériau" value={`coût ×${repairPerPa.breakdown.mCost} · temps ×${repairPerPa.breakdown.mTime}`} />
              <Term label="Multiplicateur qualité" value={`coût ×${repairPerPa.breakdown.qCost} · temps ×${repairPerPa.breakdown.qTime}`} />
            </dl>
          ) : <p className="text-sm text-muted-foreground">Données de réparation indisponibles.</p>}
        </section>
      </div>
      )}

      <footer className="border-t border-border pt-3 text-xs text-muted-foreground">
        Généré depuis {fromSavedBuild ? "le catalogue de builds" : "le build actuel"} · Système PA v{__APP_VERSION__}
      </footer>
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string | number; compact?: boolean }) {
  return (
    <div className={`${cls.card} ${compact ? "!p-3" : ""} text-center`}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 ${compact ? "text-2xl" : "text-3xl"} font-bold tabular-nums`}>{value}</div>
    </div>
  );
}

function CompactItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-semibold">{value}</div>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string | number }) {
  return <><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium tabular-nums">{value}</dd></>;
}
