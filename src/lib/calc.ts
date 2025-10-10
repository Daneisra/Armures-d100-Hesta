import type { Chassis, Material, Quality, Shield, BuildInput, BuildResult, Params } from "../types";

export function computeBuild(
  inp: BuildInput,
  tables: { chassis: Chassis[]; materials: Material[]; qualities: Quality[]; shields: Shield[]; params: Params }
): BuildResult {
  const ch       = tables.chassis.find(c => c.name === inp.chassis)!;
  const material = tables.materials.find(m => m.name === inp.material)!;
  const quality  = tables.qualities.find(q => q.name === inp.quality)!;
  const shield   = tables.shields.find(s => s.name === inp.shield)!;

  const renfort  = clamp(inp.renfort, 0, tables.params.renfortMax);
  const enchant  = clamp(inp.enchant, 0, tables.params.enchantMax);

  // PA
  let pa = ch.basePA + material.modPA + quality.bonusPA + renfort + shield.pa;
  // (option) pa += enchant;

  // Malus
  let malus = ch.baseMalus + material.malusMod + quality.malusMod + shield.malus;
  if (material.halfMalus) malus = Math.ceil(malus / 2);

  // Résumé
  const effic = pa > 0 ? pa / Math.max(1, malus) : 0;
  const sweet = malus > 0 ? (pa / malus) >= tables.params.sweetSpotRatio : pa >= tables.params.sweetSpotRatio;

  return { paFinal: pa, malusFinal: malus, effic, sweet, notes: buildNotes(material) };
}

function buildNotes(material: Material): string[] {
  const out: string[] = [];
  if (material.penIgnore && material.penIgnore > 0) out.push(`Ignore ${material.penIgnore} pénétration`);
  const r = material.res || {};
  const rnotes = [
    r.feu   ? `Feu +${r.feu}` : null,
    r.froid ? `Froid +${r.froid}` : null,
    r.foudre? `Foudre +${r.foudre}` : null,
    r.magie ? `Magie +${r.magie}` : null
  ].filter(Boolean) as string[];
  return out.concat(rnotes);
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
