/** Экспорт темы: CSS-переменные, блок Tailwind v4 (@theme) и JSON-токены (формат DTCG). */
import { cssOklch, hexToOklch } from "./color";
import { ROLE_NAMES, shadowCss, type Roles, type Settings, type Tokens } from "./theme";

const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`;
const ok = (hex: string) => cssOklch(hexToOklch(hex)!);

function roleLines(r: Roles, pre: string, pad: string) {
  return ROLE_NAMES.map((n) => `${pad}${pre}${n}: ${ok(r[n])};`).join("\n");
}

export function exportCss(t: Tokens, s: Settings) {
  const sp = t.space.map((v, i) => `  --space-${i + 1}: ${rem(v)}; /* ${v}px */`).join("\n");
  const sh = (dark: boolean) =>
    t.shadow.map((l, i) => `  --shadow-${i + 1}: ${shadowCss(dark ? l.map((x) => ({ ...x, a: Math.min(0.6, x.a * 2.6) })) : l)};`).join("\n");
  return `/* ui-theme · ${s.seed} · шаг ${s.space} · шрифт ${s.base}px × ${s.ratio} */
:root {
  color-scheme: light dark;

  /* отступы: одна шкала */
${sp}

  /* шрифт: три размера */
  --text-s: ${rem(t.text.s)};
  --text-m: ${rem(t.text.m)};
  --text-l: clamp(${rem(t.text.l)}, ${rem(t.text.l)} + ${+(((t.text.lMax - t.text.l) / 1527) * 100).toFixed(3)}vw, ${rem(t.text.lMax)});
  --leading: 1.5;

  /* форма: шкала радиусов; вложенный = внешний − отступ */
  --radius-s: ${rem(t.radius.s)};
  --radius-m: ${rem(t.radius.m)};
  --radius-l: ${rem(t.radius.l)};

  /* глубина: три уровня */
${sh(false)}

  /* цвет: роли из одного исходного ${s.seed} */
${roleLines(t.light, "--color-", "  ")}
}

/* тёмная тема — те же роли, другие значения: фон тёмно-серый, акцент светлее, выше слой — светлее */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${roleLines(t.dark, "--color-", "    ")}
${sh(true).replace(/^ {2}/gm, "    ")}
  }
}
:root[data-theme="dark"] {
${roleLines(t.dark, "--color-", "  ")}
${sh(true)}
}

body { font-size: var(--text-m); line-height: var(--leading); background: var(--color-bg); color: var(--color-text); }
.prose { max-width: 70ch; }
`;
}

export function exportTailwind(t: Tokens, s: Settings) {
  return `/* Tailwind v4 · вставьте в главный CSS после @import "tailwindcss"; */
@theme {
  --spacing: ${rem(s.space / 2)}; /* p-1 = ${s.space / 2}px, p-2 = ${s.space}px, p-4 = ${s.space * 2}px … */

  --text-sm: ${rem(t.text.s)};
  --text-base: ${rem(t.text.m)};
  --text-2xl: clamp(${rem(t.text.l)}, ${rem(t.text.l)} + ${+(((t.text.lMax - t.text.l) / 1527) * 100).toFixed(3)}vw, ${rem(t.text.lMax)});
  --text-base--line-height: 1.5;

  --radius-sm: ${rem(t.radius.s)};
  --radius-md: ${rem(t.radius.m)};
  --radius-xl: ${rem(t.radius.l)};

  --shadow-sm: ${shadowCss(t.shadow[0])};
  --shadow-md: ${shadowCss(t.shadow[1])};
  --shadow-lg: ${shadowCss(t.shadow[2])};

${roleLines(t.light, "--color-", "  ")}
}

/* тёмная тема: переопределяем те же переменные — классы вроде bg-surface и text-muted перекрасятся сами */
@layer theme {
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${roleLines(t.dark, "--color-", "      ")}
    }
  }
  :root[data-theme="dark"] {
${roleLines(t.dark, "--color-", "    ")}
  }
}
`;
}

export function exportJson(t: Tokens, s: Settings) {
  const col = (r: Roles) => Object.fromEntries(ROLE_NAMES.map((n) => [n, { $type: "color", $value: r[n] }]));
  const dim = (px: number) => ({ $type: "dimension", $value: `${px}px` });
  const data = {
    $description: `ui-theme · ${s.seed}`,
    space: Object.fromEntries(t.space.map((v, i) => [String(i + 1), dim(v)])),
    text: { s: dim(t.text.s), m: dim(t.text.m), l: dim(t.text.l), "l-max": dim(t.text.lMax), leading: { $type: "number", $value: 1.5 } },
    radius: { s: dim(t.radius.s), m: dim(t.radius.m), l: dim(t.radius.l) },
    shadow: Object.fromEntries(t.shadow.map((l, i) => [String(i + 1), {
      $type: "shadow",
      $value: l.map((x) => ({ color: `#000000${Math.round(x.a * 255).toString(16).padStart(2, "0")}`, offsetX: `${x.x}px`, offsetY: `${x.y}px`, blur: `${+x.blur.toFixed(1)}px`, spread: `${x.spread}px` })),
    }])),
    color: { light: col(t.light), dark: col(t.dark) },
  };
  return JSON.stringify(data, null, 2) + "\n";
}
