import { describe, expect, it } from "vitest";
import { computeRepair, formatHours } from "../src/lib/repair";
import { material, params, quality } from "./fixtures";

describe("computeRepair", () => {
  it("applique les multiplicateurs matériau et qualité", () => {
    const result = computeRepair(
      3,
      { ...material, compat: "Cuir", repair: { costMul: 2.5, timeMul: 1.6 } },
      { ...quality, repair: { costMul: 2, timeMul: 1.3 } },
      params
    );

    expect(result.cost).toBe(30);
    expect(result.hours).toBe(6.2);
    expect(result.breakdown).toMatchObject({ mCost: 2.5, mTime: 1.6, qCost: 2, qTime: 1.3 });
  });

  it("arrondit les PA manquants à l'entier inférieur", () => {
    const result = computeRepair(2.9, material, quality, params);

    expect(result.cost).toBe(8);
    expect(result.hours).toBe(4);
  });

  it("borne les PA manquants négatifs à zéro", () => {
    const result = computeRepair(-4, material, quality, params);

    expect(result.cost).toBe(0);
    expect(result.hours).toBe(0);
  });
});

describe("formatHours", () => {
  it("formate les heures et minutes", () => {
    expect(formatHours(1.5)).toBe("1h 30m");
    expect(formatHours(0.5)).toBe("30m");
    expect(formatHours(2)).toBe("2h");
  });
});
