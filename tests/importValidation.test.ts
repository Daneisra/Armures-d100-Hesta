import { describe, expect, it } from "vitest";
import {
  ImportValidationError,
  validateBuildImport,
  validateCatalogOverrides,
} from "../src/lib/importValidation";
import { buildInput, catalog, material } from "./fixtures";

describe("validateCatalogOverrides", () => {
  it("accepte un override valide", () => {
    expect(validateCatalogOverrides({ materials: [material] }, catalog)).toEqual([]);
  });

  it("signale les doublons, mauvais types et références invalides", () => {
    const issues = validateCatalogOverrides(
      {
        materials: [
          { ...material, modPA: "2", category: "Inconnue" },
          { ...material },
        ],
      },
      catalog
    );

    expect(issues.map(issue => issue.path)).toEqual(expect.arrayContaining([
      "overrides.materials[1].name",
      "overrides.materials[0].modPA",
      "overrides.materials[0].category",
    ]));
  });

  it("produit un rapport lisible et numéroté", () => {
    const error = new ImportValidationError("Import refusé", [
      { path: "overrides.materials[0].modPA", message: "doit être un nombre fini" },
    ]);

    expect(error.message).toContain("1 erreur(s) détectée(s)");
    expect(error.message).toContain("1. overrides.materials[0].modPA");
  });
});

describe("validateBuildImport", () => {
  const savedBuild = {
    id: "build-1",
    name: "Build valide",
    createdAt: 1,
    cat: "MetalFerreux",
    build: buildInput,
  };

  it("accepte un build dont toutes les références existent", () => {
    expect(validateBuildImport([savedBuild], catalog)).toEqual([]);
  });

  it("bloque les références inconnues et les valeurs hors bornes", () => {
    const issues = validateBuildImport([
      {
        ...savedBuild,
        build: { ...buildInput, material: "Inconnu", renfort: 99 },
      },
    ], catalog);

    expect(issues.map(issue => issue.path)).toEqual(expect.arrayContaining([
      "builds[0].build.material",
      "builds[0].build.renfort",
    ]));
  });

  it("bloque les doublons avec le catalogue local", () => {
    const issues = validateBuildImport([savedBuild], catalog, [
      { id: "local-1", name: "Build valide" },
    ]);

    expect(issues).toContainEqual({
      path: "builds[0].name",
      message: "nom déjà présent dans le catalogue local",
    });
  });
});
