import { describe, expect, it } from "vitest";
import { describeImportFailure } from "../src/lib/importFeedback";
import { ImportValidationError } from "../src/lib/importValidation";

describe("describeImportFailure", () => {
  it("produit un résumé lisible pour les erreurs de validation", () => {
    const failure = describeImportFailure(
      new ImportValidationError("Import refusé", [
        { path: "$.builds[0].name", message: "champ obligatoire manquant" },
        { path: "$.builds[0].build.material", message: "référence inconnue : Inconnu" },
      ]),
      "builds.json"
    );

    expect(failure.title).toBe("Import refusé");
    expect(failure.summary).toContain("2 corrections sont nécessaires");
    expect(failure.summary).toContain("Aucune donnée locale n’a été modifiée");
    expect(failure.issues).toHaveLength(2);
  });

  it("distingue un JSON mal formé", () => {
    const failure = describeImportFailure(
      new ImportValidationError("Import catalogue refusé", [
        { path: "$", message: "JSON invalide : Unexpected end of JSON input" },
      ]),
      "catalog.json"
    );

    expect(failure.summary).toContain("n’est pas un JSON valide");
  });

  it("distingue une erreur de lecture d’une erreur inattendue d’import", () => {
    expect(describeImportFailure(new Error("denied"), "builds.json", "read").title)
      .toBe("Lecture du fichier impossible");
    expect(describeImportFailure(new Error("quota"), "builds.json").title)
      .toBe("Import impossible");
  });
});
