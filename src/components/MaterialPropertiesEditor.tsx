import type { Material } from "../types";
import { cls } from "../ui/styles";

export default function MaterialPropertiesEditor({ value, onChange }: { value: Material; onChange: (value: Material) => void }) {
  return <div className="space-y-3">
    <fieldset className="grid gap-3 sm:grid-cols-3">
      <legend className="mb-2 text-sm font-semibold">Résistances</legend>
      {([['feu', 'Feu'], ['froid', 'Froid'], ['foudre', 'Foudre'], ['tr', 'Tranchant'], ['per', 'Perforant'], ['con', 'Contondant'], ['magie', 'Magie']] as const).map(([key, label]) => <label key={key} className="text-sm">
        {label}<input className={cls.input} type="number" step="any" value={value.res?.[key] ?? 0} onChange={event => onChange({ ...value, res: { ...value.res, [key]: event.target.valueAsNumber } })} />
      </label>)}
    </fieldset>
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-semibold">Multiplicateurs de réparation</legend>
      {([['costMul', 'Coût ×'], ['timeMul', 'Temps ×']] as const).map(([key, label]) => <label key={key} className="text-sm">
        {label}<input className={cls.input} type="number" min="0" step="any" value={value.repair?.[key] ?? 1} onChange={event => onChange({ ...value, repair: { ...value.repair, [key]: event.target.valueAsNumber } })} />
      </label>)}
    </fieldset>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.halfMalus ?? false} onChange={event => onChange({ ...value, halfMalus: event.target.checked })} />Diviser le malus final par deux</label>
  </div>;
}
