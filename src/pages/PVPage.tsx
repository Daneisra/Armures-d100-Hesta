import { useMemo, useState } from "react";
import { useCatalogData } from "../catalogContext";
import type { PVParams } from "../types";
import { computePV, interpTable } from "../lib/pv";
import { cls } from "../ui/styles";

export default function PVPage() {
  const { params } = useCatalogData();
  const pv = params.pv as PVParams;
  const minCon = pv.mode === "linear" ? (pv.minCon ?? 0) : 0;
  const maxCon = pv.mode === "linear" ? (pv.maxCon ?? 100) : 100;

  const [con, setCon] = useState(50);
  const [level, setLevel] = useState(0);

  const value = useMemo(() => computePV(con, level, pv), [con, level, pv]);
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
          , arrondi au plus proche.
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
            <label className="text-sm font-medium text-muted-foreground" htmlFor="pv-constitution">CON ({minCon}-{maxCon})</label>
            <input
              id="pv-constitution"
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
              aria-label="Constitution"
              min={minCon}
              max={maxCon}
              step={1}
              value={con}
              onChange={e => setCon(parseInt(e.target.value, 10))}
            />
          </div>

          <div className={`${cls.card} space-y-2`}>
            <label className="text-sm font-medium text-muted-foreground" htmlFor="pv-level">Niveau (optionnel)</label>
            <input
              id="pv-level"
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
                const rounded = computePV(c, 0, pv);
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
      </section>
    </div>
  );
}
