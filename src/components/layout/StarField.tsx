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

// Deterministic ragged edge points for left side (torn paper / deckled edge)
// These are x,y pairs where x is the inward bite (0=edge, positive=inward)
// and y is the vertical position as a percentage of height
const LEFT_EDGE_POINTS = [
  [0,0],[18,3],[8,7],[22,11],[5,15],[16,19],[10,23],[24,27],[6,31],[19,35],
  [11,39],[23,43],[7,47],[17,51],[9,55],[21,59],[4,63],[18,67],[12,71],[25,75],
  [8,79],[20,83],[6,87],[15,91],[10,95],[0,100]
];

const RIGHT_EDGE_POINTS = [
  [0,0],[14,4],[6,8],[20,12],[9,16],[17,20],[5,24],[22,28],[11,32],[16,36],
  [7,40],[21,44],[4,48],[18,52],[10,56],[23,60],[8,64],[15,68],[12,72],[19,76],
  [6,80],[22,84],[9,88],[17,92],[5,96],[0,100]
];

function buildRaggedPath(points: number[][], side: 'left' | 'right', width: number): string {
  // Build an SVG path for a ragged torn-paper edge
  // The path covers the outer strip and has an organic inner edge
  if (side === 'left') {
    const inner = points.map(([x, y]) => `${x},${y}`).join(' L ');
    return `M 0,0 L ${inner} L 0,100 Z`;
  } else {
    const inner = points.map(([x, y]) => `${width - x},${y}`).join(' L ');
    return `M ${width},0 L ${inner} L ${width},100 Z`;
  }
}

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

      {/* ── Soft top/bottom vignette only — no side rectangles ── */}
      <div className="paper-vignette" />

      {/* ── Ragged deckled left edge — torn aged paper ── */}
      <svg
        className="deckled-edge deckled-left"
        viewBox="0 0 30 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leftEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C8A060" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#D4AA70" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#D4AA70" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Torn paper shadow/depth */}
        <path
          d="M 0,0 L 20,3 L 9,7 L 23,11 L 6,15 L 17,19 L 11,23 L 25,27 L 7,31 L 20,35 L 12,39 L 24,43 L 8,47 L 18,51 L 10,55 L 22,59 L 5,63 L 19,67 L 13,71 L 26,75 L 9,79 L 21,83 L 7,87 L 16,91 L 11,95 L 0,100 Z"
          fill="url(#leftEdgeGrad)"
        />
        {/* Subtle inner shadow line for depth */}
        <path
          d="M 20,3 L 9,7 L 23,11 L 6,15 L 17,19 L 11,23 L 25,27 L 7,31 L 20,35 L 12,39 L 24,43 L 8,47 L 18,51 L 10,55 L 22,59 L 5,63 L 19,67 L 13,71 L 26,75 L 9,79 L 21,83 L 7,87 L 16,91 L 11,95"
          fill="none"
          stroke="rgba(160,110,50,0.12)"
          strokeWidth="0.5"
        />
      </svg>

      {/* ── Ragged deckled right edge — torn aged paper ── */}
      <svg
        className="deckled-edge deckled-right"
        viewBox="0 0 30 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rightEdgeGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#C8A060" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#D4AA70" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#D4AA70" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 30,0 L 16,4 L 24,8 L 10,12 L 21,16 L 13,20 L 25,24 L 8,28 L 19,32 L 14,36 L 23,40 L 9,44 L 26,48 L 12,52 L 20,56 L 7,60 L 22,64 L 15,68 L 18,72 L 11,76 L 24,80 L 8,84 L 21,88 L 13,92 L 25,96 L 30,100 Z"
          fill="url(#rightEdgeGrad)"
        />
        <path
          d="M 16,4 L 24,8 L 10,12 L 21,16 L 13,20 L 25,24 L 8,28 L 19,32 L 14,36 L 23,40 L 9,44 L 26,48 L 12,52 L 20,56 L 7,60 L 22,64 L 15,68 L 18,72 L 11,76 L 24,80 L 8,84 L 21,88 L 13,92 L 25,96"
          fill="none"
          stroke="rgba(160,110,50,0.12)"
          strokeWidth="0.5"
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