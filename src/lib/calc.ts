import type { Chassis, Material, Quality, Shield, BuildInput, BuildResult, Params, Enchant } from "../types";

export function computeBuild(
  inp: BuildInput,
  tables: {
    chassis: Chassis[];
    materials: Material[];
    qualities: Quality[];
    shields: Shield[];
    params: Params;
    enchants?: Enchant[];     // ⬅️ nouveau (optionnel pour compat ascendante)
  }
): BuildResult {
  const ch       = tables.chassis.find(c => c.name === inp.chassis)!;
  const material = tables.materials.find(m => m.name === inp.material)!;
  const quality  = tables.qualities.find(q => q.name === inp.quality)!;
  const shield   = tables.shields.find(s => s.name === inp.shield)!;

  const renfort  = clamp(inp.renfort, 0, tables.params.renfortMax);
  const level    = clamp(inp.enchant ?? 0, 0, tables.params.enchantMax ?? 3);

  const ench = tables.enchants?.find(e => e.id === (inp.enchantId || "protection")); // défaut Protection

  // Base PA/Malus
  let pa    = ch.basePA + material.modPA + quality.bonusPA + renfort + shield.pa;
  let malus = ch.baseMalus + material.malusMod + quality.malusMod + shield.malus;

  // Enchant — application générique
  if (ench && level > 0){
    switch(ench.kind){
      case "pa_flat":
        pa += (ench.perLevel ?? 0) * level;
        break;
      case "pa_pct":
        pa += Math.round(pa * Math.pow(ench.factor ?? 0, level)); // si tu l’ajoutes plus tard
        break;
      case "malus_flat":
        malus += (ench.perLevel ?? 0) * level; // perLevel négatif => allègement
        break;
      case "malus_mult":
        malus = Math.ceil(malus * Math.pow(ench.factor ?? 1, level));
        break;
      case "res_add":
        // les résistances n’impactent pas PA/Malus ; on les affiche en note
        break;
      case "pen_ignore_add":
        // idem : n’impacte pas PA/Malus ; note affichée
        break;
      case "extraPen_delta":
        // n’impacte pas PA/Malus ; on l’applique dans le widget d’usure via matériau patché
        break;
    }
  }

  if (material.halfMalus) malus = Math.ceil(malus / 2);

  const effic = pa > 0 ? pa / Math.max(1, malus) : 0;
  const sweet = malus > 0 ? (pa / malus) >= tables.params.sweetSpotRatio : pa >= tables.params.sweetSpotRatio;

  const notes = buildNotes(material, ench, level);
  return { paFinal: pa, malusFinal: malus, effic, sweet, notes };
}

function buildNotes(material: Material, ench?: Enchant, level?: number): string[] {
  const out: string[] = [];
  if (material.penIgnore && material.penIgnore > 0) out.push(`Ignore ${material.penIgnore} pénétration`);
  if (material.extraPen && material.extraPen > 0)   out.push(`Usure pénétration +${material.extraPen}`);

  const r = material.res || {};
  const rnotes = [
    r.feu   ? `Feu +${r.feu}`     : null,
    r.froid ? `Froid +${r.froid}` : null,
    r.foudre? `Foudre +${r.foudre}` : null,
    r.magie ? `Magie +${r.magie}` : null
  ].filter(Boolean) as string[];
  out.push(...rnotes);

  // Enchant notes
  if (ench && (level ?? 0) > 0){
    switch(ench.kind){
      case "pa_flat":
        out.push(`Enchant: +${(ench.perLevel ?? 0) * (level ?? 0)} PA`);
        break;
      case "malus_flat": {
        const v = (ench.perLevel ?? 0) * (level ?? 0);
        out.push(`Enchant: ${v >= 0 ? "+"+v : v} malus`);
        break;
      }
      case "res_add":
        out.push(`Enchant: ${ench.target ?? "global"} +${(ench.perLevel ?? 0) * (level ?? 0)}`);
        break;
      case "pen_ignore_add":
        out.push(`Enchant: Ignore +${(ench.perLevel ?? 0) * (level ?? 0)} pénétration`);
        break;
      case "extraPen_delta": {
        const v = (ench.perLevel ?? 0) * (level ?? 0);
        out.push(`Enchant: usure pénétration ${v >= 0 ? "+"+v : v}`);
        break;
      }
      case "malus_mult":
        out.push(`Enchant: malus ×${Math.pow(ench.factor ?? 1, level ?? 0).toFixed(2)}`);
        break;
      case "pa_pct":
        out.push(`Enchant: PA +${Math.round(100 * Math.pow(ench.factor ?? 0, level ?? 0))}%`);
        break;
    }
  }

  return out;
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
