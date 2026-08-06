'use client';

import React, { useEffect, useRef, useState } from 'react';

// Deterministic sparkle data
interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  dur: number;
  delay: number;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildSparkles(count: number, offset: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => {
    const s = offset + i * 13;
    const r = (n: number) => seededRand(s + n);
    return {
      id: `sparkle-${offset}-${i}`,
      x: r(0) * 100,
      y: r(1) * 100,
      size: 0.8 + r(2) * 2.2,
      opacity: 0.25 + r(3) * 0.65,
      dur: 2.5 + r(4) * 5,
      delay: r(5) * 8,
    };
  });
}

const SPARKLES_SM = buildSparkles(80, 0);
const SPARKLES_LG = buildSparkles(20, 1000);

const SPARKLE_KEYFRAMES = `
@keyframes sparkleTwinkle {
  0%, 100% { opacity: var(--sp-op-lo); transform: scale(1); }
  50%       { opacity: var(--sp-op-hi); transform: scale(1.4); }
}
@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0px) scale(1); opacity: var(--sp-op-lo); }
  33%       { transform: translateY(-6px) scale(1.1); opacity: var(--sp-op-hi); }
  66%       { transform: translateY(-3px) scale(0.95); opacity: var(--sp-op-mid); }
}
@media (prefers-reduced-motion: reduce) {
  .sparkle-dot { animation: none !important; }
}
`;

function injectSparkleKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sparkle-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'sparkle-keyframes';
  style.textContent = SPARKLE_KEYFRAMES;
  document.head.appendChild(style);
}

export default function StarField() {
  const [mounted, setMounted] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectSparkleKeyframes();
    setMounted(true);
  }, []);

  // Subtle parallax on scroll
  useEffect(() => {
    if (!mounted) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (layerRef.current) {
          layerRef.current.style.transform = `translateY(${window.scrollY * 0.08}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted]);

  return (
    <div className="starfield-bg" aria-hidden="true">
      {/* Deep space base — dark navy/purple like the reference */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, #0d0b1a 0%, #110e24 30%, #0e0c1e 60%, #0a0816 100%)',
        }}
      />

      {/* Subtle nebula glow — soft purple/indigo in the center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 75% 55% at 50% 35%, rgba(80,50,140,0.18) 0%, rgba(50,30,100,0.08) 50%, transparent 75%),
            radial-gradient(ellipse 50% 40% at 20% 70%, rgba(60,40,110,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 40% 35% at 80% 20%, rgba(70,45,120,0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Moving sparkle layer */}
      {mounted && (
        <div
          ref={layerRef}
          style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
        >
          {/* Small twinkling stars */}
          {SPARKLES_SM.map(sp => (
            <div
              key={sp.id}
              className="sparkle-dot"
              style={{
                position: 'absolute',
                left: `${sp.x}%`,
                top: `${sp.y}%`,
                width: `${sp.size}px`,
                height: `${sp.size}px`,
                borderRadius: '50%',
                background: sp.size > 2 ? 'rgba(200,190,255,1)' : 'rgba(255,255,255,1)',
                animationName: 'sparkleTwinkle',
                animationDuration: `${sp.dur}s`,
                animationDelay: `${sp.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                ['--sp-op-lo' as string]: `${sp.opacity * 0.3}`,
                ['--sp-op-mid' as string]: `${sp.opacity * 0.6}`,
                ['--sp-op-hi' as string]: `${sp.opacity}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Larger glowing stars */}
          {SPARKLES_LG.map(sp => (
            <div
              key={sp.id}
              className="sparkle-dot"
              style={{
                position: 'absolute',
                left: `${sp.x}%`,
                top: `${sp.y}%`,
                width: `${sp.size + 1}px`,
                height: `${sp.size + 1}px`,
                borderRadius: '50%',
                background: 'rgba(220,210,255,1)',
                boxShadow: `0 0 ${sp.size * 3}px ${sp.size}px rgba(160,140,255,0.35)`,
                animationName: 'sparkleFloat',
                animationDuration: `${sp.dur + 2}s`,
                animationDelay: `${sp.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationFillMode: 'both',
                ['--sp-op-lo' as string]: `${sp.opacity * 0.25}`,
                ['--sp-op-mid' as string]: `${sp.opacity * 0.55}`,
                ['--sp-op-hi' as string]: `${sp.opacity}`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Soft vignette edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(5,3,12,0.4) 80%, rgba(3,2,8,0.7) 100%)`,
        }}
      />
    </div>
  );
}
