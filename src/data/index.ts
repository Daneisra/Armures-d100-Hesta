import chassisJson     from "./chassis.json";
import materialsJson   from "./materials.json";
import qualities       from "./qualities.json";
import shields         from "./shields.json";
import params          from "./params.json";
import categoriesJson  from "./categories.json";
import enchantments    from "./enchantments.json";
import shieldMaterialsJson from "./shieldMaterials.json";

import type { Chassis, Category, Material, Enchant, ShieldMaterial } from "../types";

// ✅ Exports typés (on force les JSON vers les types attendus)
export const chassis: Chassis[]       = chassisJson   as unknown as Chassis[];
export const categories: Category[]   = categoriesJson as unknown as Category[];
export const materials: Material[]    = materialsJson as unknown as Material[];
export const enchants: Enchant[]      = enchantments   as unknown as Enchant[];
export const shieldMaterials: ShieldMaterial[] = shieldMaterialsJson as unknown as ShieldMaterial[];

// gardez les autres en export simple
export { qualities, shields, params };
