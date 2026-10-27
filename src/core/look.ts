/**
 * «Вид» экрана-примера: значения для каждого места разметки (отступ карточки, размер подписи, цвет кнопки…).
 * Разметка «Кошелька» одна; дешёвая и дорогая версии отличаются только этим объектом.
 * Дорогой вид собирается из токенов темы, дешёвый — нарочно из случайных значений.
 */
import { hexToOklch, oklchHex } from "./color";
import { shadowCss, type Roles, type Shadow, type Tokens } from "./theme";

export const SP = ["page", "pageM", "pageL", "group", "sec", "cardP", "cardP2", "rowY", "rowGap", "chipGap", "chipX", "chipY", "btnX", "btnY", "label", "nav"] as const;
export const FS = ["nav", "cap", "chip", "item", "body", "btn", "title", "num", "numMax"] as const;
export const COL = ["bg", "surface", "raised", "text", "muted", "primary", "onPrimary", "chip", "onChip", "income", "expense", "border", "track"] as const;
export const SH = ["card", "hero", "goal", "btn"] as const;
export const RAD = ["card", "hero", "goal", "img", "chip", "btn", "field"] as const;

export type Look = {
  sp: Record<(typeof SP)[number], number>;
  fs: Record<(typeof FS)[number], number>;
  col: Record<(typeof COL)[number], string>;
  sh: Record<(typeof SH)[number], Shadow>;
  rad: Record<(typeof RAD)[number], number>;
  lh: number; // межстрочный основного текста
  align: number; // 0 — по левому краю, 1 — по центру (числом, чтобы плавно морфить)
  icons: number; // 0 — один набор, 1 — три разных
  dimImg: number; // 0–1, насколько приглушить картинки (тёмная тема)
  glow: number; // 0–1, белая подложка картинки «светится» (дешёвая тёмная)
};

export function themeLook(t: Tokens, dark: boolean): Look {
  const [s0, s1, s2, s3, s4] = t.space;
  const R: Roles = dark ? t.dark : t.light;
  const lvl = (i: number): Shadow => (dark ? t.shadow[i].map((l) => ({ ...l, a: Math.min(0.6, l.a * 2.6) })) : t.shadow[i]);
  return {
    sp: { page: s2, pageM: s3, pageL: s4, group: s4, sec: s3, cardP: s2, cardP2: s2, rowY: s1, rowGap: s2, chipGap: s1, chipX: s2, chipY: s1, btnX: s3, btnY: s2, label: s0, nav: s1 },
    fs: { nav: t.text.s, cap: t.text.s, chip: t.text.s, item: t.text.m, body: t.text.m, btn: t.text.m, title: t.text.m, num: t.text.l, numMax: t.text.lMax },
    col: {
      bg: R.bg, surface: R.surface, raised: R.raised, text: R.text, muted: R.muted, primary: R.primary, onPrimary: R["on-primary"],
      chip: R.chip, onChip: R["on-chip"], income: R.income, expense: R.expense, border: R.border, track: dark ? R.overlay : R.border,
    },
    sh: { card: lvl(0), goal: lvl(0), hero: lvl(1), btn: lvl(2) },
    rad: {
      card: t.radius.l, hero: t.radius.l, goal: t.radius.l,
      img: Math.max(0, t.radius.l - s2), // вложенный угол: внешний минус отступ
      chip: t.radius.s, btn: t.radius.m, field: t.radius.m,
    },
    lh: 1.5, align: 0, icons: 0, dimImg: dark ? 0.12 : 0, glow: 0,
  };
}

/** Дешёвая версия: значения подобраны «на глаз», как часто бывает в жизни. Числа для счётчиков известны заранее. */
export function cheapLook(dark: boolean): Look {
  const hard: Shadow = [{ x: 3, y: 3, blur: 0, spread: 0, a: 1 }];
  return {
    // 13 разных отступов
    sp: { page: 13, pageM: 13, pageL: 13, group: 17, sec: 22, cardP: 17, cardP2: 20, rowY: 11, rowGap: 9, chipGap: 7, chipX: 14, chipY: 5, btnX: 19, btnY: 6, label: 3, nav: 10 },
    // 7 размеров шрифта
    fs: { nav: 12, cap: 13, chip: 14, item: 15, body: 16, btn: 14, title: 18, num: 22, numMax: 22 },
    // 9 цветов, 3 пары не проходят контраст
    col: dark
      ? { bg: "#000000", surface: "#000000", raised: "#000000", text: "#FFFFFF", muted: "#AAAAAA", primary: "#64B5F6", onPrimary: "#FFFFFF", chip: "#E8F5E9", onChip: "#81C784", income: "#2E7D32", expense: "#D32F2F", border: "#AAAAAA", track: "#E8F5E9" }
      : { bg: "#F0F0F0", surface: "#FFFFFF", raised: "#FFFFFF", text: "#222222", muted: "#AAAAAA", primary: "#64B5F6", onPrimary: "#FFFFFF", chip: "#E8F5E9", onChip: "#81C784", income: "#2E7D32", expense: "#D32F2F", border: "#AAAAAA", track: "#E8F5E9" },
    // 4 разные тени, одна жёсткая
    sh: {
      card: [{ x: 0, y: 2, blur: 3, spread: 0, a: 0.3 }],
      hero: [{ x: 0, y: 0, blur: 12, spread: 0, a: 0.18 }],
      goal: [{ x: 0, y: 5, blur: 10, spread: 0, a: 0.25 }],
      btn: hard,
    },
    // 5 радиусов; картинка в карточке скруглена как сама карточка
    rad: { card: 10, hero: 20, goal: 20, img: 20, chip: 4, btn: 6, field: 15 },
    lh: 1.2, align: 1, icons: 1, dimImg: 0, glow: dark ? 1 : 0,
  };
}

/* ---------- плавный переход между видами (для морфа в видео и в утилите) ---------- */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function lerpHex(a: string, b: string, k: number) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const x = hexToOklch(a)!, y = hexToOklch(b)!;
  // оттенок по короткой дуге; у серых оттенок берём от цветного
  let ha = x.c < 0.01 ? y.h : x.h, hb = y.c < 0.01 ? x.h : y.h;
  if (hb - ha > 180) ha += 360; else if (ha - hb > 180) hb += 360;
  return oklchHex({ l: lerp(x.l, y.l, k), c: lerp(x.c, y.c, k), h: (lerp(ha, hb, k) + 360) % 360 });
}
function lerpShadow(a: Shadow, b: Shadow, k: number): Shadow {
  const n = Math.max(a.length, b.length);
  const z = { x: 0, y: 0, blur: 0, spread: 0, a: 0 };
  return Array.from({ length: n }, (_, i) => {
    const p = a[i] ?? z, q = b[i] ?? z;
    return { x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), blur: lerp(p.blur, q.blur, k), spread: lerp(p.spread, q.spread, k), a: lerp(p.a, q.a, k) };
  });
}
const mapRec = <T extends Record<string, unknown>>(a: T, f: (k: keyof T) => unknown) =>
  Object.fromEntries(Object.keys(a).map((k) => [k, f(k as keyof T)])) as T;

/** Смешать два вида. part ограничивает морф одним правилом: "sp" | "fs" | "col" | "sh" | "rad" | "all". */
export function mix(a: Look, b: Look, k: number, parts: Set<string> | "all" = "all"): Look {
  const on = (p: string) => (parts === "all" || parts.has(p) ? k : 0);
  return {
    sp: mapRec(a.sp, (x) => lerp(a.sp[x], b.sp[x], on("sp"))),
    fs: mapRec(a.fs, (x) => lerp(a.fs[x], b.fs[x], on("fs"))),
    col: mapRec(a.col, (x) => lerpHex(a.col[x], b.col[x], on("col"))),
    sh: mapRec(a.sh, (x) => lerpShadow(a.sh[x], b.sh[x], on("sh"))),
    rad: mapRec(a.rad, (x) => lerp(a.rad[x], b.rad[x], on("rad"))),
    lh: lerp(a.lh, b.lh, on("fs")),
    align: lerp(a.align, b.align, on("form")),
    icons: on("form") >= 0.5 ? b.icons : a.icons,
    dimImg: lerp(a.dimImg, b.dimImg, on("col")),
    glow: lerp(a.glow, b.glow, on("col")),
  };
}

/** Вид → CSS-переменные на корне «Кошелька». */
export function lookVars(l: Look): Record<string, string> {
  const v: Record<string, string> = {};
  for (const k of SP) v[`--w-sp-${k}`] = `${+l.sp[k].toFixed(2)}px`;
  for (const k of FS) v[`--w-fs-${k}`] = `${+l.fs[k].toFixed(2)}px`;
  for (const k of COL) v[`--w-c-${k}`] = l.col[k];
  const ink = l.col.bg.toLowerCase() === "#000000" ? "0 0 0" : "8 10 20";
  for (const k of SH) v[`--w-sh-${k}`] = shadowCss(l.sh[k], ink);
  for (const k of RAD) v[`--w-r-${k}`] = `${+l.rad[k].toFixed(2)}px`;
  v["--w-lh"] = String(+l.lh.toFixed(3));
  // заголовок плавно растёт с шириной экрана: от num на 393 px до numMax на 1920 px
  v["--w-num-k"] = String(+((l.fs.numMax - l.fs.num) / 1527).toFixed(5));
  v["--w-align"] = l.align > 0.5 ? "center" : "left";
  v["--w-dim"] = String(1 - l.dimImg);
  v["--w-glow"] = String(l.glow);
  return v;
}
