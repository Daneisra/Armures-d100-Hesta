import { useMemo, useState } from "react";
import { params } from "../data";
import { cls } from "../ui/styles";

type RoundMode = "nearest" | "floor" | "ceil";

function roundBy(mode: RoundMode, v: number) {
  if (mode === "floor") return Math.floor(v);
  if (mode === "ceil") return Math.ceil(v);
  return Math.round(v);
}

function interpTable(x: number, pts: [number, number][]) {
  if (pts.length === 0) return 0;
  const sorted = [...pts].sort((a, b) => a[0] - b[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const [x1, y1] = sorted[i], [x2, y2] = sorted[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return 0;
}

function computePV(con: number, level: number) {
  const pv = params.pv as any;
  const roundMode: RoundMode = pv.round ?? "nearest";
  let raw = 0;

  if (pv.mode === "linear") {
    raw = (pv.slope ?? 0) * con + (pv.offset ?? 0);
  } else if (pv.mode === "table") {
    raw = interpTable(con, pv.points ?? []);
  }

  raw += (pv.perLevel ?? 0) * Math.max(0, level);

  const capped = Math.min(raw, pv.cap ?? raw);
  return roundBy(roundMode, capped);
}

export default function PVPage() {
  const pv = params.pv as any;
  const minCon = pv.minCon ?? 0;
  const maxCon = pv.maxCon ?? 100;

  const [con, setCon] = useState(50);
  const [level, setLevel] = useState(0);

  const value = useMemo(() => computePV(con, level), [con, level, pv]);
  const sampleCons = [80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1, 0];

  return (
    <div className={`${cls.page} max-w-3xl space-y-6`}>
      <header>
        <h1 className="text-2xl font-bold">
          PV & Constitution <span className="text-sm opacity-60">v{__APP_VERSION__}</span>
        </h1>
        <p className="text-sm opacity-80 mt-1">
          Modèle actuel : <b>{pv.mode === "linear" ? "linéaire" : "table"}</b>
          {pv.mode === "linear"
            ? ` (PV = round(CON × ${pv.slope}${pv.offset ? ` + ${pv.offset}` : ""}))`
            : ""}
          , arrondi <b>{pv.round ?? "nearest"}</b>.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Les PV sont calculés à partir de la Constitution selon ta table Hesta (d100 inversé). Utilise le
          slider pour voir l’évolution des PV, puis compare avec la table détaillée.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-semibold">Mini calculateur</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className={`${cls.card} space-y-2`}>
            <label className="text-sm font-medium text-muted-foreground">CON ({minCon}-{maxCon})</label>
            <input
              className={cls.input}
              type="number"
              min={minCon}
              max={maxCon}
              value={con}
              onChange={e =>
                setCon(Math.max(minCon, Math.min(maxCon, parseInt(e.target.value || "0", 10) || 0)))
              }
            />
            <input
              className="w-full mt-2"
              type="range"
              min={minCon}
              max={maxCon}
              step={1}
              value={con}
              onChange={e => setCon(parseInt(e.target.value, 10))}
            />
          </div>

          <div className={`${cls.card} space-y-2`}>
            <label className="text-sm font-medium text-muted-foreground">Niveau (optionnel)</label>
            <input
              className={cls.input}
              type="number"
              min={0}
              max={50}
              value={level}
              onChange={e => setLevel(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
            />
          </div>

          <div className={`${cls.card} flex flex-col items-center justify-center`}>
            <div className="text-xs text-muted-foreground">PV calculés</div>
            <div className="text-3xl font-semibold tabular text-center">{value}</div>
          </div>
        </div>
      </section>

      <section className={cls.card}>
        <h2 className="font-semibold mb-2">Table (repère)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="text-left">
                <th className="px-2 py-1">Constitution</th>
                <th className="px-2 py-1">PV (exact)</th>
                <th className="px-2 py-1">PV (arrondi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {sampleCons.map(c => {
                const exact = pv.mode === "linear" ? (pv.slope * c + (pv.offset ?? 0)) : interpTable(c, pv.points ?? []);
                const rounded = computePV(c, 0);
                return (
                  <tr key={c} className="text-sm">
                    <td className="px-2 py-1 tabular">{c}</td>
                    <td className="px-2 py-1 tabular">{exact.toFixed(3)}</td>
                    <td className="px-2 py-1 tabular font-semibold">{rounded}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          La colonne “PV (arrondi)” reproduit exactement tes résultats (ex. 75 ⇒ 47, 45 ⇒ 29, 1 ⇒ 1).
        </p>
      </section>
    </div>
  );
}
