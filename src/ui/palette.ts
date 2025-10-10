export const CAT_STYLES: Record<string,{bg:string;text:string;ring:string}> = {
  Textile:         { bg:"bg-sky-100",   text:"text-sky-900",   ring:"ring-sky-400" },
  Cuir:            { bg:"bg-amber-100", text:"text-amber-900", ring:"ring-amber-400" },
  MetalFerreux:    { bg:"bg-slate-200", text:"text-slate-900", ring:"ring-slate-400" },
  MetalNonFerreux: { bg:"bg-orange-100",text:"text-orange-900",ring:"ring-orange-400" },
  MetalMythique:   { bg:"bg-purple-100",text:"text-purple-900",ring:"ring-purple-400" },
  OrganiqueRigide: { bg:"bg-lime-100",  text:"text-lime-900",  ring:"ring-lime-400" },
  Bois:            { bg:"bg-emerald-100",text:"text-emerald-900",ring:"ring-emerald-400" },
  MineralVerre:    { bg:"bg-cyan-100",  text:"text-cyan-900",  ring:"ring-cyan-400" },
  ResineDure:      { bg:"bg-yellow-100",text:"text-yellow-900",ring:"ring-yellow-400" },
  _default:        { bg:"bg-slate-100", text:"text-slate-800", ring:"ring-slate-400" }
};
export function catStyle(key?: string){ return CAT_STYLES[key ?? ""] ?? CAT_STYLES._default; }
