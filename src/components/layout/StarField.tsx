'use client';

import React from 'react';

export default function StarField() {
  return (
    <div className="starfield-bg" aria-hidden="true">
      {/* Papyrus base — warm aged parchment */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, #FBF6EC 0%, #F6EDDC 40%, #F1E4CE 70%, #EBDBC4 100%)',
        }}
      />

      {/* Subtle papyrus fiber texture via SVG noise */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Warm center glow — sunlight through windows */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(255,220,140,0.10) 0%, rgba(200,164,91,0.04) 55%, transparent 80%)',
        }}
      />

      {/* Soft edge vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 100% 100% at 50% 50%,
              transparent 55%,
              rgba(120,80,40,0.05) 75%,
              rgba(90,55,25,0.10) 90%,
              rgba(65,35,12,0.16) 100%
            )
          `,
        }}
      />
    </div>
  );
}
