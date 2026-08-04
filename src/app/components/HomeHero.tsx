'use client';

import React from 'react';

import AppLogo from '@/components/ui/AppLogo';

interface SiteStats {
  titlesAvailable: number;
  activeBatchCount: number;
  lowestPrice: number;
  wishlistCount: number;
}

interface HomeHeroProps {
  stats?: SiteStats | null;
}

export default function HomeHero({ stats }: HomeHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Radial glow behind hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      {/* Decorative stars */}
      <div className="absolute top-20 left-1/4 text-2xl animate-float" style={{ color: 'var(--primary)', animationDelay: '0s' }} aria-hidden="true">✦</div>
      <div className="absolute top-32 right-1/4 text-sm animate-float" style={{ color: 'var(--accent-light)', animationDelay: '1s' }} aria-hidden="true">✧</div>
      <div className="absolute bottom-32 left-1/3 text-lg animate-float" style={{ color: 'var(--primary-bright)', animationDelay: '2s' }} aria-hidden="true">✤</div>
      <div className="absolute bottom-20 right-1/3 text-xl animate-float" style={{ color: 'var(--accent)', animationDelay: '0.5s' }} aria-hidden="true">★</div>
      <div className="absolute top-1/2 left-10 text-xs animate-float" style={{ color: 'var(--primary)', animationDelay: '1.5s' }} aria-hidden="true">✦</div>
      <div className="absolute top-1/3 right-10 text-base animate-float" style={{ color: 'var(--accent-light)', animationDelay: '0.8s' }} aria-hidden="true">✧</div>

      {/* Hero content */}
      <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up">
        <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--primary)', letterSpacing: '0.2em' }}>
          ✦ Your Cozy Online Bookstore ✦
        </p>

        {/* Official Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="rounded-full p-5 animate-glow-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
              boxShadow: '0 0 80px rgba(139,92,246,0.3)',
            }}
          >
            <AppLogo size={200} className="drop-shadow-lg" />
          </div>
        </div>

        <p className="text-lg sm:text-xl font-light mb-2 font-display italic" style={{ color: 'var(--foreground-muted)' }}>
          Your cozy corner for pre-loved and pre-ordered books
        </p>

        <p className="text-sm mb-10 max-w-lg mx-auto" style={{ color: 'var(--foreground-subtle)', lineHeight: '1.7' }}>
          Carefully curated titles for Filipino readers — from epic fantasy to heartwarming fiction,
          all delivered to your door.
        </p>

        {/* Dynamic Stats — no preorder count per Master Appendix */}
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
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <p className="font-display text-xl font-bold" style={{ color: 'var(--primary-bright)' }}>{stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="w-px h-12 mx-auto" style={{ background: 'linear-gradient(180deg, var(--primary), transparent)' }} aria-hidden="true" />
      </div>
    </section>
  );
}