import type { Material } from "../types";

function Chip({children, className=""}:{children:React.ReactNode; className?:string}){
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded focus-visible:outline-none focus-visible:ring-2 ${className}`} tabIndex={0}>{children}</span>;
}

export default function MaterialBadges({ mat }: { mat: Material }) {
  const res = mat.res || {};
  const chips: JSX.Element[] = [];

  if (mat.effects && mat.effects !== "—") chips.push(<Chip key="eff" className="bg-slate-200 text-slate-900">{mat.effects}</Chip>);
  if (mat.halfMalus) chips.push(<Chip key="half" className="bg-emerald-200 text-emerald-900">Malus ×0,5</Chip>);
  if (mat.penIgnore && mat.penIgnore > 0) chips.push(<Chip key="pen" className="bg-amber-200 text-amber-900">Ignore {mat.penIgnore} pénétration</Chip>);

  if (res.feu)    chips.push(<Chip key="feu"    className="bg-red-200 text-red-900">Feu +{res.feu}</Chip>);
  if (res.froid)  chips.push(<Chip key="froid"  className="bg-blue-200 text-blue-900">Froid +{res.froid}</Chip>);
  if (res.foudre) chips.push(<Chip key="foudre" className="bg-yellow-200 text-yellow-900">Foudre +{res.foudre}</Chip>);
  if (res.magie)  chips.push(<Chip key="magie"  className="bg-purple-200 text-purple-900">Magie +{res.magie}</Chip>);
  if (res.tr)     chips.push(<Chip key="tr"     className="bg-slate-200 text-slate-900">Tranchant +{res.tr}</Chip>);
  if (res.per)    chips.push(<Chip key="per"    className="bg-slate-200 text-slate-900">Perforant +{res.per}</Chip>);
  if (res.con)    chips.push(<Chip key="con"    className="bg-slate-200 text-slate-900">Contondant +{res.con}</Chip>);

  if (chips.length === 0) chips.push(<Chip key="none" className="bg-slate-100 text-slate-500">—</Chip>);
  return <div className="flex flex-wrap gap-1">{chips}</div>;
}
