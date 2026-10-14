import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

/**
 * BrandLogo component
 * To easily replace this logo with your own custom logo:
 * Simply replace the file 'public/logo.svg' or add 'public/logo.png' in the project!
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-7 h-7', size = 28 }) => {
  const [imgError, setImgError] = useState(false);

  // If a custom image exists in public/ (e.g. /logo.svg), it is loaded directly
  if (!imgError) {
    return (
      <img
        src="/logo.svg"
        alt="OpenArt Hub Logo"
        width={size}
        height={size}
        className={`${className} object-contain rounded-md flex-shrink-0 transition-transform hover:scale-105`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Built-in fallback modern vector logo
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${className} flex-shrink-0`}
      aria-hidden
    >
      <defs>
        <linearGradient id="fallback-logo-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="fallback-logo-g2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill="#0d1117" stroke="url(#fallback-logo-g1)" strokeWidth="2.5" />
      <path d="M19 45 L19 19 L37 32 Z" fill="url(#fallback-logo-g1)" opacity="0.95" />
      <path d="M45 19 L45 45 L27 32 Z" fill="url(#fallback-logo-g2)" opacity="0.9" />
      <circle cx="32" cy="32" r="5" fill="#ffffff" />
    </svg>
  );
};
