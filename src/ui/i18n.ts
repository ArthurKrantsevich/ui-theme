/** Тексты утилиты на двух языках. Числа и источники совпадают с docs/plans/ui-theme-facts.md. */
export type Lang = "ru" | "en";

type Src = { label: string; href: string };
const NNG_PROX = { label: "NN/g · Proximity", href: "https://www.nngroup.com/articles/gestalt-proximity/" };
const ANDROID_GRID = { label: "Android · 8dp grid", href: "https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units" };
const NNG_HIER = { label: "NN/g · Visual hierarchy", href: "https://www.nngroup.com/articles/visual-hierarchy-ux-definition/" };
const WCAG_SPACING = { label: "WCAG 1.4.12", href: "https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html" };
const WCAG_CONTRAST = { label: "WCAG 1.4.3", href: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" };
const CSS_COLOR = { label: "CSS Color 4", href: "https://www.w3.org/TR/css-color-4/" };
const RAMA = { label: "Ramachandran, Nature 1988", href: "https://doi.org/10.1038/331163a0" };
const CSS_BG = { label: "CSS Backgrounds 3", href: "https://www.w3.org/TR/css-backgrounds-3/#corner-shaping" };
const M_DARK = { label: "Material · Dark theme", href: "https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md" };
const APPLE_DARK = { label: "Apple HIG · Dark Mode", href: "https://developer.apple.com/design/human-interface-guidelines/dark-mode" };

export const STR: Record<Lang, {
  title: string; sub: string; video: string; repo: string;
  modes: { cheap: string; split: string; theme: string }; light: string; dark: string;
  focus: { all: string; phone: string; tablet: string; laptop: string; desktop: string };
  counters: { spacing: string; sizes: string; fails: string; shadows: string; radii: string };
  measuredOn: string;
  steps: { title: string; why: string; src: Src[] }[];
  space: { label: string; normal: string; dense: string };
  type: { base: string; ratio: string; app: string; landing: string; tight: string; sample: string };
  color: { seed: string; presets: string; tint: string; fix: string; fixed: string; asIs: string; pass: string; fail: string; nearest: string; pairs: string };
  depth: { soft: string; round: string; nested: string; levels: string[] };
  darkStep: { on: string; note: string };
  exp: { copy: string; copied: string; download: string };
  slug: { proof: string; register: string; misregister: string };
  roles: Record<string, string>;
  made: string;
  marks: string;
}> = {
  ru: {
    title: "Оттиск темы",
    sub: "Пять правил — одна тема для телефона, планшета, ноутбука и ПК.",
    video: "Видео: почему интерфейс выглядит дёшево", repo: "Код на GitHub",
    modes: { cheap: "Дёшево", split: "Разрез", theme: "Тема" }, light: "Светлая", dark: "Тёмная",
    focus: { all: "Все", phone: "Телефон", tablet: "Планшет", laptop: "Ноутбук", desktop: "ПК" },
    counters: { spacing: "отступов", sizes: "размеров", fails: "провалов контраста", shadows: "теней", radii: "радиусов" },
    measuredOn: "посчитано по экрану",
    steps: [
      { title: "Отступы", why: "Мозг группирует элементы по расстоянию — это закон близости. Одна шкала делает связи на экране однозначными: внутри группы меньше, между группами больше.", src: [NNG_PROX, ANDROID_GRID] },
      { title: "Шрифт", why: "Иерархия держится на контрасте: три заметных размера вместо семи похожих. Межстрочный — полтора, строка — до 75 знаков.", src: [NNG_HIER, WCAG_SPACING] },
      { title: "Цвет", why: "Контраст считается формулой: обычному тексту нужно не меньше 4,5:1. Все роли — из одного цвета, поэтому сменить бренд — поменять одно число.", src: [WCAG_CONTRAST, CSS_COLOR] },
      { title: "Глубина и форма", why: "Мозг ждёт свет сверху: тень снизу читается как «приподнято». Три уровня вместо случайных теней. Вложенный угол = внешний − отступ.", src: [RAMA, CSS_BG] },
      { title: "Тёмная тема", why: "Не инверсия: фон тёмно-серый, акцент светлее, а чем выше слой — тем он светлее. Тени в темноте почти не видны.", src: [M_DARK, APPLE_DARK] },
      { title: "Экспорт", why: "Заберите тему кодом: переменные CSS, блок для Tailwind v4 или JSON-токены для дизайнеров.", src: [] },
    ],
    space: { label: "Базовый шаг", normal: "обычный интерфейс", dense: "плотный: таблицы, админки" },
    type: { base: "Основной текст", ratio: "Шаг шкалы", app: "приложение", landing: "лендинг", tight: "плотно", sample: "Траты за месяц" },
    color: { seed: "Цвет бренда", presets: "Примеры", tint: "Оттенок нейтральных", fix: "Исправить", fixed: "Исправлено", asIs: "Как есть", pass: "белый текст проходит", fail: "белый текст не проходит", nearest: "Ближайший, который проходит", pairs: "Пары текст / фон" },
    depth: { soft: "Мягкость теней", round: "Круглость углов", nested: "Вложенный угол", levels: ["карточка", "главное", "всплывающее"] },
    darkStep: { on: "Показать тёмную тему", note: "Тема строится из тех же ролей — новых переменных не нужно." },
    exp: { copy: "Скопировать", copied: "Скопировано", download: "Скачать" },
    slug: { proof: "пробный оттиск", register: "приводка совпадает", misregister: "приводка не совпадает" },
    roles: { bg: "фон", surface: "поверхность", raised: "поднятое", overlay: "всплывающее", text: "текст", muted: "подписи", border: "линии", primary: "основной", "on-primary": "на основном", chip: "чип", "on-chip": "на чипе", income: "доход", expense: "расход" },
    made: "сделано ИИ · @neurop1lot",
    marks: "Числа на экране",
  },
  en: {
    title: "Theme proof",
    sub: "Five rules — one theme for phone, tablet, laptop and desktop.",
    video: "Video: why your UI looks cheap", repo: "Code on GitHub",
    modes: { cheap: "Cheap", split: "Split", theme: "Theme" }, light: "Light", dark: "Dark",
    focus: { all: "All", phone: "Phone", tablet: "Tablet", laptop: "Laptop", desktop: "Desktop" },
    counters: { spacing: "spacings", sizes: "sizes", fails: "contrast fails", shadows: "shadows", radii: "radii" },
    measuredOn: "measured on screen",
    steps: [
      { title: "Spacing", why: "The brain groups elements by distance — the law of proximity. One scale makes relations unambiguous: less inside a group, more between groups.", src: [NNG_PROX, ANDROID_GRID] },
      { title: "Type", why: "Hierarchy is contrast: three clearly different sizes instead of seven similar ones. Line height 1.5, lines up to 75 characters.", src: [NNG_HIER, WCAG_SPACING] },
      { title: "Color", why: "Contrast is a formula: body text needs at least 4.5:1. Every role comes from one color, so changing the brand is changing one number.", src: [WCAG_CONTRAST, CSS_COLOR] },
      { title: "Depth & shape", why: "The brain expects light from above: a shadow below reads as raised. Three levels instead of random shadows. Nested corner = outer − padding.", src: [RAMA, CSS_BG] },
      { title: "Dark theme", why: "Not an inversion: the background is dark grey, the accent gets lighter, and higher layers get lighter. Shadows barely show in the dark.", src: [M_DARK, APPLE_DARK] },
      { title: "Export", why: "Take the theme as code: CSS variables, a Tailwind v4 block or JSON tokens for designers.", src: [] },
    ],
    space: { label: "Base step", normal: "regular interface", dense: "dense: tables, admin" },
    type: { base: "Body text", ratio: "Scale step", app: "app", landing: "landing", tight: "tight", sample: "This month" },
    color: { seed: "Brand color", presets: "Examples", tint: "Neutral tint", fix: "Fix", fixed: "Fixed", asIs: "As is", pass: "white text passes", fail: "white text fails", nearest: "Nearest passing", pairs: "Text / background pairs" },
    depth: { soft: "Shadow softness", round: "Corner roundness", nested: "Nested corner", levels: ["card", "key", "floating"] },
    darkStep: { on: "Show dark theme", note: "Built from the same roles — no new variables." },
    exp: { copy: "Copy", copied: "Copied", download: "Download" },
    slug: { proof: "proof", register: "in register", misregister: "out of register" },
    roles: { bg: "background", surface: "surface", raised: "raised", overlay: "overlay", text: "text", muted: "muted", border: "lines", primary: "primary", "on-primary": "on primary", chip: "chip", "on-chip": "on chip", income: "income", expense: "expense" },
    made: "made by AI · @neurop1lot",
    marks: "Show numbers",
  },
};
