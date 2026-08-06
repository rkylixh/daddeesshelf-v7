'use client';

import React, { memo } from 'react';
import Image from 'next/image';

interface AppLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  variant?: 'full' | 'outline';
}

const AppLogo = memo(function AppLogo({ size = 64, className = '', onClick, variant = 'full' }: AppLogoProps) {
  const src = '/assets/images/Untitled_design__7_-1785917477724.png';

  return (
    <div
      className={`flex items-center flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <Image
        src={src}
        alt="Daddee's Shelf logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  );
});

export default AppLogo;
