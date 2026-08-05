'use client';

import React, { memo } from 'react';
import Image from 'next/image';

interface AppLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

const AppLogo = memo(function AppLogo({ size = 64, className = '', onClick }: AppLogoProps) {
  return (
    <div
      className={`flex items-center flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <Image
        src="/assets/images/image-1785915949797.png"
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
