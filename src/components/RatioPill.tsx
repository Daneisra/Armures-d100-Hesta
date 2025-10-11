export default function RatioPill({ratio}:{ratio:number}){
  const cls = ratio >= 2.5 ? "bg-green-100 text-green-900"
           : ratio >= 2.0 ? "bg-emerald-100 text-emerald-900"
           : ratio >= 1.5 ? "bg-amber-100 text-amber-900"
           : "bg-rose-100 text-rose-900";
  return <span className={`badge ${cls}`}>Ratio {ratio.toFixed(2)}</span>;
}
