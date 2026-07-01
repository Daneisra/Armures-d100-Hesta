import type { BuildInput } from "./types";
import type { Catalog } from "./catalog";
import { assertValidBuildImport, ImportValidationError, type ImportIssue } from "./lib/importValidation";

export type SavedBuild = {
  id: string;
  name: string;
  note?: string;
  createdAt: number;
  build: BuildInput;
  cat?: string;
};

const STORAGE_KEY = "pa_build_catalog_v1";

function load(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function persist(list: SavedBuild[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getBuilds(): SavedBuild[] {
  return load();
}

export function addBuild(entry: Omit<SavedBuild, "id" | "createdAt">) {
  const list = load();
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const next: SavedBuild = { ...entry, id, createdAt: Date.now() };
  persist([next, ...list]);
}

export function deleteBuild(id: string) {
  const list = load().filter(b => b.id !== id);
  persist(list);
}

export function resetBuilds() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportBuilds(): string {
  return JSON.stringify({ schemaVersion: 1, builds: load() }, null, 2);
}

export function importBuilds(text: string, mode: "replace" | "merge", catalog: Catalog) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erreur de lecture inconnue";
    throw new ImportValidationError("Import de builds refusé", [{ path: "$", message: `JSON invalide : ${message}` }]);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ImportValidationError("Import de builds refusé", [{ path: "$", message: "doit être un objet JSON" }]);
  }

  const root = parsed as Record<string, unknown>;
  const issues: ImportIssue[] = [];
  Object.keys(root).forEach(key => {
    if (key !== "schemaVersion" && key !== "builds") issues.push({ path: `$.${key}`, message: "champ inconnu" });
  });
  if (root.schemaVersion !== 1) {
    issues.push({ path: "$.schemaVersion", message: "version attendue : 1" });
  }
  if (!Object.prototype.hasOwnProperty.call(root, "builds")) {
    issues.push({ path: "$.builds", message: "champ obligatoire manquant" });
  }
  if (issues.length) throw new ImportValidationError("Import de builds refusé", issues);

  const current = mode === "replace" ? [] : load();
  assertValidBuildImport(root.builds, catalog, current);
  const incoming = root.builds;
  const merged = [...incoming, ...current];
  persist(merged);
}
