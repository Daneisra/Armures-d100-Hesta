import { useMemo, useState } from "react";
import type { Material, Params } from "../types";
import { simulateWear } from "../lib/wear";
import { cls } from "../ui/styles";

type WearWidgetProps = {
  paFinal: number;
  material?: Material;
  params: Params;
  className?: string;
};

export default function WearWidget({
  paFinal,
  material,
  params,
  className,
}: WearWidgetProps) {
  const [dmg, setDmg] = useState<number>(10); // d20 par défaut

  const res = useMemo(() => {
    if (!material) return null;
    return simulateWear(dmg, paFinal, material, params);
  }, [dmg, paFinal, material, params]);

  return (
    <div className={className ?? cls.card}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Usure en combat</h3>
        <div className="text-xs text-muted-foreground">
          base: {params.baseWear} — cap/coup: {params.capWearPerHit}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 items-end">
        <label className="text-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">Dégâts (d20)</div>
          <input
            type="number"
            min={0}
            max={20}
            className={cls.input}
            value={dmg}
            onChange={e => setDmg(Math.max(0, Math.min(20, parseInt(e.target.value||"0",10) || 0)))}
          />
        </label>

        {res && (
          <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">PA avant</span>      <b className="tabular">{res.paBefore}</b>
            <span className="text-muted-foreground">PV subis</span>       <b className="tabular">{res.pvLost}</b>
            <span className="text-muted-foreground">Usure appliquée</span>
            <b className="tabular">
              {res.wearApplied}
              {res.breakdown.capped && <span className={`ml-2 ${cls.badgeWarn}`}>cap</span>}
              {res.breakdown.penetrated && <span className={`ml-2 ${cls.badgeBad}`}>pénétration</span>}
            </b>
            <span className="text-muted-foreground">PA après</span>       <b className="tabular">{res.paAfter}</b>
          </div>
        )}
      </div>
    </div>
  );
}
