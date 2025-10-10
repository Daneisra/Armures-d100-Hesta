import { ReactNode } from "react";

export default function InputRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-3 py-2">
      <div className="text-sm opacity-80">{label}</div>
      <div>{children}</div>
    </div>
  );
}
