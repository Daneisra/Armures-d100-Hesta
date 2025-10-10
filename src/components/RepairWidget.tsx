import { useMemo, useState } from "react";
import type { Material, Quality, Params } from "../types";
import { computeRepair, formatHours } from "../lib/repair";

export default function RepairWidget({
  paMax,
  material,
  quality,
  params
}: {
  paMax: number;
  material?: Material;
  quality?: Quality;
  params: Params;
}){
  const [paCurrent, setPaCurrent] = useState<number>(paMax);

  const paMissing = Math.max(0, Math.min(paMax, paMax - paCurrent));
  const rep = useMemo(()=> {
    if (!material || !quality) return null;
    return computeRepair(paMissing, material, quality, params);
  }, [paMissing, material, quality, params]);

  return (
    <div className="rounded-xl border p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Réparation</h3>
        <div className="text-xs opacity-70">
          bases ({material?.compat}) — {params.repair.costPerPA[material?.compat ?? "Métal"]} po / {params.repair.timePerPA[material?.compat ?? "Métal"]} h par PA
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 items-end text-sm">
        <label>
          <div className="opacity-70 mb-1">PA max</div>
          <input className="input" type="number" value={paMax} readOnly />
        </label>
        <label>
          <div className="opacity-70 mb-1">PA actuel</div>
          <input
            className="input"
            type="number"
            min={0}
            max={paMax}
            value={paCurrent}
            onChange={(e)=> setPaCurrent(Math.max(0, Math.min(paMax, parseInt(e.target.value||"0",10) || 0)))}
          />
        </label>
        <div>
          <div className="opacity-70 mb-1">PA manquants</div>
          <div className="input">{paMissing}</div>
        </div>
      </div>

      {rep && (
        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="rounded-md border p-3">
            <div className="opacity-70">Coût total</div>
            <div className="text-lg font-semibold tabular">{rep.cost.toFixed(0)} po</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="opacity-70">Temps total</div>
            <div className="text-lg font-semibold">{formatHours(rep.hours)}</div>
            <div className="text-xs opacity-60 tabular">{rep.hours.toFixed(1)} h</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="opacity-70 mb-1">Multiplicateurs</div>
            <div className="text-xs leading-6">
              Matériau: coût ×{rep.breakdown.mCost} • temps ×{rep.breakdown.mTime}<br/>
              Qualité: coût ×{rep.breakdown.qCost} • temps ×{rep.breakdown.qTime}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
