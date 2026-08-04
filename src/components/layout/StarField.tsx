'use client';

import React, { useMemo } from 'react';

interface StarData {
  id: string;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const STAR_COUNT = 120;

function generateStars(): StarData[] {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: `star-${i + 1}`,
    top: `${(i * 7.3 + 13) % 100}%`,
    left: `${(i * 11.7 + 5) % 100}%`,
    size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.5 : 1,
    duration: 2 + (i % 4),
    delay: (i % 30) * 0.1,
    opacity: 0.2 + (i % 5) * 0.15,
  }));
}

export default function StarField() {
  const stars = useMemo(() => generateStars(), []);

  return (
    <div className="starfield-bg" aria-hidden="true">
      <div className="milky-way" />
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}