import type { PVParams } from "../types";

export function interpTable(x: number, pts: [number, number][]) {
  if (pts.length === 0) return 0;
  const sorted = [...pts].sort((a, b) => a[0] - b[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const [x1, y1] = sorted[i], [x2, y2] = sorted[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return 0;
}

export function computePV(con: number, level: number, pv: PVParams) {
  let raw = 0;

  if (pv.mode === "linear") {
    raw = (pv.slope ?? 0) * con + (pv.offset ?? 0);
  } else if (pv.mode === "table") {
    raw = interpTable(con, pv.points ?? []);
  }

  raw += (pv.perLevel ?? 0) * Math.max(0, level);

  const capped = Math.min(raw, pv.cap ?? raw);
  return Math.round(capped);
}
