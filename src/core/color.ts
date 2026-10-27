/** Цветовая математика без библиотек: OKLCH → sRGB, HSL, HEX и контраст по WCAG 2. */

export type Oklch = { l: number; c: number; h: number }; // l 0–1, c 0–0.4, h 0–360
export type Rgb = [number, number, number]; // 0–1, гамма sRGB

const toLinear = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const toGamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

/** OKLCH → линейный sRGB (может выйти за 0–1, если цвет вне охвата экрана). */
function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** Цвет, который экран точно покажет: если не влезает, уменьшаем chroma, сохраняя светлоту и оттенок. */
export function fitGamut(c: Oklch): Oklch {
  if (inGamut(oklchToLinear(c))) return c;
  let lo = 0;
  let hi = c.c;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ ...c, c: mid }))) lo = mid;
    else hi = mid;
  }
  return { ...c, c: lo };
}

export function oklchToRgb(c: Oklch): Rgb {
  const lin = oklchToLinear(fitGamut(c));
  return lin.map((v) => Math.min(1, Math.max(0, toGamma(Math.min(1, Math.max(0, v)))))) as Rgb;
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  // s и l в процентах, как в CSS
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export const rgbToHex = (rgb: Rgb) =>
  "#" + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();

/** Относительная яркость по WCAG 2. */
export const luminance = ([r, g, b]: Rgb) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

/** Контраст двух цветов: от 1 (одинаковые) до 21 (чёрный на белом). */
export function contrast(a: Rgb, b: Rgb) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const r2 = (n: number, d = 3) => +n.toFixed(d);
export const cssOklch = (c: Oklch) => {
  const f = fitGamut(c);
  return `oklch(${r2(f.l * 100, 1)}% ${r2(f.c)} ${Math.round(f.h)})`;
};
export const cssHsl = (rgb: Rgb) => {
  const [h, s, l] = rgbToHsl(rgb);
  return `hsl(${h} ${s}% ${l}%)`;
};
export const cssRgb = (rgb: Rgb) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(" ")})`;

/** HEX → sRGB 0–1. Принимает #rgb и #rrggbb. */
export function hexToRgb(hex: string): Rgb | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
}

/** sRGB → OKLCH (обратная к oklchToRgb). */
export function rgbToOklch([r, g, b]: Rgb): Oklch {
  const [R, G, B] = [r, g, b].map(toLinear);
  const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(a, bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

export const hexToOklch = (hex: string) => {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklch(rgb) : null;
};
export const oklchHex = (c: Oklch) => rgbToHex(oklchToRgb(c));
export const contrastHex = (a: string, b: string) => contrast(hexToRgb(a)!, hexToRgb(b)!);
