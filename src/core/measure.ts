/**
 * Счётчики, посчитанные по готовому DOM (getComputedStyle), а не вписанные руками:
 * число в кадре равно числу в коде.
 */
import { contrast, hexToRgb, type Rgb } from "./color";

export type Counts = { spacing: number; sizes: number; fails: number; shadows: number; radii: number; colors: number };

const px = (v: string) => (v.endsWith("px") ? Math.round(parseFloat(v) * 2) / 2 : NaN);

function parseColor(v: string): Rgb | null {
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (p.length === 4 && p[3] === 0) return null; // прозрачный
  return [p[0] / 255, p[1] / 255, p[2] / 255];
}
const key = (c: Rgb) => c.map((x) => Math.round(x * 255)).join(",");

/** Фон, на котором реально лежит элемент: первый непрозрачный предок. */
function backdrop(el: Element): Rgb {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const c = parseColor(getComputedStyle(e).backgroundColor);
    if (c) return c;
  }
  return hexToRgb("#FFFFFF")!;
}

/** Тень считается тенью, если она не внутренняя и не волосяная линия (1px без размытия). */
function realShadows(v: string): string[] {
  if (!v || v === "none") return [];
  const parts = v.split(/,(?![^(]*\))/).map((s) => s.trim());
  const keep = parts.filter((s) => {
    if (/inset/.test(s)) return false;
    const nums = s.replace(/rgba?\([^)]*\)/, "").trim().split(/\s+/).map(parseFloat);
    const [x = 0, y = 0, blur = 0] = nums;
    const a = Number((s.match(/rgba?\([^)]*,\s*([\d.]+)\)/) ?? [])[1] ?? 1);
    if (a === 0) return false;
    return !(blur === 0 && Math.abs(x) <= 1 && Math.abs(y) <= 1);
  });
  return keep.length ? [keep.join(", ")] : [];
}

export function measure(root: Element | null): Counts | null {
  if (!root) return null;
  const app = root.querySelector(".w-app");
  if (!app) return null;
  const spacing = new Set<number>(), sizes = new Set<number>(), shadows = new Set<string>(), radii = new Set<number>(), colors = new Set<string>();
  const fails = new Set<string>();
  const els = [app, ...Array.from(app.querySelectorAll("*"))];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || (el as HTMLElement).offsetParent === null && el !== app) continue;
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    if (el.closest(".w-tag")) continue;
    for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginBottom", "rowGap", "columnGap"] as const) {
      const v = px(cs[p]);
      if (v > 0) spacing.add(v);
    }
    const r = px(cs.borderTopLeftRadius);
    if (r > 0 && r < 500) radii.add(r);
    for (const s of realShadows(cs.boxShadow)) shadows.add(s);
    const bg = parseColor(cs.backgroundColor);
    if (bg) colors.add(key(bg));
    // текст: размер шрифта, цвет и контраст с реальным фоном
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
    if (hasText) {
      sizes.add(px(cs.fontSize));
      const fg = parseColor(cs.color);
      if (fg) {
        colors.add(key(fg));
        const b = backdrop(el);
        const big = px(cs.fontSize) >= 24 || (px(cs.fontSize) >= 18.5 && Number(cs.fontWeight) >= 700);
        if (contrast(fg, b) < (big ? 3 : 4.5)) fails.add(key(fg) + "/" + key(b));
      }
    }
  }
  return { spacing: spacing.size, sizes: sizes.size, fails: fails.size, shadows: shadows.size, radii: radii.size, colors: colors.size };
}
