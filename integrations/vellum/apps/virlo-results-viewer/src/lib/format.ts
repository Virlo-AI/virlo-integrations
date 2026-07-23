/** Compact number formatting: 1_500 -> "1.5K", 2_000_000 -> "2M". */
export function fmt(n?: number): string {
  if (!n || n < 0) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".0", "") + "K";
  return String(n);
}
