import { useMemo, useState } from "react";
import { params } from "../data";

type RoundMode = "nearest" | "floor" | "ceil";

function roundBy(mode: RoundMode, v: number){
  if (mode === "floor") return Math.floor(v);
  if (mode === "ceil")  return Math.ceil(v);
  return Math.round(v);
}

function interpTable(x: number, pts: [number, number][]) {
  if (pts.length === 0) return 0;
  const sorted = [...pts].sort((a,b)=>a[0]-b[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length-1][0]) return sorted[sorted.length-1][1];
  // recherche du segment
  for (let i=0;i<sorted.length-1;i++){
    const [x1,y1] = sorted[i], [x2,y2] = sorted[i+1];
    if (x >= x1 && x <= x2){
      const t = (x - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return 0;
}

function computePV(con: number, level: number){
  const pv = params.pv as any;
  const roundMode: RoundMode = pv.round ?? "nearest";
  let raw = 0;

  if (pv.mode === "linear"){
    raw = (pv.slope ?? 0) * con + (pv.offset ?? 0);
  } else if (pv.mode === "table"){
    raw = interpTable(con, pv.points ?? []);
  }

  raw += (pv.perLevel ?? 0) * Math.max(0, level);

  const capped = Math.min(raw, pv.cap ?? raw);
  return roundBy(roundMode, capped);
}

export default function PVPage(){
  const pv = params.pv as any;
  const minCon = pv.minCon ?? 0, maxCon = pv.maxCon ?? 100;

  const [con, setCon]     = useState(50);
  const [level, setLevel] = useState(0);

  const value = useMemo(()=> computePV(con, level), [con, level, pv]);

  // mini-grille pour visualiser les valeurs “arrondies” comme dans ton tableau
  const sampleCons = [80,75,70,65,60,55,50,45,40,35,30,25,20,15,10,5,1,0];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">PV & Constitution <span className="text-sm opacity-60">v{__APP_VERSION__}</span></h1>
        <p className="text-sm opacity-80 mt-1">
          Modèle actuel : <b>{pv.mode === "linear" ? `linéaire` : `table`}</b>
          {pv.mode === "linear" ? ` (PV = round(CON × ${pv.slope}${pv.offset?` + ${pv.offset}`:""}))` : ""}, arrondi <b>{pv.round ?? "nearest"}</b>.
        </p>
      </header>

      <section className="rounded-xl border p-4 space-y-4">
        <h2 className="font-semibold">Mini calculateur</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="opacity-70 text-sm block mb-1">CON ({minCon}–{maxCon})</label>
            <input className="input" type="number" min={minCon} max={maxCon} value={con}
                   onChange={e=>setCon(Math.max(minCon, Math.min(maxCon, parseInt(e.target.value||"0",10) || 0)))} />
            <input className="w-full mt-2" type="range" min={minCon} max={maxCon} step={1} value={con}
                   onChange={e=>setCon(parseInt(e.target.value,10))} />
          </div>
          <div>
            <label className="opacity-70 text-sm block mb-1">Niveau (optionnel)</label>
            <input className="input" type="number" min={0} max={50} value={level}
                   onChange={e=>setLevel(Math.max(0, parseInt(e.target.value||"0",10)||0))} />
          </div>
          <div className="rounded-lg border p-3 flex flex-col justify-center">
            <div className="text-sm opacity-70">PV calculés</div>
            <div className="text-2xl font-semibold tabular">{value}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Table (repère)</h2>
        <div className="grid grid-cols-3 text-sm font-medium mb-1">
          <div>Constitution</div><div>PV (exact)</div><div>PV (arrondi)</div>
        </div>
        <div className="divide-y">
          {sampleCons.map(c=>{
            const exact = pv.mode === "linear" ? (pv.slope * c + (pv.offset ?? 0)) : interpTable(c, pv.points ?? []);
            const rounded = computePV(c, 0);
            return (
              <div key={c} className="grid grid-cols-3 text-sm py-1">
                <div className="tabular">{c}</div>
                <div className="tabular">{exact.toFixed(3)}</div>
                <div className="tabular font-semibold">{rounded}</div>
              </div>
            );
          })}
        </div>
        <p className="text-xs opacity-70 mt-2">La colonne “PV (arrondi)” reproduit exactement tes résultats (ex. 75 → 47, 45 → 29, 1 → 1).</p>
      </section>
    </div>
  );
}
