'use client';

import React from 'react';
import AppImage from '@/components/ui/AppImage';

interface HomeHeroProps {
  stats?: {
    titlesAvailable: number;
    activeBatchCount: number;
    lowestPrice: number;
    wishlistCount: number;
  } | null;
}

export default function HomeHero({ stats }: HomeHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Warm morning sunlight glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 65% at 50% 30%, rgba(200,164,91,0.18) 0%, rgba(168,116,69,0.08) 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      {/* Parchment texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(232,216,195,0.3) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 80% 20%, rgba(247,239,229,0.25) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      {/* Botanical / ornamental floating accents */}
      <div className="absolute top-20 left-1/4 text-2xl animate-float" style={{ color: 'var(--primary)', animationDelay: '0s', opacity: 0.45 }} aria-hidden="true">❧</div>
      <div className="absolute top-32 right-1/4 text-sm animate-float" style={{ color: 'var(--accent-light)', animationDelay: '1s', opacity: 0.4 }} aria-hidden="true">✿</div>
      <div className="absolute bottom-32 left-1/3 text-lg animate-float" style={{ color: 'var(--primary)', animationDelay: '2s', opacity: 0.35 }} aria-hidden="true">⚜</div>
      <div className="absolute bottom-20 right-1/3 text-xl animate-float" style={{ color: 'var(--accent)', animationDelay: '0.5s', opacity: 0.3 }} aria-hidden="true">✾</div>
      <div className="absolute top-1/2 left-10 text-xs animate-float" style={{ color: 'var(--primary)', animationDelay: '1.5s', opacity: 0.4 }} aria-hidden="true">❦</div>
      <div className="absolute top-1/3 right-10 text-base animate-float" style={{ color: 'var(--accent-light)', animationDelay: '0.8s', opacity: 0.35 }} aria-hidden="true">✽</div>

      {/* Hero content */}
      <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up">
        <p className="text-xs font-semibold uppercase tracking-widest mb-6 font-sans" style={{ color: 'var(--primary-bright)', letterSpacing: '0.22em' }}>
          ❧ Your Cozy Independent Bookstore ❧
        </p>

        {/* Logo — white background removed via mix-blend-multiply */}
        <div className="flex justify-center mb-8">
          <AppImage
            src="/assets/images/Untitled_design__7_-1785917477724.png"
            alt="Daddee's Shelf — cozy independent bookstore logo"
            width={260}
            height={260}
            className="object-contain drop-shadow-lg"
            style={{ mixBlendMode: 'multiply' } as React.CSSProperties}
            priority
          />
        </div>

        <p className="text-lg sm:text-xl font-light mb-2 font-display italic" style={{ color: 'var(--foreground-muted)' }}>
          Your cozy corner for pre-loved and pre-ordered books
        </p>

        <p className="text-sm mb-10 max-w-lg mx-auto font-serif" style={{ color: 'var(--foreground-subtle)', lineHeight: '1.8' }}>
          Carefully curated titles for Filipino readers — from epic fantasy to heartwarming fiction,
          all delivered to your door.
        </p>

        {/* Dynamic Stats */}
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
                  background: 'rgba(243,231,213,0.7)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 12px rgba(75,53,42,0.1)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <p className="font-display text-xl font-bold" style={{ color: 'var(--primary-bright)' }}>{stat.value}</p>
                <p className="text-xs mt-0.5 font-sans" style={{ color: 'var(--foreground-muted)' }}>{stat.label}</p>
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