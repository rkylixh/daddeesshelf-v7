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

      {/* ── Warm aged parchment base ── */}
      <div className="parchment-base" />

      {/* ── Morning light wash ── */}
      <div className="morning-light" />

      {/* ── Honey-gold center warmth ── */}
      <div className="center-warmth" />

      {/* ── Soft top/bottom vignette ── */}
      <div className="paper-vignette" />

      {/* ══════════════════════════════════════════
          SCROLL ROLLED EDGES — top and bottom
          Cylindrical roll effect like a real scroll
      ══════════════════════════════════════════ */}

      {/* Top rolled edge */}
      <div className="scroll-roll scroll-roll-top" />

      {/* Bottom rolled edge */}
      <div className="scroll-roll scroll-roll-bottom" />

      {/* ══════════════════════════════════════════
          BURNT / CHARRED RAGGED SIDE EDGES
          Dark, organic, fire-scorched look
      ══════════════════════════════════════════ */}

      {/* Left burnt edge — SVG with dark charred organic shape */}
      <svg
        className="scroll-burnt-edge scroll-burnt-left"
        viewBox="0 0 120 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leftBurntGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stopColor="#1A0A00" stopOpacity="1" />
            <stop offset="35%" stopColor="#2E1200" stopOpacity="0.92" />
            <stop offset="60%" stopColor="#4A2000" stopOpacity="0.65" />
            <stop offset="80%" stopColor="#6B3A10" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#8B5520" stopOpacity="0" />
          </linearGradient>
          <filter id="leftBurntBlur">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.02" numOctaves="4" seed="2" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        {/* Main dark burnt mass */}
        <path
          d="M 0,0
             L 85,0
             L 72,18  L 90,38  L 65,55  L 88,72  L 60,90  L 82,110
             L 68,130 L 91,148 L 63,168 L 86,185 L 58,205 L 84,222
             L 66,242 L 89,260 L 61,280 L 87,298 L 64,318 L 90,335
             L 62,355 L 85,372 L 59,392 L 83,410 L 67,430 L 88,448
             L 60,468 L 86,485 L 63,505 L 89,522 L 61,542 L 84,560
             L 66,580 L 90,598 L 62,618 L 87,635 L 59,655 L 83,672
             L 65,692 L 88,710 L 60,730 L 85,748 L 63,768 L 89,785
             L 61,805 L 86,822 L 64,842 L 90,860 L 62,880 L 87,898
             L 65,918 L 88,935 L 60,955 L 84,972 L 70,990 L 80,1000
             L 0,1000
             Z"
          fill="url(#leftBurntGrad)"
        />
        {/* Charred inner edge detail — darker jagged line */}
        <path
          d="M 72,18  L 90,38  L 65,55  L 88,72  L 60,90  L 82,110
             L 68,130 L 91,148 L 63,168 L 86,185 L 58,205 L 84,222
             L 66,242 L 89,260 L 61,280 L 87,298 L 64,318 L 90,335
             L 62,355 L 85,372 L 59,392 L 83,410 L 67,430 L 88,448
             L 60,468 L 86,485 L 63,505 L 89,522 L 61,542 L 84,560
             L 66,580 L 90,598 L 62,618 L 87,635 L 59,655 L 83,672
             L 65,692 L 88,710 L 60,730 L 85,748 L 63,768 L 89,785
             L 61,805 L 86,822 L 64,842 L 90,860 L 62,880 L 87,898
             L 65,918 L 88,935 L 60,955 L 84,972"
          fill="none"
          stroke="rgba(80,30,5,0.5)"
          strokeWidth="2"
        />
        {/* Ember glow line at the torn edge */}
        <path
          d="M 72,18  L 90,38  L 65,55  L 88,72  L 60,90  L 82,110
             L 68,130 L 91,148 L 63,168 L 86,185 L 58,205 L 84,222
             L 66,242 L 89,260 L 61,280 L 87,298 L 64,318 L 90,335
             L 62,355 L 85,372 L 59,392 L 83,410 L 67,430 L 88,448
             L 60,468 L 86,485 L 63,505 L 89,522 L 61,542 L 84,560
             L 66,580 L 90,598 L 62,618 L 87,635 L 59,655 L 83,672
             L 65,692 L 88,710 L 60,730 L 85,748 L 63,768 L 89,785
             L 61,805 L 86,822 L 64,842 L 90,860 L 62,880 L 87,898
             L 65,918 L 88,935 L 60,955 L 84,972"
          fill="none"
          stroke="rgba(180,80,10,0.18)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Right burnt edge — mirror of left */}
      <svg
        className="scroll-burnt-edge scroll-burnt-right"
        viewBox="0 0 120 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rightBurntGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%"  stopColor="#1A0A00" stopOpacity="1" />
            <stop offset="35%" stopColor="#2E1200" stopOpacity="0.92" />
            <stop offset="60%" stopColor="#4A2000" stopOpacity="0.65" />
            <stop offset="80%" stopColor="#6B3A10" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#8B5520" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Mirror of left side */}
        <path
          d="M 120,0
             L 35,0
             L 48,18  L 30,38  L 55,55  L 32,72  L 60,90  L 38,110
             L 52,130 L 29,148 L 57,168 L 34,185 L 62,205 L 36,222
             L 54,242 L 31,260 L 59,280 L 33,298 L 56,318 L 30,335
             L 58,355 L 35,372 L 61,392 L 37,410 L 53,430 L 32,448
             L 60,468 L 34,485 L 57,505 L 31,522 L 59,542 L 36,560
             L 54,580 L 30,598 L 58,618 L 33,635 L 61,655 L 37,672
             L 55,692 L 32,710 L 60,730 L 35,748 L 57,768 L 31,785
             L 59,805 L 34,822 L 56,842 L 30,860 L 58,880 L 33,898
             L 55,918 L 32,935 L 60,955 L 36,972 L 50,990 L 40,1000
             L 120,1000
             Z"
          fill="url(#rightBurntGrad)"
        />
        <path
          d="M 48,18  L 30,38  L 55,55  L 32,72  L 60,90  L 38,110
             L 52,130 L 29,148 L 57,168 L 34,185 L 62,205 L 36,222
             L 54,242 L 31,260 L 59,280 L 33,298 L 56,318 L 30,335
             L 58,355 L 35,372 L 61,392 L 37,410 L 53,430 L 32,448
             L 60,468 L 34,485 L 57,505 L 31,522 L 59,542 L 36,560
             L 54,580 L 30,598 L 58,618 L 33,635 L 61,655 L 37,672
             L 55,692 L 32,710 L 60,730 L 35,748 L 57,768 L 31,785
             L 59,805 L 34,822 L 56,842 L 30,860 L 58,880 L 33,898
             L 55,918 L 32,935 L 60,955 L 36,972"
          fill="none"
          stroke="rgba(80,30,5,0.5)"
          strokeWidth="2"
        />
        <path
          d="M 48,18  L 30,38  L 55,55  L 32,72  L 60,90  L 38,110
             L 52,130 L 29,148 L 57,168 L 34,185 L 62,205 L 36,222
             L 54,242 L 31,260 L 59,280 L 33,298 L 56,318 L 30,335
             L 58,355 L 35,372 L 61,392 L 37,410 L 53,430 L 32,448
             L 60,468 L 34,485 L 57,505 L 31,522 L 59,542 L 36,560
             L 54,580 L 30,598 L 58,618 L 33,635 L 61,655 L 37,672
             L 55,692 L 32,710 L 60,730 L 35,748 L 57,768 L 31,785
             L 59,805 L 34,822 L 56,842 L 30,860 L 58,880 L 33,898
             L 55,918 L 32,935 L 60,955 L 36,972"
          fill="none"
          stroke="rgba(180,80,10,0.18)"
          strokeWidth="1.5"
        />
      </svg>

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