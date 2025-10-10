import { useMemo } from "react";
import type { Chassis, Material } from "../types";

export default function CompatBadge({
  chassis,
  material,
}: {
  chassis?: Chassis;
  material?: Material;
}) {
  const { ok, msg } = useMemo(() => {
    if (!chassis || !material) return { ok: false, msg: "—" };
    const ok = material.compat === chassis.category;
    const msg = ok
      ? `Compatible (${chassis.category})`
      : `Incompatible : ${material.compat} ≠ ${chassis.category}`;
    return { ok, msg };
  }, [chassis, material]);

  return (
    <span
      title={msg}
      className={[
        "inline-flex items-center gap-1 text-xs px-2 py-1 rounded",
        ok ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900",
      ].join(" ")}
      aria-label={msg}
    >
      <span role="img" aria-hidden>{ok ? "✅" : "❌"}</span>
      {ok ? "Compatible" : "Incompatible"}
    </span>
  );
}
