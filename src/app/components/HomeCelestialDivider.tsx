import React from 'react';

interface Props {
  label: string;
}

export default function HomeCelestialDivider({ label }: Props) {
  return (
    <div className="celestial-divider content-wrapper">
      <span className="text-sm tracking-widest font-sans" style={{ color: 'var(--primary-bright)', letterSpacing: '0.18em' }}>
        ❧ {label} ❧
      </span>
    </div>
  );
}