export const DEFAULT_TEXT_COLOR = "#17202a";

export const OUTLINE_PRESETS = [
  { id: "tonal", label: "ton sur ton", tonal: true },
  { id: "charcoal", label: "charbon", color: "#1b1b1f" },
  { id: "white", label: "blanc", color: "#ffffff" },
  { id: "gold", label: "or", color: "#c9a227" },
];

export function clampPosition(value) {
  const position = Number(value);
  if (!Number.isFinite(position)) return null;
  return Math.min(1, Math.max(0, position));
}

export function getPositionFromPercent(value) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return null;
  return Math.min(1, Math.max(0, percent / 100));
}

export function getPositionPercent(value, fallback = 0.5) {
  return String(Math.round((clampPosition(value) ?? fallback) * 100));
}

export function normalizeHex(color, fallback = DEFAULT_TEXT_COLOR) {
  const value = String(color || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return fallback;
}

export function getDefaultOutlineColor(textColor) {
  return getOutlineColorOptions(textColor)[0];
}

export function getOutlineColorOptions(textColor) {
  const normalized = normalizeHex(textColor);
  return OUTLINE_PRESETS.map((preset) =>
    preset.tonal ? getTonalOutlineColor(normalized) : preset.color,
  );
}

// "Ton sur ton": keep the text's own hue but shift its lightness to a deep
// shade (or, for already-dark text, a soft pale one) so the outline remains
// visibly distinct while preserving the text colour's character.
export function getTonalOutlineColor(textColor) {
  const rgb = hexToRgb(textColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (hsl.l >= 36) {
    return hslToHex(hsl.h, Math.min(72, Math.max(42, hsl.s)), 24);
  }
  return hslToHex(hsl.h, Math.min(42, Math.max(28, hsl.s)), 58);
}

export function getContrastRatio(firstColor, secondColor) {
  const first = getRelativeLuminance(hexToRgb(firstColor));
  const second = getRelativeLuminance(hexToRgb(secondColor));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function hexToRgb(hex) {
  const value = normalizeHex(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function getRelativeLuminance(rgb) {
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    if (max === g) hue = (b - r) / delta + 2;
    if (max === b) hue = (r - g) / delta + 4;
    hue *= 60;
  }

  return { h: hue, s: saturation * 100, l: lightness * 100 };
}

function hslToHex(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const l = Math.max(0, Math.min(100, lightness)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  );
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}
