import { describe, expect, it } from "vitest";
import { computePV, interpTable } from "../src/lib/pv";
import { params } from "./fixtures";

describe("computePV", () => {
  it("applique le coefficient officiel puis arrondit au plus proche", () => {
    expect(computePV(75, 0, params.pv)).toBe(47);
    expect(computePV(45, 0, params.pv)).toBe(28);
    expect(computePV(1, 0, params.pv)).toBe(1);
  });

  it("ajoute les PV par niveau avant le cap et ignore les niveaux négatifs", () => {
    const pv = { mode: "linear" as const, slope: 1, perLevel: 3, cap: 12 };
    expect(computePV(8, 2, pv)).toBe(12);
    expect(computePV(8, -5, pv)).toBe(8);
  });

  it("interpole les points du mode table et borne les valeurs extérieures", () => {
    const pv = { mode: "table" as const, points: [[80, 50], [0, 0]] as [number, number][] };
    expect(computePV(40, 0, pv)).toBe(25);
    expect(computePV(-5, 0, pv)).toBe(0);
    expect(computePV(90, 0, pv)).toBe(50);
    expect(interpTable(40, pv.points)).toBe(25);
  });
});
