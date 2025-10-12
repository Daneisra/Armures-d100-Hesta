import chassisJson           from "./chassis.json";
import materialsJson         from "./materials.json";
import qualities             from "./qualities.json";
import shields               from "./shields.json";
import rawParams             from "./params.json";
import categoriesJson        from "./categories.json";
import enchantments          from "./enchantments.json";
import shieldMaterialsJson   from "./shieldMaterials.json";

import type {
  Chassis, Category, Material, Enchant, ShieldMaterial, Params, PVParams
} from "../types";

/** Convertit le JSON libre -> type PVParams (et resserre mode/round) */
function toPVParams(pv: any): PVParams {
  const round = pv?.round === "floor" || pv?.round === "ceil" ? pv.round : "nearest";

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

  // défaut: linear
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

// ✅ Exports typés (on force les JSON vers les types attendus)
export const chassis: Chassis[]             = chassisJson         as unknown as Chassis[];
export const categories: Category[]         = categoriesJson      as unknown as Category[];
export const materials: Material[]          = materialsJson       as unknown as Material[];
export const enchants: Enchant[]            = enchantments        as unknown as Enchant[];
export const shieldMaterials: ShieldMaterial[] = shieldMaterialsJson as unknown as ShieldMaterial[];

// ✅ params typé: on adapte le JSON pour que pv.mode soit "linear" | "table"
export const params: Params = {
  ...(rawParams as any),
  pv: toPVParams((rawParams as any).pv),
};

// on peut garder ces exports “simples”
export { qualities, shields };
