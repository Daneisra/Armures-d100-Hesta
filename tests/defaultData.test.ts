import { describe, expect, it } from "vitest";
import { defaultCatalog } from "../src/catalog";
import { validateCatalogOverrides } from "../src/lib/importValidation";
import categories from "../src/data/categories.json";
import chassis from "../src/data/chassis.json";
import materials from "../src/data/materials.json";
import qualities from "../src/data/qualities.json";
import shields from "../src/data/shields.json";
import shieldMaterials from "../src/data/shieldMaterials.json";
import enchantments from "../src/data/enchantments.json";
import repairMaterial from "../src/data/repairMaterial.json";
import repairQuality from "../src/data/repairQuality.json";
import params from "../src/data/params.json";
import type { Category, Enchant, ShieldMaterial } from "../src/types";

type RepairRow = { name: string; costMul: number; timeMul: number; note?: string };

function unique(values: string[]) {
  return new Set(values.map(value => value.trim().toLocaleLowerCase("fr"))).size === values.length;
}

function completeRepairMap(rows: RepairRow[], names: string[]) {
  expect(unique(rows.map(row => row.name))).toBe(true);
  expect(rows.map(row => row.name).sort()).toEqual([...names].sort());
  for (const row of rows) {
    expect(Object.keys(row).every(key => ["name", "costMul", "timeMul", "note"].includes(key))).toBe(true);
    expect(Number.isFinite(row.costMul) && row.costMul >= 0).toBe(true);
    expect(Number.isFinite(row.timeMul) && row.timeMul >= 0).toBe(true);
  }
}

describe("données JSON officielles", () => {
  it("respecte le schéma des domaines éditables et leurs références", () => {
    expect(validateCatalogOverrides(
      { chassis, materials, qualities, shields, params },
      defaultCatalog
    )).toEqual([]);
  });

  it("référence chaque famille et chaque catégorie à des données utilisables", () => {
    const typedCategories = categories as Category[];
    const compats = new Set(["Gambison", "Cuir", "Métal"]);
    expect(unique(typedCategories.map(category => category.key))).toBe(true);
    expect(unique(typedCategories.map(category => category.label))).toBe(true);
    expect(new Set(typedCategories.map(category => category.sort)).size).toBe(typedCategories.length);

    for (const category of typedCategories) {
      expect(Object.keys(category).every(key => ["key", "label", "sort", "compat", "description"].includes(key))).toBe(true);
      expect(category.key.trim()).not.toBe("");
      expect(category.label.trim()).not.toBe("");
      expect(Number.isInteger(category.sort) && category.sort >= 0).toBe(true);
      expect(compats.has(category.compat)).toBe(true);
      expect(materials.some(material => material.category === category.key && material.compat === category.compat)).toBe(true);
    }
    for (const armor of chassis) {
      expect(materials.some(material => material.compat === armor.category)).toBe(true);
    }
  });

  it("vérifie les enchantements et leurs bornes", () => {
    const rows = enchantments as Enchant[];
    const kinds = new Set(["pa_flat", "malus_flat", "res_add", "pen_ignore_add", "extraPen_delta", "pa_pct", "malus_mult"]);
    const targets = new Set(["global", "feu", "froid", "foudre", "magie", "tr", "per", "con"]);
    expect(unique(rows.map(row => row.id))).toBe(true);
    expect(unique(rows.map(row => row.name))).toBe(true);
    expect(rows.some(row => row.id === "protection")).toBe(true);

    for (const row of rows) {
      expect(Object.keys(row).every(key => ["id", "name", "kind", "target", "perLevel", "factor", "minLevel", "maxLevel"].includes(key))).toBe(true);
      expect(row.id.trim()).not.toBe("");
      expect(row.name.trim()).not.toBe("");
      expect(kinds.has(row.kind)).toBe(true);
      if (["pa_pct", "malus_mult"].includes(row.kind)) {
        expect(typeof row.factor === "number" && Number.isFinite(row.factor) && row.factor >= 0).toBe(true);
      } else {
        expect(typeof row.perLevel === "number" && Number.isFinite(row.perLevel)).toBe(true);
      }
      if (row.kind === "res_add") expect(targets.has(row.target ?? "")).toBe(true);
      if (row.minLevel !== undefined) expect(Number.isInteger(row.minLevel) && row.minLevel >= 0).toBe(true);
      if (row.maxLevel !== undefined) expect(Number.isInteger(row.maxLevel) && row.maxLevel >= (row.minLevel ?? 0) && row.maxLevel <= params.enchantMax).toBe(true);
    }
  });

  it("vérifie les matériaux de bouclier", () => {
    const rows = shieldMaterials as ShieldMaterial[];
    expect(unique(rows.map(row => row.name))).toBe(true);
    for (const row of rows) {
      expect(Object.keys(row).every(key => ["name", "compat", "paMod", "malusMod", "effects"].includes(key))).toBe(true);
      expect(row.name.trim()).not.toBe("");
      expect(["Bois", "Métal", "Cuir", "Mixte"]).toContain(row.compat);
      expect(Number.isInteger(row.paMod)).toBe(true);
      expect(Number.isInteger(row.malusMod)).toBe(true);
    }
  });

  it("associe chaque matériau et qualité à une ligne de réparation valide", () => {
    completeRepairMap(repairMaterial, materials.map(row => row.name));
    completeRepairMap(repairQuality, qualities.map(row => row.name));

    for (const row of repairMaterial) {
      const loaded = defaultCatalog.materials.find(material => material.name === row.name);
      expect(loaded?.repair?.costMul).toBe(row.costMul);
      expect(loaded?.repair?.timeMul).toBe(row.timeMul);
    }
    for (const row of repairQuality) {
      const loaded = defaultCatalog.qualities.find(quality => quality.name === row.name);
      expect(loaded?.repair?.costMul).toBe(row.costMul);
      expect(loaded?.repair?.timeMul).toBe(row.timeMul);
    }
  });

  it("conserve un jeu complet de paramètres numériques par défaut", () => {
    expect(Object.keys(params).sort()).toEqual(["sweetSpotRatio", "renfortMax", "enchantMax", "baseWear", "capWearPerHit", "repair", "pv"].sort());
    expect(params.sweetSpotRatio).toBeGreaterThan(0);
    for (const key of ["renfortMax", "enchantMax", "baseWear", "capWearPerHit"] as const) {
      expect(Number.isInteger(params[key]) && params[key] >= 0).toBe(true);
    }
    for (const map of [params.repair.costPerPA, params.repair.timePerPA]) {
      expect(Object.keys(map).sort()).toEqual(["Gambison", "Cuir", "Métal"].sort());
      expect(Object.values(map).every(value => typeof value === "number" && Number.isFinite(value) && value >= 0)).toBe(true);
    }
    expect(params.pv.mode).toBe("linear");
    expect(params.pv.round).toBe("nearest");
    expect(params.pv.minCon).toBeLessThanOrEqual(params.pv.maxCon);
    expect([params.pv.slope, params.pv.offset, params.pv.minCon, params.pv.maxCon, params.pv.perLevel, params.pv.cap]
      .every(value => Number.isFinite(value))).toBe(true);
  });
});
