import { describe, expect, it } from "vitest";
import { defaultCatalog, mergeCatalog } from "../src/catalog";

describe("mergeCatalog", () => {
  it("utilise le canon lorsqu’un domaine n’a pas d’override", () => {
    expect(mergeCatalog({}).materials).toEqual(defaultCatalog.materials);
  });

  it("traite une liste éditée comme un instantané complet", () => {
    const materials = defaultCatalog.materials.slice(1);

    expect(mergeCatalog({ materials }).materials).toEqual(materials);
  });

  it("autorise la suppression de tous les éléments d’un domaine", () => {
    expect(mergeCatalog({ shields: [] }).shields).toEqual([]);
  });
});
