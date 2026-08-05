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

// Dust mote data — generated once on mount to avoid hydration mismatch
const DUST_MOTES = [
  { x: 12, y: 18, size: 2.5, dur: 14, delay: 0, opacity: 0.35 },
  { x: 28, y: 45, size: 1.8, dur: 18, delay: 2, opacity: 0.25 },
  { x: 45, y: 22, size: 3, dur: 12, delay: 4, opacity: 0.3 },
  { x: 62, y: 60, size: 2, dur: 20, delay: 1, opacity: 0.2 },
  { x: 78, y: 35, size: 1.5, dur: 16, delay: 3, opacity: 0.28 },
  { x: 88, y: 72, size: 2.8, dur: 11, delay: 5, opacity: 0.22 },
  { x: 35, y: 80, size: 1.6, dur: 22, delay: 0.5, opacity: 0.18 },
  { x: 55, y: 15, size: 2.2, dur: 15, delay: 6, opacity: 0.32 },
  { x: 72, y: 88, size: 1.9, dur: 19, delay: 2.5, opacity: 0.2 },
  { x: 18, y: 65, size: 2.4, dur: 13, delay: 7, opacity: 0.26 },
  { x: 92, y: 28, size: 1.7, dur: 17, delay: 1.5, opacity: 0.24 },
  { x: 5, y: 50, size: 2.1, dur: 21, delay: 4.5, opacity: 0.19 },
  { x: 50, y: 92, size: 1.4, dur: 14, delay: 8, opacity: 0.22 },
  { x: 82, y: 55, size: 2.6, dur: 16, delay: 3.5, opacity: 0.28 },
  { x: 40, y: 38, size: 1.3, dur: 23, delay: 6.5, opacity: 0.16 },
];

export default function HomeHero({ stats }: HomeHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const shelvesRef = useRef<HTMLDivElement>(null);
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
        if (shelvesRef.current) {
          shelvesRef.current.style.transform = `translateY(${scrollY * 0.18}px)`;
        }
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
      style={{ background: '#FBF5EC' }}
    >
      {/* ── Layer 1: Far background — blurred antique bookshelves ── */}
      <div
        ref={shelvesRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {/* Left shelf wall */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                rgba(139,90,43,0.06) 0px,
                rgba(139,90,43,0.06) 2px,
                transparent 2px,
                transparent 52px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(101,65,30,0.04) 0px,
                rgba(101,65,30,0.04) 1px,
                transparent 1px,
                transparent 28px
              ),
              linear-gradient(180deg, rgba(232,210,178,0.55) 0%, rgba(215,190,155,0.45) 50%, rgba(200,170,130,0.4) 100%)
            `,
            filter: 'blur(1.5px)',
          }}
        />
        {/* Right shelf wall */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                rgba(139,90,43,0.06) 0px,
                rgba(139,90,43,0.06) 2px,
                transparent 2px,
                transparent 52px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(101,65,30,0.04) 0px,
                rgba(101,65,30,0.04) 1px,
                transparent 1px,
                transparent 28px
              ),
              linear-gradient(180deg, rgba(215,190,155,0.45) 0%, rgba(200,170,130,0.4) 50%, rgba(185,155,115,0.35) 100%)
            `,
            filter: 'blur(1.5px)',
          }}
        />
        {/* Book spines on left shelves */}
        {[8, 18, 28, 38, 48, 58, 68, 78, 88].map((top, i) => (
          <React.Fragment key={`ls-${i}`}>
            <div
              className="absolute"
              style={{
                left: `${3 + (i % 4) * 5}%`,
                top: `${top}%`,
                width: `${14 + (i % 3) * 6}px`,
                height: `${70 + (i % 5) * 20}px`,
                background: [
                  'rgba(139,90,43,0.18)',
                  'rgba(101,65,30,0.14)',
                  'rgba(168,116,69,0.16)',
                  'rgba(120,80,40,0.12)',
                  'rgba(155,100,55,0.15)',
                ][i % 5],
                borderRadius: '2px',
                filter: 'blur(0.8px)',
              }}
            />
          </React.Fragment>
        ))}
        {/* Book spines on right shelves */}
        {[5, 15, 25, 35, 45, 55, 65, 75, 85].map((top, i) => (
          <React.Fragment key={`rs-${i}`}>
            <div
              className="absolute"
              style={{
                right: `${3 + (i % 4) * 5}%`,
                top: `${top}%`,
                width: `${12 + (i % 3) * 7}px`,
                height: `${65 + (i % 5) * 22}px`,
                background: [
                  'rgba(168,116,69,0.16)',
                  'rgba(139,90,43,0.14)',
                  'rgba(101,65,30,0.18)',
                  'rgba(155,100,55,0.12)',
                  'rgba(120,80,40,0.15)',
                ][i % 5],
                borderRadius: '2px',
                filter: 'blur(0.8px)',
              }}
            />
          </React.Fragment>
        ))}
        {/* Shelf planks */}
        {[20, 40, 60, 80].map((top, i) => (
          <React.Fragment key={`plank-${i}`}>
            <div
              className="absolute left-0 w-1/3"
              style={{
                top: `${top}%`,
                height: '3px',
                background: 'rgba(101,65,30,0.12)',
                filter: 'blur(0.5px)',
              }}
            />
            <div
              className="absolute right-0 w-1/3"
              style={{
                top: `${top}%`,
                height: '3px',
                background: 'rgba(101,65,30,0.12)',
                filter: 'blur(0.5px)',
              }}
            />
          </React.Fragment>
        ))}
        {/* Parchment texture overlay on shelves */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 40% 100% at 0% 50%, rgba(247,239,225,0.6) 0%, transparent 70%),
              radial-gradient(ellipse 40% 100% at 100% 50%, rgba(247,239,225,0.5) 0%, transparent 70%)
            `,
          }}
        />
      </div>

      {/* ── Layer 2: Warm sunbeam light rays ── */}
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
            background: 'linear-gradient(160deg, rgba(255,220,140,0.22) 0%, rgba(255,200,100,0.12) 30%, transparent 65%)',
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
            background: 'linear-gradient(155deg, rgba(255,235,160,0.15) 0%, rgba(255,215,120,0.08) 40%, transparent 70%)',
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
            background: 'radial-gradient(ellipse 80% 70% at 50% 20%, rgba(255,220,140,0.18) 0%, rgba(200,164,91,0.08) 50%, transparent 75%)',
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
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(200,164,91,0.12) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
      </div>

      {/* ── Layer 3: Floating dust motes ── */}
      {mounted && (
        <div
          ref={dustRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={{ zIndex: 3 }}
          aria-hidden="true"
        >
          {DUST_MOTES.map((mote, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                borderRadius: '50%',
                background: 'rgba(200,164,91,0.7)',
                opacity: mote.opacity,
                animation: `heroMoteDrift ${mote.dur}s ease-in-out infinite`,
                animationDelay: `${mote.delay}s`,
                boxShadow: `0 0 ${mote.size * 2}px rgba(200,164,91,0.4)`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Layer 4: Botanical / decorative accents ── */}
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

      {/* ── Layer 5: Parchment vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 5,
          background: `
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(200,170,130,0.12) 70%, rgba(180,145,100,0.22) 100%),
            radial-gradient(ellipse 120% 30% at 50% 0%, rgba(247,239,225,0.4) 0%, transparent 60%),
            radial-gradient(ellipse 120% 20% at 50% 100%, rgba(220,195,160,0.3) 0%, transparent 60%)
          `,
        }}
        aria-hidden="true"
      />

      {/* ── Layer 6: Hero content ── */}
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
                  background: 'rgba(247,239,225,0.85)',
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

      {/* ── Keyframe styles injected inline ── */}
      <style>{`
        @keyframes heroMoteDrift {
          0%, 100% { transform: translate(0px, 0px); opacity: var(--base-opacity, 0.25); }
          20% { transform: translate(6px, -14px); opacity: calc(var(--base-opacity, 0.25) * 1.4); }
          40% { transform: translate(-4px, -8px); opacity: calc(var(--base-opacity, 0.25) * 0.8); }
          60% { transform: translate(8px, -20px); opacity: calc(var(--base-opacity, 0.25) * 1.2); }
          80% { transform: translate(-2px, -12px); opacity: calc(var(--base-opacity, 0.25) * 0.9); }
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