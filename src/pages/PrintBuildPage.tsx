import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import type { BuildInput } from "../types";
import { useCatalogData } from "../catalogContext";
import { computeBuild } from "../lib/calc";
import { computeRepair, formatHours } from "../lib/repair";
import MaterialBadges from "../components/MaterialBadges";
import { cls } from "../ui/styles";

type PrintLocationState = {
  build?: BuildInput;
  cat?: string;
};

const BUILD_STORAGE_KEY = "lastBuild_v2";
const CATEGORY_STORAGE_KEY = "lastBuildCat_v2";

export default function PrintBuildPage() {
  const catalog = useCatalogData();
  const location = useLocation();
  const state = location.state as PrintLocationState | null;

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
      cat: state?.cat ?? localStorage.getItem(CATEGORY_STORAGE_KEY) ?? "",
    };

    let candidate = state?.build;
    if (!candidate) {
      try {
        const stored = localStorage.getItem(BUILD_STORAGE_KEY);
        candidate = stored ? JSON.parse(stored) as BuildInput : undefined;
      } catch {
        candidate = undefined;
      }
    }

    const next = { ...fallback, ...candidate, cat: state?.cat ?? candidate?.cat ?? fallback.cat };
    if (!catalog.chassis.some(item => item.name === next.chassis)) next.chassis = fallback.chassis;
    if (!catalog.materials.some(item => item.name === next.material)) next.material = fallback.material;
    if (!catalog.qualities.some(item => item.name === next.quality)) next.quality = fallback.quality;
    if (!catalog.shields.some(item => item.name === next.shield)) next.shield = fallback.shield;
    if (!catalog.enchants.some(item => item.id === next.enchantId)) next.enchantId = fallback.enchantId;
    if (!catalog.shieldMaterials.some(item => item.name === next.shieldMaterial)) next.shieldMaterial = fallback.shieldMaterial;
    return next;
  }, [catalog, state]);

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

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Fiche ${build.chassis} — Système PA`;
    return () => { document.title = previousTitle; };
  }, [build.chassis]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fiche d’armure</p>
          <h1 className="text-3xl font-bold">{build.chassis}</h1>
          <p className="text-sm text-muted-foreground">{build.material} · {build.quality}</p>
        </div>
        <Link className={cls.btnGhost} to="/">Retour au calculateur</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Résultats principaux">
        <Metric label="PA final" value={result.paFinal} />
        <Metric label="Malus final" value={result.malusFinal} />
        <Metric label="Ratio PA/Malus" value={ratio} />
      </section>

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

      <footer className="border-t border-border pt-3 text-xs text-muted-foreground">
        Généré depuis le build actuel · Système PA v{__APP_VERSION__}
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${cls.card} text-center`}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string | number }) {
  return <><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium tabular-nums">{value}</dd></>;
}
