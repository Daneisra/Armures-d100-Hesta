import type { Material, Quality, Params } from "../types";

export function computeRepair(
  paMissing: number,
  material: Material,
  quality: Quality,
  params: Params
){
  const compat = material.compat; // "Gambison" | "Cuir" | "Métal"
  const baseCost = params.repair.costPerPA[compat];
  const baseTime = params.repair.timePerPA[compat];

  const mCost = material.repairCostMult ?? 1;
  const mTime = material.repairTimeMult ?? 1;
  const qCost = quality.repairCostMult ?? 1;
  const qTime = quality.repairTimeMult ?? 1;

  const cost = paMissing * baseCost * mCost * qCost;
  const hours = paMissing * baseTime * mTime * qTime;

  return {
    paMissing,
    cost,
    hours,
    breakdown: {
      baseCost, baseTime,
      mCost, mTime,
      qCost, qTime
    }
  };
}

export function formatHours(h: number){
  const days = Math.floor(h / 24);
  const hours = Math.round(h - days * 24);
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h`;
}
