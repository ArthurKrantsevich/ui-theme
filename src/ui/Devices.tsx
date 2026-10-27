/**
 * Четыре устройства с настоящими размерами экрана в CSS-пикселях:
 * iPhone 15 Pro 393×852, iPad 820×1180, MacBook 1280×800, монитор 1920×1080.
 * Экран рисуется в натуральную величину и уменьшается целиком (transform), поэтому
 * container queries «Кошелька» видят настоящую ширину устройства.
 */
import type { CSSProperties, ReactNode } from "react";

export type DeviceId = "phone" | "tablet" | "laptop" | "desktop";

export const DEVICES: Record<DeviceId, { w: number; h: number; safeTop: number; safeBottom: number; outerW: number; outerH: number }> = {
  // outer — габарит корпуса вместе с рамкой, подставкой и основанием
  phone: { w: 393, h: 852, safeTop: 54, safeBottom: 30, outerW: 393 + 24, outerH: 852 + 24 },
  tablet: { w: 820, h: 1180, safeTop: 28, safeBottom: 20, outerW: 820 + 48, outerH: 1180 + 48 },
  laptop: { w: 1280, h: 800, safeTop: 0, safeBottom: 0, outerW: 1280 + 220, outerH: 800 + 40 + 26 },
  desktop: { w: 1920, h: 1080, safeTop: 0, safeBottom: 0, outerW: 1920 + 48, outerH: 1080 + 48 + 300 },
};
export const ORDER: DeviceId[] = ["phone", "tablet", "laptop", "desktop"];

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={`dv-status ${dark ? "on-dark" : ""}`} aria-hidden="true">
      <span>9:41</span>
      <span className="dv-status-r">
        <svg width="18" height="12" viewBox="0 0 18 12">{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 5} y={9 - i * 3} width="3" height={3 + i * 3} rx="1" fill="currentColor" />)}</svg>
        <svg width="26" height="13" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45" /><rect x="2" y="2" width="19" height="9" rx="2" fill="currentColor" /><rect x="24" y="4" width="2" height="5" rx="1" fill="currentColor" opacity=".45" /></svg>
      </span>
    </div>
  );
}

/** Корпус + экран. children — содержимое экрана в натуральную величину. */
export function Device({ id, scale, dark, children, style, label }: { id: DeviceId; scale: number; dark: boolean; children: ReactNode; style?: CSSProperties; label?: string }) {
  const d = DEVICES[id];
  const vars = { "--w-safe-top": `${d.safeTop}px`, "--w-safe-bottom": `${d.safeBottom}px` } as CSSProperties;
  return (
    <figure className={`dv dv-${id}`} style={{ width: d.outerW * scale, height: d.outerH * scale, ...style }} aria-label={label}>
      <div className="dv-body" style={{ width: d.outerW, height: d.outerH, transform: `scale(${scale})` }}>
        <div className="dv-shell">
          <div className="dv-screen" style={{ width: d.w, height: d.h, ...vars }}>
            {children}
            {id === "phone" && <><StatusBar dark={dark} /><i className="dv-island" /><i className={`dv-home ${dark ? "on-dark" : ""}`} /></>}
            {id === "tablet" && <StatusBar dark={dark} />}
          </div>
          {id === "tablet" && <i className="dv-cam" />}
          {id === "laptop" && <i className="dv-notch" />}
        </div>
        {id === "laptop" && <div className="dv-base"><i /></div>}
        {id === "desktop" && <div className="dv-stand"><i className="dv-neck" /><i className="dv-foot" /></div>}
      </div>
    </figure>
  );
}
