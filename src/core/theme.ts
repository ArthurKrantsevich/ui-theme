/** Движок темы: пять правил → токены для светлой и тёмной темы. Без библиотек. */
import { contrast, hexToOklch, oklchHex, oklchToRgb, type Oklch } from "./color";

export type Settings = {
  space: 4 | 8; // базовый шаг сетки
  base: number; // основной размер текста, px
  ratio: number; // шаг шкалы шрифта: 1.25 — приложения, 1.333 — лендинги
  seed: string; // исходный цвет бренда, hex
  fix: boolean; // подвинуть основной цвет до ближайшего, который проходит 4,5:1
  tint: number; // насколько нейтральные окрашены оттенком бренда, 0–1
  soft: number; // мягкость теней, 0.6–1.6
  round: number; // круглость углов, 0–1.5
};

export const DEFAULTS: Settings = { space: 8, base: 16, ratio: 1.25, seed: "#2F6BDE", fix: true, tint: 0.5, soft: 1, round: 1 };

export type Layer = { x: number; y: number; blur: number; spread: number; a: number };
export type Shadow = Layer[];
export type Roles = Record<RoleName, string>;

export const ROLE_NAMES = [
  "bg", "surface", "raised", "overlay", "text", "muted", "border",
  "primary", "on-primary", "chip", "on-chip", "income", "expense",
] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export type Tokens = {
  space: number[]; // 5 ступеней
  text: { s: number; m: number; l: number; lMax: number };
  radius: { s: number; m: number; l: number };
  shadow: Shadow[]; // уровни 1–3
  light: Roles;
  dark: Roles;
  seed: { hex: string; ok: Oklch; contrast: number; on: "white" | "ink" };
  primary: { hex: string; contrast: number; moved: boolean };
};

const WHITE = "#FFFFFF";
const r1 = (n: number) => Math.round(n);

/** Пары «текст на фоне», которые обязаны проходить контраст. Порог 4,5 — обычный текст (WCAG 1.4.3). */
export const PAIRS: { fg: RoleName; bg: RoleName; min: number }[] = [
  { fg: "text", bg: "bg", min: 4.5 },
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "muted", bg: "surface", min: 4.5 },
  { fg: "muted", bg: "bg", min: 4.5 },
  { fg: "on-primary", bg: "primary", min: 4.5 },
  { fg: "on-chip", bg: "chip", min: 4.5 },
  { fg: "income", bg: "surface", min: 4.5 },
  { fg: "expense", bg: "surface", min: 4.5 },
];

/** Светлоту двигаем шагами, пока пара не пройдёт. Возвращает ближайший проходящий цвет. */
function shiftUntil(c: Oklch, against: string, min: number, dir: -1 | 1): Oklch {
  let x = { ...c };
  for (let i = 0; i < 120; i++) {
    if (contrast(oklchToRgb(x), hexRgb(against)) >= min) return x;
    x = { ...x, l: Math.min(0.99, Math.max(0.05, x.l + dir * 0.005)) };
  }
  return x;
}
const hexRgb = (h: string) => oklchToRgb(hexToOklch(h)!);

export function build(s: Settings): Tokens {
  const ok = hexToOklch(s.seed) ?? hexToOklch(DEFAULTS.seed)!;
  const H = ok.h;
  const tintC = 0.004 + 0.02 * s.tint; // окраска нейтральных
  const n = (l: number, c = tintC) => oklchHex({ l, c, h: H });

  // --- основной цвет: как есть или ближайший проходящий ---
  const seedHex = oklchHex(ok);
  const inkHex = n(0.2, 0.03);
  // на кнопке бренда обычно белый текст: проверяем его; «исправить» — ближайший более тёмный оттенок того же цвета
  const seedContrast = contrast(hexRgb(seedHex), hexRgb(WHITE));
  const seedOn: "white" | "ink" = "white";
  let prim = ok;
  const primOn: "white" | "ink" = "white";
  if (s.fix && seedContrast < 4.5) prim = shiftUntil(ok, WHITE, 4.5, -1);
  const primaryHex = oklchHex(prim);
  const onPrimary = primOn === "white" ? WHITE : inkHex;
  void seedOn;

  const light: Roles = {
    bg: n(0.972),
    surface: WHITE,
    raised: WHITE,
    overlay: WHITE,
    text: n(0.22, 0.02),
    muted: n(0.47, 0.025),
    border: n(0.9),
    primary: primaryHex,
    "on-primary": onPrimary,
    chip: oklchHex({ l: 0.94, c: Math.min(0.045, ok.c * 0.35), h: H }),
    "on-chip": oklchHex({ l: 0.32, c: Math.min(0.09, ok.c * 0.6), h: H }),
    income: oklchHex(shiftUntil({ l: 0.52, c: 0.13, h: 150 }, WHITE, 4.5, -1)),
    expense: oklchHex(shiftUntil({ l: 0.55, c: 0.17, h: 27 }, WHITE, 4.5, -1)),
  };

  // тёмная тема: не чёрный, а тёмно-серый; выше слой — светлее; акцент светлее и спокойнее
  const dSurface = n(0.215);
  const dPrim = shiftUntil({ l: 0.8, c: Math.min(ok.c, 0.13), h: H }, n(0.2), 4.5, 1);
  const dark: Roles = {
    bg: n(0.178, 0.008),
    surface: dSurface,
    raised: n(0.255),
    overlay: n(0.295),
    text: n(0.95, 0.008),
    muted: n(0.76, 0.015),
    border: n(0.33),
    primary: oklchHex(dPrim),
    "on-primary": n(0.2, 0.03),
    chip: oklchHex({ l: 0.33, c: Math.min(0.06, ok.c * 0.45), h: H }),
    "on-chip": oklchHex({ l: 0.9, c: Math.min(0.05, ok.c * 0.4), h: H }),
    income: oklchHex(shiftUntil({ l: 0.78, c: 0.12, h: 150 }, dSurface, 4.5, 1)),
    expense: oklchHex(shiftUntil({ l: 0.74, c: 0.13, h: 27 }, dSurface, 4.5, 1)),
  };

  const b = s.space;
  const space = [b / 2, b, b * 2, b * 3, b * 4];
  const m = s.base;
  const text = { s: r1(m / s.ratio), m, l: r1(m * s.ratio ** 2), lMax: r1(m * s.ratio ** 4) };
  const k = s.round;
  // l − отступ карточки (16) = m: вложенный угол картинки попадает в ту же шкалу
  const radius = { s: r1(8 * k), m: r1(16 * k), l: r1(32 * k) };
  const f = s.soft;
  const shadow: Shadow[] = [
    [{ x: 0, y: 1, blur: 2 * f, spread: 0, a: 0.1 }, { x: 0, y: 2, blur: 6 * f, spread: 0, a: 0.07 }],
    [{ x: 0, y: 2, blur: 4 * f, spread: 0, a: 0.08 }, { x: 0, y: 8, blur: 20 * f, spread: -2, a: 0.11 }],
    [{ x: 0, y: 4, blur: 8 * f, spread: 0, a: 0.1 }, { x: 0, y: 18, blur: 40 * f, spread: -6, a: 0.18 }],
  ];
  return {
    space, text, radius, shadow, light, dark,
    seed: { hex: seedHex, ok, contrast: seedContrast, on: seedOn },
    primary: { hex: primaryHex, contrast: contrast(hexRgb(primaryHex), hexRgb(onPrimary)), moved: primaryHex !== seedHex },
  };
}

export const shadowCss = (sh: Shadow, ink = "0 0 0") =>
  sh.length ? sh.map((l) => `${l.x}px ${l.y}px ${+l.blur.toFixed(1)}px ${l.spread}px rgb(${ink} / ${+l.a.toFixed(3)})`).join(", ") : "none";

export const pairContrast = (roles: Roles, fg: RoleName, bg: RoleName) => contrast(hexRgb(roles[fg]), hexRgb(roles[bg]));
