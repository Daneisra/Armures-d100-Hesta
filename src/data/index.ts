import chassisJson     from "./chassis.json";
import materialsJson   from "./materials.json"; // ⬅️ ajout
import qualities       from "./qualities.json";
import shields         from "./shields.json";
import params          from "./params.json";
import categoriesJson  from "./categories.json";

import type { Chassis, Category, Material } from "../types";

// ✅ Exports typés (on force les JSON vers les types attendus)
export const chassis: Chassis[]       = chassisJson   as unknown as Chassis[];
export const categories: Category[]   = categoriesJson as unknown as Category[];
export const materials: Material[]    = materialsJson as unknown as Material[]; // ⬅️ important

// gardez les autres en export simple
export { qualities, shields, params };
