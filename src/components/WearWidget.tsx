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
  attackPenetration: number;
  effectivePenetration: number;
  paBefore: number;
  paEffective: number;
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
  const [attackPenetration, setAttackPenetration] = useState<number>(0);
  const [log, setLog] = useState<WearLog[]>([]);

  useEffect(() => {
    setPaCurrent(paFinal);
    setLog([]);
  }, [paFinal]);

  const preview = useMemo(() => {
    if (!material) return null;
    return simulateWear(dmg, attackPenetration, paCurrent, material, params);
  }, [dmg, attackPenetration, paCurrent, material, params]);

  const applyHit = () => {
    if (!material) return;
    const res = simulateWear(dmg, attackPenetration, paCurrent, material, params);
    setPaCurrent(res.paAfter);
    setLog(prev => [
      {
        dmg,
        attackPenetration: res.attackPenetration,
        effectivePenetration: res.effectivePenetration,
        paBefore: res.paBefore,
        paEffective: res.paEffective,
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

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
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

      <details className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm">
          Options avancées
          {attackPenetration > 0 && <span className={`ml-2 ${cls.badgeInfo}`}>Perce-armure {attackPenetration}</span>}
        </summary>
        <div className="mt-3 max-w-sm">
          <label className="text-sm" htmlFor="wear-armor-piercing">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Perce-armure (optionnel)</span>
            <input
              id="wear-armor-piercing"
              type="number"
              min={0}
              className={cls.input}
              value={attackPenetration}
              aria-describedby="wear-armor-piercing-help"
              onChange={e => setAttackPenetration(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
            />
          </label>
          <p id="wear-armor-piercing-help" className="mt-1 text-xs text-muted-foreground">
            Réduit les PA effectives uniquement pour ce coup. Le <code>penIgnore</code> du matériau en annule une partie, sans réduire directement les dégâts.
          </p>
        </div>
      </details>

      {preview && (
        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
          <span className="text-muted-foreground">PA avant</span>      <b className="tabular">{preview.paBefore}</b>
          {attackPenetration > 0 && (
            <>
              <span className="text-muted-foreground">Perce-armure effectif</span>
              <b className="tabular">
                {preview.effectivePenetration}
                {preview.penIgnore > 0 && <span className={`ml-2 ${cls.badgeGood}`}>résistance {preview.penIgnore}</span>}
              </b>
            </>
          )}
          <span className="text-muted-foreground">PA effective</span>  <b className="tabular">{preview.paEffective}</b>
          <span className="text-muted-foreground">PV subis</span>       <b className="tabular">{preview.pvLost}</b>
          <span className="text-muted-foreground">Usure appliquée</span>
          <b className="tabular">
            {preview.wearApplied}
            {preview.breakdown.capped && <span className={`ml-2 ${cls.badgeWarn}`}>cap</span>}
            {preview.breakdown.penetrated && <span className={`ml-2 ${cls.badgeBad}`}>coup pénétrant</span>}
          </b>
          <span className="text-muted-foreground">PA après</span>       <b className="tabular">{preview.paAfter}</b>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Historique des coups</div>
          <div className="space-y-1 max-h-52 overflow-auto pr-1 text-sm">
            {log.map((l, idx) => (
              <div key={idx} className="grid gap-2 items-center rounded border px-2 py-1 md:grid-cols-5">
                <span className="tabular">dégâts {l.dmg}</span>
                <span className="tabular">perce-armure {l.attackPenetration} → {l.effectivePenetration}</span>
                <span className="tabular">PA eff. {l.paEffective}</span>
                <span className="tabular">PA {l.paBefore} → {l.paAfter}</span>
                <span className="tabular">usure {l.wearApplied}</span>
                <span className="tabular text-muted-foreground md:col-span-5">{l.pvLost} PV subis</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
