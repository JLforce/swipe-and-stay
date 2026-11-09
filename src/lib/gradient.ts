// The Lovable prototype described photo placeholders as Tailwind gradient strings
// ("from-emerald-700 via-teal-600 to-emerald-400"). React Native has no CSS gradients,
// so we translate those strings into color arrays for expo-linear-gradient.
export type GradientColors = readonly [string, string, ...string[]];

const PALETTE: Record<string, string> = {
  "amber-100": "#fef3c7", "amber-200": "#fde68a", "amber-300": "#fcd34d", "amber-500": "#f59e0b",
  "amber-600": "#d97706", "amber-800": "#92400e",
  "cyan-400": "#22d3ee", "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490", "cyan-800": "#155e75",
  "emerald-200": "#a7f3d0", "emerald-300": "#6ee7b7", "emerald-400": "#34d399", "emerald-500": "#10b981",
  "emerald-600": "#059669", "emerald-700": "#047857", "emerald-800": "#065f46",
  "green-600": "#16a34a", "green-700": "#15803d", "green-800": "#166534",
  "lime-200": "#d9f99d", "lime-300": "#bef264", "lime-400": "#a3e635", "lime-500": "#84cc16",
  "orange-200": "#fed7aa", "orange-300": "#fdba74", "orange-400": "#fb923c", "orange-500": "#f97316",
  "orange-700": "#c2410c", "orange-800": "#9a3412",
  "pink-200": "#fbcfe8",
  "rose-200": "#fecdd3", "rose-400": "#fb7185", "rose-500": "#f43f5e", "rose-600": "#e11d48",
  "sky-200": "#bae6fd",
  "stone-300": "#d6d3d1", "stone-600": "#57534e", "stone-700": "#44403c", "stone-800": "#292524",
  "teal-100": "#ccfbf1", "teal-300": "#5eead4", "teal-400": "#2dd4bf", "teal-500": "#14b8a6",
  "teal-600": "#0d9488", "teal-700": "#0f766e", "teal-800": "#115e59",
  "yellow-200": "#fef08a",
};

export function toGradient(spec: string): GradientColors {
  const cols = spec
    .split(/\s+/)
    .map((t) => PALETTE[t.replace(/^(from|via|to)-/, "")])
    .filter((c): c is string => Boolean(c));
  if (cols.length >= 2) return [cols[0]!, cols[1]!, ...cols.slice(2)];
  return ["#0b6b4f", "#34d399"];
}
