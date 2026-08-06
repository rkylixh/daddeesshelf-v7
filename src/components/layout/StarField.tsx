'use client';

import React, { useEffect, useRef, useState } from 'react';

// Deterministic glitter/dust particle data — warm palette only
interface GlitterMote {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  dur: number;
  delay: number;
  driftX: number;
  driftY: number;
  color: string;
  blur: number;
  br: string;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Warm palette: ivory, champagne, antique gold, cream, soft amber
const WARM_COLORS = [
  'rgba(255,248,220,1)',   // ivory
  'rgba(245,232,190,1)',   // champagne
  'rgba(212,185,120,1)',   // antique gold
  'rgba(255,252,235,1)',   // cream
  'rgba(230,210,155,1)',   // warm gold
  'rgba(255,240,200,1)',   // soft amber
  'rgba(240,220,160,1)',   // golden wheat
];

function buildMotes(count: number, offset: number): GlitterMote[] {
  return Array.from({ length: count }, (_, i) => {
    const s = offset + i * 17;
    const r = (n: number) => seededRand(s + n);
    return {
      id: `mote-${offset}-${i}`,
      x: r(0) * 100,
      y: r(1) * 100,
      size: 1 + r(2) * 3.5,
      opacity: 0.06 + r(3) * 0.22,
      dur: 12 + r(4) * 22,
      delay: r(5) * 18,
      driftX: (r(6) - 0.5) * 30,
      driftY: -(10 + r(7) * 30),
      color: WARM_COLORS[Math.floor(r(8) * WARM_COLORS.length)],
      blur: 0.3 + r(9) * 1.4,
      br: `${38 + r(10) * 32}% ${62 - r(11) * 22}% ${48 + r(12) * 28}% ${44 + r(13) * 22}%`,
    };
  });
}

// Three layers for depth
const MOTES_BG = buildMotes(55, 0);
const MOTES_MID = buildMotes(35, 2000);
const MOTES_FG = buildMotes(20, 4000);

// Glitter sparkle points — tiny bright flashes
function buildSparkles(count: number, offset: number) {
  return Array.from({ length: count }, (_, i) => {
    const s = offset + i * 11;
    const r = (n: number) => seededRand(s + n);
    return {
      id: `sp-${offset}-${i}`,
      x: r(0) * 100,
      y: r(1) * 100,
      size: 1 + r(2) * 2,
      opacity: 0.15 + r(3) * 0.45,
      dur: 3 + r(4) * 6,
      delay: r(5) * 12,
    };
  });
}

const SPARKLES = buildSparkles(40, 6000);

const KEYFRAMES = `
@keyframes warmMoteDrift {
  0%   { transform: translate(0px, 0px) scale(1);    opacity: var(--mo-lo); }
  25%  { transform: translate(var(--mo-dx), calc(var(--mo-dy) * 0.4)) scale(1.05); opacity: var(--mo-hi); }
  50%  { transform: translate(calc(var(--mo-dx) * 0.6), calc(var(--mo-dy) * 0.7)) scale(0.95); opacity: var(--mo-mid); }
  75%  { transform: translate(calc(var(--mo-dx) * 0.9), var(--mo-dy)) scale(1.02); opacity: var(--mo-hi); }
  100% { transform: translate(0px, 0px) scale(1);    opacity: var(--mo-lo); }
}
@keyframes warmGlitterFlash {
  0%, 100% { opacity: var(--sp-lo); transform: scale(0.8); }
  40%       { opacity: var(--sp-hi); transform: scale(1.3); }
  60%       { opacity: var(--sp-mid); transform: scale(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .warm-mote, .warm-sparkle { animation: none !important; }
}
`;

function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('warm-field-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'warm-field-keyframes';
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

export default function StarField() {
  const [mounted, setMounted] = useState(false);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const midLayerRef = useRef<HTMLDivElement>(null);
  const fgLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectKeyframes();
    setMounted(true);
  }, []);

  // Subtle parallax — each layer at different speed
  useEffect(() => {
    if (!mounted) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        if (bgLayerRef.current)  bgLayerRef.current.style.transform  = `translateY(${sy * 0.04}px)`;
        if (midLayerRef.current) midLayerRef.current.style.transform = `translateY(${sy * 0.07}px)`;
        if (fgLayerRef.current)  fgLayerRef.current.style.transform  = `translateY(${sy * 0.11}px)`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted]);

  return (
    <div className="starfield-bg" aria-hidden="true">

      {/* ── Warm parchment base ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, #FBF5EC 0%, #F5E8D0 30%, #F8EFE0 60%, #F2E4CC 100%)',
        }}
      />

      {/* ── Sunray beams from upper-left ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(148deg, rgba(255,220,130,0.28) 0%, rgba(255,200,90,0.12) 25%, transparent 55%),
            linear-gradient(155deg, rgba(255,235,160,0.18) 0%, rgba(255,215,110,0.08) 35%, transparent 60%)
          `,
        }}
      />

      {/* ── Warm ambient radial glows ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 70% 50% at 30% 15%, rgba(255,220,130,0.22) 0%, rgba(200,164,91,0.08) 45%, transparent 70%),
            radial-gradient(ellipse 55% 40% at 75% 25%, rgba(255,235,160,0.14) 0%, rgba(216,180,108,0.06) 40%, transparent 65%),
            radial-gradient(ellipse 80% 35% at 50% 100%, rgba(200,164,91,0.10) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Background dust layer (slowest parallax) ── */}
      {mounted && (
        <div
          ref={bgLayerRef}
          style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
        >
          {MOTES_BG.map(m => (
            <div
              key={m.id}
              className="warm-mote"
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.size}px`,
                height: `${m.size * 0.8}px`,
                borderRadius: m.br,
                background: m.color,
                filter: `blur(${m.blur}px)`,
                animationName: 'warmMoteDrift',
                animationDuration: `${m.dur}s`,
                animationDelay: `${m.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                ['--mo-lo' as string]: `${m.opacity * 0.35}`,
                ['--mo-mid' as string]: `${m.opacity * 0.65}`,
                ['--mo-hi' as string]: `${m.opacity}`,
                ['--mo-dx' as string]: `${m.driftX}px`,
                ['--mo-dy' as string]: `${m.driftY}px`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Mid dust layer ── */}
      {mounted && (
        <div
          ref={midLayerRef}
          style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
        >
          {MOTES_MID.map(m => (
            <div
              key={m.id}
              className="warm-mote"
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.size * 0.75}px`,
                height: `${m.size * 0.6}px`,
                borderRadius: m.br,
                background: m.color,
                filter: `blur(${m.blur * 0.7}px)`,
                animationName: 'warmMoteDrift',
                animationDuration: `${m.dur * 0.85}s`,
                animationDelay: `${m.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                ['--mo-lo' as string]: `${m.opacity * 0.4}`,
                ['--mo-mid' as string]: `${m.opacity * 0.7}`,
                ['--mo-hi' as string]: `${m.opacity * 1.1}`,
                ['--mo-dx' as string]: `${m.driftX * 0.7}px`,
                ['--mo-dy' as string]: `${m.driftY * 0.8}px`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Foreground glitter sparkles (fastest parallax) ── */}
      {mounted && (
        <div
          ref={fgLayerRef}
          style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
        >
          {/* Foreground dust motes */}
          {MOTES_FG.map(m => (
            <div
              key={m.id}
              className="warm-mote"
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.size * 0.55}px`,
                height: `${m.size * 0.45}px`,
                borderRadius: m.br,
                background: m.color,
                filter: `blur(${m.blur * 0.4}px)`,
                animationName: 'warmMoteDrift',
                animationDuration: `${m.dur * 0.7}s`,
                animationDelay: `${m.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                ['--mo-lo' as string]: `${m.opacity * 0.5}`,
                ['--mo-mid' as string]: `${m.opacity * 0.8}`,
                ['--mo-hi' as string]: `${m.opacity * 1.2}`,
                ['--mo-dx' as string]: `${m.driftX * 0.5}px`,
                ['--mo-dy' as string]: `${m.driftY * 0.6}px`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Glitter sparkle flashes */}
          {SPARKLES.map(sp => (
            <div
              key={sp.id}
              className="warm-sparkle"
              style={{
                position: 'absolute',
                left: `${sp.x}%`,
                top: `${sp.y}%`,
                width: `${sp.size}px`,
                height: `${sp.size}px`,
                borderRadius: '50%',
                background: 'rgba(255,248,210,1)',
                boxShadow: `0 0 ${sp.size * 2}px ${sp.size * 0.8}px rgba(212,185,120,0.4)`,
                animationName: 'warmGlitterFlash',
                animationDuration: `${sp.dur}s`,
                animationDelay: `${sp.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                ['--sp-lo' as string]: `${sp.opacity * 0.15}`,
                ['--sp-mid' as string]: `${sp.opacity * 0.5}`,
                ['--sp-hi' as string]: `${sp.opacity}`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Soft vignette to keep edges warm ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 110% 110% at 50% 50%, transparent 55%, rgba(200,164,91,0.06) 75%, rgba(168,116,69,0.10) 100%)`,
        }}
      />
    </div>
  );
}
