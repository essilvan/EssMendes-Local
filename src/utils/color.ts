import React from "react";

export interface ColorPreset {
  name: string;
  hex: string;
  category?: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Teal (Padrão)", hex: "#0d9488" },
  { name: "Esmeralda", hex: "#059669" },
  { name: "Azul Real", hex: "#2563eb" },
  { name: "Índigo", hex: "#4f46e5" },
  { name: "Violeta / Roxo", hex: "#7c3aed" },
  { name: "Rosa / Magenta", hex: "#e11d48" },
  { name: "Dourado / Âmbar", hex: "#d97706" },
  { name: "Terracota / Cobre", hex: "#c2410c" },
  { name: "Preto / Grafite", hex: "#0f172a" },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let cleaned = hex.replace(/^#/, "").trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getContrastTextColor(hex: string): "#ffffff" | "#0f172a" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  // Luminance calculation
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 160 ? "#0f172a" : "#ffffff";
}

export function getThemeColorStyles(primaryColor?: string | null): React.CSSProperties {
  const color =
    primaryColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor.trim())
      ? primaryColor.trim()
      : "#0d9488";
  
  const rgb = hexToRgb(color) || { r: 13, g: 148, b: 136 };
  const contrastText = getContrastTextColor(color);

  return {
    "--primary-color": color,
    "--primary-rgb": `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    "--primary-contrast": contrastText,
    "--primary-alpha-05": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
    "--primary-alpha-10": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    "--primary-alpha-15": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    "--primary-alpha-20": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
    "--primary-alpha-85": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`,
    "--primary-alpha-90": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`,
  } as React.CSSProperties;
}
