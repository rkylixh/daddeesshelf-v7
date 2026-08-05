'use client';

import React, { useMemo } from 'react';

interface DustData {
  id: string;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const DUST_COUNT = 80;

function generateDust(): DustData[] {
  return Array.from({ length: DUST_COUNT }, (_, i) => ({
    id: `dust-${i + 1}`,
    top: `${(i * 7.3 + 13) % 100}%`,
    left: `${(i * 11.7 + 5) % 100}%`,
    size: i % 7 === 0 ? 2 : i % 4 === 0 ? 1.5 : 1,
    duration: 6 + (i % 8),
    delay: (i % 40) * 0.15,
    opacity: 0.08 + (i % 5) * 0.06,
  }));
}

export default function StarField() {
  const dust = useMemo(() => generateDust(), []);

  return (
    <div className="starfield-bg" aria-hidden="true">
      <div className="milky-way" />
      {dust.map(particle => (
        <div
          key={particle.id}
          className="star"
          style={{
            top: particle.top,
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            background: 'var(--star-color)',
          }}
        />
      ))}
    </div>
  );
}