import React from 'react';

export const AmasLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Black circular background */}
    <circle cx="100" cy="100" r="96" fill="#111111" stroke="#E53935" strokeWidth="4" />
    
    {/* Red spoon / swoosh arc */}
    <path d="M55 145 C 30 115, 30 75, 75 45 C 105 30, 145 40, 165 65" stroke="#E53935" strokeWidth="10" strokeLinecap="round" />
    
    {/* Red spoon head */}
    <circle cx="62" cy="125" r="14" fill="#E53935" />
    <ellipse cx="62" cy="125" rx="10" ry="12" fill="#E53935" />

    {/* Fork on the right */}
    <path d="M152 75 L 152 135 M 145 75 L 145 100 M 159 75 L 159 100" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    
    {/* Bold Red 'A' in the center */}
    <text x="100" y="78" fontFamily="Outfit, sans-serif" fontSize="58" fontWeight="900" fill="#E53935" textAnchor="middle">A</text>
    
    {/* MA'S FOOD & BITES banner */}
    <text x="100" y="105" fontFamily="Outfit, sans-serif" fontSize="14" fontWeight="800" fill="#FFFFFF" letterSpacing="1.5" textAnchor="middle">MA'S</text>
    <text x="100" y="125" fontFamily="Outfit, sans-serif" fontSize="12" fontWeight="800" fill="#E53935" letterSpacing="1" textAnchor="middle">FOOD & BITES</text>
  </svg>
);
