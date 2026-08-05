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

// Dust mote data — fixed to avoid hydration mismatch
const HERO_MOTES = [
  { x: 8,  y: 14, size: 2.8, dur: 22, delay: 0,   opacity: 0.28 },
  { x: 22, y: 38, size: 1.9, dur: 28, delay: 3,   opacity: 0.20 },
  { x: 38, y: 18, size: 3.2, dur: 19, delay: 6,   opacity: 0.24 },
  { x: 55, y: 65, size: 2.1, dur: 32, delay: 1.5, opacity: 0.18 },
  { x: 70, y: 28, size: 1.6, dur: 25, delay: 4,   opacity: 0.22 },
  { x: 84, y: 75, size: 2.5, dur: 17, delay: 7,   opacity: 0.20 },
  { x: 30, y: 82, size: 1.7, dur: 35, delay: 2,   opacity: 0.16 },
  { x: 48, y: 10, size: 2.3, dur: 21, delay: 8,   opacity: 0.26 },
  { x: 65, y: 90, size: 2.0, dur: 30, delay: 5,   opacity: 0.18 },
  { x: 15, y: 58, size: 2.6, dur: 24, delay: 9,   opacity: 0.22 },
  { x: 90, y: 22, size: 1.8, dur: 27, delay: 2.5, opacity: 0.20 },
  { x: 4,  y: 44, size: 2.2, dur: 33, delay: 6.5, opacity: 0.17 },
  { x: 76, y: 48, size: 1.5, dur: 20, delay: 11,  opacity: 0.24 },
  { x: 42, y: 72, size: 2.9, dur: 26, delay: 4.5, opacity: 0.19 },
  { x: 58, y: 32, size: 1.4, dur: 38, delay: 0.8, opacity: 0.15 },
  { x: 93, y: 60, size: 2.4, dur: 23, delay: 7.5, opacity: 0.21 },
  { x: 25, y: 95, size: 1.6, dur: 29, delay: 3.5, opacity: 0.16 },
  { x: 68, y: 5,  size: 2.0, dur: 18, delay: 10,  opacity: 0.23 },
];

// Botanical floating elements
const BOTANICALS = [
  { top: '7%',  left: '5%',   symbol: '❧', size: 26, opacity: 0.14, dur: 18, delay: 0,   rot: -15 },
  { top: '10%', right: '6%',  symbol: '✿', size: 20, opacity: 0.12, dur: 22, delay: 4,   rot: 12  },
  { top: '42%', left: '3%',   symbol: '❦', size: 16, opacity: 0.11, dur: 26, delay: 8,   rot: 5   },
  { top: '35%', right: '4%',  symbol: '✽', size: 14, opacity: 0.13, dur: 20, delay: 2,   rot: -8  },
  { top: '72%', left: '7%',   symbol: '⚜', size: 18, opacity: 0.16, dur: 24, delay: 6,   rot: 10  },
  { top: '78%', right: '8%',  symbol: '❁', size: 15, opacity: 0.12, dur: 30, delay: 3,   rot: -12 },
  { top: '55%', left: '1%',   symbol: '✾', size: 12, opacity: 0.10, dur: 28, delay: 11,  rot: 20  },
  { top: '20%', right: '2%',  symbol: '❃', size: 13, opacity: 0.11, dur: 16, delay: 5,   rot: -5  },
];

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
          lightRef.current.style.transform = `translateY(${scrollY * 0.05}px)`;
        }
        if (dustRef.current) {
          dustRef.current.style.transform = `translateY(${scrollY * 0.03}px)`;
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
      style={{ background: 'transparent' }}
    >
      {/* ── Layer 1: Morning light wash from upper-left ── */}
      <div
        ref={lightRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {/* Primary morning light — upper left wash */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '75%',
            height: '90%',
            background: 'radial-gradient(ellipse 70% 65% at 15% 10%, rgba(255,228,160,0.28) 0%, rgba(255,210,120,0.14) 35%, rgba(240,195,100,0.06) 60%, transparent 80%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Secondary warm fill — upper right */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '55%',
            height: '70%',
            background: 'radial-gradient(ellipse 60% 55% at 85% 8%, rgba(255,218,140,0.18) 0%, rgba(245,200,110,0.09) 40%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />
        {/* Honey-gold ambient center warmth */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '20%',
            width: '60%',
            height: '55%',
            background: 'radial-gradient(ellipse 80% 60% at 50% 15%, rgba(255,225,150,0.14) 0%, rgba(220,180,100,0.07) 50%, transparent 75%)',
            filter: 'blur(16px)',
          }}
        />
        {/* Warm floor reflection */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '15%',
            width: '70%',
            height: '35%',
            background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(210,175,110,0.10) 0%, transparent 65%)',
            filter: 'blur(14px)',
          }}
        />
        {/* Antique gold highlight — left edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,220,140,0.08) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ── Layer 2: Floating dust motes ── */}
      {mounted && (
        <div
          ref={dustRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        >
          {HERO_MOTES.map((mote, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(220,175,80,0.9) 0%, rgba(200,155,60,0.5) 60%, transparent 100%)',
                opacity: mote.opacity,
                animation: `heroMoteDrift ${mote.dur}s ease-in-out infinite`,
                animationDelay: `${mote.delay}s`,
                boxShadow: `0 0 ${mote.size * 2.5}px rgba(210,165,70,0.35)`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Layer 3: Botanical / decorative accents ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} aria-hidden="true">
        {BOTANICALS.map((b, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: b.top,
              left: 'left' in b ? (b as any).left : undefined,
              right: 'right' in b ? (b as any).right : undefined,
              fontSize: `${b.size}px`,
              opacity: b.opacity,
              transform: `rotate(${b.rot}deg)`,
              animation: `heroBotanicalFloat ${b.dur}s ease-in-out infinite`,
              animationDelay: `${b.delay}s`,
              color: '#8B6030',
              filter: 'sepia(0.3)',
            }}
          >
            {b.symbol}
          </div>
        ))}

        {/* Illuminated manuscript top ornament */}
        <div
          className="absolute"
          style={{
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            opacity: 0.18,
            letterSpacing: '0.6em',
            color: '#B8903F',
            fontFamily: 'serif',
            whiteSpace: 'nowrap',
          }}
        >
          ✦ · · · ✦ · · · ✦
        </div>

        {/* Thin gold rule lines — manuscript style */}
        <div
          className="absolute"
          style={{
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(200,164,91,0.25), transparent)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(200,164,91,0.2), transparent)',
          }}
        />
      </div>

      {/* ── Layer 4: Parchment edge vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 4,
          background: `
            radial-gradient(ellipse 110% 110% at 50% 50%, transparent 45%, rgba(185,150,95,0.08) 70%, rgba(165,130,80,0.16) 100%),
            radial-gradient(ellipse 130% 25% at 50% 0%, rgba(240,220,180,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 130% 20% at 50% 100%, rgba(210,180,130,0.12) 0%, transparent 55%)
          `,
        }}
        aria-hidden="true"
      />

      {/* ── Layer 5: Hero content — title page of a collector's edition ── */}
      <div className="relative flex flex-col items-center justify-center text-center" style={{ zIndex: 5 }}>
        {/* Eyebrow label — manuscript header */}
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-6 font-sans"
          style={{ color: 'var(--primary-bright)', letterSpacing: '0.22em', opacity: 0.85 }}
        >
          ❧ Discover Your Next Favorite Story ❧
        </p>

        {/* Logo — the bookstore title page centrepiece */}
        <div
          className="flex justify-center mb-8"
          style={{
            filter: 'drop-shadow(0 6px 28px rgba(200,164,91,0.22)) drop-shadow(0 2px 10px rgba(75,53,42,0.12))',
          }}
        >
          <AppImage
            src="/assets/images/Untitled_design__7_-1785917477724.png"
            alt="Daddee's Shelf — cozy independent bookstore logo"
            width={280}
            height={280}
            className="object-contain"
            style={{ mixBlendMode: 'multiply' } as React.CSSProperties}
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
                  border: '1px solid rgba(200,164,91,0.28)',
                  boxShadow: '0 2px 16px rgba(75,53,42,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(8px)',
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
        style={{ zIndex: 5, animation: 'heroBotanicalFloat 4s ease-in-out infinite', animationDelay: '1s' }}
        aria-hidden="true"
      >
        <div className="w-px h-12 mx-auto" style={{ background: 'linear-gradient(180deg, var(--primary), transparent)' }} />
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes heroMoteDrift {
          0%,  100% { transform: translate(0px, 0px) scale(1); }
          20%        { transform: translate(5px, -12px) scale(1.1); }
          40%        { transform: translate(-4px, -7px) scale(0.9); }
          60%        { transform: translate(7px, -18px) scale(1.05); }
          80%        { transform: translate(-2px, -10px) scale(0.95); }
        }
        @keyframes heroBotanicalFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
          33%       { transform: translateY(-5px) rotate(calc(var(--rot, 0deg) + 1.5deg)); }
          66%       { transform: translateY(-2px) rotate(calc(var(--rot, 0deg) - 1deg)); }
        }
      `}</style>
    </section>
  );
}