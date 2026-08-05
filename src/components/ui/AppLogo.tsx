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
  const src = variant === 'outline' ?'/assets/images/ChatGPT_Image_Aug_5__2026__03_55_49_PM-1785916605536.png' :'/assets/images/ChatGPT_Image_Aug_5__2026__03_56_22_PM-1785916609214.png';

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
        style={{ mixBlendMode: 'multiply' }}
        priority
      />
    </div>
  );
});

export default AppLogo;
