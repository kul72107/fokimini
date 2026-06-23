import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const LogoCatHacker: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cat face */}
    <ellipse cx="64" cy="72" rx="36" ry="32" fill="#7C3AED" stroke="#000" strokeWidth="4" />
    {/* Left ear */}
    <path d="M32 48L28 20L52 36" fill="#7C3AED" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
    <path d="M32 48L30 28L48 38" fill="#F472B6" />
    {/* Right ear */}
    <path d="M96 48L100 20L76 36" fill="#7C3AED" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
    <path d="M96 48L98 28L80 38" fill="#F472B6" />
    {/* Inner ear pink */}
    <path d="M36 46L34 32L48 40" fill="#F472B6" />
    <path d="M92 46L94 32L80 40" fill="#F472B6" />
    {/* Star on forehead */}
    <polygon points="64,44 66,50 72,50 67,54 69,60 64,56 59,60 61,54 56,50 62,50" fill="#FACC15" stroke="#000" strokeWidth="2" />
    {/* Hacker goggles */}
    <rect x="32" y="60" width="28" height="20" rx="8" fill="#1F1F1F" stroke="#000" strokeWidth="3" />
    <rect x="68" y="60" width="28" height="20" rx="8" fill="#1F1F1F" stroke="#000" strokeWidth="3" />
    <rect x="58" y="66" width="12" height="4" fill="#1F1F1F" stroke="#000" strokeWidth="2" />
    {/* Eye shine */}
    <circle cx="42" cy="68" r="4" fill="#60A5FA" />
    <circle cx="44" cy="66" r="2" fill="#FFF" />
    <circle cx="86" cy="68" r="4" fill="#60A5FA" />
    <circle cx="88" cy="66" r="2" fill="#FFF" />
    {/* Nose */}
    <ellipse cx="64" cy="82" rx="5" ry="4" fill="#F472B6" stroke="#000" strokeWidth="2" />
    {/* Mouth */}
    <path d="M56 88C58 92 60 94 64 94C68 94 70 92 72 88" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Whiskers */}
    <line x1="28" y1="76" x2="44" y2="80" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    <line x1="26" y1="84" x2="44" y2="84" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="80" x2="100" y2="76" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="84" x2="102" y2="84" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    {/* Hoodie */}
    <path d="M28 96C28 96 20 108 16 120C16 120 32 124 64 124C96 124 112 120 112 120C108 108 100 96 100 96" fill="#5B21B6" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
    {/* Drawstrings */}
    <line x1="52" y1="100" x2="50" y2="112" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    <line x1="76" y1="100" x2="78" y2="112" stroke="#000" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const PawDecoration: React.FC<IconProps & { fill?: string }> = ({ className = '', size = 200, fill = '#A78BFA' }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Main pad - heart shaped */}
    <path d="M100 180C80 180 40 160 40 120C40 90 65 70 100 70C135 70 160 90 160 120C160 160 120 180 100 180Z" fill={fill} stroke="#000" strokeWidth="4" />
    {/* Toe pad 1 */}
    <ellipse cx="55" cy="55" rx="22" ry="26" fill={fill} stroke="#000" strokeWidth="4" />
    {/* Toe pad 2 */}
    <ellipse cx="100" cy="38" rx="22" ry="28" fill={fill} stroke="#000" strokeWidth="4" />
    {/* Toe pad 3 */}
    <ellipse cx="145" cy="55" rx="22" ry="26" fill={fill} stroke="#000" strokeWidth="4" />
  </svg>
);

export const PawCursor: React.FC<IconProps> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 28L6 4L14 10L16 6L22 12L24 8L28 20L26 22L28 24L24 28L22 26L20 30L10 28Z" fill="#7C3AED" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const IconPasswordGame: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="24" y="48" width="80" height="64" rx="12" fill="#7C3AED" stroke="#000" strokeWidth="4" />
    <rect x="40" y="16" width="48" height="40" rx="20" fill="#FACC15" stroke="#000" strokeWidth="4" />
    <circle cx="64" cy="80" r="12" fill="#FACC15" stroke="#000" strokeWidth="3" />
    <circle cx="64" cy="80" r="5" fill="#000" />
    {/* Cat face on lock */}
    <circle cx="52" cy="72" r="3" fill="#FFF" />
    <circle cx="76" cy="72" r="3" fill="#FFF" />
    <ellipse cx="64" cy="78" rx="3" ry="2" fill="#F472B6" />
  </svg>
);

export const IconPhishingGame: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="16" y="40" width="80" height="56" rx="8" fill="#F472B6" stroke="#000" strokeWidth="4" />
    <polygon points="16,40 56,80 96,40" fill="#F9A8D4" stroke="#000" strokeWidth="3" />
    <circle cx="72" cy="64" r="16" fill="#FACC15" stroke="#000" strokeWidth="3" />
    <text x="66" y="70" fontSize="18" fontWeight="bold" fill="#000">!</text>
    {/* Hook */}
    <path d="M100 16L100 48" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <path d="M100 16C108 16 112 22 112 28C112 34 108 38 100 38" stroke="#60A5FA" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Waves */}
    <path d="M20 112C30 104 40 112 50 112C60 112 70 104 80 112" stroke="#60A5FA" strokeWidth="3" fill="none" />
    <path d="M30 120C40 112 50 120 60 120C70 120 80 112 90 120" stroke="#60A5FA" strokeWidth="3" fill="none" />
  </svg>
);

export const IconFirewallGame: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Brick wall */}
    <rect x="16" y="32" width="96" height="80" rx="4" fill="#FB923C" stroke="#000" strokeWidth="4" />
    <line x1="16" y1="56" x2="112" y2="56" stroke="#000" strokeWidth="3" />
    <line x1="16" y1="80" x2="112" y2="80" stroke="#000" strokeWidth="3" />
    <line x1="48" y1="32" x2="48" y2="56" stroke="#000" strokeWidth="3" />
    <line x1="80" y1="32" x2="80" y2="56" stroke="#000" strokeWidth="3" />
    <line x1="32" y1="56" x2="32" y2="80" stroke="#000" strokeWidth="3" />
    <line x1="64" y1="56" x2="64" y2="80" stroke="#000" strokeWidth="3" />
    <line x1="96" y1="56" x2="96" y2="80" stroke="#000" strokeWidth="3" />
    <line x1="48" y1="80" x2="48" y2="104" stroke="#000" strokeWidth="3" />
    <line x1="80" y1="80" x2="80" y2="104" stroke="#000" strokeWidth="3" />
    {/* Shield */}
    <path d="M64 12C64 12 44 20 44 36C44 56 64 72 64 72C64 72 84 56 84 36C84 20 64 12 64 12Z" fill="#FACC15" stroke="#000" strokeWidth="3" />
    {/* Cat emblem on shield */}
    <circle cx="64" cy="40" r="8" fill="#7C3AED" stroke="#000" strokeWidth="2" />
    <circle cx="60" cy="38" r="2" fill="#FFF" />
    <circle cx="68" cy="38" r="2" fill="#FFF" />
    {/* Flame */}
    <path d="M90 48C98 40 106 48 102 56C108 52 114 60 106 68" fill="#EF4444" stroke="#000" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconEncryptionGame: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Scroll */}
    <rect x="28" y="24" width="56" height="80" rx="8" fill="#DDD6FE" stroke="#000" strokeWidth="4" />
    <rect x="28" y="24" width="56" height="16" rx="8" fill="#C4B5FD" stroke="#000" strokeWidth="4" />
    {/* Scrambled letters */}
    <text x="38" y="64" fontSize="12" fontWeight="bold" fill="#7C3AED" fontFamily="monospace">KHOOR</text>
    <text x="38" y="80" fontSize="12" fontWeight="bold" fill="#7C3AED" fontFamily="monospace">ZRUOG</text>
    {/* Arrow */}
    <path d="M88 56L104 56M104 56L96 48M104 56L96 64" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Lock */}
    <rect x="84" y="64" width="28" height="24" rx="6" fill="#FACC15" stroke="#000" strokeWidth="3" />
    <rect x="92" y="52" width="12" height="16" rx="6" fill="#FACC15" stroke="#000" strokeWidth="3" />
    <circle cx="98" cy="76" r="4" fill="#000" />
  </svg>
);

export const IconNetworkGame: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Globe */}
    <circle cx="64" cy="64" r="44" fill="#60A5FA" stroke="#000" strokeWidth="4" />
    <ellipse cx="64" cy="64" rx="20" ry="44" fill="none" stroke="#000" strokeWidth="2" />
    <line x1="20" y1="64" x2="108" y2="64" stroke="#000" strokeWidth="2" />
    <ellipse cx="64" cy="64" rx="36" ry="16" fill="none" stroke="#000" strokeWidth="2" />
    {/* Nodes with cat faces */}
    <circle cx="30" cy="40" r="12" fill="#7C3AED" stroke="#000" strokeWidth="3" />
    <circle cx="28" cy="38" r="2" fill="#FFF" />
    <circle cx="34" cy="38" r="2" fill="#FFF" />
    <circle cx="98" cy="40" r="12" fill="#F472B6" stroke="#000" strokeWidth="3" />
    <circle cx="96" cy="38" r="2" fill="#FFF" />
    <circle cx="102" cy="38" r="2" fill="#FFF" />
    <circle cx="30" cy="88" r="12" fill="#FACC15" stroke="#000" strokeWidth="3" />
    <circle cx="28" cy="86" r="2" fill="#FFF" />
    <circle cx="34" cy="86" r="2" fill="#FFF" />
    <circle cx="98" cy="88" r="12" fill="#4ADE80" stroke="#000" strokeWidth="3" />
    <circle cx="96" cy="86" r="2" fill="#FFF" />
    <circle cx="102" cy="86" r="2" fill="#FFF" />
    {/* Connection lines */}
    <line x1="42" y1="40" x2="86" y2="40" stroke="#000" strokeWidth="3" />
    <line x1="42" y1="88" x2="86" y2="88" stroke="#000" strokeWidth="3" />
    <line x1="30" y1="52" x2="30" y2="76" stroke="#000" strokeWidth="3" />
    <line x1="98" y1="52" x2="98" y2="76" stroke="#000" strokeWidth="3" />
  </svg>
);

export const IconMalwareGame: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Virus */}
    <circle cx="64" cy="64" r="24" fill="#4ADE80" stroke="#000" strokeWidth="4" />
    {/* Spikes */}
    <line x1="64" y1="32" x2="64" y2="16" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="64" y1="96" x2="64" y2="112" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="32" y1="64" x2="16" y2="64" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="96" y1="64" x2="112" y2="64" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="41" y1="41" x2="30" y2="30" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="87" y1="87" x2="98" y2="98" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="41" y1="87" x2="30" y2="98" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    <line x1="87" y1="41" x2="98" y2="30" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    {/* Face */}
    <circle cx="56" cy="58" r="4" fill="#000" />
    <circle cx="72" cy="58" r="4" fill="#000" />
    <circle cx="54" cy="56" r="1.5" fill="#FFF" />
    <circle cx="70" cy="56" r="1.5" fill="#FFF" />
    <ellipse cx="64" cy="70" rx="6" ry="4" fill="#EF4444" stroke="#000" strokeWidth="2" />
    {/* Net overlay */}
    <path d="M88 24L40 104" stroke="#F472B6" strokeWidth="4" strokeLinecap="round" />
    <path d="M96 32L48 112" stroke="#F472B6" strokeWidth="4" strokeLinecap="round" />
    <path d="M104 40L56 120" stroke="#F472B6" strokeWidth="4" strokeLinecap="round" />
    <line x1="40" y1="104" x2="104" y2="104" stroke="#F472B6" strokeWidth="3" />
    <line x1="48" y1="88" x2="112" y2="88" stroke="#F472B6" strokeWidth="3" />
  </svg>
);

export const IconTerminal: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Monitor body */}
    <rect x="16" y="20" width="96" height="72" rx="8" fill="#1F1F1F" stroke="#000" strokeWidth="4" />
    {/* Cat ears on monitor */}
    <path d="M32 20L28 4L48 16" fill="#7C3AED" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    <path d="M96 20L100 4L80 16" fill="#7C3AED" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    {/* Screen */}
    <rect x="24" y="28" width="80" height="52" rx="4" fill="#000" />
    {/* Terminal text */}
    <text x="32" y="48" fontFamily="monospace" fontSize="10" fill="#4ADE80">&gt; _</text>
    <text x="48" y="48" fontFamily="monospace" fontSize="10" fill="#A78BFA">ls</text>
    <text x="32" y="64" fontFamily="monospace" fontSize="8" fill="#FFF">missions/</text>
    {/* Stand */}
    <rect x="52" y="92" width="24" height="8" fill="#7C3AED" stroke="#000" strokeWidth="3" />
    <rect x="40" y="100" width="48" height="6" rx="3" fill="#7C3AED" stroke="#000" strokeWidth="3" />
    {/* Purple frame accent */}
    <rect x="16" y="20" width="96" height="8" rx="4" fill="#7C3AED" />
    <line x1="16" y1="28" x2="112" y2="28" stroke="#000" strokeWidth="2" />
  </svg>
);

export const IconLinuxPenguin: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Body */}
    <ellipse cx="64" cy="72" rx="32" ry="40" fill="#FFF" stroke="#000" strokeWidth="4" />
    {/* Head */}
    <ellipse cx="64" cy="36" rx="28" ry="24" fill="#FFF" stroke="#000" strokeWidth="4" />
    {/* Eyes */}
    <ellipse cx="52" cy="32" rx="8" ry="10" fill="#FFF" stroke="#000" strokeWidth="3" />
    <ellipse cx="76" cy="32" rx="8" ry="10" fill="#FFF" stroke="#000" strokeWidth="3" />
    <circle cx="54" cy="32" r="4" fill="#000" />
    <circle cx="78" cy="32" r="4" fill="#000" />
    <circle cx="55" cy="30" r="1.5" fill="#FFF" />
    <circle cx="79" cy="30" r="1.5" fill="#FFF" />
    {/* Beak */}
    <polygon points="60,40 68,40 64,48" fill="#F97316" stroke="#000" strokeWidth="2" />
    {/* Flippers */}
    <ellipse cx="28" cy="72" rx="10" ry="24" transform="rotate(20 28 72)" fill="#1F1F1F" stroke="#000" strokeWidth="3" />
    <ellipse cx="100" cy="72" rx="10" ry="24" transform="rotate(-20 100 72)" fill="#1F1F1F" stroke="#000" strokeWidth="3" />
    {/* Feet */}
    <ellipse cx="48" cy="112" rx="14" ry="8" fill="#F97316" stroke="#000" strokeWidth="3" />
    <ellipse cx="80" cy="112" rx="14" ry="8" fill="#F97316" stroke="#000" strokeWidth="3" />
    {/* Bandana */}
    <path d="M40 56C48 64 80 64 88 56L92 60C80 72 48 72 36 60L40 56Z" fill="#7C3AED" stroke="#000" strokeWidth="3" />
    {/* Paw prints on bandana */}
    <circle cx="56" cy="62" r="3" fill="#F472B6" />
    <circle cx="64" cy="64" r="3" fill="#F472B6" />
    <circle cx="72" cy="62" r="3" fill="#F472B6" />
  </svg>
);

export const BadgeStar: React.FC<IconProps> = ({ className = '', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="32,4 38,24 60,24 42,36 48,56 32,44 16,56 22,36 4,24 26,24" fill="#FACC15" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    <polygon points="32,12 36,26 50,26 38,34 42,48 32,40 22,48 26,34 14,26 28,26" fill="#FDE047" />
  </svg>
);

export const BadgePaw: React.FC<IconProps> = ({ className = '', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="28" fill="#7C3AED" stroke="#000" strokeWidth="3" />
    {/* Paw shape */}
    <ellipse cx="32" cy="38" rx="10" ry="9" fill="#A78BFA" stroke="#000" strokeWidth="2" />
    <circle cx="24" cy="28" r="5" fill="#A78BFA" stroke="#000" strokeWidth="2" />
    <circle cx="32" cy="24" r="5" fill="#A78BFA" stroke="#000" strokeWidth="2" />
    <circle cx="40" cy="28" r="5" fill="#A78BFA" stroke="#000" strokeWidth="2" />
    {/* Star center */}
    <polygon points="32,30 33,33 36,33 34,35 35,38 32,36 29,38 30,35 28,33 31,33" fill="#FACC15" />
  </svg>
);

export const BadgeShield: React.FC<IconProps> = ({ className = '', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 4C32 4 12 12 12 28C12 48 32 58 32 58C32 58 52 48 52 28C52 12 32 4 32 4Z" fill="#4ADE80" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    <path d="M32 10C32 10 18 16 18 28C18 44 32 52 32 52C32 52 46 44 46 28C46 16 32 10 32 10Z" fill="#86EFAC" />
    {/* Checkmark */}
    <path d="M22 30L28 38L42 22" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ConfettiPaw: React.FC<IconProps & { color?: string }> = ({ className = '', size = 24, color = '#7C3AED' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="12" cy="16" rx="6" ry="5" fill={color} stroke="#000" strokeWidth="2" />
    <circle cx="7" cy="9" r="3" fill={color} stroke="#000" strokeWidth="2" />
    <circle cx="12" cy="7" r="3" fill={color} stroke="#000" strokeWidth="2" />
    <circle cx="17" cy="9" r="3" fill={color} stroke="#000" strokeWidth="2" />
  </svg>
);

export const IconBackToTop: React.FC<IconProps> = ({ className = '', size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="20" fill="#7C3AED" stroke="#000" strokeWidth="3" />
    <path d="M16 28L24 18L32 28" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="14" cy="36" r="3" fill="#A78BFA" stroke="#000" strokeWidth="1.5" />
    <circle cx="34" cy="36" r="3" fill="#A78BFA" stroke="#000" strokeWidth="1.5" />
  </svg>
);
