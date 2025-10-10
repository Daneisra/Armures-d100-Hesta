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
  /** Catégorie d’affinage (Textile, MetalFerreux, Bois, etc.) */
  category: string;
  /** Groupe de compatibilité pour le châssis */
  compat: "Gambison" | "Cuir" | "Métal";
  modPA: number;
  malusMod: number;
  effects?: string;
  halfMalus?: boolean;
  penIgnore?: number;
  extraPen?: number;
  res?: Partial<Resist>;
};

export type Quality = { name: string; bonusPA: number; malusMod: number };
export type Shield  = { name: string; pa: number; malus: number; poids?: number };
export type Params = {
  sweetSpotRatio: number;
  renfortMax: number;
  enchantMax: number;
  /** Usure de base sur un coup non pénétrant */
  baseWear: number;          // ex: 1
  /** Limite maximale d'usure appliquée sur un coup (après extraPen) */
  capWearPerHit: number;     // ex: 4
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

