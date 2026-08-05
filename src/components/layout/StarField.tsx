'use client';

import React, { useMemo } from 'react';

// All particle data generated deterministically to avoid hydration mismatch
function generateParticles() {
  const motes = Array.from({ length: 38 }, (_, i) => ({
    id: `mote-${i}`,
    top: `${(i * 8.3 + 7) % 100}%`,
    left: `${(i * 13.7 + 3) % 100}%`,
    size: i % 6 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.1,
    duration: 18 + (i % 14),
    delay: (i % 38) * 0.55,
    opacity: 0.12 + (i % 5) * 0.05,
    driftX: ((i % 7) - 3) * 4,
    driftY: -8 - (i % 6) * 3,
  }));

  const petals = Array.from({ length: 8 }, (_, i) => ({
    id: `petal-${i}`,
    top: `${(i * 17 + 5) % 85}%`,
    left: `${(i * 23 + 8) % 92}%`,
    duration: 28 + (i % 10),
    delay: i * 3.5,
    opacity: 0.08 + (i % 3) * 0.04,
    symbol: ['✿', '❀', '✾', '❁', '✽', '❃', '✿', '❀'][i % 8],
    rotate: (i * 45) % 360,
    size: 8 + (i % 4) * 3,
  }));

  return { motes, petals };
}

const { motes, petals } = generateParticles();

export default function StarField() {
  return (
    <div className="parchment-bg" aria-hidden="true">
      {/* ── Continuous parchment base — one seamless warm sheet ── */}
      <div className="parchment-base" />

      {/* ── Morning light wash from upper-left ── */}
      <div className="morning-light" />

      {/* ── Secondary warm ambient from upper-right ── */}
      <div className="ambient-right" />

      {/* ── Honey-gold center warmth ── */}
      <div className="center-warmth" />

      {/* ── Soft vignette edges — aged paper feel ── */}
      <div className="paper-vignette" />

      {/* ── Floating dust motes ── */}
      {motes.map(mote => (
        <div
          key={mote.id}
          className="dust-mote"
          style={{
            top: mote.top,
            left: mote.left,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            opacity: mote.opacity,
            animationDuration: `${mote.duration}s`,
            animationDelay: `${mote.delay}s`,
            '--drift-x': `${mote.driftX}px`,
            '--drift-y': `${mote.driftY}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* ── Drifting botanical petals ── */}
      {petals.map(petal => (
        <div
          key={petal.id}
          className="drifting-petal"
          style={{
            top: petal.top,
            left: petal.left,
            fontSize: `${petal.size}px`,
            opacity: petal.opacity,
            animationDuration: `${petal.duration}s`,
            animationDelay: `${petal.delay}s`,
            transform: `rotate(${petal.rotate}deg)`,
          }}
        >
          {petal.symbol}
        </div>
      ))}

      {/* ── Antique book corner flourishes ── */}
      <div className="corner-flourish corner-tl">❧</div>
      <div className="corner-flourish corner-tr">❧</div>
      <div className="corner-flourish corner-bl">❦</div>
      <div className="corner-flourish corner-br">❦</div>
    </div>
  );
}