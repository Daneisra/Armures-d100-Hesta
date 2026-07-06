import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeBuild } from "../lib/calc";
import type { BuildInput, Category } from "../types";
import InputRow from "./InputRow";
import RatioPill from "./RatioPill";
import CompatBadge from "./CompatBadge";
import WearWidget from "./WearWidget";
import RepairWidget from "./RepairWidget";
import AccessibleDialog from "./AccessibleDialog";
import { addBuild } from "../buildCatalog";
import { useCatalogData } from "../catalogContext";
import { cls } from "../ui/styles";
import { useLocation, useNavigate } from "react-router-dom";

// --- localStorage versionning ---
const SCHEMA = 2;
const STORAGE_KEY = `lastBuild_v${SCHEMA}`;
const LEGACY_KEYS = ["lastBuild"];
const CAT_KEY = "lastBuildCat_v2";

export default function Calculator(){
  const { chassis, materials, qualities, shields, params, categories, enchants, shieldMaterials } = useCatalogData();
  const location = useLocation();
  const navigate = useNavigate();

  const sanitize = useCallback((b: BuildInput): BuildInput => {
    const safe = { ...b } as BuildInput;
    const has = (name: string, list: {name:string}[]) => list.some(x => x.name === name);

    if (!has(safe.chassis,   chassis))   safe.chassis   = chassis[0]?.name ?? "";
    if (!has(safe.material,  materials)) safe.material  = materials[0]?.name ?? "";
    if (!qualities.some(q=>q.name===safe.quality)) safe.quality = qualities[0]?.name ?? "";
    if (!has(safe.shield,    shields))   safe.shield    = shields[0]?.name ?? "";

    if (safe.shield !== "Aucun") {
      const okShieldMat = (shieldMaterials||[]).some(m => m.name === safe.shieldMaterial);
      if (!okShieldMat) safe.shieldMaterial = shieldMaterials?.[0]?.name ?? "";
    } else {
      safe.shieldMaterial = "";
    }

    if (!safe.enchantId) safe.enchantId = "protection";
    if (typeof safe.enchant !== "number") safe.enchant = 0;
    return safe;
  }, [chassis, materials, qualities, shields, shieldMaterials]);

  const defaults = useMemo<BuildInput>(() => ({
    chassis: chassis[0]?.name ?? "",
    material: materials[0]?.name ?? "",
    quality:  qualities[1]?.name ?? qualities[0]?.name ?? "",
    renfort:  0,
    enchant:  0,
    enchantId: "protection",
    shield:   shields[0]?.name ?? "",
    shieldMaterial: shieldMaterials?.[0]?.name ?? "",
    cat: localStorage.getItem(CAT_KEY) ?? "",
  }), [chassis, materials, qualities, shields, shieldMaterials]);

  // --- État principal (avec migration + fallback sûr) ---
  const [inp, setInp] = useState<BuildInput>(() => {
    try {
      const rawNew = localStorage.getItem(STORAGE_KEY);
      const rawLegacy = LEGACY_KEYS.map(k => localStorage.getItem(k)).find(Boolean) ?? null;
      const base = rawNew ?? rawLegacy;
      const init = base ? sanitize(JSON.parse(base)) : sanitize(defaults);
      if (!rawNew && rawLegacy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
        LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
      }
      return init;
    } catch {
      return sanitize(defaults);
    }
  });
  const [showLegend, setShowLegend] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Build partagé via URL (?build=...&cat=...)
  useEffect(() => {
    const paramsUrl = new URLSearchParams(location.search);
    const encoded = paramsUrl.get("build");
    if (!encoded) return;
    try {
      const decoded = decodeURIComponent(atob(encoded));
      const parsed = JSON.parse(decoded) as BuildInput;
      const next = sanitize(parsed);
      const catParam = paramsUrl.get("cat") ?? undefined;
      setInp(next);
      if (catParam) setCat(catParam);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (catParam) localStorage.setItem(CAT_KEY, catParam);
    } catch {
      // ignore malformed share links
    }
    // nettoyer l'URL pour éviter la réapplication
    const cleaned = new URLSearchParams(location.search);
    cleaned.delete("build");
    cleaned.delete("cat");
    navigate({ pathname: location.pathname, search: cleaned.toString() ? `?${cleaned}` : "" }, { replace: true, state: null });
  }, [location.search, sanitize, navigate, location.pathname]);

  // Hydrate depuis un build appliqué via navigation state (sans reload)
  useEffect(() => {
    const state = location.state as { build?: BuildInput; cat?: string } | null;
    if (state?.build) {
      const next = sanitize(state.build);
      setInp(next);
      if (state.cat) setCat(state.cat);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (state.cat) localStorage.setItem(CAT_KEY, state.cat);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, sanitize, navigate, location.pathname]);

  // sauvegarde versionnée
  useEffect(()=> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inp));
  }, [inp]);

  // reset local config (bouton)
  const resetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CAT_KEY);
    LEGACY_KEYS.forEach(k=>localStorage.removeItem(k));
    window.location.reload();
  };

  const saveCurrentBuild = () => {
    const name = saveName.trim();
    if (!name) return;
    addBuild({ name, build: { ...inp, cat }, cat });
    setSaveName("");
    setSaveDialogOpen(false);
    setFeedback(`Build « ${name} » sauvegardé dans le catalogue local.`);
  };

  // --- filtre catégorie pilotée par châssis ---
  const [cat, setCat] = useState<string>(() => localStorage.getItem(CAT_KEY) ?? defaults.cat ?? "");

  const expectedCompat = useMemo(
    () => chassis.find(c => c.name === inp.chassis)?.category,
    [chassis, inp.chassis]
  );

  const categoriesSorted = useMemo(
    () => [...categories].sort((a: Category, b: Category) => a.sort - b.sort),
    [categories]
  );

  const categoriesForChassis = useMemo(
    () => categoriesSorted.filter(c => !expectedCompat || c.compat === expectedCompat),
    [categoriesSorted, expectedCompat]
  );

  useEffect(() => {
    if (!categoriesForChassis.length) return;
    if (!cat || !categoriesForChassis.find(c => c.key === cat)) {
      setCat(categoriesForChassis[0].key);
    }
  }, [categoriesForChassis]);

  useEffect(() => {
    if (cat) localStorage.setItem(CAT_KEY, cat);
  }, [cat]);

  const mats = useMemo(() => {
    const byCompat = expectedCompat ? materials.filter(m => m.compat === expectedCompat) : materials;
    const byCat    = cat ? byCompat.filter(m => m.category === cat) : byCompat;
    return byCat.sort((a, b) => a.name.localeCompare(b.name));
  }, [expectedCompat, cat, materials]);

  useEffect(() => {
    if (!mats.find(m => m.name === inp.material) && mats.length > 0) {
      setInp(s => ({ ...s, material: mats[0].name }));
    }
  }, [mats, inp.material]);

  const res = useMemo(
    () => computeBuild(inp, { chassis, materials, qualities, shields, params, enchants, shieldMaterials }),
    [inp, chassis, materials, qualities, shields, params, enchants, shieldMaterials]
  );
  const cardFx = "animate-in fade-in slide-in-from-bottom-2 duration-200";

  const chCurrent  = useMemo(() => chassis.find(c => c.name === inp.chassis), [chassis, inp.chassis]);
  const matCurrent = useMemo(() => materials.find(m => m.name === inp.material), [materials, inp.material]);
  const qCurrent   = useMemo(() => qualities.find(q => q.name === inp.quality), [qualities, inp.quality]);
  const enchCurrent= useMemo(() => enchants.find(e => e.id === (inp.enchantId ?? "protection")), [enchants, inp.enchantId]);
  const compatOk = Boolean(chCurrent && matCurrent && matCurrent.compat === chCurrent.category);

  const onNum = (k: keyof Pick<BuildInput, "renfort" | "enchant">) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setInp(s => ({ ...s, [k]: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }));

  const materialForWear = useMemo(() => {
    if (!matCurrent || !enchCurrent || (inp.enchant ?? 0) <= 0) return matCurrent;
    const delta = (enchCurrent.perLevel ?? 0) * (inp.enchant ?? 0);
    if (enchCurrent.kind === "extraPen_delta") {
      return { ...matCurrent, extraPen: Math.max(0, (matCurrent.extraPen ?? 0) + delta) };
    }
    if (enchCurrent.kind === "pen_ignore_add") {
      return { ...matCurrent, penIgnore: Math.max(0, (matCurrent.penIgnore ?? 0) + delta) };
    }
    return matCurrent;
  }, [matCurrent, enchCurrent, inp.enchant]);

  const ratioValue = res.malusFinal <= 0 ? Infinity : res.paFinal / res.malusFinal;
  const ratioSpoken = Number.isFinite(ratioValue) ? ratioValue.toFixed(2) : "infini";

  const efficiencyPoints = useMemo(() => {
    const maxMalus = Math.max(12, res.malusFinal + 6);
    const step = Math.max(1, Math.ceil(maxMalus / 10));
    const base = [];
    for (let m = step; m <= maxMalus; m += step) {
      base.push({ x: m, y: res.paFinal / Math.max(1, m) });
    }
    if (!base.find(p => p.x === res.malusFinal) && res.malusFinal > 0) {
      base.push({ x: res.malusFinal, y: ratioValue });
    }
    return base.sort((a, b) => a.x - b.x);
  }, [res.paFinal, res.malusFinal, ratioValue]);

  const wearPoints = useMemo(() => {
    const perHit = Math.min(
      params.baseWear + (materialForWear?.extraPen ?? 0),
      params.capWearPerHit
    );
    const hits = 10;
    const pts = [];
    for (let i = 0; i <= hits; i += 1) {
      pts.push({ x: i, y: Math.max(0, res.paFinal - perHit * i) });
    }
    return { pts, perHit };
  }, [materialForWear?.extraPen, params.baseWear, params.capWearPerHit, res.paFinal]);

  return (
    <div className={`${cls.page} max-w-7xl space-y-6`}>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Calculateur d'armure <span className="text-sm opacity-60">v{__APP_VERSION__}</span></h1>
        <button className={cls.btnGhost} onClick={() => setResetDialogOpen(true)} title="Efface la configuration locale et recharge">
          Réinitialiser la config locale
        </button>
      </div>
      <p className="text-sm opacity-80">
        d100 inversé — objectif : ratio PA/Malus ≈ {params.sweetSpotRatio}
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <section className={`${cls.card} ${cardFx} order-2 xl:order-none xl:col-start-1 xl:row-start-1 xl:row-span-4 2xl:row-span-2`}>
          <h2 className="text-base font-semibold mb-3">Entrées</h2>

          <InputRow label="Châssis" id="calc-chassis">
            <select
              id="calc-chassis"
              className={cls.select}
              value={inp.chassis}
              onChange={e => setInp({ ...inp, chassis: e.target.value })}
            >
              {chassis.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Catégorie (affinage)" id="calc-category">
            <select id="calc-category" className={cls.select} value={cat} onChange={e => setCat(e.target.value)}>
              {categoriesForChassis.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </InputRow>

          <InputRow label="Matériau" id="calc-material">
            <select
              id="calc-material"
              className={cls.select}
              value={inp.material}
              onChange={e => setInp({ ...inp, material: e.target.value })}
            >
              {mats.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Qualité" id="calc-quality">
            <select
              id="calc-quality"
              className={cls.select}
              value={inp.quality}
              onChange={e => setInp({ ...inp, quality: e.target.value })}
            >
              {qualities.map(q => <option key={q.name} value={q.name}>{q.name}</option>)}
            </select>
          </InputRow>

          <InputRow label="Renfort" id="calc-renfort">
            <div>
              <input
                id="calc-renfort"
                className={cls.input}
                type="number"
                min={0}
                max={params.renfortMax}
                value={inp.renfort}
                onChange={onNum("renfort")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Chaque niveau ajoute +1 PA mais aussi +1 malus.
              </p>
            </div>
          </InputRow>

          <InputRow label="Enchantement" id="calc-enchant">
            <div>
              <select
                id="calc-enchant"
                className={cls.select}
                value={inp.enchantId ?? "protection"}
                onChange={e => setInp({ ...inp, enchantId: e.target.value })}
              >
                {enchants.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Choisis l'effet appliqué avant de fixer son niveau.
              </p>
            </div>
          </InputRow>

          <InputRow label="Niveau d'enchant" id="calc-enchant-level">
            <div>
              <input
                id="calc-enchant-level"
                className={cls.input}
                type="number"
                min={0}
                max={params.enchantMax}
                value={inp.enchant}
                onChange={e => setInp(s => ({
                  ...s,
                  enchant: Math.max(0, Math.min(params.enchantMax, parseInt(e.target.value||"0",10)||0)),
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Limité à {params.enchantMax} niveaux selon tes règles.
              </p>
            </div>
          </InputRow>

          <InputRow label="Bouclier" id="calc-shield">
            <select
              id="calc-shield"
              className={cls.select}
              value={inp.shield}
              onChange={e => setInp({ ...inp, shield: e.target.value })}
            >
              {shields.map(s => <option key={s.name}>{s.name}</option>)}
            </select>
          </InputRow>

          {inp.shield !== "Aucun" && (
            <InputRow label="Matériau de bouclier" id="calc-shield-material">
              <select
                id="calc-shield-material"
                className={cls.select}
                value={inp.shieldMaterial ?? ""}
                onChange={e => setInp({ ...inp, shieldMaterial: e.target.value })}
              >
                {shieldMaterials.map(sm => <option key={sm.name} value={sm.name}>{sm.name}</option>)}
              </select>
            </InputRow>
          )}
        </section>

          <section className={`${cls.card} ${cardFx} order-1 xl:order-none xl:col-start-2 xl:row-start-1`}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Résumé</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>PA final</span><b className="tabular">{res.paFinal}</b></div>
              <div className="flex items-center justify-between"><span>Malus final</span><b className="tabular">{res.malusFinal}</b></div>
              <div className="flex items-center justify-between">
                <span>Compatibilité</span>
                <CompatBadge chassis={chCurrent} material={matCurrent} />
              </div>
              <div className="flex items-center justify-between">
                <span>Efficacité</span>
                <div className="flex items-center gap-2">
                  <RatioPill ratio={res.effic} />
                  <span className={res.sweet ? cls.badgeGood : cls.badgeBad}>
                    {res.sweet ? "Bon équilibre" : "-"}
                  </span>
                </div>
              </div>

              {res.notes.length > 0 && (
                <div className="pt-2 border-t mt-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Effets</div>
                  <ul className={cls.noteList}>
                    {res.notes.map((n, i) => (<li key={i}>{n}</li>))}
                  </ul>
                </div>
              )}
            </div>
            <div aria-live="polite" className="sr-only">
              {`PA ${res.paFinal}, malus ${res.malusFinal}, ratio ${ratioSpoken}, ${compatOk ? "châssis et matériau compatibles." : "châssis et matériau incompatibles."} ${res.sweet ? "Bon équilibre." : ""}`}
            </div>
            <div className="pt-3 border-t mt-3 flex gap-2 flex-wrap">
              <button className={cls.btnPrimary} onClick={() => setSaveDialogOpen(true)}>
                Enregistrer ce build
              </button>
              <button
                className={cls.btnGhost}
                onClick={() => navigate("/print", { state: { build: { ...inp, cat }, cat } })}
              >
                Voir la fiche
              </button>
              <button
                className={cls.btnGhost}
                onClick={() => {
                  localStorage.setItem("lastBuild_v2", JSON.stringify({ ...inp, cat }));
                  localStorage.setItem("lastBuildCat_v2", cat);
                  setFeedback("Build appliqué pour le chargement rapide.");
                }}
              >
                Charger ce build
              </button>
              <button
                className={cls.btnGhost}
                onClick={() => setShowLegend(v => !v)}
                aria-expanded={showLegend}
                aria-controls="calc-legend"
              >
                {showLegend ? "Masquer la légende" : "Afficher la légende"}
              </button>
            </div>
            {showLegend && (
              <div id="calc-legend" className="mt-3 border-t pt-3">
                <h4 className="font-semibold mb-2 text-sm">Légende</h4>
                <ul className={`${cls.noteList} space-y-2`}>
                  <li className="flex items-center">
                    <span className={cls.badgeGood}>Compatible</span>
                    <span className="ml-2 text-sm text-muted-foreground">→ châssis et matériau alignés.</span>
                  </li>
                  <li className="flex items-center">
                    <span className={cls.badgeBad}>Incompatible</span>
                    <span className="ml-2 text-sm text-muted-foreground">→ combinaison à éviter.</span>
                  </li>
                  <li className="flex items-center">
                    <span className={cls.badgeWarn}>Sweet spot</span>
                    <span className="ml-2 text-sm text-muted-foreground">→ ratio PA/malus favorable.</span>
                  </li>
                </ul>
              </div>
            )}
          </section>

          <section className={`${cls.card} ${cardFx} order-3 xl:order-none xl:col-start-2 xl:row-start-2 2xl:col-start-3 2xl:row-start-1`}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Équilibrage (aperçu)</h3>
            <div className="grid gap-6">
              <MiniLineChart
                title="Efficacité selon le malus"
                points={efficiencyPoints}
                highlight={{ x: res.malusFinal, y: ratioValue }}
                xLabel="Malus"
                yLabel="PA/Malus"
              />
              <MiniLineChart
                title="Usure cumulée (PA restante)"
                points={wearPoints.pts}
                highlight={{ x: 0, y: res.paFinal }}
                xLabel="Coups"
                yLabel="PA"
                note={`Usure par coup ≈ ${wearPoints.perHit.toFixed(1)}`}
              />
            </div>
          </section>

          <WearWidget
            paFinal={res.paFinal}
            material={materialForWear}
            params={params}
            className={`${cls.card} ${cardFx} order-4 xl:order-none xl:col-start-2 xl:row-start-3 2xl:row-start-2`}
          />
          <RepairWidget
            paMax={res.paFinal}
            material={matCurrent}
            quality={qCurrent}
            params={params}
            className={`${cls.card} ${cardFx} order-5 xl:order-none xl:col-start-2 xl:row-start-4 2xl:col-start-3 2xl:row-start-2`}
          />
      </div>

      <div aria-live="polite" className="text-sm text-emerald-600 dark:text-emerald-300">
        {feedback}
      </div>

      <AccessibleDialog
        open={saveDialogOpen}
        title="Enregistrer le build"
        description="Choisis un nom pour retrouver cette configuration dans le catalogue local."
        onClose={() => setSaveDialogOpen(false)}
        initialFocusSelector="#save-build-name"
        footer={(
          <>
            <button className={cls.btnGhost} type="button" onClick={() => setSaveDialogOpen(false)}>Annuler</button>
            <button className={cls.btnPrimary} type="submit" form="save-build-form" disabled={!saveName.trim()}>
              Enregistrer
            </button>
          </>
        )}
      >
        <form id="save-build-form" onSubmit={event => { event.preventDefault(); saveCurrentBuild(); }}>
          <label htmlFor="save-build-name" className="text-sm font-medium">Nom du build</label>
          <input
            id="save-build-name"
            className={`${cls.input} mt-1`}
            value={saveName}
            onChange={event => setSaveName(event.target.value)}
            autoComplete="off"
          />
        </form>
      </AccessibleDialog>

      <AccessibleDialog
        open={resetDialogOpen}
        title="Réinitialiser la configuration locale ?"
        description="Le dernier build actif sera effacé et la page sera rechargée avec les valeurs par défaut."
        onClose={() => setResetDialogOpen(false)}
        footer={(
          <>
            <button className={cls.btnGhost} type="button" onClick={() => setResetDialogOpen(false)}>Annuler</button>
            <button className={`${cls.btnPrimary} bg-rose-600 hover:bg-rose-700`} type="button" onClick={resetLocal}>
              Réinitialiser
            </button>
          </>
        )}
      >
        <p className="text-sm text-muted-foreground">Cette action ne supprime pas les builds enregistrés dans le catalogue.</p>
      </AccessibleDialog>
    </div>
  );
}

type Point = { x: number; y: number };
const chartExportButton = "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium shadow-sm outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/50";

function chartFilename(title: string, extension: "svg" | "csv") {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "graphique"}.${extension}`;
}

function downloadChart(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function MiniLineChart({
  title,
  points,
  highlight,
  xLabel,
  yLabel,
  note,
}: {
  title: string;
  points: Point[];
  highlight?: Point;
  xLabel: string;
  yLabel: string;
  note?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const cleanPoints = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const highlightFinite = highlight && Number.isFinite(highlight.x) && Number.isFinite(highlight.y) ? highlight : undefined;
  if (!cleanPoints.length) return null;
  const xs = cleanPoints.map(p => p.x).concat(highlightFinite ? [highlightFinite.x] : []);
  const ys = cleanPoints.map(p => p.y).concat(highlightFinite ? [highlightFinite.y] : []);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys);
  const pad = 12;
  const w = 320;
  const h = 180;
  const scaleX = (x: number) => {
    if (maxX === minX) return pad;
    return pad + ((x - minX) / (maxX - minX)) * (w - pad * 2);
  };
  const scaleY = (y: number) => {
    if (maxY === minY) return h - pad;
    return h - pad - ((y - minY) / (maxY - minY)) * (h - pad * 2);
  };
  const poly = cleanPoints.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(" ");
  const activePoint = activePointIndex === null ? undefined : cleanPoints[activePointIndex];
  const formatValue = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2);

  const exportCSV = () => {
    const rows = cleanPoints.map(point => `${point.x},${point.y}`);
    downloadChart(`\uFEFF${xLabel},${yLabel}\n${rows.join("\n")}`, chartFilename(title, "csv"), "text/csv;charset=utf-8");
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("style", "color:#0ea5e9;background:#ffffff");
    clone.querySelectorAll("[data-interactive]").forEach(element => element.remove());
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    downloadChart(content, chartFilename(title, "svg"), "image/svg+xml;charset=utf-8");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">{yLabel}</span>
          <button className={chartExportButton} type="button" onClick={exportSVG}>SVG</button>
          <button className={chartExportButton} type="button" onClick={exportCSV}>CSV</button>
        </div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${title}. Utilise Tab pour explorer les points.`} className="w-full h-auto text-primary">
        <title>{title}</title>
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" strokeOpacity={0.25} />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="currentColor" strokeOpacity={0.25} />
        <polyline fill="none" stroke="currentColor" strokeWidth={2} points={poly} />
        {cleanPoints.map((p, idx) => (
          <circle
            key={idx}
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={activePointIndex === idx ? 5 : 3.5}
            fill="currentColor"
            fillOpacity={activePointIndex === idx ? 0.9 : 0.2}
            stroke="currentColor"
            strokeWidth={1}
            tabIndex={0}
            role="button"
            aria-label={`${xLabel} ${formatValue(p.x)}, ${yLabel} ${formatValue(p.y)}`}
            onMouseEnter={() => setActivePointIndex(idx)}
            onFocus={() => setActivePointIndex(idx)}
            onClick={() => setActivePointIndex(idx)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActivePointIndex(idx);
              }
            }}
          />
        ))}
        {highlightFinite && (
          <circle
            cx={scaleX(highlightFinite.x)}
            cy={scaleY(highlightFinite.y)}
            r={5}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        )}
        {activePoint && (
          <g data-interactive="tooltip" pointerEvents="none">
            <rect
              x={Math.min(w - 196, Math.max(pad, scaleX(activePoint.x) - 90))}
              y={Math.max(pad, scaleY(activePoint.y) - 38)}
              width={190}
              height={28}
              rx={5}
              fill="white"
              stroke="currentColor"
              strokeOpacity={0.4}
            />
            <text
              x={Math.min(w - 190, Math.max(pad + 6, scaleX(activePoint.x) - 84))}
              y={Math.max(pad + 19, scaleY(activePoint.y) - 19)}
              fill="#0f172a"
              fontSize={11.5}
            >
              {xLabel} {formatValue(activePoint.x)} · {yLabel} {formatValue(activePoint.y)}
            </text>
          </g>
        )}
      </svg>
      <p className="min-h-4 text-xs text-muted-foreground" aria-live="polite">
        {activePoint ? `${xLabel} ${formatValue(activePoint.x)} — ${yLabel} ${formatValue(activePoint.y)}` : "Survole un point ou utilise le clavier pour afficher sa valeur."}
      </p>
      {note && <div className="text-right text-xs text-muted-foreground">{note}</div>}
    </div>
  );
}
