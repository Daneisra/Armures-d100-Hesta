import { Shirt, Feather, Anvil, Nut, Gem, Bone, Trees, GlassWater, Zap, CircleHelp } from "lucide-react";

export function iconForCategory(key?: string){
  switch(key){
    case "Textile":         return Shirt;
    case "Cuir":            return Feather;
    case "MetalFerreux":    return Anvil;
    case "MetalNonFerreux": return Nut;
    case "MetalMythique":   return Gem;
    case "OrganiqueRigide": return Bone;
    case "Bois":            return Trees;
    case "MineralVerre":    return GlassWater;
    case "ResineDure":      return Zap;
    default:                return CircleHelp;
  }
}
