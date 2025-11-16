import { cls } from "../ui/styles";

export default function RatioPill({ ratio }: { ratio: number }){
  const tone = ratio >= 2.5 ? cls.badgeGood
             : ratio >= 2.0 ? cls.badgeNeutral
             : ratio >= 1.5 ? cls.badgeWarn
             : cls.badgeBad;
  return <span className={tone}>Ratio {ratio.toFixed(2)}</span>;
}
