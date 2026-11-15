import { describe, expect, it } from "vitest";
import { defaultCatalog, exportCatalog, importCatalog, mergeCatalog } from "../src/catalog";
import { validateCatalogOverrides, validateBuildImport } from "../src/lib/importValidation";
import { computeBuild } from "../src/lib/calc";
import { computeRepair } from "../src/lib/repair";

describe("catalogue étendu", () => {
  const category = { key: "Custom", label: "Personnalisé", sort: 10, compat: "Métal" as const };
  const material = { ...defaultCatalog.materials.find(item => item.compat === "Métal")!, name: "Custom", category: "Custom", res: { feu: 3 }, repair: { costMul: 2, timeMul: 3 } };
  const enchant = { id: "custom", name: "Protection locale", kind: "pa_flat" as const, perLevel: 2 };
  const overrides = { categories: [...defaultCatalog.categories, category], materials: [...defaultCatalog.materials, material], enchants: [...defaultCatalog.enchants, enchant], shieldMaterials: [...defaultCatalog.shieldMaterials, { name: "Local", compat: "Mixte" as const, paMod: 2, malusMod: 0 }] };

  it("exporte et importe ensemble catégories, matériaux et enchantements personnalisés", () => {
    expect(importCatalog(exportCatalog(overrides))).toEqual(overrides);
    const merged = mergeCatalog(overrides);
    expect(merged.categories).toContainEqual(category);
    expect(merged.enchants).toContainEqual(enchant);
    expect(merged.shieldMaterials).toContainEqual(overrides.shieldMaterials.at(-1));
  });

  it("refuse une suppression ou un changement de compatibilité d’une catégorie utilisée", () => {
    expect(validateCatalogOverrides({ categories: defaultCatalog.categories.slice(1) }, defaultCatalog).length).toBeGreaterThan(0);
    expect(validateCatalogOverrides({ categories: defaultCatalog.categories.map(item => ({ ...item, compat: "Cuir" })) }, defaultCatalog).length).toBeGreaterThan(0);
  });

  it("valide les catégories seules et un import fusionné utilisant une catégorie locale", () => {
    expect(validateCatalogOverrides({ categories: defaultCatalog.categories }, defaultCatalog)).toEqual([]);
    const base = { categories: overrides.categories };
    expect(importCatalog(exportCatalog({ materials: [material] }), base).materials).toEqual([material]);
  });

  it("refuse doublons d’identifiants, mauvais types, résistances inconnues et multiplicateurs négatifs", () => {
    expect(validateCatalogOverrides({ categories: [category, category], enchants: [enchant, enchant], shieldMaterials: [{ name: "X", compat: "Bois", paMod: "1", malusMod: 0 }], materials: [{ ...material, res: { poison: 1 }, repair: { costMul: -1 } }] }, defaultCatalog).map(issue => issue.path)).toEqual(expect.arrayContaining([
      "overrides.categories[1].key", "overrides.enchants[1].id", "overrides.shieldMaterials[0].paMod", "overrides.materials[0].res.poison", "overrides.materials[0].repair.costMul",
    ]));
  });

  it("utilise la Chitine dans les builds et leur validation", () => {
    const catalog = mergeCatalog(overrides);
    const input = { chassis: catalog.chassis.find(item => item.category === "Métal")!.name, material: material.name, quality: "Standard", renfort: 0, enchant: 1, enchantId: enchant.id, shield: "Rondache", shieldMaterial: "Chitine", cat: category.key };
    expect(validateBuildImport([{ id: "test", name: "Test", createdAt: 1, build: input }], catalog)).toEqual([]);
    const withChitine = computeBuild(input, catalog);
    const withoutChitine = computeBuild({ ...input, shieldMaterial: "Bois" }, catalog);
    expect(withChitine.paFinal - withoutChitine.paFinal).toBe(1);
    expect(withChitine.malusFinal - withoutChitine.malusFinal).toBe(1);
    const repair = computeRepair(2, material, catalog.qualities.find(item => item.name === "Standard")!, catalog.params);
    expect(repair.cost).toBe(2 * catalog.params.repair.costPerPA.Métal * 2);
    expect(repair.hours).toBe(2 * catalog.params.repair.timePerPA.Métal * 3);
  });

  it("empêche de vider les domaines nécessaires au calcul", () => {
    expect(validateCatalogOverrides({ materials: [] }, defaultCatalog)).toContainEqual({ path: "overrides.materials", message: "conserver au moins un élément pour le calculateur" });
  });
});
