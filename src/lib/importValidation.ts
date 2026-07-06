import type { Catalog, CatalogOverrides } from "../catalog";
import type { BuildInput } from "../types";

type JsonRecord = Record<string, unknown>;

export type ImportIssue = {
  path: string;
  message: string;
};

export class ImportValidationError extends Error {
  readonly title: string;
  readonly issues: ImportIssue[];

  constructor(title: string, issues: ImportIssue[]) {
    const lines = issues.map((issue, index) => `${index + 1}. ${issue.path} — ${issue.message}`);
    super(`${title}\n${issues.length} erreur(s) détectée(s)\n\n${lines.join("\n")}`);
    this.name = "ImportValidationError";
    this.title = title;
    this.issues = issues;
  }
}

const COMPATS = new Set(["Gambison", "Cuir", "Métal"]);
const GROUPS = new Set(["Légère", "Intermédiaire", "Lourde"]);
const RESIST_KEYS = new Set(["feu", "froid", "foudre", "tr", "per", "con", "magie"]);

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOwn = (record: JsonRecord, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key);

function addIssue(issues: ImportIssue[], path: string, message: string) {
  issues.push({ path, message });
}

function checkKnownKeys(record: JsonRecord, allowed: Set<string>, path: string, issues: ImportIssue[]) {
  Object.keys(record).forEach(key => {
    if (!allowed.has(key)) addIssue(issues, `${path}.${key}`, "champ inconnu");
  });
}

function checkString(
  record: JsonRecord,
  key: string,
  path: string,
  issues: ImportIssue[],
  options: { required?: boolean; nonEmpty?: boolean; allowed?: Set<string> } = {}
) {
  const required = options.required ?? true;
  if (!hasOwn(record, key)) {
    if (required) addIssue(issues, `${path}.${key}`, "champ obligatoire manquant");
    return;
  }
  const value = record[key];
  if (typeof value !== "string") {
    addIssue(issues, `${path}.${key}`, "doit être une chaîne de caractères");
    return;
  }
  if ((options.nonEmpty ?? true) && value.trim().length === 0) {
    addIssue(issues, `${path}.${key}`, "ne doit pas être vide");
  }
  if (options.allowed && !options.allowed.has(value)) {
    addIssue(issues, `${path}.${key}`, `valeur invalide : ${value}`);
  }
}

function checkNumber(
  record: JsonRecord,
  key: string,
  path: string,
  issues: ImportIssue[],
  options: { required?: boolean; min?: number; max?: number; integer?: boolean } = {}
) {
  const required = options.required ?? true;
  if (!hasOwn(record, key)) {
    if (required) addIssue(issues, `${path}.${key}`, "champ numérique obligatoire manquant");
    return;
  }
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, `${path}.${key}`, "doit être un nombre fini");
    return;
  }
  if (options.integer && !Number.isInteger(value)) {
    addIssue(issues, `${path}.${key}`, "doit être un entier");
  }
  if (options.min !== undefined && value < options.min) {
    addIssue(issues, `${path}.${key}`, `doit être supérieur ou égal à ${options.min}`);
  }
  if (options.max !== undefined && value > options.max) {
    addIssue(issues, `${path}.${key}`, `doit être inférieur ou égal à ${options.max}`);
  }
}

function checkBoolean(record: JsonRecord, key: string, path: string, issues: ImportIssue[]) {
  if (hasOwn(record, key) && typeof record[key] !== "boolean") {
    addIssue(issues, `${path}.${key}`, "doit être un booléen");
  }
}

function checkUniqueNames(list: unknown[], path: string, issues: ImportIssue[]) {
  const seen = new Map<string, number>();
  list.forEach((item, index) => {
    if (!isRecord(item) || typeof item.name !== "string") return;
    const normalized = item.name.trim().toLocaleLowerCase("fr");
    if (!normalized) return;
    const previous = seen.get(normalized);
    if (previous !== undefined) {
      addIssue(issues, `${path}[${index}].name`, `doublon avec ${path}[${previous}].name`);
    } else {
      seen.set(normalized, index);
    }
  });
}

function checkRepairMultipliers(value: unknown, path: string, issues: ImportIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet");
    return;
  }
  checkKnownKeys(value, new Set(["costMul", "timeMul", "note"]), path, issues);
  checkNumber(value, "costMul", path, issues, { required: false, min: 0 });
  checkNumber(value, "timeMul", path, issues, { required: false, min: 0 });
  checkString(value, "note", path, issues, { required: false, nonEmpty: false });
}

function checkChassis(value: unknown, path: string, issues: ImportIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet châssis");
    return;
  }
  checkKnownKeys(value, new Set(["name", "basePA", "baseMalus", "group", "category"]), path, issues);
  checkString(value, "name", path, issues);
  checkNumber(value, "basePA", path, issues, { min: 0, integer: true });
  checkNumber(value, "baseMalus", path, issues, { min: 0, integer: true });
  checkString(value, "group", path, issues, { allowed: GROUPS });
  checkString(value, "category", path, issues, { allowed: COMPATS });
}

function checkMaterial(value: unknown, path: string, issues: ImportIssue[], catalog: Catalog) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet matériau");
    return;
  }
  checkKnownKeys(
    value,
    new Set(["name", "category", "compat", "modPA", "malusMod", "effects", "halfMalus", "penIgnore", "extraPen", "res", "repair"]),
    path,
    issues
  );
  checkString(value, "name", path, issues);
  checkString(value, "category", path, issues);
  checkString(value, "compat", path, issues, { allowed: COMPATS });
  checkNumber(value, "modPA", path, issues, { integer: true });
  checkNumber(value, "malusMod", path, issues, { integer: true });
  checkString(value, "effects", path, issues, { required: false, nonEmpty: false });
  checkBoolean(value, "halfMalus", path, issues);
  checkNumber(value, "penIgnore", path, issues, { required: false, min: 0, integer: true });
  checkNumber(value, "extraPen", path, issues, { required: false, min: 0, integer: true });

  if (hasOwn(value, "res")) {
    if (!isRecord(value.res)) {
      addIssue(issues, `${path}.res`, "doit être un objet de résistances");
    } else {
      checkKnownKeys(value.res, RESIST_KEYS, `${path}.res`, issues);
      Object.keys(value.res).forEach(key => checkNumber(value.res as JsonRecord, key, `${path}.res`, issues, { required: false }));
    }
  }
  if (hasOwn(value, "repair")) checkRepairMultipliers(value.repair, `${path}.repair`, issues);

  if (typeof value.category === "string") {
    const category = catalog.categories.find(item => item.key === value.category);
    if (!category) {
      addIssue(issues, `${path}.category`, `référence inconnue : ${value.category}`);
    } else if (typeof value.compat === "string" && category.compat !== value.compat) {
      addIssue(issues, `${path}.compat`, `incompatible avec la catégorie ${value.category} (${category.compat} attendu)`);
    }
  }
}

function checkQuality(value: unknown, path: string, issues: ImportIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet qualité");
    return;
  }
  checkKnownKeys(value, new Set(["name", "bonusPA", "malusMod", "repair"]), path, issues);
  checkString(value, "name", path, issues);
  checkNumber(value, "bonusPA", path, issues, { min: 0, integer: true });
  checkNumber(value, "malusMod", path, issues, { integer: true });
  if (hasOwn(value, "repair")) checkRepairMultipliers(value.repair, `${path}.repair`, issues);
}

function checkShield(value: unknown, path: string, issues: ImportIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet bouclier");
    return;
  }
  checkKnownKeys(value, new Set(["name", "pa", "malus", "poids"]), path, issues);
  checkString(value, "name", path, issues);
  checkNumber(value, "pa", path, issues, { min: 0, integer: true });
  checkNumber(value, "malus", path, issues, { min: 0, integer: true });
  checkNumber(value, "poids", path, issues, { required: false, min: 0 });
}

function checkCompatNumberMap(value: unknown, path: string, issues: ImportIssue[]) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet indexé par compatibilité");
    return;
  }
  checkKnownKeys(value, COMPATS, path, issues);
  Object.keys(value).forEach(key => checkNumber(value, key, path, issues, { required: false, min: 0 }));
}

function checkPVParams(value: unknown, path: string, issues: ImportIssue[], catalog: Catalog) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet de paramètres PV");
    return;
  }
  const mode = typeof value.mode === "string" ? value.mode : catalog.params.pv.mode;
  const allowed = mode === "table"
    ? new Set(["mode", "points", "round", "perLevel", "cap"])
    : new Set(["mode", "slope", "offset", "round", "minCon", "maxCon", "perLevel", "cap"]);
  checkKnownKeys(value, allowed, path, issues);
  checkString(value, "mode", path, issues, { required: false, allowed: new Set(["linear", "table"]) });
  checkString(value, "round", path, issues, { required: false, allowed: new Set(["nearest"]) });
  checkNumber(value, "perLevel", path, issues, { required: false });
  checkNumber(value, "cap", path, issues, { required: false, min: 0 });

  if (mode === "table") {
    if (hasOwn(value, "points")) {
      if (!Array.isArray(value.points) || value.points.length === 0) {
        addIssue(issues, `${path}.points`, "doit être un tableau non vide de couples [CON, PV]");
      } else {
        value.points.forEach((point, index) => {
          if (!Array.isArray(point) || point.length !== 2 || point.some(item => typeof item !== "number" || !Number.isFinite(item))) {
            addIssue(issues, `${path}.points[${index}]`, "doit être un couple de nombres finis [CON, PV]");
          }
        });
      }
    }
  } else {
    checkNumber(value, "slope", path, issues, { required: false, min: 0 });
    checkNumber(value, "offset", path, issues, { required: false });
    checkNumber(value, "minCon", path, issues, { required: false, min: 0 });
    checkNumber(value, "maxCon", path, issues, { required: false, min: 0 });
    if (typeof value.minCon === "number" && typeof value.maxCon === "number" && value.minCon > value.maxCon) {
      addIssue(issues, `${path}.maxCon`, "doit être supérieur ou égal à minCon");
    }
  }
}

function checkParams(value: unknown, path: string, issues: ImportIssue[], catalog: Catalog) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet de paramètres");
    return;
  }
  checkKnownKeys(value, new Set(["sweetSpotRatio", "renfortMax", "enchantMax", "baseWear", "capWearPerHit", "repair", "pv"]), path, issues);
  checkNumber(value, "sweetSpotRatio", path, issues, { required: false, min: Number.EPSILON });
  checkNumber(value, "renfortMax", path, issues, { required: false, min: 0, integer: true });
  checkNumber(value, "enchantMax", path, issues, { required: false, min: 0, integer: true });
  checkNumber(value, "baseWear", path, issues, { required: false, min: 0 });
  checkNumber(value, "capWearPerHit", path, issues, { required: false, min: 0 });

  if (hasOwn(value, "repair")) {
    if (!isRecord(value.repair)) {
      addIssue(issues, `${path}.repair`, "doit être un objet");
    } else {
      checkKnownKeys(value.repair, new Set(["costPerPA", "timePerPA"]), `${path}.repair`, issues);
      if (hasOwn(value.repair, "costPerPA")) checkCompatNumberMap(value.repair.costPerPA, `${path}.repair.costPerPA`, issues);
      if (hasOwn(value.repair, "timePerPA")) checkCompatNumberMap(value.repair.timePerPA, `${path}.repair.timePerPA`, issues);
    }
  }
  if (hasOwn(value, "pv")) checkPVParams(value.pv, `${path}.pv`, issues, catalog);
}

function checkArrayDomain(
  value: unknown,
  path: string,
  issues: ImportIssue[],
  validator: (item: unknown, itemPath: string, issues: ImportIssue[]) => void
) {
  if (!Array.isArray(value)) {
    addIssue(issues, path, "doit être un tableau");
    return;
  }
  checkUniqueNames(value, path, issues);
  value.forEach((item, index) => validator(item, `${path}[${index}]`, issues));
}

export function validateCatalogOverrides(value: unknown, catalog: Catalog): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (!isRecord(value)) {
    addIssue(issues, "overrides", "doit être un objet");
    return issues;
  }
  const supported = new Set(["chassis", "materials", "qualities", "shields", "params"]);
  checkKnownKeys(value, supported, "overrides", issues);

  if (hasOwn(value, "chassis")) checkArrayDomain(value.chassis, "overrides.chassis", issues, checkChassis);
  if (hasOwn(value, "materials")) {
    checkArrayDomain(value.materials, "overrides.materials", issues, (item, path, list) => checkMaterial(item, path, list, catalog));
  }
  if (hasOwn(value, "qualities")) checkArrayDomain(value.qualities, "overrides.qualities", issues, checkQuality);
  if (hasOwn(value, "shields")) checkArrayDomain(value.shields, "overrides.shields", issues, checkShield);
  if (hasOwn(value, "params")) checkParams(value.params, "overrides.params", issues, catalog);
  return issues;
}

function checkBuildInput(value: unknown, path: string, issues: ImportIssue[], catalog: Catalog) {
  if (!isRecord(value)) {
    addIssue(issues, path, "doit être un objet build");
    return;
  }
  checkKnownKeys(value, new Set(["chassis", "material", "quality", "renfort", "enchant", "enchantId", "shield", "shieldMaterial", "cat"]), path, issues);
  checkString(value, "chassis", path, issues);
  checkString(value, "material", path, issues);
  checkString(value, "quality", path, issues);
  checkNumber(value, "renfort", path, issues, { min: 0, max: catalog.params.renfortMax, integer: true });
  checkNumber(value, "enchant", path, issues, { min: 0, max: catalog.params.enchantMax, integer: true });
  checkString(value, "enchantId", path, issues, { required: false });
  checkString(value, "shield", path, issues);
  checkString(value, "shieldMaterial", path, issues, { required: false, nonEmpty: false });
  checkString(value, "cat", path, issues, { required: false, nonEmpty: false });

  const chassis = typeof value.chassis === "string" ? catalog.chassis.find(item => item.name === value.chassis) : undefined;
  const material = typeof value.material === "string" ? catalog.materials.find(item => item.name === value.material) : undefined;
  if (typeof value.chassis === "string" && !chassis) addIssue(issues, `${path}.chassis`, `référence inconnue : ${value.chassis}`);
  if (typeof value.material === "string" && !material) addIssue(issues, `${path}.material`, `référence inconnue : ${value.material}`);
  if (typeof value.quality === "string" && !catalog.qualities.some(item => item.name === value.quality)) {
    addIssue(issues, `${path}.quality`, `référence inconnue : ${value.quality}`);
  }
  if (typeof value.shield === "string" && !catalog.shields.some(item => item.name === value.shield)) {
    addIssue(issues, `${path}.shield`, `référence inconnue : ${value.shield}`);
  }
  if (typeof value.enchantId === "string" && !catalog.enchants.some(item => item.id === value.enchantId)) {
    addIssue(issues, `${path}.enchantId`, `référence inconnue : ${value.enchantId}`);
  }
  if (typeof value.shieldMaterial === "string" && value.shieldMaterial && !catalog.shieldMaterials.some(item => item.name === value.shieldMaterial)) {
    addIssue(issues, `${path}.shieldMaterial`, `référence inconnue : ${value.shieldMaterial}`);
  }
  if (typeof value.cat === "string" && value.cat && !catalog.categories.some(item => item.key === value.cat)) {
    addIssue(issues, `${path}.cat`, `référence inconnue : ${value.cat}`);
  }
  if (chassis && material && chassis.category !== material.compat) {
    addIssue(issues, path, `châssis ${chassis.name} incompatible avec le matériau ${material.name}`);
  }
  if (material && typeof value.cat === "string" && value.cat && material.category !== value.cat) {
    addIssue(issues, `${path}.cat`, `la catégorie ${value.cat} ne correspond pas au matériau ${material.name} (${material.category})`);
  }
}

export function validateBuildImport(
  value: unknown,
  catalog: Catalog,
  existingBuilds: Array<{ id: string; name: string }> = []
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (!Array.isArray(value)) {
    addIssue(issues, "builds", "doit être un tableau");
    return issues;
  }
  checkUniqueNames(value, "builds", issues);
  const seenIds = new Map<string, number>();
  const existingIds = new Set(existingBuilds.map(item => item.id));
  const existingNames = new Set(existingBuilds.map(item => item.name.trim().toLocaleLowerCase("fr")));

  value.forEach((entry, index) => {
    const path = `builds[${index}]`;
    if (!isRecord(entry)) {
      addIssue(issues, path, "doit être un objet de build sauvegardé");
      return;
    }
    checkKnownKeys(entry, new Set(["id", "name", "note", "createdAt", "build", "cat"]), path, issues);
    checkString(entry, "id", path, issues);
    checkString(entry, "name", path, issues);
    checkString(entry, "note", path, issues, { required: false, nonEmpty: false });
    checkNumber(entry, "createdAt", path, issues, { min: 0, integer: true });
    checkString(entry, "cat", path, issues, { required: false, nonEmpty: false });
    checkBuildInput(entry.build, `${path}.build`, issues, catalog);

    if (typeof entry.id === "string" && entry.id.trim()) {
      const previous = seenIds.get(entry.id);
      if (previous !== undefined) addIssue(issues, `${path}.id`, `doublon avec builds[${previous}].id`);
      else if (existingIds.has(entry.id)) addIssue(issues, `${path}.id`, "identifiant déjà présent dans le catalogue local");
      else seenIds.set(entry.id, index);
    }
    if (typeof entry.name === "string" && existingNames.has(entry.name.trim().toLocaleLowerCase("fr"))) {
      addIssue(issues, `${path}.name`, "nom déjà présent dans le catalogue local");
    }
    if (typeof entry.cat === "string" && entry.cat && !catalog.categories.some(item => item.key === entry.cat)) {
      addIssue(issues, `${path}.cat`, `référence inconnue : ${entry.cat}`);
    }
    if (isRecord(entry.build) && typeof entry.cat === "string" && typeof entry.build.cat === "string" && entry.cat !== entry.build.cat) {
      addIssue(issues, `${path}.cat`, "doit correspondre à build.cat");
    }
  });
  return issues;
}

export function assertValidCatalogOverrides(value: unknown, catalog: Catalog): asserts value is CatalogOverrides {
  const issues = validateCatalogOverrides(value, catalog);
  if (issues.length) throw new ImportValidationError("Import catalogue refusé", issues);
}

export function assertValidBuildImport(
  value: unknown,
  catalog: Catalog,
  existingBuilds: Array<{ id: string; name: string }> = []
): asserts value is Array<{ id: string; name: string; note?: string; createdAt: number; build: BuildInput; cat?: string }> {
  const issues = validateBuildImport(value, catalog, existingBuilds);
  if (issues.length) throw new ImportValidationError("Import de builds refusé", issues);
}
