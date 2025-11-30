import { useEffect, useMemo, useState } from "react";
import type { Material, Params } from "../types";
import { simulateWear } from "../lib/wear";
import { cls } from "../ui/styles";

type WearWidgetProps = {
  paFinal: number;
  material?: Material;
  params: Params;
  className?: string;
};

type WearLog = {
  dmg: number;
  paBefore: number;
  paAfter: number;
  pvLost: number;
  wearApplied: number;
  capped: boolean;
  penetrated: boolean;
};

export default function WearWidget({
  paFinal,
  material,
  params,
  className,
}: WearWidgetProps) {
  const [paCurrent, setPaCurrent] = useState<number>(paFinal);
  const [dmg, setDmg] = useState<number>(10); // autorise bonus/malus >20
  const [log, setLog] = useState<WearLog[]>([]);

  useEffect(() => {
    setPaCurrent(paFinal);
    setLog([]);
  }, [paFinal]);

  const preview = useMemo(() => {
    if (!material) return null;
    return simulateWear(dmg, paCurrent, material, params);
  }, [dmg, paCurrent, material, params]);

  const applyHit = () => {
    if (!material) return;
    const res = simulateWear(dmg, paCurrent, material, params);
    setPaCurrent(res.paAfter);
    setLog(prev => [
      {
        dmg,
        paBefore: res.paBefore,
        paAfter: res.paAfter,
        pvLost: res.pvLost,
        wearApplied: res.wearApplied,
        capped: res.breakdown.capped,
        penetrated: res.breakdown.penetrated,
      },
      ...prev,
    ]);
  };

  return (
    <div className={className ?? cls.card}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Usure en combat</h3>
        <div className="text-xs text-muted-foreground">
          base: {params.baseWear} — cap/coup: {params.capWearPerHit}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 items-end">
        <label className="text-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">PA actuelle</div>
          <input
            type="number"
            min={0}
            className={cls.input}
            value={paCurrent}
            onChange={e => setPaCurrent(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
          />
        </label>
        <label className="text-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">Dégâts (d20 + bonus)</div>
          <input
            type="number"
            min={0}
            className={cls.input}
            value={dmg}
            onChange={e => setDmg(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
          />
        </label>
        <button className={cls.btnPrimary} onClick={applyHit} disabled={!material}>
          Appliquer le coup
        </button>
      </div>

      {preview && (
        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
          <span className="text-muted-foreground">PA avant</span>      <b className="tabular">{preview.paBefore}</b>
          <span className="text-muted-foreground">PV subis</span>       <b className="tabular">{preview.pvLost}</b>
          <span className="text-muted-foreground">Usure appliquée</span>
          <b className="tabular">
            {preview.wearApplied}
            {preview.breakdown.capped && <span className={`ml-2 ${cls.badgeWarn}`}>cap</span>}
            {preview.breakdown.penetrated && <span className={`ml-2 ${cls.badgeBad}`}>pénétration</span>}
          </b>
          <span className="text-muted-foreground">PA après</span>       <b className="tabular">{preview.paAfter}</b>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Historique des coups</div>
          <div className="space-y-1 max-h-52 overflow-auto pr-1 text-sm">
            {log.map((l, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-center rounded border px-2 py-1">
                <span className="tabular">dégâts {l.dmg}</span>
                <span className="tabular">PA {l.paBefore} → {l.paAfter}</span>
                <span className="tabular">usure {l.wearApplied}</span>
                <span className="tabular text-muted-foreground">{l.pvLost} PV</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
