import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { build, DEFAULTS, PAIRS, pairContrast, ROLE_NAMES, shadowCss, type Settings } from "./core/theme";
import { cheapLook, mix, themeLook, type Look } from "./core/look";
import { Wallet, type Marks } from "./core/Wallet";
import { measure, type Counts } from "./core/measure";
import { exportCss, exportJson, exportTailwind } from "./core/export";
import { Device, DEVICES, ORDER, type DeviceId } from "./ui/Devices";
import { STR, type Lang } from "./ui/i18n";

type Mode = "cheap" | "split" | "theme";
type Focus = "all" | DeviceId;
type View = { mode: Mode; dark: boolean; focus: Focus; lang: Lang; split: number; step: number; rec: string; marks: boolean };

const VIDEO = "https://www.youtube.com/@NeuroP1lot";
const REPO = "https://github.com/ArthurKrantsevich/ui-theme";
const PRESETS = ["#2F6BDE", "#F26B1D", "#0E9F6E", "#C2185B", "#F4C430", "#5B4BDB"];

/* ---------------- состояние в адресе: любую сцену можно открыть ссылкой ---------------- */
function readUrl(): { s: Settings; v: View } {
  const q = new URLSearchParams(location.search);
  const num = (k: string, d: number) => (q.has(k) ? Number(q.get(k)) : d);
  const small = typeof innerWidth === "number" && innerWidth < 760;
  return {
    s: {
      space: q.get("space") === "4" ? 4 : 8,
      base: num("base", DEFAULTS.base),
      ratio: num("ratio", DEFAULTS.ratio),
      seed: q.get("seed") ? "#" + q.get("seed")!.replace("#", "") : DEFAULTS.seed,
      fix: q.get("fix") !== "0",
      tint: num("tint", DEFAULTS.tint),
      soft: num("soft", DEFAULTS.soft),
      round: num("round", DEFAULTS.round),
    },
    v: {
      mode: (["cheap", "split", "theme"].includes(q.get("mode") ?? "") ? q.get("mode") : "theme") as Mode,
      dark: q.get("dark") === "1",
      focus: (q.get("focus") as Focus) ?? (small ? "phone" : "all"),
      lang: q.get("lang") === "en" ? "en" : q.get("lang") === "ru" ? "ru" : navigator.language?.startsWith("ru") ? "ru" : "en",
      split: num("split", 50),
      step: num("step", 1),
      rec: q.get("rec") ?? "",
      marks: q.get("marks") === "1",
    },
  };
}
function writeUrl(s: Settings, v: View) {
  const q = new URLSearchParams();
  if (s.seed !== DEFAULTS.seed) q.set("seed", s.seed.replace("#", ""));
  if (s.space !== 8) q.set("space", "4");
  if (s.base !== DEFAULTS.base) q.set("base", String(s.base));
  if (s.ratio !== DEFAULTS.ratio) q.set("ratio", String(s.ratio));
  if (!s.fix) q.set("fix", "0");
  if (s.tint !== DEFAULTS.tint) q.set("tint", String(s.tint));
  if (s.soft !== DEFAULTS.soft) q.set("soft", String(s.soft));
  if (s.round !== DEFAULTS.round) q.set("round", String(s.round));
  if (v.mode !== "theme") q.set("mode", v.mode);
  if (v.dark) q.set("dark", "1");
  if (v.focus !== "all") q.set("focus", v.focus);
  q.set("lang", v.lang);
  if (v.rec) q.set("rec", v.rec);
  if (v.marks) q.set("marks", "1");
  if (v.step !== 1) q.set("step", String(v.step));
  history.replaceState(null, "", `${location.pathname}?${q}`);
}

/** Плавный морф вида: при смене «дёшево ↔ тема» значения перетекают за 0,9 с. */
function useMorph(target: Look): Look {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const cur = useRef(target);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { cur.current = target; setShown(target); return; }
    from.current = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      const l = mix(from.current, target, e);
      cur.current = l;
      setShown(l);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

/** Число в фиксированных ячейках; при смене каждая цифра «перелистывается». */
function Flip({ value }: { value: number | string }) {
  const s = String(value);
  return (
    <span className="flip" aria-label={String(value)}>
      {s.split("").map((ch, i) => <span key={i + ch} className="flip-cell" aria-hidden="true">{ch === " " ? " " : ch}</span>)}
    </span>
  );
}

function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; label: ReactNode; hint?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)} title={o.hint}>
          {o.label}{o.hint && <small>{o.hint}</small>}
        </button>
      ))}
    </div>
  );
}

function Range({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <label className="range">
      <span className="range-top"><span>{label}</span><output className="mono">{fmt(value)}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ "--p": `${((value - min) / (max - min)) * 100}%` } as CSSProperties} />
    </label>
  );
}

/** Раскладка листа «Все»: монитор слева, справа ноутбук, под ним планшет и телефон — как полосы на печатном листе. */
const G = 130, CAP = 90;
const IMPOSE: Record<DeviceId, { x: number; y: number }> = (() => {
  const d = DEVICES, rightX = d.desktop.outerW + G * 1.4;
  const rowH = d.laptop.outerH + CAP + G * 0.4;
  const pairW = d.tablet.outerW + G + d.phone.outerW;
  const tx = rightX + (d.laptop.outerW - pairW) / 2;
  const colH = rowH + d.tablet.outerH + CAP;
  return {
    desktop: { x: 0, y: (colH - d.desktop.outerH - CAP) / 2 },
    laptop: { x: rightX, y: 0 },
    tablet: { x: tx, y: rowH },
    phone: { x: tx + d.tablet.outerW + G, y: rowH + d.tablet.outerH - d.phone.outerH },
  };
})();
const IMPOSE_W = DEVICES.desktop.outerW + G * 1.4 + DEVICES.laptop.outerW;
const IMPOSE_H = DEVICES.laptop.outerH + CAP + G * 0.4 + DEVICES.tablet.outerH + CAP;
const inkOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.25 ? "#15171c" : "#ffffff";
};

const fmtRatio = (r: number, lang: Lang) => (lang === "ru" ? r.toFixed(2).replace(".", ",") : r.toFixed(2)) + ":1";

export default function App() {
  const init = useMemo(readUrl, []);
  const [s, setS] = useState<Settings>(init.s);
  const [v, setV] = useState<View>(init.v);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"css" | "tw" | "json">("css");
  const [hex, setHex] = useState(init.s.seed); // черновик поля: можно печатать по символу
  const set = (p: Partial<Settings>) => setS((x) => ({ ...x, ...p }));
  const setView = (p: Partial<View>) => setV((x) => ({ ...x, ...p }));
  const L = STR[v.lang];
  const t = useMemo(() => build(s), [s]);

  useEffect(() => writeUrl(s, v), [s, v]);
  useEffect(() => setHex((h) => (h.toUpperCase() === s.seed ? h : s.seed)), [s.seed]);
  useEffect(() => { document.documentElement.lang = v.lang; document.title = v.lang === "ru" ? "Оттиск темы — ui-theme" : "Theme proof — ui-theme"; }, [v.lang]);

  const themeL = useMemo(() => themeLook(t, v.dark), [t, v.dark]);
  const cheapL = useMemo(() => cheapLook(v.dark), [v.dark]);
  const shown = useMorph(v.mode === "cheap" ? cheapL : themeL);
  const roles = v.dark ? t.dark : t.light;

  /* ---------- раскладка листа: общий масштаб для всех устройств, как на типографском листе ---------- */
  const sheetRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 600 });
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const list = v.focus === "all" ? ORDER : [v.focus];
  const pos = v.focus === "all" ? IMPOSE : { [v.focus]: { x: 0, y: 0 } } as Partial<Record<DeviceId, { x: number; y: number }>>;
  const sheetW = v.focus === "all" ? IMPOSE_W : DEVICES[v.focus].outerW;
  const sheetH = v.focus === "all" ? IMPOSE_H : DEVICES[v.focus].outerH + CAP;
  const scale = Math.max(0.05, Math.min(box.w / sheetW, box.h / sheetH));

  /* ---------- счётчики по DOM ноутбука (или устройства в фокусе) ---------- */
  const measureId: DeviceId = v.focus === "all" ? "laptop" : v.focus;
  const [counts, setCounts] = useState<Counts | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const root = document.querySelector(`[data-measure="${measureId}"] .w`);
      setCounts(measure(root));
    });
    return () => cancelAnimationFrame(id);
  }, [shown, measureId, v.mode]);

  const code = tab === "css" ? exportCss(t, s) : tab === "tw" ? exportTailwind(t, s) : exportJson(t, s);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ }
  };
  const download = () => {
    const name = tab === "css" ? "theme.css" : tab === "tw" ? "theme.tailwind.css" : "theme.tokens.json";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = name;
    a.click();
  };

  const marks: Marks | undefined = v.marks ? ((["sp", "fs", "col", "rad", "col"] as Marks[])[v.step - 1] ?? "sp") : undefined;
  const screen = (id: DeviceId) => {
    if (v.mode !== "split") return <Wallet look={shown} lang={v.lang} marks={marks} tone={v.mode === "cheap" ? "bad" : "good"} />;
    return (
      <div className="split">
        <Wallet look={cheapL} lang={v.lang} />
        <div className="split-theme" style={{ clipPath: `inset(0 0 0 ${v.split}%)` }}><Wallet look={themeL} lang={v.lang} /></div>
        <i className="split-line" style={{ left: `${v.split}%` }} data-id={id} />
      </div>
    );
  };

  const misreg = v.mode === "cheap";
  const sheet = (
    <div className={`sheet ${misreg ? "misreg" : ""}`}>
      <div className="slug mono" aria-hidden={v.rec ? "true" : undefined}>
        <Reg />
        <span>ui-theme · {L.slug.proof} · {v.mode === "cheap" ? "1/2" : "2/2"}</span>
        <span>{list.map((id) => DEVICES[id].w).join(" · ")} px</span>
        <span className={misreg ? "warn" : "ok"}>{misreg ? L.slug.misregister : L.slug.register}</span>
        <Reg />
      </div>
      <div className="stage" ref={sheetRef}>
        <div className="stage-row" style={{ width: sheetW * scale, height: sheetH * scale }}>
          {list.map((id) => (
            <div key={id} className="plate" data-measure={id} style={{ left: pos[id]!.x * scale, top: pos[id]!.y * scale }}>
              <Crop />
              <Device id={id} scale={scale} dark={v.dark} label={L.focus[id]}>{screen(id)}</Device>
              <span className="plate-cap mono">{L.focus[id]} · {DEVICES[id].w}</span>
            </div>
          ))}
        </div>
        {v.mode === "split" && (
          <input className="split-range" type="range" min={4} max={96} value={v.split} aria-label={L.modes.split}
            onChange={(e) => setView({ split: Number(e.target.value) })} />
        )}
      </div>
      <div className="colorbar" aria-label={L.color.pairs}>
        {ROLE_NAMES.map((n) => (
          <span key={n} className="patch" style={{ background: roles[n], color: inkOn(roles[n]) }} title={`${L.roles[n]} ${roles[n]}`}>
            <span className="mono">{roles[n].slice(1)}</span>
          </span>
        ))}
      </div>
    </div>
  );

  if (v.rec === "sheet") return <div className={`app rec ${v.dark ? "is-dark" : ""}`}>{sheet}</div>;

  const step = (i: number, body: ReactNode) => {
    const st = L.steps[i];
    const open = v.step === i + 1;
    return (
      <section className={`step ${open ? "open" : ""}`} key={i}>
        <button className="step-head" aria-expanded={open} onClick={() => setView({ step: open ? 0 : i + 1 })}>
          <span className="step-n mono">{i + 1}</span>
          <span className="step-t">{st.title}</span>
          <svg className="step-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {open && (
          <div className="step-body">
            {body}
            <p className="why">{st.why}</p>
            {st.src.length > 0 && <p className="src">{st.src.map((x) => <a key={x.href} href={x.href} target="_blank" rel="noreferrer">{x.label}</a>)}</p>}
          </div>
        )}
      </section>
    );
  };

  const failing = PAIRS.map((p) => ({ ...p, r: pairContrast(roles, p.fg, p.bg) }));

  return (
    <div className={`app ${v.dark ? "is-dark" : ""}`}>
      <aside className="rail">
        <header className="brand">
          <h1>{L.title}</h1>
          <p>{L.sub}</p>
        </header>

        {step(0, (
          <>
            <Seg label={L.space.label} value={s.space} onChange={(x) => set({ space: x })}
              options={[{ v: 8, label: "8 px", hint: L.space.normal }, { v: 4, label: "4 px", hint: L.space.dense }]} />
            <div className="ladder" aria-hidden="true">
              {t.space.map((x) => <span key={x} className="ladder-step"><i style={{ width: x * 2 }} /><b className="mono">{x}</b></span>)}
            </div>
          </>
        ))}

        {step(1, (
          <>
            <Range label={L.type.base} value={s.base} min={14} max={18} step={1} onChange={(x) => set({ base: x })} fmt={(x) => `${x} px`} />
            <Seg label={L.type.ratio} value={s.ratio} onChange={(x) => set({ ratio: x })}
              options={[{ v: 1.2, label: "×1,2", hint: L.type.tight }, { v: 1.25, label: "×1,25", hint: L.type.app }, { v: 1.333, label: "×1,333", hint: L.type.landing }]} />
            <div className="type-ramp">
              <span style={{ fontSize: t.text.s }}>{t.text.s} <small>{L.counters.sizes}</small></span>
              <span style={{ fontSize: t.text.m }}>{t.text.m} · {L.type.sample}</span>
              <span style={{ fontSize: Math.min(t.text.l, 30) }}>{t.text.l}–{t.text.lMax}</span>
            </div>
          </>
        ))}

        {step(2, (
          <>
            <div className="seed">
              <label className="seed-pick">
                <input type="color" value={s.seed} onChange={(e) => set({ seed: e.target.value.toUpperCase() })} aria-label={L.color.seed} />
                <span>{L.color.seed}</span>
              </label>
              <input className="seed-hex mono" value={hex} spellCheck={false} aria-label={L.color.seed} maxLength={7}
                onChange={(e) => { const x = e.target.value; setHex(x); if (/^#[0-9a-f]{6}$/i.test(x)) set({ seed: x.toUpperCase() }); }} />
            </div>
            <div className="presets" role="group" aria-label={L.color.presets}>
              {PRESETS.map((p) => <button key={p} className={p === s.seed ? "on" : ""} style={{ background: p }} aria-label={p} onClick={() => set({ seed: p })} />)}
            </div>
            <div className={`check ${t.seed.contrast >= 4.5 ? "pass" : "fail"}`}>
              <span className="check-chip" style={{ background: t.seed.hex, color: t.seed.on === "white" ? "#fff" : "#16181D" }}>Aa</span>
              <span>
                <b className="mono">{t.seed.hex} · {fmtRatio(t.seed.contrast, v.lang)}</b>
                <small>{t.seed.contrast >= 4.5 ? L.color.pass : L.color.fail}</small>
              </span>
              {t.seed.contrast < 4.5 && (
                <Seg label={L.color.fix} value={s.fix ? 1 : 0} onChange={(x) => set({ fix: !!x })}
                  options={[{ v: 0, label: L.color.asIs }, { v: 1, label: s.fix ? L.color.fixed : L.color.fix }]} />
              )}
            </div>
            {t.primary.moved && (
              <div className="check pass">
                <span className="check-chip" style={{ background: t.primary.hex, color: t.light["on-primary"] }}>Aa</span>
                <span><b className="mono">{t.primary.hex} · {fmtRatio(t.primary.contrast, v.lang)}</b><small>{L.color.nearest}</small></span>
              </div>
            )}
            <Range label={L.color.tint} value={s.tint} min={0} max={1} step={0.05} onChange={(x) => set({ tint: x })} fmt={(x) => `${Math.round(x * 100)}%`} />
            <ul className="pairs" aria-label={L.color.pairs}>
              {failing.map((p) => (
                <li key={p.fg + p.bg} className={p.r >= p.min ? "pass" : "fail"}>
                  <span className="pair-sw" style={{ background: roles[p.bg], color: roles[p.fg] }}>Aa</span>
                  <span>{L.roles[p.fg]} / {L.roles[p.bg]}</span>
                  <b className="mono">{fmtRatio(p.r, v.lang)}</b>
                </li>
              ))}
            </ul>
          </>
        ))}

        {step(3, (
          <>
            <Range label={L.depth.soft} value={s.soft} min={0.6} max={1.6} step={0.1} onChange={(x) => set({ soft: x })} fmt={(x) => `×${x.toFixed(1)}`} />
            <Range label={L.depth.round} value={s.round} min={0} max={1.5} step={0.125} onChange={(x) => set({ round: x })} fmt={() => `${t.radius.s} · ${t.radius.m} · ${t.radius.l}`} />
            <div className="levels">
              {t.shadow.map((sh, i) => (
                <span key={i} className="lvl" style={{ boxShadow: shadowCss(sh), borderRadius: [t.radius.s, t.radius.m, t.radius.l][i] / 2 + 4 }}>
                  <b className="mono">{i + 1}</b><small>{L.depth.levels[i]}</small>
                </span>
              ))}
            </div>
            <p className="nested mono">{L.depth.nested}: {t.radius.l} − {t.space[2]} = {Math.max(0, t.radius.l - t.space[2])}</p>
          </>
        ))}

        {step(4, (
          <>
            <Seg label={L.steps[4].title} value={v.dark ? 1 : 0} onChange={(x) => setView({ dark: !!x })}
              options={[{ v: 0, label: L.light }, { v: 1, label: L.dark }]} />
            <p className="note">{L.darkStep.note}</p>
          </>
        ))}

        {step(5, (
          <>
            <Seg label={L.steps[5].title} value={tab} onChange={setTab}
              options={[{ v: "css", label: "CSS" }, { v: "tw", label: "Tailwind" }, { v: "json", label: "JSON" }]} />
            <pre className="code mono" tabIndex={0}>{code}</pre>
            <div className="code-act">
              <button className="btn-primary" onClick={copy}>{copied ? L.exp.copied : L.exp.copy}</button>
              <button className="btn-ghost" onClick={download}>{L.exp.download}</button>
            </div>
          </>
        ))}

        <footer className="rail-foot">
          <a href={VIDEO} target="_blank" rel="noreferrer">{L.video}</a>
          <a href={REPO} target="_blank" rel="noreferrer">{L.repo}</a>
          <span>{L.made}</span>
        </footer>
      </aside>

      <main className="main">
        <div className="toolbar">
          <Seg label="mode" value={v.mode} onChange={(x) => setView({ mode: x })}
            options={[{ v: "cheap", label: L.modes.cheap }, { v: "split", label: L.modes.split }, { v: "theme", label: L.modes.theme }]} />
          <Seg label="theme" value={v.dark ? 1 : 0} onChange={(x) => setView({ dark: !!x })}
            options={[{ v: 0, label: <Sun /> }, { v: 1, label: <Moon /> }]} />
          <Seg label="focus" value={v.focus} onChange={(x) => setView({ focus: x })}
            options={(["all", ...ORDER] as Focus[]).map((f) => ({ v: f, label: L.focus[f] }))} />
          <button className={`marks-btn ${v.marks ? "on" : ""}`} aria-pressed={v.marks} onClick={() => setView({ marks: !v.marks })}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7v10M20 7v10M4 12h16M8 9l-4 3 4 3M16 9l4 3-4 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {L.marks}
          </button>
          <Seg label="lang" value={v.lang} onChange={(x) => setView({ lang: x })} options={[{ v: "ru", label: "RU" }, { v: "en", label: "EN" }]} />
        </div>
        {counts && v.mode !== "split" && (
          <dl className="counters" aria-live="polite">
            {(["spacing", "sizes", "fails", "shadows", "radii"] as const).map((k) => (
              <div key={k} className={`counter ${k === "fails" && counts.fails > 0 ? "bad" : ""}`}>
                <dt>{L.counters[k]}</dt>
                <dd><Flip value={counts[k]} /></dd>
              </div>
            ))}
            <div className="counter-note mono">{L.measuredOn}: {L.focus[measureId]}</div>
          </dl>
        )}
        {sheet}
      </main>
    </div>
  );
}

/* --- метки печатного листа: крест приводки и метки обреза --- */
function Reg() {
  return (
    <svg className="reg" viewBox="0 0 24 24" aria-hidden="true">
      {["c", "m", "y", "k"].map((k) => (
        <g key={k} className={`reg-${k}`}>
          <circle cx="12" cy="12" r="6.5" fill="none" strokeWidth="1" />
          <path d="M12 1v22M1 12h22" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}
function Crop() {
  return <span className="crop" aria-hidden="true"><i /><i /><i /><i /></span>;
}
const Sun = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-label="light"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-label="dark"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
);
