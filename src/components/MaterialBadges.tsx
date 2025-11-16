import type { Material } from "../types";
import { cls } from "../ui/styles";

function Chip({children, tone = cls.badgeNeutral}:{children:React.ReactNode; tone?:string}){
  return <span className={tone} tabIndex={0}>{children}</span>;
}

export default function MaterialBadges({ mat }: { mat: Material }) {
  const res = mat.res || {};
  const chips: JSX.Element[] = [];

  if (mat.effects && mat.effects !== "—") chips.push(<Chip key="eff">{mat.effects}</Chip>);
  if (mat.halfMalus) chips.push(<Chip key="half" tone={cls.badgeGood}>Malus ×0,5</Chip>);
  if (mat.penIgnore && mat.penIgnore > 0) chips.push(<Chip key="pen" tone={cls.badgeWarn}>Ignore {mat.penIgnore} pénétration</Chip>);

  if (res.feu)    chips.push(<Chip key="feu"    tone={cls.badgeBad}>Feu +{res.feu}</Chip>);
  if (res.froid)  chips.push(<Chip key="froid"  tone={cls.badgeInfo}>Froid +{res.froid}</Chip>);
  if (res.foudre) chips.push(<Chip key="foudre" tone={cls.badgeWarn}>Foudre +{res.foudre}</Chip>);
  if (res.magie)  chips.push(<Chip key="magie"  tone={cls.badgeMystic}>Magie +{res.magie}</Chip>);
  if (res.tr)     chips.push(<Chip key="tr">Tranchant +{res.tr}</Chip>);
  if (res.per)    chips.push(<Chip key="per">Perforant +{res.per}</Chip>);
  if (res.con)    chips.push(<Chip key="con">Contondant +{res.con}</Chip>);

  if (chips.length === 0) chips.push(<Chip key="none" tone={cls.badgeMuted}>—</Chip>);
  return <div className="flex flex-wrap gap-1">{chips}</div>;
}
