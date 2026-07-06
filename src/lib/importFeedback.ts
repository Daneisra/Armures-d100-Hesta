import { ImportValidationError, type ImportIssue } from "./importValidation";

export type ImportFailure = {
  title: string;
  summary: string;
  report: string;
  issues: ImportIssue[];
};

export function describeImportFailure(
  error: unknown,
  fileName: string,
  phase: "read" | "import" = "import"
): ImportFailure {
  if (error instanceof ImportValidationError) {
    const malformedJson = error.issues.some(issue => issue.message.startsWith("JSON invalide"));
    const count = error.issues.length;
    return {
      title: error.title,
      summary: malformedJson
        ? `Le fichier « ${fileName} » n’est pas un JSON valide. Aucune donnée locale n’a été modifiée.`
        : `${count} ${count > 1 ? "corrections sont nécessaires" : "correction est nécessaire"} dans « ${fileName} ». Aucune donnée locale n’a été modifiée.`,
      report: error.message,
      issues: error.issues,
    };
  }

  const detail = error instanceof Error ? error.message : "Erreur inconnue";
  return {
    title: phase === "read" ? "Lecture du fichier impossible" : "Import impossible",
    summary: phase === "read"
      ? `Le fichier « ${fileName} » n’a pas pu être lu. Vérifie qu’il est accessible puis réessaie.`
      : `Une erreur inattendue a interrompu l’import de « ${fileName} ». Les données existantes ont été conservées.`,
    report: `${phase === "read" ? "Lecture du fichier impossible" : "Import impossible"}\n\n${detail}`,
    issues: [],
  };
}
