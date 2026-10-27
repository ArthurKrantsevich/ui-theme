/**
 * «Кошелёк» — экран-пример. Одна разметка на все устройства: раскладку меняют container queries
 * (телефон — одна колонка, планшет — две, ноутбук — боковое меню, ПК — ещё панель справа).
 * Все отступы, размеры, цвета, тени и углы приходят из CSS-переменных вида (look.ts).
 */
import type { CSSProperties, ReactNode } from "react";
import { lookVars, type Look } from "./look";
import { contrast, hexToRgb } from "./color";
import { shadowCss } from "./theme";
import "./wallet.css";

export type Lang = "ru" | "en";
/** Разметка поверх экрана: числа отступов, размеров, контраста, теней или радиусов. */
export type Marks = "sp" | "fs" | "col" | "sh" | "rad";

const T = {
  ru: {
    app: "Кошелёк", month: "Октябрь", spent: "Потрачено за месяц", of: "из 60 000 ₽", balance: "48 250 ₽",
    add: "Добавить трату", search: "Поиск по тратам", list: "Траты за месяц",
    chips: ["Все", "Еда", "Транспорт", "Дом", "Досуг"],
    nav: ["Главная", "Траты", "Цели", "Профиль"],
    goal: "Цель: отпуск", goalSum: "96 000 из 150 000 ₽", goalLeft: "Осталось 54 000 ₽ · до июня",
    cats: "По категориям",
    items: [
      { icon: "cart", title: "Продукты, «Лавка»", cat: "Еда · сегодня", sum: "−2 340 ₽", inc: false },
      { icon: "salary", title: "Зарплата", cat: "Доход · 25 окт", sum: "+85 000 ₽", inc: true },
      { icon: "bus", title: "Метро", cat: "Транспорт · 24 окт", sum: "−62 ₽", inc: false },
      { icon: "coffee", title: "Кофе с собой", cat: "Еда · 24 окт", sum: "−290 ₽", inc: false },
      { icon: "home", title: "Аренда", cat: "Дом · 20 окт", sum: "−32 000 ₽", inc: false },
      { icon: "film", title: "Кино", cat: "Досуг · 18 окт", sum: "−800 ₽", inc: false },
    ],
    catRows: [["Дом", 66], ["Еда", 18], ["Транспорт", 9], ["Досуг", 7]] as [string, number][],
  },
  en: {
    app: "Wallet", month: "October", spent: "Spent this month", of: "of $1,500", balance: "$1,206.25",
    add: "Add expense", search: "Search expenses", list: "This month",
    chips: ["All", "Food", "Transport", "Home", "Leisure"],
    nav: ["Home", "Expenses", "Goals", "Profile"],
    goal: "Goal: vacation", goalSum: "$2,400 of $3,750", goalLeft: "$1,350 to go · by June",
    cats: "By category",
    items: [
      { icon: "cart", title: "Groceries", cat: "Food · today", sum: "−$58.50", inc: false },
      { icon: "salary", title: "Salary", cat: "Income · Oct 25", sum: "+$2,125", inc: true },
      { icon: "bus", title: "Subway", cat: "Transport · Oct 24", sum: "−$2.90", inc: false },
      { icon: "coffee", title: "Coffee to go", cat: "Food · Oct 24", sum: "−$4.80", inc: false },
      { icon: "home", title: "Rent", cat: "Home · Oct 20", sum: "−$800", inc: false },
      { icon: "film", title: "Cinema", cat: "Leisure · Oct 18", sum: "−$20", inc: false },
    ],
    catRows: [["Home", 66], ["Food", 18], ["Transport", 9], ["Leisure", 7]] as [string, number][],
  },
};

const P: Record<string, ReactNode> = {
  home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  list: <><path d="M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1z" /><path d="M9 9h6M9 13h4" /></>,
  goal: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  cart: <><path d="M4 5h2l2 10h10l2-7H7" /><circle cx="9.5" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></>,
  salary: <><rect x="3.5" y="6.5" width="17" height="11" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  bus: <><rect x="5" y="4" width="14" height="13" rx="3" /><path d="M5 11h14M8 20v-3M16 20v-3" /></>,
  coffee: <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M9 3.5v2.5M12.5 3.5v2.5" /></>,
  film: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M16 5v14M4 9.5h4M4 14.5h4M16 9.5h4M16 14.5h4" /></>,
};

/** Иконка. В дешёвой версии иконки «из трёх наборов»: тонкая, жирная и залитая. */
function Icon({ name, mixed = 0, i = 0 }: { name: string; mixed?: number; i?: number }) {
  const kind = mixed ? i % 3 : 0;
  const sw = kind === 1 ? 1 : kind === 2 ? 2.6 : 2;
  return (
    <svg className="w-ico" viewBox="0 0 24 24" aria-hidden="true" data-stroke={sw}
      fill={kind === 2 ? "currentColor" : "none"} fillOpacity={kind === 2 ? 0.35 : 1}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </svg>
  );
}

/** Картинка цели: море и солнце, нарисованы в SVG. В дешёвой версии — на белой подложке, как клипарт. */
function GoalArt({ cheap }: { cheap: number }) {
  return (
    <svg className="w-art" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD9A8" /><stop offset="1" stopColor="#FFB38A" />
        </linearGradient>
        <linearGradient id="w-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3C8DBC" /><stop offset="1" stopColor="#1F5E8C" />
        </linearGradient>
      </defs>
      <rect width="320" height="160" fill={cheap ? "#FFFFFF" : "url(#w-sky)"} />
      <circle cx="226" cy="74" r="30" fill="#FFF3D6" />
      <path d="M0 96h320v64H0z" fill="url(#w-sea)" />
      <path d="M0 104c26-6 52-6 78 0s52 6 78 0 52-6 78 0 52 6 86 0" stroke="#9FD2EE" strokeWidth="3" fill="none" opacity=".7" />
      <path d="M30 130c22-5 44-5 66 0s44 5 66 0" stroke="#9FD2EE" strokeWidth="2.5" fill="none" opacity=".5" />
      <path d="M0 160c40-26 92-34 150-30 50 4 100 14 170 30z" fill="#F2D3A2" />
    </svg>
  );
}

export function Wallet({ look, lang = "ru", style, marks, tone = "good", hover = -1 }: { look: Look; lang?: Lang; style?: CSSProperties; marks?: Marks; tone?: "good" | "bad"; hover?: number }) {
  const t = T[lang];
  const n = (x: number) => String(Math.round(x));
  const cr = (fg: string, bg: string) => {
    const r = contrast(hexToRgb(fg)!, hexToRgb(bg)!);
    return { txt: (lang === "ru" ? r.toFixed(1).replace(".", ",") : r.toFixed(1)) + ":1", ok: r >= 4.5 };
  };
  // тени: номер уровня по порядку уникальных значений
  const shList = Array.from(new Set(Object.values(look.sh).map((x) => shadowCss(x))));
  const shN = (k: keyof Look["sh"]) => String(shList.indexOf(shadowCss(look.sh[k])) + 1);
  const Tag = ({ m, v, ok, pos }: { m: Marks; v: string; ok?: boolean; pos?: string }) =>
    marks === m ? <b className={`w-tag ${ok === false ? "bad" : ok ? "good" : tone} ${pos ?? ""}`}>{v}</b> : null;
  const mixed = look.icons;
  const cheap = look.glow > 0 || look.icons > 0 ? 1 : 0;
  return (
    <div className="w" style={{ ...(lookVars(look) as CSSProperties), ...style }} lang={lang}>
     <div className="w-app">
      <i className="w-safe-top" aria-hidden="true" />
      <aside className="w-side">
        <div className="w-logo"><span className="w-logo-mark" />{t.app}</div>
        <nav className="w-sidenav" aria-label={t.app}>
          {(["home", "list", "goal", "user"] as const).map((n, i) => (
            <a key={n} className={i === 1 ? "on" : ""}><Icon name={n} mixed={mixed} i={i} />{t.nav[i]}</a>
          ))}
        </nav>
        <button className="w-btn w-add-side"><Icon name="plus" />{t.add}<Tag m="sp" v={n(look.sp.btnY) + " · " + n(look.sp.btnX)} pos="r" /><Tag m="fs" v={n(look.fs.btn)} pos="r" /><Tag m="col" {...((c) => ({ v: c.txt, ok: c.ok }))(cr(look.col.onPrimary, look.col.primary))} pos="r" /><Tag m="sh" v={shN("btn")} pos="r" /><Tag m="rad" v={n(look.rad.btn)} pos="r" /></button>
      </aside>

      <main className="w-main">
        <header className="w-head">
          <div>
            <h1 className="w-month">{t.month}<Tag m="fs" v={n(look.fs.num)} pos="r" /></h1>
          </div>
          <label className="w-field w-search-head"><Icon name="search" /><span>{t.search}</span></label>
          <span className="w-avatar" aria-hidden="true" />
        </header>

        <div className="w-grid">
          <section className="w-hero">
            <Tag m="sp" v={"p " + n(look.sp.cardP)} />
            <Tag m="sh" v={shN("hero")} pos="r" />
            <Tag m="rad" v={n(look.rad.hero)} />
            <span className="w-cap">{t.spent}<Tag m="fs" v={n(look.fs.cap)} pos="r" /><Tag m="col" {...((c) => ({ v: c.txt, ok: c.ok }))(cr(look.col.muted, look.col.raised))} pos="r" /></span>
            <strong className="w-num">{t.balance}<Tag m="fs" v={n(look.fs.num)} pos="r" /></strong>
            <div className="w-bar"><i style={{ width: "80%" }} /></div>
            <span className="w-cap">{t.of}</span>
          </section>

          <section className="w-goal">
            <Tag m="sh" v={shN("goal")} pos="r" />
            <Tag m="rad" v={n(look.rad.goal)} />
            <div className="w-goal-img"><GoalArt cheap={cheap} /><Tag m="rad" v={n(look.rad.img)} pos="in" /></div>
            <div className="w-goal-body">
              <b className="w-title">{t.goal}</b>
              <span className="w-cap">{t.goalSum}</span>
              <div className="w-bar"><i style={{ width: "64%" }} /></div>
              <span className="w-cap">{t.goalLeft}</span>
            </div>
          </section>

          <div className="w-actions">
            <button className="w-btn w-add"><Icon name="plus" />{t.add}<Tag m="sp" v={n(look.sp.btnY) + " · " + n(look.sp.btnX)} pos="r" /><Tag m="fs" v={n(look.fs.btn)} pos="r" /><Tag m="col" {...((c) => ({ v: c.txt, ok: c.ok }))(cr(look.col.onPrimary, look.col.primary))} pos="r" /><Tag m="sh" v={shN("btn")} pos="r" /><Tag m="rad" v={n(look.rad.btn)} pos="r" /></button>
            <label className="w-field w-search"><Icon name="search" /><span>{t.search}</span></label>
          </div>

          <section className="w-feed">
            <h2 className="w-title w-feed-title">{t.list}<Tag m="fs" v={n(look.fs.title)} pos="r" /><Tag m="sp" v={n(look.sp.group)} pos="r" /></h2>
            <div className="w-chips">
              {t.chips.map((c, i) => <span key={c} className={i === 0 ? "w-chip on" : "w-chip"}>{c}{i === 0 && <><Tag m="fs" v={n(look.fs.chip)} pos="r" /><Tag m="col" {...((x) => ({ v: x.txt, ok: x.ok }))(cr(look.col.onChip, look.col.chip))} pos="r" /><Tag m="rad" v={n(look.rad.chip)} pos="r" /></>}{i === 1 && <Tag m="sp" v={n(look.sp.chipGap)} pos="l" />}</span>)}
            </div>
            <ul className="w-list">
              <Tag m="sp" v={"p " + n(look.sp.cardP2)} />
              <Tag m="sh" v={shN("card")} pos="r" />
              <Tag m="rad" v={n(look.rad.card)} />
              {t.items.map((it, i) => (
                <li key={it.title} className={i === hover ? "w-row hover" : "w-row"}>
                  <span className="w-row-ico"><Icon name={it.icon} mixed={mixed} i={i} /></span>
                  <span className="w-row-txt"><span className="w-item">{it.title}{i === 0 && <Tag m="fs" v={n(look.fs.item)} pos="r" />}</span><span className="w-cap">{it.cat}{i === 0 && <Tag m="fs" v={n(look.fs.cap)} pos="r" />}</span></span>
                  {i === 0 && <Tag m="sp" v={n(look.sp.rowY)} pos="r" />}
                  <span className={it.inc ? "w-sum inc" : "w-sum"}>{it.sum}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <aside className="w-right">
        <section className="w-cats">
          <b className="w-title">{t.cats}</b>
          {t.catRows.map(([n, p]) => (
            <div key={n} className="w-cat">
              <span className="w-cat-top"><span className="w-item">{n}</span><span className="w-cap">{p}%</span></span>
              <div className="w-bar"><i style={{ width: `${p}%` }} /></div>
            </div>
          ))}
        </section>
      </aside>

      <nav className="w-tabbar" aria-label={t.app}>
        {(["home", "list", "goal", "user"] as const).map((n, i) => (
          <a key={n} className={i === 1 ? "on" : ""}><span className="w-pill"><Icon name={n} mixed={mixed} i={i} /></span><span>{t.nav[i]}</span></a>
        ))}
        <i className="w-safe-bottom" aria-hidden="true" />
      </nav>
     </div>
    </div>
  );
}
