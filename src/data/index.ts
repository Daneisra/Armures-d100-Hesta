import chassisJson           from "./chassis.json";
import materialsJson         from "./materials.json";
import qualitiesJson         from "./qualities.json";
import shieldsJson           from "./shields.json";
import rawParams             from "./params.json";
import categoriesJson        from "./categories.json";
import enchantmentsJson      from "./enchantments.json";
import shieldMaterialsJson   from "./shieldMaterials.json";

import repairMaterial        from "./repairMaterial.json";
import repairQuality         from "./repairQuality.json";

import type {
  Chassis,
  Category,
  Material,
  Quality,
  Enchant,
  ShieldMaterial,
  Params,
  PVParams,
} from "../types";

/* ---------- PV adapter: JSON libre -> PVParams strict ---------- */
function toPVParams(pv: any): PVParams {
  const round =
    pv?.round === "floor" || pv?.round === "ceil" ? pv.round : "nearest";

  if (pv?.mode === "table") {
    const pts: [number, number][] = Array.isArray(pv.points)
      ? pv.points.map((p: any) => [Number(p[0]), Number(p[1])])
      : [];
    return {
      mode: "table",
      points: pts,
      round,
      perLevel: Number(pv.perLevel ?? 0),
      cap: Number(pv.cap ?? 999),
    };
  }

  // défaut: linear (PV = slope * CON + offset)
  return {
    mode: "linear",
    slope: Number(pv?.slope ?? 0.625),
    offset: Number(pv?.offset ?? 0),
    round,
    minCon: Number(pv?.minCon ?? 0),
    maxCon: Number(pv?.maxCon ?? 100),
    perLevel: Number(pv?.perLevel ?? 0),
    cap: Number(pv?.cap ?? 999),
  };
}

/* ---------- Overrides réparation (matériau / qualité) ---------- */
// maps "nom" -> overrides (costMul, timeMul, note?)
const matOv = new Map((repairMaterial as any[]).map(o => [String(o.name), o]));
const quaOv = new Map((repairQuality  as any[]).map(o => [String(o.name), o]));

/* ---------- Exports typés et normalisés ---------- */
export const chassis: Chassis[]             = chassisJson         as unknown as Chassis[];
export const categories: Category[]         = categoriesJson      as unknown as Category[];
export const enchants: Enchant[]            = enchantmentsJson    as unknown as Enchant[];
export const shieldMaterials: ShieldMaterial[] = shieldMaterialsJson as unknown as ShieldMaterial[];

/** matériaux + injection des multiplicateurs de réparation (défaut 1 si non listé) */
export const materials: Material[] =
  (materialsJson as any[]).map((m: any) => {
    const ov = matOv.get(m.name);
    return {
      ...m,
      repair: {
        costMul: ov?.costMul ?? 1,
        timeMul: ov?.timeMul ?? 1,
        note: ov?.note
      }
    } as Material;
  });

/** qualités + injection des multiplicateurs de réparation (défaut 1 si non listé) */
export const qualities: Quality[] =
  (qualitiesJson as any[]).map((q: any) => {
    const ov = quaOv.get(q.name);
    return {
      ...q,
      repair: {
        costMul: ov?.costMul ?? 1,
        timeMul: ov?.timeMul ?? 1,
        note: ov?.note
      }
    } as Quality;
  });

/** params avec pv typé (mode "linear"|"table") */
export const params: Params = {
  ...(rawParams as any),
  pv: toPVParams((rawParams as any).pv),
};

// Shields (si tu veux le typage strict, dé-commente la ligne suivante)
// import type { Shield } from "../types";
// export const shields: Shield[] = shieldsJson as unknown as Shield[];
export { shieldsJson as shields };
