import type { Material, Params } from "../types";

export type WearResult = {
  damage: number;
  paBefore: number;
  paAfter: number;
  pvLost: number;
  wearApplied: number;
  breakdown: { base: number; extra: number; capped: boolean; penetrated: boolean };
};

/**
 * Simule l'usure sur un coup:
 * - coup non pénétrant: usure = baseWear
 * - coup pénétrant:     usure = baseWear + extraPen(material)
 * - cap par coup appliqué à la fin
 * - PA ne baisse que de l'usure (pas des dégâts)
 * - PV subis = max(0, damage - paBefore)
 */
export function simulateWear(damage: number, paBefore: number, material: Material, params: Params): WearResult {
  const penetrated = damage > paBefore;
  const base = params.baseWear ?? 1;
  const extra = penetrated ? (material.extraPen ?? 0) : 0;

  let wear = base + extra;
  const cap = params.capWearPerHit ?? Infinity;
  const capped = wear > cap;
  if (capped) wear = cap;

  const paAfter = Math.max(0, paBefore - wear);
  const pvLost  = Math.max(0, damage - paBefore);

  return {
    damage,
    paBefore,
    paAfter,
    pvLost,
    wearApplied: wear,
    breakdown: { base, extra, capped, penetrated }
  };
}
