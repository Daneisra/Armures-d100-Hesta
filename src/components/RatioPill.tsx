export default function RatioPill({ ratio, ok }: { ratio: number; ok: boolean }){
    const cls = ok ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900";
    return <span className={`px-2 py-1 rounded-full text-sm ${cls}`}>Ratio {ratio.toFixed(2)}</span>;
}