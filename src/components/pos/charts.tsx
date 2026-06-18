"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Konteyner genişliğini ölçer (crisp, çarpıtmasız SVG için). */
function useWidth(fallback = 720) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const cw = e.contentRect.width;
      if (cw > 0) setW(cw);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

/* ============================================================
   Orwion POS — Hafif, bağımlılıksız premium grafik motoru
   Tümü SVG; kıvrımlı (monotone-cubic) çizgi, gradient dolgu,
   crisp non-scaling stroke. "Lego bar" yok.
   ============================================================ */

type Pt = { x: number; y: number };

/** Yumuşak kübik (Catmull-Rom → Bézier) yol üretir. */
function smoothPath(pts: Pt[], tension = 0.5): string {
  if (pts.length < 2) return "";
  const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

/* ---------- Alan Grafiği ---------- */
export function AreaChart({
  data,
  height = 200,
  stroke = "#f59e0b",
  fillFrom = "rgba(245,158,11,0.32)",
  fillTo = "rgba(245,158,11,0)",
  fmt = (n: number) => String(n),
  peakLabel,
  grid = "#eef2f7",
  labelColor = "#94a3b8",
}: {
  data: { label: string; value: number }[];
  height?: number;
  stroke?: string;
  fillFrom?: string;
  fillTo?: string;
  fmt?: (n: number) => string;
  peakLabel?: boolean;
  grid?: string;
  labelColor?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const { ref, w } = useWidth();
  const W = Math.max(240, w);
  const H = height;
  const padX = 18;
  const padTop = 30;
  const padBot = 26;
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = max - min || 1;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBot;

  const pts: Pt[] = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - ((d.value - min) / span) * innerH,
  }));

  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${padTop + innerH} Z`;

  const peakIdx = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => padTop + t * innerH);

  return (
    <div ref={ref} className="w-full">
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>

      {/* Izgara */}
      {gridY.map((y, i) => (
        <line
          key={i}
          x1={padX}
          x2={W - padX}
          y1={y}
          y2={y}
          stroke={grid}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* Dolgu + çizgi */}
      <path d={area} fill={`url(#area-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Noktalar */}
      {pts.map((p, i) => {
        const peak = i === peakIdx;
        return (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={peak ? 4.5 : 2.5}
              fill="#fff"
              stroke={stroke}
              strokeWidth={peak ? 3 : 2}
              vectorEffect="non-scaling-stroke"
            />
            {peak && peakLabel && (
              <g>
                <rect
                  x={p.x - 34}
                  y={p.y - 30}
                  width={68}
                  height={20}
                  rx={6}
                  fill="#0f172a"
                />
                <text
                  x={p.x}
                  y={p.y - 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#fff"
                >
                  {fmt(data[peakIdx].value)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* X etiketleri */}
      {data.map((d, i) => (
        <text
          key={i}
          x={pts[i].x}
          y={H - 8}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={labelColor}
        >
          {d.label}
        </text>
      ))}
    </svg>
    </div>
  );
}

/* ---------- Donut Grafiği ---------- */
export function DonutChart({
  segments,
  size = 168,
  thickness = 22,
  centerTop,
  centerBottom,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  // Her segmentin kümülatif başlangıç oranı (saf hesap; render sırasında mutasyon yok).
  const starts = segments.map((_, i) =>
    segments.slice(0, i).reduce((sum, x) => sum + x.value / total, 0),
  );

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const offset = -starts[i] * c;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          {centerBottom && (
            <div className="text-[10px] font-bold tracking-wide text-ink3 uppercase">
              {centerBottom}
            </div>
          )}
          {centerTop && (
            <div className="font-display tnum text-xl font-extrabold text-ink">
              {centerTop}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sparkline (mini trend) ---------- */
export function Sparkline({
  data,
  stroke = "#10b981",
  className,
}: {
  data: number[];
  stroke?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const W = 120;
  const H = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts: Pt[] = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 3 - ((v - min) / span) * (H - 6),
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${uid})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
