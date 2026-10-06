"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Column chart of uploads per week. Single series, so no legend: the panel title names it.
 * Columns: <=24px, 4px rounded tops, square at the baseline; hairline grid; hover and focus
 * show a tooltip; a table view of the same numbers sits beside it for screen readers.
 */
export function UploadsChart({ data }: { data: { week: string; uploads: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);

  // Draw at the container's real width so text stays 12px at every screen size.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 260;
  const pad = { top: 16, right: 8, bottom: 32, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.uploads));
  const top = Math.ceil(max / 2) * 2; // clean even tick ceiling
  const ticks = Array.from({ length: top / 2 + 1 }, (_, i) => i * 2);
  const band = innerW / data.length;
  const barW = Math.min(24, band * 0.5);
  const labelEvery = band < 56 ? 2 : 1; // thin out week labels on narrow screens
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;

  // Rounded top (4px), square base.
  const barPath = (x: number, v: number) => {
    const y0 = pad.top + innerH;
    const y1 = y(v);
    const r = Math.min(4, (y0 - y1) / 2, barW / 2);
    if (v <= 0) return "";
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${y0} Z`;
  };

  const tip = active !== null ? data[active] : null;
  const tipX = active !== null ? ((pad.left + band * active + band / 2) / W) * 100 : 0;
  const tipY = tip ? (y(tip.uploads) / H) * 100 : 0;

  return (
    <div className="chart" ref={boxRef}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Uploads per week, ${data[0]?.week} to ${data[data.length - 1]?.week}. Highest: ${max}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={pad.left - 10} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--ink-muted)" fontFamily="var(--font-sans)">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + band * i + (band - barW) / 2;
          return (
            <g key={d.week} className="chart-col" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
              <rect
                className="chart-hit"
                x={pad.left + band * i}
                y={pad.top}
                width={band}
                height={innerH}
                tabIndex={0}
                aria-label={`Week of ${d.week}: ${d.uploads} uploads`}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
              <rect className="chart-focus" x={pad.left + band * i + 2} y={pad.top} width={band - 4} height={innerH} rx={6} pointerEvents="none" />
              <path d={barPath(x, d.uploads)} fill="var(--blue)" pointerEvents="none" />
              {i % labelEvery === 0 ? <text x={pad.left + band * i + band / 2} y={H - 10} textAnchor="middle" fontSize="12" fill="var(--ink-muted)" fontFamily="var(--font-sans)">{d.week}</text> : null}
            </g>
          );
        })}
      </svg>
      {tip ? (
        <div className="chart-tooltip" style={{ left: `${tipX}%`, top: `${tipY}%` }} role="status">
          Week of {tip.week}: <strong>{tip.uploads}</strong> {tip.uploads === 1 ? "upload" : "uploads"}
        </div>
      ) : null}
      <table className="visually-hidden">
        <caption>Uploads per week</caption>
        <thead><tr><th>Week of</th><th>Uploads</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.week}><td>{d.week}</td><td>{d.uploads}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
