import type { Material, Quality, Params } from "../types";

/** Formatage simple: 1.5h -> "1h 30m", 0.5 -> "30m", 2 -> "2h" */
export function formatHours(h: number): string {
  const total = Math.max(0, h);
  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export type RepairBreakdown = {
  compat: string;
  baseCost: number;
  baseTime: number;
  mCost: number;
  mTime: number;
  qCost: number;
  qTime: number;
};

export type RepairResult = {
  cost: number;     // total po
  hours: number;    // total heures
  breakdown: RepairBreakdown;
  note?: string;    // éventuelle note de matériau
};

/**
 * Calcule la réparation :
 * base (par compat) × multiplicateurs matériau × multiplicateurs qualité × PA manquants.
 */
export function computeRepair(
  paMissing: number,
  material: Material,
  quality: Quality,
  params: Params
): RepairResult {
  const compat = material?.compat ?? "Métal";

  const baseCost = params.repair.costPerPA[compat] ?? 1;
  const baseTime = params.repair.timePerPA[compat] ?? 0.5;

  // multiplicateurs matériau (nouveau tuning)
  const mCost = material?.repair?.costMul ?? 1;
  const mTime = material?.repair?.timeMul ?? 1;

  // multiplicateurs qualité (si tu en as défini côté Quality, sinon 1)
  const qCost = quality?.repair?.costMul ?? 1;
  const qTime = quality?.repair?.timeMul ?? 1;

  const missing = Math.max(0, Math.floor(paMissing));

  const totalCost = Math.max(0, Math.round(missing * baseCost * mCost * qCost));
  const totalHours =
    Math.max(0, +(missing * baseTime * mTime * qTime).toFixed(1));

  return {
    cost: totalCost,
    hours: totalHours,
    breakdown: { compat, baseCost, baseTime, mCost, mTime, qCost, qTime },
    note: material?.repair?.note,
  };
}
