import { useMemo } from "react";
import type { Chassis, Material } from "../types";
import { cls } from "../ui/styles";

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
      className={ok ? cls.badgeGood : cls.badgeBad}
      aria-label={msg}
    >
      <span role="img" aria-hidden>{ok ? "✅" : "❌"}</span>
      {ok ? "Compatible" : "Incompatible"}
    </span>
  );
}
