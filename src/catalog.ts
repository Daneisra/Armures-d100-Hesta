import { chassis as chassisDefault, materials as materialsDefault, qualities as qualitiesDefault, shields as shieldsDefault, params as paramsDefault, categories as categoriesDefault, enchants as enchantsDefault, shieldMaterials as shieldMaterialsDefault } from "./data";
import type { Chassis, Material, Quality, Shield, Params, Category, Enchant, ShieldMaterial } from "./types";

export type Catalog = {
  chassis: Chassis[];
  materials: Material[];
  qualities: Quality[];
  shields: Shield[];
  params: Params;
  categories: Category[];
  enchants: Enchant[];
  shieldMaterials: ShieldMaterial[];
};

export type CatalogOverrides = Partial<Omit<Catalog, "params">> & { params?: Partial<Params> };

const STORAGE_KEY = "pa_catalog_v1";
const SCHEMA_VERSION = 1;

const defaults: Catalog = {
  chassis: chassisDefault,
  materials: materialsDefault,
  qualities: qualitiesDefault,
  shields: shieldsDefault as Shield[],
  params: paramsDefault,
  categories: categoriesDefault,
  enchants: enchantsDefault,
  shieldMaterials: shieldMaterialsDefault,
};

function mergeList<T extends Record<string, any>>(base: T[], ov?: T[], key: keyof T = "name"): T[] {
  if (!ov || ov.length === 0) return base;
  const map = new Map<string, T>();
  base.forEach(item => map.set(String(item[key]), item));
  ov.forEach(item => map.set(String(item[key]), item));
  return Array.from(map.values());
}

function mergeParams(base: Params, override?: Partial<Params>): Params {
  if (!override) return base;
  return {
    ...base,
    ...override,
    repair: {
      costPerPA: { ...base.repair.costPerPA, ...(override.repair?.costPerPA ?? {}) },
      timePerPA: { ...base.repair.timePerPA, ...(override.repair?.timePerPA ?? {}) },
    },
    pv: { ...base.pv, ...(override.pv ?? {}) },
  };
}

export function mergeCatalog(overrides: CatalogOverrides | null): Catalog {
  const ov = overrides ?? {};
  return {
    chassis: mergeList(defaults.chassis, ov.chassis),
    materials: mergeList(defaults.materials, ov.materials),
    qualities: mergeList(defaults.qualities, ov.qualities),
    shields: mergeList(defaults.shields, ov.shields),
    params: mergeParams(defaults.params, ov.params),
    categories: defaults.categories,
    enchants: defaults.enchants,
    shieldMaterials: defaults.shieldMaterials,
  };
}

export function loadOverrides(): CatalogOverrides | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== SCHEMA_VERSION) return null;
    return parsed.overrides ?? null;
  } catch {
    return null;
  }
}

export function saveOverrides(overrides: CatalogOverrides | null) {
  if (!overrides || Object.keys(overrides).length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const payload = { schemaVersion: SCHEMA_VERSION, overrides };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetOverrides() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportCatalog(overrides: CatalogOverrides): string {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    overrides,
  };
  return JSON.stringify(payload, null, 2);
}

export function importCatalog(text: string): CatalogOverrides {
  const parsed = JSON.parse(text);
  if (parsed?.schemaVersion !== SCHEMA_VERSION || typeof parsed !== "object") {
    throw new Error("Fichier incompatible ou schemaVersion manquante");
  }
  const ov = parsed.overrides ?? {};
  return ov;
}

export { defaults as defaultCatalog, STORAGE_KEY as CATALOG_STORAGE_KEY };
