'use client';

import React, { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Deterministic particle data — generated once, no Math.random() in render
// ---------------------------------------------------------------------------

interface DustParticle {
  id: string;
  x: number;   // % left
  y: number;   // % top
  size: number; // px
  opacity: number;
  dur: number;  // animation duration s
  delay: number; // animation delay s
  driftX: number; // horizontal drift px
  driftY: number; // vertical drift px
  blur: number;  // px
  color: string;
}

// Warm dust palette — ivory, champagne, antique gold, soft cream
const DUST_COLORS = [
  'rgba(255,248,230,1)',   // ivory
  'rgba(245,235,200,1)',   // champagne
  'rgba(212,185,120,1)',   // antique gold
  'rgba(255,252,240,1)',   // soft cream
  'rgba(230,210,160,1)',   // warm wheat
];

function seededRand(seed: number): number {
  // Simple deterministic pseudo-random (LCG)
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildLayer(count: number, seedOffset: number, sizeRange: [number, number], opacityRange: [number, number], durRange: [number, number], blurRange: [number, number]): DustParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const s = seedOffset + i * 7;
    const r = (n: number) => seededRand(s + n);
    return {
      id: `dust-${seedOffset}-${i}`,
      x: r(0) * 100,
      y: r(1) * 100,
      size: sizeRange[0] + r(2) * (sizeRange[1] - sizeRange[0]),
      opacity: opacityRange[0] + r(3) * (opacityRange[1] - opacityRange[0]),
      dur: durRange[0] + r(4) * (durRange[1] - durRange[0]),
      delay: r(5) * 20,
      driftX: (r(6) - 0.5) * 30,
      driftY: -(20 + r(7) * 40),
      blur: blurRange[0] + r(8) * (blurRange[1] - blurRange[0]),
      color: DUST_COLORS[Math.floor(r(9) * DUST_COLORS.length)],
    };
  });
}

// Three depth layers
const LAYER_BG   = buildLayer(28, 100, [1, 2.5],   [0.04, 0.10], [22, 38], [0.5, 1.5]);
const LAYER_MID  = buildLayer(22, 300, [1.5, 3.5], [0.06, 0.14], [16, 28], [0.3, 1.0]);
const LAYER_FG   = buildLayer(14, 600, [2, 4],     [0.08, 0.18], [12, 20], [0.0, 0.6]);

// ---------------------------------------------------------------------------
// Keyframe injection (once)
// ---------------------------------------------------------------------------

const KEYFRAMES = `
@keyframes ambientDrift {
  0%   { transform: translate(0px, 0px) scale(1);     opacity: var(--d-op-start); }
  25%  { transform: translate(var(--d-x2), var(--d-y2)) scale(1.05); }
  50%  { transform: translate(var(--d-x3), var(--d-y3)) scale(0.95); opacity: var(--d-op-mid); }
  75%  { transform: translate(var(--d-x4), var(--d-y4)) scale(1.02); }
  100% { transform: translate(var(--d-dx), var(--d-dy)) scale(1);    opacity: var(--d-op-start); }
}
@media (prefers-reduced-motion: reduce) {
  .ambient-dust-particle { animation: none !important; opacity: 0 !important; }
}
`;

function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ambient-dust-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'ambient-dust-keyframes';
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Single particle
// ---------------------------------------------------------------------------

function Particle({ p, parallaxFactor }: { p: DustParticle; parallaxFactor: number }) {
  // Intermediate drift waypoints for organic motion
  const x2 = p.driftX * 0.3;
  const y2 = p.driftY * 0.25;
  const x3 = p.driftX * 0.6 + (p.driftX > 0 ? -8 : 8);
  const y3 = p.driftY * 0.55;
  const x4 = p.driftX * 0.85;
  const y4 = p.driftY * 0.8;

  return (
    <div
      className="ambient-dust-particle"
      style={{
        position: 'absolute',
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: `${p.size}px`,
        height: `${p.size * (0.6 + seededRand(p.x * 13) * 0.8)}px`, // irregular shape
        borderRadius: `${40 + seededRand(p.y * 7) * 40}% ${60 - seededRand(p.x * 3) * 20}% ${50 + seededRand(p.y * 11) * 30}% ${45 + seededRand(p.x * 17) * 25}%`,
        background: p.color,
        opacity: p.opacity,
        filter: `blur(${p.blur}px)`,
        willChange: 'transform, opacity',
        animationName: 'ambientDrift',
        animationDuration: `${p.dur}s`,
        animationDelay: `${p.delay}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationFillMode: 'both',
        // CSS custom properties for keyframe waypoints
        ['--d-dx' as string]: `${p.driftX}px`,
        ['--d-dy' as string]: `${p.driftY}px`,
        ['--d-x2' as string]: `${x2}px`,
        ['--d-y2' as string]: `${y2}px`,
        ['--d-x3' as string]: `${x3}px`,
        ['--d-y3' as string]: `${y3}px`,
        ['--d-x4' as string]: `${x4}px`,
        ['--d-y4' as string]: `${y4}px`,
        ['--d-op-start' as string]: `${p.opacity}`,
        ['--d-op-mid' as string]: `${p.opacity * 0.55}`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Layer wrapper with parallax scroll
// ---------------------------------------------------------------------------

function DustLayer({ particles, parallaxFactor, zIndex }: { particles: DustParticle[]; parallaxFactor: number; zIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = `translateY(${window.scrollY * parallaxFactor}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [parallaxFactor]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        willChange: 'transform',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {particles.map(p => (
        <Particle key={p.id} p={p} parallaxFactor={parallaxFactor} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface AmbientDustProps {
  /** Pass true for admin pages — uses lower opacity for subtlety */
  subtle?: boolean;
}

export default function AmbientDust({ subtle = false }: AmbientDustProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    injectKeyframes();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Subtle mode for admin: reduce particle counts via opacity wrapper
  const wrapperStyle: React.CSSProperties = subtle
    ? { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.45 }
    : { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 1 };

  return (
    <div style={wrapperStyle} aria-hidden="true">
      {/* Background layer — slowest parallax */}
      <DustLayer particles={LAYER_BG}  parallaxFactor={-0.015} zIndex={1} />
      {/* Mid layer */}
      <DustLayer particles={LAYER_MID} parallaxFactor={-0.030} zIndex={2} />
      {/* Foreground layer — fastest parallax */}
      <DustLayer particles={LAYER_FG}  parallaxFactor={-0.050} zIndex={3} />
    </div>
  );
}
