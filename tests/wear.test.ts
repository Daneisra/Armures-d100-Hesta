import { describe, expect, it } from "vitest";
import { applyDamageToPV, simulateWear } from "../src/lib/wear";
import { material, params } from "./fixtures";

describe("simulateWear", () => {
  it("applique la pénétration après penIgnore sans réduire les dégâts bruts", () => {
    const result = simulateWear(
      18,
      3,
      16,
      { ...material, name: "Adamantium", penIgnore: 1, extraPen: 3 },
      params
    );

    expect(result.effectivePenetration).toBe(2);
    expect(result.paEffective).toBe(14);
    expect(result.pvLost).toBe(4);
    expect(result.wearApplied).toBe(4);
    expect(result.paAfter).toBe(12);
  });

  it("accepte des dégâts supérieurs à 20", () => {
    const result = simulateWear(35, 0, 12, material, params);

    expect(result.damage).toBe(35);
    expect(result.pvLost).toBe(23);
  });

  it("n'applique que l'usure de base sur un coup non pénétrant", () => {
    const result = simulateWear(8, 0, 12, material, params);

    expect(result.breakdown.penetrated).toBe(false);
    expect(result.wearApplied).toBe(1);
    expect(result.paAfter).toBe(11);
  });

  it("borne l'usure au cap par coup", () => {
    const result = simulateWear(30, 0, 12, { ...material, extraPen: 20 }, params);

    expect(result.breakdown.capped).toBe(true);
    expect(result.wearApplied).toBe(8);
    expect(result.paAfter).toBe(4);
  });

  it("empêche penIgnore de produire une pénétration négative", () => {
    const result = simulateWear(10, 2, 12, { ...material, penIgnore: 4 }, params);

    expect(result.effectivePenetration).toBe(0);
    expect(result.paEffective).toBe(12);
  });

  it("ne classe pas comme pénétrant un coup égal aux PA effectives", () => {
    const result = simulateWear(10, 2, 12, material, params);

    expect(result.paEffective).toBe(10);
    expect(result.pvLost).toBe(0);
    expect(result.breakdown.penetrated).toBe(false);
    expect(result.wearApplied).toBe(params.baseWear);
  });
});

describe("applyDamageToPV", () => {
  it("retire les dégâts réellement subis coup par coup", () => {
    const first = applyDamageToPV(20, 6);
    const second = applyDamageToPV(first.after, 5);
    expect(first).toEqual({ before: 20, after: 14, lost: 6 });
    expect(second).toEqual({ before: 14, after: 9, lost: 5 });
  });

  it("borne les PV à zéro en cas de dégâts excessifs", () => {
    expect(applyDamageToPV(3, 8)).toEqual({ before: 3, after: 0, lost: 3 });
  });

  it("ignore les dégâts négatifs", () => {
    expect(applyDamageToPV(12, -2)).toEqual({ before: 12, after: 12, lost: 0 });
  });
});
