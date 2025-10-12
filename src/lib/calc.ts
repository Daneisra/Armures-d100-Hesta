import type { Chassis, Material, Quality, Shield, BuildInput, BuildResult, Params, Enchant, ShieldMaterial } from "../types";

const orFirst = <T,>(arr: T[], pred: (x:T)=>boolean) =>
  arr.find(pred) ?? arr[0];

export function computeBuild(
  inp: BuildInput,
  tables: {
    chassis: Chassis[];
    materials: Material[];
    qualities: Quality[];
    shields: Shield[];
    params: Params;
    enchants?: Enchant[];
    shieldMaterials?: ShieldMaterial[];
  }
): BuildResult {
  const ch       = orFirst(tables.chassis, c => c.name === inp.chassis);
  const material = orFirst(tables.materials, m => m.name === inp.material);
  const quality  = orFirst(tables.qualities, q => q.name === inp.quality);
  const shield   = orFirst(tables.shields, s => s.name === inp.shield);

  const shMat    = tables.shieldMaterials?.find(sm => sm.name === inp.shieldMaterial);
  const ench     = tables.enchants?.find(e => e.id === (inp.enchantId || "protection")); // défaut Protection


  const renfort  = clamp(inp.renfort, 0, tables.params.renfortMax);
  const level    = clamp(inp.enchant ?? 0, 0, tables.params.enchantMax ?? 3);


  // Base PA/Malus
  let pa    = ch.basePA + material.modPA + quality.bonusPA + renfort;
  let malus = ch.baseMalus + material.malusMod + quality.malusMod;

  // Bouclier (base + matériau éventuel)
  let shieldPa    = shield.pa;
  let shieldMalus = shield.malus;
  if (shMat) {
    shieldPa    += shMat.paMod;
    shieldMalus += shMat.malusMod;
  }
  pa    += shieldPa;
  malus += shieldMalus;

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

  malus = Math.max(0, malus);

  if (material.halfMalus) malus = Math.ceil(malus / 2);

  const ratio = malus <= 0 ? Infinity : pa / malus;
  const effic = malus <= 0 ? pa : ratio;
  const sweet = ratio >= tables.params.sweetSpotRatio;

  // notes (ajoute un résumé bouclier)
  const notes = buildNotes(material, ench, level);
  if (inp.shield !== "Aucun") {
    const part = `Bouclier: +${shieldPa} PA, +${shieldMalus} malus` + (shMat ? ` (${shMat.name})` : "");
    notes.unshift(part);
  }
  
  return { paFinal: pa, malusFinal: malus, effic, sweet, notes };
}

function buildNotes(material: Material, ench?: Enchant, level?: number): string[] {
  const out: string[] = [];
  if (material.penIgnore && material.penIgnore > 0) out.push(`Ignore ${material.penIgnore} pénétration`);
  if (material.extraPen && material.extraPen > 0)   out.push(`Usure pénétration +${material.extraPen}`);

  const r = material.res || {};
  const rnotes = [
    r.tr    ? `Tr +${r.tr}`       : null,
    r.per   ? `Per +${r.per}`     : null,
    r.con   ? `Con +${r.con}`     : null,
    r.feu   ? `Feu +${r.feu}`     : null,
    r.froid ? `Froid +${r.froid}` : null,
    r.foudre? `Foudre +${r.foudre}` : null,
    r.magie ? `Magie +${r.magie}` : null,
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
