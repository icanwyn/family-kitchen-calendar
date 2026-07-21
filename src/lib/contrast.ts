/** Relative luminance of a hex color (0–1). */
export function luminance(hex: string): number {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return 0.5;
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const toLin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/** White or near-black text for readable chips on a brand color. */
export function textOnColor(hex: string): string {
  return luminance(hex) > 0.55 ? "#0f172a" : "#ffffff";
}

/** Slightly darkened brand color for better edge definition. */
export function solidEventBg(hex: string): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "#334155";
  const r = Math.max(0, Math.round(((n >> 16) & 255) * 0.92));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * 0.92));
  const b = Math.max(0, Math.round((n & 255) * 0.92));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
