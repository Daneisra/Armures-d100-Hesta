import type { Chassis, Category, Material } from "../types";

const GROUPS = new Set(["Légère","Intermédiaire","Lourde"]);
const COMPAT = new Set(["Gambison","Cuir","Métal"]);

export function validateChassis(list: Chassis[]) {
  list.forEach(c => {
    if (!GROUPS.has(c.group))  console.warn(`[Chassis] group invalide: ${c.name} -> ${c.group}`);
    if (!COMPAT.has(c.category)) console.warn(`[Chassis] category invalide: ${c.name} -> ${c.category}`);
  });
}

export function validateCategories(list: Category[]) {
  list.forEach(c => {
    if (!COMPAT.has(c.compat)) console.warn(`[Category] compat invalide: ${c.key} -> ${c.compat}`);
  });
}

export function validateMaterials(list: Material[]) {
  list.forEach(m => {
    if (!COMPAT.has(m.compat)) console.warn(`[Material] compat invalide: ${m.name} -> ${m.compat}`);
  });
}
