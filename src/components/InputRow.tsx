import { ReactNode } from "react";

export default function InputRow({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 items-start gap-2 py-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-3">
      <label className="text-sm font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
