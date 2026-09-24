import type { CSSProperties } from "react";

export type ThemeColors = { accent: string; bgColor: string; surfaceColor: string; textColor: string };
export type ThemePreset = ThemeColors & { id: string; name: string };

export const THEME_PRESETS: ThemePreset[] = [
  { id: "nuit", name: "Nuit", bgColor: "#09090b", surfaceColor: "#111114", textColor: "#f4f4f5", accent: "#7c5cff" },
  { id: "ocean", name: "Océan", bgColor: "#0a1120", surfaceColor: "#111b2f", textColor: "#e2e8f0", accent: "#22d3ee" },
  { id: "foret", name: "Forêt", bgColor: "#0b1410", surfaceColor: "#13211a", textColor: "#e6f4ea", accent: "#34d399" },
  { id: "braise", name: "Braise", bgColor: "#140d0a", surfaceColor: "#211612", textColor: "#fdf0e8", accent: "#f97316" },
  { id: "aurore", name: "Aurore", bgColor: "#130a1a", surfaceColor: "#1e1128", textColor: "#f5eafb", accent: "#e879f9" },
  { id: "papier", name: "Papier", bgColor: "#fafaf9", surfaceColor: "#ffffff", textColor: "#1c1917", accent: "#6d28d9" },
  { id: "sable", name: "Sable", bgColor: "#f5efe6", surfaceColor: "#fffaf3", textColor: "#2b2118", accent: "#c2410c" },
  { id: "menthe", name: "Menthe", bgColor: "#effbf7", surfaceColor: "#ffffff", textColor: "#0f2e27", accent: "#0d9488" },
  { id: "rose", name: "Rose", bgColor: "#fff3f6", surfaceColor: "#ffffff", textColor: "#3b0a1e", accent: "#e11d48" },
  { id: "ciel", name: "Ciel", bgColor: "#f1f6ff", surfaceColor: "#ffffff", textColor: "#0f1d3a", accent: "#2563eb" },
];

export const DEFAULT_THEME = THEME_PRESETS[0]!;

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

/** Luminance relative (WCAG) d'une couleur hexadécimale. */
export function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Texte lisible (blanc ou quasi-noir) sur une couleur donnée — ex. boutons d'accent. */
export function readableOn(hex: string) {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#111111") ? "#ffffff" : "#111111";
}

/** Variables CSS appliquées par la classe `.portfolio-theme` (voir globals.css). */
export function themeStyle(colors: ThemeColors): CSSProperties {
  const c = {
    accent: isHex(colors.accent) ? colors.accent : DEFAULT_THEME.accent,
    bg: isHex(colors.bgColor) ? colors.bgColor : DEFAULT_THEME.bgColor,
    surface: isHex(colors.surfaceColor) ? colors.surfaceColor : DEFAULT_THEME.surfaceColor,
    text: isHex(colors.textColor) ? colors.textColor : DEFAULT_THEME.textColor,
  };
  return {
    "--p-bg": c.bg,
    "--p-surface": c.surface,
    "--p-text": c.text,
    "--accent": c.accent,
    "--accent-fg": readableOn(c.accent),
    colorScheme: luminance(c.bg) > 0.4 ? "light" : "dark",
  } as CSSProperties;
}
