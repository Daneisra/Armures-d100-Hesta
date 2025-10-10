import { catStyle } from "../ui/palette";
import { iconForCategory } from "../ui/icons";

export default function CategoryBadge({ label, keyName }: { label: string; keyName?: string }){
  const C = iconForCategory(keyName);
  const s = catStyle(keyName);
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${s.bg} ${s.text}`}>
      <C size={14} aria-hidden />
      {label}
    </span>
  );
}
