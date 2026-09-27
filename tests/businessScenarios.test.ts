import { describe, expect, it } from "vitest";
import { defaultCatalog } from "../src/catalog";
import { computeBuild } from "../src/lib/calc";
import { computePV } from "../src/lib/pv";
import { computeRepair } from "../src/lib/repair";
import { applyDamageToPV, simulateWear } from "../src/lib/wear";
import type { BuildInput } from "../src/types";

const defaultInput: BuildInput = {
  chassis: "Vêtement matelassé (gambison)",
  material: "Tissu matelassé",
  quality: "Standard",
  shield: "Aucun",
  shieldMaterial: "",
  renfort: 0,
  enchantId: "protection",
  enchant: 0,
};

function materialNamed(name: string) {
  const material = defaultCatalog.materials.find(item => item.name === name);
  if (!material) throw new Error(`Matériau absent : ${name}`);
  return material;
}

function qualityNamed(name: string) {
  const quality = defaultCatalog.qualities.find(item => item.name === name);
  if (!quality) throw new Error(`Qualité absente : ${name}`);
  return quality;
}

describe("scénarios métier avec les données officielles", () => {
  it("relie PV, armure textile, dégâts, usure et réparation", () => {
    const build = computeBuild(defaultInput, defaultCatalog);
    expect(build).toMatchObject({ paFinal: 2, malusFinal: 0, sweet: true });

    const initialPV = computePV(50, 0, defaultCatalog.params.pv);
    const hit = simulateWear(10, 0, build.paFinal, materialNamed("Tissu matelassé"), defaultCatalog.params);
    const health = applyDamageToPV(initialPV, hit.pvLost);
    const repair = computeRepair(build.paFinal - hit.paAfter, materialNamed("Tissu matelassé"), qualityNamed("Standard"), defaultCatalog.params);

    expect(initialPV).toBe(31);
    expect(hit).toMatchObject({ paEffective: 2, pvLost: 8, wearApplied: 1, paAfter: 1 });
    expect(health).toEqual({ before: 31, after: 23, lost: 8 });
    expect(repair).toMatchObject({ cost: 1, hours: 0.5 });
  });

  it("applique la résistance à la pénétration et le coût canonique de l’adamantium", () => {
    const input: BuildInput = { ...defaultInput, chassis: "Brigandine", material: "Adamantium" };
    const build = computeBuild(input, defaultCatalog);
    const adamantium = materialNamed("Adamantium");
    const hit = simulateWear(18, 3, build.paFinal, adamantium, defaultCatalog.params);
    const health = applyDamageToPV(31, hit.pvLost);
    const repair = computeRepair(build.paFinal - hit.paAfter, adamantium, qualityNamed("Standard"), defaultCatalog.params);

    expect(build).toMatchObject({ paFinal: 14, malusFinal: 7, sweet: true });
    expect(hit).toMatchObject({ effectivePenetration: 2, paEffective: 12, pvLost: 6, wearApplied: 4, paAfter: 10 });
    expect(health).toEqual({ before: 31, after: 25, lost: 6 });
    expect(repair).toMatchObject({ cost: 64, hours: 20 });
  });

  it("cumule qualité, renfort, demi-malus et enchantement plafonné", () => {
    const input: BuildInput = {
      ...defaultInput,
      chassis: "Plaque complète",
      material: "Mithril",
      quality: "Bonne",
      renfort: 2,
      enchantId: "protection_maj",
      enchant: 3,
    };
    const build = computeBuild(input, defaultCatalog);

    expect(build).toMatchObject({ paFinal: 29, malusFinal: 7, sweet: true });
    expect(build.notes).toContain("Enchant: +4 PA");
  });
});
