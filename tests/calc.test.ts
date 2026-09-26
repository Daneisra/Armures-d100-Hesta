import { describe, expect, it } from "vitest";
import { computeBuild } from "../src/lib/calc";
import { buildInput, catalog, material } from "./fixtures";

describe("computeBuild", () => {
  it("additionne le renfort aux PA et au malus", () => {
    const result = computeBuild({ ...buildInput, renfort: 2 }, catalog);

    expect(result.paFinal).toBe(14);
    expect(result.malusFinal).toBe(8);
  });

  it("borne le renfort à renfortMax", () => {
    const result = computeBuild({ ...buildInput, renfort: 99 }, catalog);

    expect(result.paFinal).toBe(15);
    expect(result.malusFinal).toBe(9);
  });

  it("applique les enchantements de PA et de malus", () => {
    const protection = computeBuild({ ...buildInput, enchant: 2, enchantId: "protection" }, catalog);
    const lightening = computeBuild({ ...buildInput, enchant: 2, enchantId: "alleger" }, catalog);

    expect(protection.paFinal).toBe(14);
    expect(protection.malusFinal).toBe(6);
    expect(lightening.paFinal).toBe(12);
    expect(lightening.malusFinal).toBe(4);
  });

  it("applique halfMalus après le cumul", () => {
    const halfCatalog = {
      ...catalog,
      materials: [{ ...material, halfMalus: true }],
    };
    const result = computeBuild({ ...buildInput, renfort: 2 }, halfCatalog);

    expect(result.malusFinal).toBe(4);
  });

  it("ajoute le bouclier et son matériau", () => {
    const result = computeBuild(
      { ...buildInput, shield: "Rondache", shieldMaterial: "Acier" },
      catalog
    );

    expect(result.paFinal).toBe(15);
    expect(result.malusFinal).toBe(9);
  });

  it("utilise un ratio infini pour le sweet spot quand le malus final vaut zéro", () => {
    const result = computeBuild(
      buildInput,
      { ...catalog, chassis: [{ ...catalog.chassis[0], baseMalus: -2 }] }
    );

    expect(result.malusFinal).toBe(0);
    expect(result.effic).toBe(result.paFinal);
    expect(result.sweet).toBe(true);
  });

  it("respecte le niveau maximum propre à l'enchantement", () => {
    const limitedCatalog = {
      ...catalog,
      enchants: [{ id: "limited", name: "Protection majeure", kind: "pa_flat" as const, perLevel: 2, maxLevel: 2 }],
    };
    const result = computeBuild({ ...buildInput, enchantId: "limited", enchant: 3 }, limitedCatalog);

    expect(result.paFinal).toBe(16);
    expect(result.notes).toContain("Enchant: +4 PA");
  });
});
