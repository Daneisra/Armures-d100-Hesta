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
    <div className="grid grid-cols-[180px_1fr] items-start gap-3 py-2">
      <label className="text-sm font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}
