'use client';

import React, { useEffect, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';

interface HomeHeroProps {
  stats?: {
    titlesAvailable: number;
    activeBatchCount: number;
    lowestPrice: number;
    wishlistCount: number;
  } | null;
}

// Deterministic vintage star/lustre particles — no Math.random() in render
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const STAR_PARTICLES = Array.from({ length: 60 }, (_, i) => {
  const r = (n: number) => seededRand(i * 13 + n);
  return {
    id: i,
    x: r(0) * 100,
    y: r(1) * 100,
    size: 1 + r(2) * 3,          // 1–4px
    opacity: 0.08 + r(3) * 0.22, // 8–30% — subtle
    dur: 10 + r(4) * 20,         // 10–30s drift
    delay: r(5) * 15,
    driftX: (r(6) - 0.5) * 40,
    driftY: -(15 + r(7) * 35),
    // Warm vintage palette: ivory, champagne, antique gold, cream
    color: [
      'rgba(255,248,220,1)',
      'rgba(245,232,190,1)',
      'rgba(212,185,120,1)',
      'rgba(255,252,235,1)',
      'rgba(230,210,155,1)',
    ][Math.floor(r(8) * 5)],
    blur: r(9) * 1.2,
    // Irregular shape via border-radius
    br: `${40 + r(10) * 30}% ${60 - r(11) * 20}% ${50 + r(12) * 25}% ${45 + r(13) * 20}%`,
  };
});

export default function HomeHero({ stats }: HomeHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (lightRef.current) {
          lightRef.current.style.transform = `translateY(${scrollY * 0.06}px)`;
        }
        if (dustRef.current) {
          dustRef.current.style.transform = `translateY(${scrollY * 0.04}px)`;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{ background: 'rgba(251,245,236,0.55)' }}
    >
      {/* ── Layer 1: Warm sunbeam light rays ── */}
      <div
        ref={lightRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      >
        {/* Primary sunbeam from upper-left window */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '15%',
            width: '45%',
            height: '120%',
            background: 'linear-gradient(160deg, rgba(255,220,140,0.18) 0%, rgba(255,200,100,0.09) 30%, transparent 65%)',
            transform: 'rotate(-8deg)',
            transformOrigin: 'top left',
            filter: 'blur(18px)',
          }}
        />
        {/* Secondary softer beam */}
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            left: '30%',
            width: '35%',
            height: '100%',
            background: 'linear-gradient(155deg, rgba(255,235,160,0.12) 0%, rgba(255,215,120,0.06) 40%, transparent 70%)',
            transform: 'rotate(-5deg)',
            transformOrigin: 'top left',
            filter: 'blur(24px)',
          }}
        />
        {/* Warm ambient glow — center */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            height: '60%',
            background: 'radial-gradient(ellipse 80% 70% at 50% 20%, rgba(255,220,140,0.14) 0%, rgba(200,164,91,0.06) 50%, transparent 75%)',
            filter: 'blur(8px)',
          }}
        />
        {/* Floor warm glow */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '20%',
            width: '60%',
            height: '30%',
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,164,91,0.10) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
      </div>

      {/* ── Layer 2: Floating vintage lustre dust / star particles ── */}
      {mounted && (
        <div
          ref={dustRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={{ zIndex: 3 }}
          aria-hidden="true"
        >
          {STAR_PARTICLES.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size * 0.85}px`,
                borderRadius: p.br,
                background: p.color,
                opacity: p.opacity,
                filter: `blur(${p.blur}px)`,
                animation: `heroLustreDrift ${p.dur}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Layer 3: Botanical / decorative accents ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }} aria-hidden="true">
        {/* Top-left pressed flower */}
        <div
          className="absolute"
          style={{
            top: '8%',
            left: '6%',
            fontSize: '28px',
            opacity: 0.18,
            transform: 'rotate(-15deg)',
            filter: 'sepia(0.4)',
            animation: 'heroBotanicalFloat 12s ease-in-out infinite',
            animationDelay: '0s',
            color: '#8B5E3C',
          }}
        >❧</div>
        {/* Top-right botanical */}
        <div
          className="absolute"
          style={{
            top: '12%',
            right: '7%',
            fontSize: '22px',
            opacity: 0.15,
            transform: 'rotate(12deg)',
            animation: 'heroBotanicalFloat 15s ease-in-out infinite',
            animationDelay: '3s',
            color: '#7A5230',
          }}
        >✿</div>
        {/* Bottom-left gold flourish */}
        <div
          className="absolute"
          style={{
            bottom: '15%',
            left: '8%',
            fontSize: '20px',
            opacity: 0.2,
            transform: 'rotate(8deg)',
            animation: 'heroBotanicalFloat 18s ease-in-out infinite',
            animationDelay: '6s',
            color: '#C8A45B',
          }}
        >⚜</div>
        {/* Bottom-right ornament */}
        <div
          className="absolute"
          style={{
            bottom: '20%',
            right: '9%',
            fontSize: '18px',
            opacity: 0.16,
            transform: 'rotate(-10deg)',
            animation: 'heroBotanicalFloat 14s ease-in-out infinite',
            animationDelay: '2s',
            color: '#A87445',
          }}
        >✾</div>
        {/* Mid-left quill */}
        <div
          className="absolute"
          style={{
            top: '45%',
            left: '4%',
            fontSize: '16px',
            opacity: 0.14,
            animation: 'heroBotanicalFloat 20s ease-in-out infinite',
            animationDelay: '9s',
            color: '#8B5E3C',
          }}
        >❦</div>
        {/* Mid-right ornament */}
        <div
          className="absolute"
          style={{
            top: '38%',
            right: '5%',
            fontSize: '14px',
            opacity: 0.18,
            animation: 'heroBotanicalFloat 16s ease-in-out infinite',
            animationDelay: '4s',
            color: '#C8A45B',
          }}
        >✽</div>
        {/* Wax seal hint — top center */}
        <div
          className="absolute"
          style={{
            top: '6%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            opacity: 0.12,
            letterSpacing: '0.5em',
            color: '#A87445',
            fontFamily: 'serif',
          }}
        >— ✦ —</div>
      </div>

      {/* ── Layer 4: Light parchment vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 5,
          background: `
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(200,170,130,0.08) 70%, rgba(180,145,100,0.15) 100%),
            radial-gradient(ellipse 120% 30% at 50% 0%, rgba(247,239,225,0.25) 0%, transparent 60%),
            radial-gradient(ellipse 120% 20% at 50% 100%, rgba(220,195,160,0.2) 0%, transparent 60%)
          `,
        }}
        aria-hidden="true"
      />

      {/* ── Layer 5: Hero content ── */}
      <div className="relative flex flex-col items-center justify-center text-center" style={{ zIndex: 6 }}>
        {/* Eyebrow label */}
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-6 font-sans"
          style={{ color: 'var(--primary-bright)', letterSpacing: '0.22em', opacity: 0.85 }}
        >
          ❧ Your Cozy Independent Bookstore ❧
        </p>

        {/* Logo — the bookstore sign above the door */}
        <div
          className="flex justify-center mb-8"
          style={{
            filter: 'drop-shadow(0 4px 24px rgba(200,164,91,0.25)) drop-shadow(0 2px 8px rgba(75,53,42,0.15))',
          }}
        >
          <AppImage
            src="/assets/images/Untitled_design__7_-1785917477724.png"
            alt="Daddee's Shelf — cozy independent bookstore logo"
            width={280}
            height={280}
            className="object-contain"
            priority
          />
        </div>

        {/* Tagline */}
        <p
          className="text-lg sm:text-xl font-light mb-2 font-display italic"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Your cozy corner for pre-loved and pre-ordered books
        </p>

        <p
          className="text-sm mb-10 max-w-lg mx-auto font-serif"
          style={{ color: 'var(--foreground-subtle)', lineHeight: '1.9' }}
        >
          Carefully curated titles for Filipino readers — from epic fantasy to heartwarming fiction,
          all delivered to your door.
        </p>

        {/* Dynamic Stats — library catalogue card style */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {[
              { label: 'Titles Available', value: stats.titlesAvailable.toLocaleString() },
              { label: 'Active Batches', value: stats.activeBatchCount.toLocaleString() },
              { label: 'Starting From', value: stats.lowestPrice > 0 ? `₱${stats.lowestPrice.toLocaleString()}` : '—' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-xl p-3 text-center"
                style={{
                  background: 'rgba(247,239,225,0.75)',
                  border: '1px solid rgba(200,164,91,0.3)',
                  boxShadow: '0 2px 16px rgba(75,53,42,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <p className="font-display text-xl font-bold" style={{ color: 'var(--primary-bright)' }}>{stat.value}</p>
                <p className="text-xs mt-0.5 font-sans" style={{ color: 'var(--foreground-muted)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Scroll indicator ── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ zIndex: 6, animation: 'heroBotanicalFloat 4s ease-in-out infinite', animationDelay: '1s' }}
        aria-hidden="true"
      >
        <div className="w-px h-12 mx-auto" style={{ background: 'linear-gradient(180deg, var(--primary), transparent)' }} />
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes heroLustreDrift {
          0%   { transform: translate(0px, 0px) scale(1); }
          20%  { transform: translate(5px, -12px) scale(1.05); }
          40%  { transform: translate(-4px, -7px) scale(0.95); }
          60%  { transform: translate(7px, -18px) scale(1.03); }
          80%  { transform: translate(-2px, -10px) scale(0.98); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes heroBotanicalFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
          33% { transform: translateY(-6px) rotate(calc(var(--rot, 0deg) + 2deg)); }
          66% { transform: translateY(-3px) rotate(calc(var(--rot, 0deg) - 1deg)); }
        }
      `}</style>
    </section>
  );
}