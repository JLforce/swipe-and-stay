// Brand colors. Keep in sync with the `colors` block in tailwind.config.js
// (Tailwind classes like bg-primary use that file; Icon/LinearGradient need raw hex).
export const colors = {
  background: "#FBF8F0",
  foreground: "#15302A",
  card: "#FEFCF6",
  primary: "#0B6B4F",
  primaryForeground: "#FBF8F0",
  secondary: "#E6F2ED",
  secondaryForeground: "#1F4A3D",
  muted: "#F2EFE6",
  mutedForeground: "#5F6F69",
  accent: "#E0703F",
  destructive: "#D23F2B",
  border: "#E4E3D3",
} as const;
