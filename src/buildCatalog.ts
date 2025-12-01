import type { BuildInput } from "./types";

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

export function importBuilds(text: string, mode: "replace" | "merge" = "merge") {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e: any) {
    throw new Error("JSON invalide : " + (e?.message ?? "parse error"));
  }
  const errors: string[] = [];
  const incoming: SavedBuild[] = Array.isArray(parsed?.builds) ? parsed.builds : [];
  if (!Array.isArray(parsed?.builds)) {
    errors.push("`builds` doit être un tableau");
  }
  incoming.forEach((b, idx) => {
    if (!b?.name) errors.push(`build #${idx+1} : name manquant`);
    if (!b?.build) errors.push(`build #${idx+1} : champ build manquant`);
  });
  if (errors.length) {
    throw new Error("Import builds invalide :\n- " + errors.join("\n- "));
  }
  const current = mode === "replace" ? [] : load();
  const merged = [...incoming, ...current];
  persist(merged);
}
