import type { Catalog } from "../src/catalog";
import type { BuildInput, Material, Params, Quality } from "../src/types";

export const params: Params = {
  sweetSpotRatio: 2,
  renfortMax: 3,
  enchantMax: 3,
  baseWear: 1,
  capWearPerHit: 8,
  repair: {
    costPerPA: { Gambison: 1, Cuir: 2, Métal: 4 },
    timePerPA: { Gambison: 0.5, Cuir: 1, Métal: 2 },
  },
  pv: {
    mode: "linear",
    slope: 0.625,
    offset: 0,
    round: "nearest",
    minCon: 0,
    maxCon: 100,
    perLevel: 0,
    cap: 999,
  },
};

export const material: Material = {
  name: "Acier",
  category: "MetalFerreux",
  compat: "Métal",
  modPA: 2,
  malusMod: 2,
  penIgnore: 0,
  extraPen: 3,
  res: {},
};

export const quality: Quality = {
  name: "Standard",
  bonusPA: 0,
  malusMod: 0,
};

export const catalog: Catalog = {
  chassis: [
    { name: "Armure test", basePA: 10, baseMalus: 4, group: "Intermédiaire", category: "Métal" },
  ],
  materials: [material],
  qualities: [quality],
  shields: [
    { name: "Aucun", pa: 0, malus: 0, poids: 0 },
    { name: "Rondache", pa: 2, malus: 2, poids: 2 },
  ],
  params,
  categories: [
    { key: "MetalFerreux", label: "Métal ferreux", sort: 0, compat: "Métal" },
  ],
  enchants: [
    { id: "protection", name: "Protection", kind: "pa_flat", perLevel: 1 },
    { id: "alleger", name: "Allègement", kind: "malus_flat", perLevel: -1 },
  ],
  shieldMaterials: [
    { name: "Acier", compat: "Métal", paMod: 1, malusMod: 1 },
  ],
};

export const buildInput: BuildInput = {
  chassis: "Armure test",
  material: "Acier",
  quality: "Standard",
  renfort: 0,
  enchant: 0,
  enchantId: "protection",
  shield: "Aucun",
  shieldMaterial: "",
  cat: "MetalFerreux",
};
