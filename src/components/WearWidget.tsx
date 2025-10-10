import { useMemo, useState } from "react";
import type { Material, Params } from "../types";
import { simulateWear } from "../lib/wear";

export default function WearWidget({
  paFinal,
  material,
  params
}: {
  paFinal: number;
  material: Material | undefined;
  params: Params;
}) {
  const [dmg, setDmg] = useState<number>(10); // d20 par défaut

  const res = useMemo(() => {
    if (!material) return null;
    return simulateWear(dmg, paFinal, material, params);
  }, [dmg, paFinal, material, params]);

  return (
    <div className="rounded-xl border p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Usure en combat (simulation)</h3>
        <div className="text-xs opacity-70">
          base: {params.baseWear} • cap/coup: {params.capWearPerHit}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 items-end">
        <label className="text-sm">
          <div className="opacity-70 mb-1">Dégâts (d20)</div>
          <input
            type="number"
            min={0}
            max={20}
            className="input"
            value={dmg}
            onChange={(e)=>setDmg(Math.max(0, Math.min(20, parseInt(e.target.value||"0",10) || 0)))}
          />
        </label>

        {res && (
          <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="opacity-70">PA avant</span>      <b className="tabular">{res.paBefore}</b>
            <span className="opacity-70">PV subis</span>       <b className="tabular">{res.pvLost}</b>
            <span className="opacity-70">Usure appliquée</span>
            <b className="tabular">
              {res.wearApplied}
              {res.breakdown.capped && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">cap</span>}
              {res.breakdown.penetrated && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">pénétration</span>}
            </b>
            <span className="opacity-70">PA après</span>       <b className="tabular">{res.paAfter}</b>
          </div>
        )}
      </div>
    </div>
  );
}
