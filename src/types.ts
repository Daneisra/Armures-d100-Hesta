export type Category = {
  key: string;
  label: string;
  sort: number;
  description?: string;
  /** Groupe de compatibilité attendu par le châssis */
  compat: "Gambison" | "Cuir" | "Métal";
};

export type Chassis = {
  name: string;
  basePA: number;
  baseMalus: number;
  group: "Légère" | "Intermédiaire" | "Lourde";
  /** compat châssis = groupe attendu côté matériau */
  category: "Gambison" | "Cuir" | "Métal";
};

export type Resist = {
  feu: number; froid: number; foudre: number;
  tr: number; per: number; con: number; magie: number;
};

export type Material = {
  name: string;
  category: string;
  compat: "Gambison" | "Cuir" | "Métal";
  modPA: number;
  malusMod: number;
  effects?: string;
  halfMalus?: boolean;
  penIgnore?: number;
  extraPen?: number;
  res?: Partial<Resist>;
  repair?: {
    costMul?: number; // multiplicateur coût (par PA manquant)
    timeMul?: number; // multiplicateur temps (par PA manquant)
    note?: string;    // (facultatif) info utile à afficher
  };
};

export type Shield  = { name: string; pa: number; malus: number; poids?: number };

export type ShieldMaterial = {
  name: string;
  compat: "Bois" | "Métal" | "Cuir" | "Mixte";
  paMod: number;       // +PA appliqué au bouclier
  malusMod: number;    // +Malus appliqué au bouclier
  effects?: string;
};

export type PVParams =
  | {
      mode: "linear";
      slope: number;
      offset?: number;
      round?: "nearest" | "floor" | "ceil";
      minCon?: number;
      maxCon?: number;
      perLevel?: number;
      cap?: number;
    }
  | {
      mode: "table";
      points: [number, number][];
      round?: "nearest" | "floor" | "ceil";
      perLevel?: number;
      cap?: number;
    };

export type Params = {
  sweetSpotRatio: number;
  renfortMax: number;
  enchantMax: number;
  baseWear: number;
  capWearPerHit: number;
  repair: {
    costPerPA: { Gambison: number; Cuir: number; Métal: number };
    timePerPA: { Gambison: number; Cuir: number; Métal: number };
  };
  pv: PVParams;
};


export type Quality = {
  name: string;
  bonusPA: number;
  malusMod: number;
  repair?: {
    costMul?: number; // défaut 1
    timeMul?: number; // défaut 1
    note?: string;
  };
};

export type BuildInput = {
  chassis: string;
  material: string;
  quality: string;
  renfort: number;
  enchant: number;
  enchantId?: string;
  shield: string;
  shieldMaterial?: string;
  cat?: string;
};

export type BuildResult = {
  paFinal: number;
  malusFinal: number;
  effic: number;
  sweet: boolean;
  notes: string[];
};

export type Enchant = {
  id: string;                      // "protection", "alleger", ...
  name: string;                    // "Protection", "Allègement", ...
  kind:
    | "pa_flat"                    // +PA linéaire
    | "malus_flat"                 // malus +/- linéaire (valeur négative pour réduire)
    | "res_add"                    // +résistances
    | "pen_ignore_add"             // +pénétration ignorée
    | "extraPen_delta"             // delta sur usure pénétration (négatif = meilleure tenue)
    | "pa_pct"                     // +PA en pourcentage (optionnel)
    | "malus_mult";                // x malus (peu utilisé)
  target?: "global" | "feu" | "froid" | "foudre" | "magie" | "tr" | "per" | "con";
  perLevel?: number;               // incrément par niveau (pour pa_flat, malus_flat, res_add, pen_ignore_add)
  factor?: number;                 // multiplicateur par niveau (pour malus_mult, pa_pct)
  minLevel?: number;               // défaut 0
  maxLevel?: number;               // défaut params.enchantMax
};
