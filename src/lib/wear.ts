import type { Material, Params } from "../types";

export type WearResult = {
  damage: number;
  attackPenetration: number;
  effectivePenetration: number;
  penIgnore: number;
  paBefore: number;
  paEffective: number;
  paAfter: number;
  pvLost: number;
  wearApplied: number;
  breakdown: { base: number; extra: number; capped: boolean; penetrated: boolean };
};

/**
 * Simule l'usure sur un coup:
 * - la pénétration effective réduit temporairement les PA pour ce coup
 * - penIgnore réduit la pénétration, jamais les dégâts bruts
 * - coup non pénétrant: usure = baseWear
 * - coup pénétrant: usure = baseWear + extraPen(material)
 * - cap par coup appliqué à la fin
 * - PA ne baisse que de l'usure (pas des dégâts)
 * - PV subis = max(0, damage - paEffective)
 */
export function simulateWear(
  damage: number,
  attackPenetration: number,
  paBefore: number,
  material: Material,
  params: Params
): WearResult {
  const safeDamage = Math.max(0, damage);
  const safePenetration = Math.max(0, attackPenetration);
  const penIgnore = Math.max(0, material.penIgnore ?? 0);
  const effectivePenetration = Math.max(0, safePenetration - penIgnore);
  const paEffective = Math.max(0, paBefore - effectivePenetration);
  const penetrated = safeDamage > paEffective;
  const base = params.baseWear ?? 1;
  const extra = penetrated ? (material.extraPen ?? 0) : 0;

  let wear = base + extra;
  const cap = params.capWearPerHit ?? Infinity;
  const capped = wear > cap;
  if (capped) wear = cap;

  const paAfter = Math.max(0, paBefore - wear);
  const pvLost  = Math.max(0, safeDamage - paEffective);

  return {
    damage: safeDamage,
    attackPenetration: safePenetration,
    effectivePenetration,
    penIgnore,
    paBefore,
    paEffective,
    paAfter,
    pvLost,
    wearApplied: wear,
    breakdown: { base, extra, capped, penetrated }
  };
}
