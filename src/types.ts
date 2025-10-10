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

  /** 🔧 Réparation — multiplicateurs spécifiques au matériau */
  repairCostMult?: number; // défaut 1
  repairTimeMult?: number; // défaut 1
};

export type Shield  = { name: string; pa: number; malus: number; poids?: number };

export type Params = {
  sweetSpotRatio: number;
  renfortMax: number;
  enchantMax: number;
  
  /** Usure (déjà en 0.2.0) */
  baseWear: number;          
  capWearPerHit: number;

  /** ⚙️ Réparation — bases par compat (coût en po, temps en h) */
  repair: {
    costPerPA: { Gambison: number; Cuir: number; Métal: number };
    timePerPA: { Gambison: number; Cuir: number; Métal: number };
  };
};

export type Quality = {
  name: string;
  bonusPA: number;
  malusMod: number;

  /** 🔧 Réparation — multiplicateurs de qualité */
  repairCostMult?: number; // défaut 1
  repairTimeMult?: number; // défaut 1
};

export type BuildInput = {
  chassis: string;
  material: string;
  quality: string;
  renfort: number;
  enchant: number;
  shield: string;
};

export type BuildResult = {
  paFinal: number;
  malusFinal: number;
  effic: number;
  sweet: boolean;
  notes: string[];
};

