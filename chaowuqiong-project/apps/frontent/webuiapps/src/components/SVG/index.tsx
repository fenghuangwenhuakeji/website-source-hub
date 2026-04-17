import React from 'react';

interface SVGProps {
  className?: string;
  size?: number | string;
  color?: string;
}

// Logo SVG
export const LogoSVG: React.FC<SVGProps> = ({ className, size = 40, color = '#667eea' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#logoGradient)" strokeWidth="2" fill="none" filter="url(#glow)" />
    <path
      d="M50 15 L65 40 L90 40 L70 58 L78 85 L50 68 L22 85 L30 58 L10 40 L35 40 Z"
      fill="url(#logoGradient)"
      filter="url(#glow)"
    />
    <circle cx="50" cy="50" r="8" fill="#fff" />
  </svg>
);

// AI Brain SVG
export const AIBrainSVG: React.FC<SVGProps> = ({ className, size = 120, color = '#667eea' }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="50%" stopColor="#764ba2" />
        <stop offset="100%" stopColor="#f093fb" />
      </linearGradient>
      <filter id="brainGlow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Brain outer shape */}
    <path
      d="M100 20 C140 20 170 50 170 100 C170 150 140 180 100 180 C60 180 30 150 30 100 C30 50 60 20 100 20"
      stroke="url(#brainGradient)"
      strokeWidth="3"
      fill="none"
      filter="url(#brainGlow)"
    />
    {/* Neural connections */}
    <g stroke="url(#brainGradient)" strokeWidth="2" fill="none" opacity="0.6">
      <path d="M50 60 Q75 80 100 60" />
      <path d="M100 60 Q125 80 150 60" />
      <path d="M50 100 Q75 120 100 100" />
      <path d="M100 100 Q125 120 150 100" />
      <path d="M50 140 Q75 120 100 140" />
      <path d="M100 140 Q125 120 150 140" />
    </g>
    {/* Neural nodes */}
    <g fill="url(#brainGradient)">
      <circle cx="50" cy="60" r="6" />
      <circle cx="100" cy="60" r="8" />
      <circle cx="150" cy="60" r="6" />
      <circle cx="50" cy="100" r="6" />
      <circle cx="100" cy="100" r="10" />
      <circle cx="150" cy="100" r="6" />
      <circle cx="50" cy="140" r="6" />
      <circle cx="100" cy="140" r="8" />
      <circle cx="150" cy="140" r="6" />
    </g>
    {/* Center glow */}
    <circle cx="100" cy="100" r="15" fill="url(#brainGradient)" opacity="0.3" filter="url(#brainGlow)" />
  </svg>
);

// Agent Avatar SVG
export const AgentAvatarSVG: React.FC<SVGProps & { type?: 'assistant' | 'creative' | 'analyst' | 'coder' }> = 
({ className, size = 80, type = 'assistant' }) => {
  const colors = {
    assistant: { primary: '#667eea', secondary: '#764ba2' },
    creative: { primary: '#f093fb', secondary: '#f5576c' },
    analyst: { primary: '#4facfe', secondary: '#00f2fe' },
    coder: { primary: '#43e97b', secondary: '#38f9d7' },
  };
  const { primary, secondary } = colors[type];

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`avatarGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <filter id={`avatarGlow-${type}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Background circle */}
      <circle cx="50" cy="50" r="45" fill={`url(#avatarGrad-${type})`} opacity="0.2" />
      <circle cx="50" cy="50" r="40" stroke={`url(#avatarGrad-${type})`} strokeWidth="2" fill="none" filter={`url(#avatarGlow-${type})`} />
      {/* Face */}
      <circle cx="35" cy="40" r="5" fill={primary} />
      <circle cx="65" cy="40" r="5" fill={primary} />
      <path d="M35 60 Q50 70 65 60" stroke={primary} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Type indicator */}
      <circle cx="50" cy="50" r="48" stroke={primary} strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

// Chat Bubble SVG
export const ChatBubbleSVG: React.FC<SVGProps & { isUser?: boolean }> = ({ className, size = 24, isUser = false }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id={isUser ? "userBubble" : "aiBubble"} x1="0%" y1="0%" x2="100%" y2="100%">
        {isUser ? (
          <>
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </>
        ) : (
          <>
            <stop offset="0%" stopColor="#f093fb" />
            <stop offset="100%" stopColor="#f5576c" />
          </>
        )}
      </linearGradient>
    </defs>
    <path
      d={isUser 
        ? "M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        : "M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H18L22 22V4C22 2.9 21.1 2 20 2Z"
      }
      fill={`url(#${isUser ? 'userBubble' : 'aiBubble'})`}
      opacity="0.2"
    />
    <path
      d={isUser 
        ? "M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        : "M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H18L22 22V4C22 2.9 21.1 2 20 2Z"
      }
      stroke={`url(#${isUser ? 'userBubble' : 'aiBubble'})`}
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

// Send Button SVG
export const SendButtonSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sendGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="20" fill="url(#sendGradient)" opacity="0.1" />
    <path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="url(#sendGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Recharge/Wallet SVG
export const WalletSVG: React.FC<SVGProps> = ({ className, size = 64 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fa709a" />
        <stop offset="100%" stopColor="#fee140" />
      </linearGradient>
      <filter id="walletGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="10" y="30" width="80" height="55" rx="8" stroke="url(#walletGradient)" strokeWidth="2" fill="none" filter="url(#walletGlow)" />
    <path d="M10 40H90" stroke="url(#walletGradient)" strokeWidth="2" />
    <circle cx="75" cy="57.5" r="10" stroke="url(#walletGradient)" strokeWidth="2" fill="none" />
    <circle cx="75" cy="57.5" r="4" fill="url(#walletGradient)" />
    <path d="M20 30V20C20 15 25 10 35 10H75C85 10 90 15 90 20V30" stroke="url(#walletGradient)" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
);

// Mobile Menu SVG
export const MobileMenuSVG: React.FC<SVGProps & { isOpen?: boolean }> = ({ className, size = 24, isOpen = false }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    {isOpen ? (
      <>
        <path d="M18 6L6 18" stroke="url(#menuGradient)" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 6L18 18" stroke="url(#menuGradient)" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M3 12H21" stroke="url(#menuGradient)" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 6H21" stroke="url(#menuGradient)" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 18H21" stroke="url(#menuGradient)" strokeWidth="2" strokeLinecap="round" />
      </>
    )}
  </svg>
);

// Background Pattern SVG
export const BackgroundPatternSVG: React.FC<SVGProps> = ({ className }) => (
  <svg
    className={className}
    width="100%"
    height="100%"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(102, 126, 234, 0.1)" strokeWidth="0.5" />
      </pattern>
      <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(102, 126, 234, 0.1)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <circle cx="50" cy="50" r="40" fill="url(#bgGradient)" />
  </svg>
);

// Crown SVG for VIP
export const CrownSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#ffaa00" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
      <filter id="crownGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M15 70 L25 35 L50 55 L75 35 L85 70 Z"
      fill="url(#crownGradient)"
      filter="url(#crownGlow)"
    />
    <circle cx="25" cy="35" r="6" fill="url(#crownGradient)" />
    <circle cx="50" cy="55" r="6" fill="url(#crownGradient)" />
    <circle cx="75" cy="35" r="6" fill="url(#crownGradient)" />
    <rect x="15" y="70" width="70" height="10" rx="2" fill="url(#crownGradient)" opacity="0.8" />
  </svg>
);

// Diamond SVG for Premium
export const DiamondSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d4ff" />
        <stop offset="50%" stopColor="#7b68ee" />
        <stop offset="100%" stopColor="#ff69b4" />
      </linearGradient>
      <filter id="diamondGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M50 10 L85 35 L50 90 L15 35 Z"
      fill="url(#diamondGradient)"
      filter="url(#diamondGlow)"
      opacity="0.9"
    />
    <path
      d="M50 10 L85 35 L50 90 L15 35 Z"
      stroke="white"
      strokeWidth="1"
      fill="none"
      opacity="0.3"
    />
    <path d="M15 35 L50 45 L85 35" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
    <path d="M50 45 L50 90" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
  </svg>
);

// Rocket SVG for Launch
export const RocketSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
      <filter id="rocketGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M50 10 C35 25 30 50 35 70 L45 70 L45 85 L55 85 L55 70 L65 70 C70 50 65 25 50 10 Z"
      fill="url(#rocketGradient)"
      filter="url(#rocketGlow)"
    />
    <circle cx="50" cy="45" r="8" fill="white" opacity="0.9" />
    <path d="M35 70 L25 80 L35 75" fill="url(#rocketGradient)" opacity="0.7" />
    <path d="M65 70 L75 80 L65 75" fill="url(#rocketGradient)" opacity="0.7" />
    <path d="M45 85 L50 95 L55 85" fill="#ff6b6b" opacity="0.8">
      <animate attributeName="opacity" values="0.8;0.4;0.8" dur="0.5s" repeatCount="indefinite" />
    </path>
  </svg>
);

// Gift Box SVG
export const GiftSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="giftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f093fb" />
        <stop offset="100%" stopColor="#f5576c" />
      </linearGradient>
      <filter id="giftGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="15" y="40" width="70" height="45" rx="4" fill="url(#giftGradient)" filter="url(#giftGlow)" />
    <rect x="10" y="30" width="80" height="15" rx="4" fill="url(#giftGradient)" filter="url(#giftGlow)" opacity="0.9" />
    <rect x="45" y="30" width="10" height="55" fill="white" opacity="0.3" />
    <path d="M50 30 C50 20 40 15 35 20 C30 25 35 30 50 30" fill="url(#giftGradient)" />
    <path d="M50 30 C50 20 60 15 65 20 C70 25 65 30 50 30" fill="url(#giftGradient)" />
  </svg>
);

// Lightning SVG for Energy
export const LightningSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
      <filter id="lightningGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M55 10 L25 50 L45 50 L35 90 L75 40 L55 40 L65 10 Z"
      fill="url(#lightningGradient)"
      filter="url(#lightningGlow)"
    >
      <animate attributeName="opacity" values="1;0.7;1" dur="0.3s" repeatCount="indefinite" />
    </path>
  </svg>
);

// Shield SVG for Security
export const ShieldSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#43e97b" />
        <stop offset="100%" stopColor="#38f9d7" />
      </linearGradient>
      <filter id="shieldGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M50 10 L85 25 L85 50 C85 70 70 85 50 95 C30 85 15 70 15 50 L15 25 Z"
      fill="url(#shieldGradient)"
      filter="url(#shieldGlow)"
      opacity="0.2"
    />
    <path
      d="M50 10 L85 25 L85 50 C85 70 70 85 50 95 C30 85 15 70 15 50 L15 25 Z"
      stroke="url(#shieldGradient)"
      strokeWidth="2"
      fill="none"
    />
    <path d="M35 50 L45 60 L65 40" stroke="url(#shieldGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Message SVG for Chat
export const MessageSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="messageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path
      d="M15 25 C15 18 21 12 28 12 L72 12 C79 12 85 18 85 25 L85 60 C85 67 79 73 72 73 L35 73 L20 88 L20 73 L28 73 C21 73 15 67 15 60 Z"
      fill="url(#messageGradient)"
      opacity="0.2"
    />
    <path
      d="M15 25 C15 18 21 12 28 12 L72 12 C79 12 85 18 85 25 L85 60 C85 67 79 73 72 73 L35 73 L20 88 L20 73 L28 73 C21 73 15 67 15 60 Z"
      stroke="url(#messageGradient)"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="35" cy="42" r="4" fill="url(#messageGradient)" />
    <circle cx="50" cy="42" r="4" fill="url(#messageGradient)" />
    <circle cx="65" cy="42" r="4" fill="url(#messageGradient)" />
  </svg>
);

// Settings Gear SVG
export const SettingsSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path
      d="M50 35 C41.7 35 35 41.7 35 50 C35 58.3 41.7 65 50 65 C58.3 65 65 58.3 65 50 C65 41.7 58.3 35 50 35 Z"
      stroke="url(#settingsGradient)"
      strokeWidth="3"
      fill="none"
    />
    <path
      d="M50 15 L55 25 L65 22 L68 32 L78 35 L75 45 L85 50 L75 55 L78 65 L68 68 L65 78 L55 75 L50 85 L45 75 L35 78 L32 68 L22 65 L25 55 L15 50 L25 45 L22 35 L32 32 L35 22 L45 25 Z"
      stroke="url(#settingsGradient)"
      strokeWidth="2"
      fill="none"
    >
      <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
    </path>
  </svg>
);

// User Profile SVG
export const UserSVG: React.FC<SVGProps> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="35" r="18" stroke="url(#userGradient)" strokeWidth="3" fill="none" />
    <path
      d="M20 85 C20 65 35 55 50 55 C65 55 80 65 80 85"
      stroke="url(#userGradient)"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Sparkle SVG for AI
export const SparkleSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#ff69b4" />
        <stop offset="100%" stopColor="#00d4ff" />
      </linearGradient>
      <filter id="sparkleGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M50 10 L55 40 L85 50 L55 60 L50 90 L45 60 L15 50 L45 40 Z"
      fill="url(#sparkleGradient)"
      filter="url(#sparkleGlow)"
    >
      <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
    </path>
  </svg>
);

// Neural Network SVG
export const NeuralNetworkSVG: React.FC<SVGProps> = ({ className, size = 120 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="50%" stopColor="#764ba2" />
        <stop offset="100%" stopColor="#f093fb" />
      </linearGradient>
      <filter id="neuralGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g stroke="url(#neuralGradient)" strokeWidth="1" opacity="0.4">
      <line x1="40" y1="40" x2="100" y2="70" />
      <line x1="40" y1="100" x2="100" y2="70" />
      <line x1="40" y1="160" x2="100" y2="130" />
      <line x1="40" y1="100" x2="100" y2="130" />
      <line x1="100" y1="70" x2="160" y2="100" />
      <line x1="100" y1="130" x2="160" y2="100" />
      <line x1="40" y1="40" x2="100" y2="130" />
      <line x1="40" y1="160" x2="100" y2="70" />
    </g>
    <g fill="url(#neuralGradient)" filter="url(#neuralGlow)">
      <circle cx="40" cy="40" r="8" />
      <circle cx="40" cy="100" r="8" />
      <circle cx="40" cy="160" r="8" />
      <circle cx="100" cy="70" r="10" />
      <circle cx="100" cy="130" r="10" />
      <circle cx="160" cy="100" r="12" />
    </g>
    <circle cx="160" cy="100" r="20" stroke="url(#neuralGradient)" strokeWidth="2" fill="none" opacity="0.5">
      <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// WeChat Pay SVG
export const WeChatPaySVG: React.FC<SVGProps> = ({ className, size = 48 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="wechatPayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#07c160" />
        <stop offset="100%" stopColor="#00a854" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#wechatPayGradient)" opacity="0.1" />
    <circle cx="50" cy="50" r="40" stroke="url(#wechatPayGradient)" strokeWidth="2" fill="none" />
    <path
      d="M35 45 C35 38 42 32 50 32 C58 32 65 38 65 45 C65 52 58 58 50 58 L50 65"
      stroke="url(#wechatPayGradient)"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="50" cy="72" r="3" fill="url(#wechatPayGradient)" />
  </svg>
);

// Alipay SVG
export const AlipaySVG: React.FC<SVGProps> = ({ className, size = 48 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="alipayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1677ff" />
        <stop offset="100%" stopColor="#0052d9" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#alipayGradient)" opacity="0.1" />
    <circle cx="50" cy="50" r="40" stroke="url(#alipayGradient)" strokeWidth="2" fill="none" />
    <path
      d="M30 50 L45 65 L70 35"
      stroke="url(#alipayGradient)"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Floating Particles SVG
export const FloatingParticlesSVG: React.FC<SVGProps> = ({ className }) => (
  <svg
    className={className}
    width="100%"
    height="100%"
    viewBox="0 0 400 400"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="particleGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(102, 126, 234, 0.8)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    {[...Array(20)].map((_, i) => (
      <circle
        key={i}
        cx={50 + (i * 17) % 300}
        cy={50 + (i * 23) % 300}
        r={2 + (i % 4)}
        fill="url(#particleGradient)"
        opacity={0.3 + (i % 5) * 0.1}
      >
        <animate
          attributeName="cy"
          values={`${50 + (i * 23) % 300};${30 + (i * 23) % 300};${50 + (i * 23) % 300}`}
          dur={`${3 + i % 5}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values={`${0.3 + (i % 5) * 0.1};${0.5 + (i % 5) * 0.1};${0.3 + (i % 5) * 0.1}`}
          dur={`${2 + i % 3}s`}
          repeatCount="indefinite"
        />
      </circle>
    ))}
  </svg>
);

// Voice/Microphone SVG
export const VoiceSVG: React.FC<SVGProps & { isActive?: boolean }> = ({ className, size = 24, isActive = false }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="voiceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <rect x="35" y="20" width="30" height="50" rx="15" stroke="url(#voiceGradient)" strokeWidth="3" fill="none" />
    <path d="M25 50 C25 70 40 85 50 85 C60 85 75 70 75 50" stroke="url(#voiceGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <line x1="50" y1="85" x2="50" y2="95" stroke="url(#voiceGradient)" strokeWidth="3" strokeLinecap="round" />
    {isActive && (
      <>
        <circle cx="50" cy="45" r="5" fill="url(#voiceGradient)">
          <animate attributeName="r" values="5;8;5" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="30" cy="50" r="3" fill="url(#voiceGradient)" opacity="0.5">
          <animate attributeName="r" values="3;6;3" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="50" r="3" fill="url(#voiceGradient)" opacity="0.5">
          <animate attributeName="r" values="3;6;3" dur="0.5s" repeatCount="indefinite" />
        </circle>
      </>
    )}
  </svg>
);

// Attachment/Paperclip SVG
export const AttachmentSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="attachGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path
      d="M70 35 L40 65 C35 70 35 78 40 83 C45 88 53 88 58 83 L78 63 C85 56 85 45 78 38 L72 32 C65 25 54 25 47 32 L27 52 C20 59 20 70 27 77"
      stroke="url(#attachGradient)"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Image/File SVG
export const ImageSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="imageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <rect x="15" y="20" width="70" height="60" rx="5" stroke="url(#imageGradient)" strokeWidth="3" fill="none" />
    <circle cx="35" cy="40" r="8" stroke="url(#imageGradient)" strokeWidth="2" fill="none" />
    <path d="M15 65 L35 50 L50 60 L70 40 L85 55" stroke="url(#imageGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Code SVG
export const CodeSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="codeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#43e97b" />
        <stop offset="100%" stopColor="#38f9d7" />
      </linearGradient>
    </defs>
    <path d="M35 30 L15 50 L35 70" stroke="url(#codeGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M65 30 L85 50 L65 70" stroke="url(#codeGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M55 25 L45 75" stroke="url(#codeGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

// Memory SVG
export const MemorySVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f093fb" />
        <stop offset="100%" stopColor="#f5576c" />
      </linearGradient>
    </defs>
    <rect x="20" y="25" width="60" height="50" rx="5" stroke="url(#memoryGradient)" strokeWidth="3" fill="none" />
    <line x1="20" y1="40" x2="80" y2="40" stroke="url(#memoryGradient)" strokeWidth="2" />
    <line x1="20" y1="55" x2="80" y2="55" stroke="url(#memoryGradient)" strokeWidth="2" />
    <line x1="40" y1="25" x2="40" y2="75" stroke="url(#memoryGradient)" strokeWidth="2" />
    <line x1="60" y1="25" x2="60" y2="75" stroke="url(#memoryGradient)" strokeWidth="2" />
  </svg>
);

// Workflow SVG
export const WorkflowSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="workflowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
    <rect x="15" y="15" width="25" height="25" rx="4" stroke="url(#workflowGradient)" strokeWidth="2" fill="none" />
    <rect x="60" y="15" width="25" height="25" rx="4" stroke="url(#workflowGradient)" strokeWidth="2" fill="none" />
    <rect x="37" y="60" width="25" height="25" rx="4" stroke="url(#workflowGradient)" strokeWidth="2" fill="none" />
    <path d="M40 27 L60 27" stroke="url(#workflowGradient)" strokeWidth="2" markerEnd="url(#arrow)" />
    <path d="M72 40 L72 55 L50 55 L50 60" stroke="url(#workflowGradient)" strokeWidth="2" />
    <circle cx="50" cy="72" r="3" fill="url(#workflowGradient)" />
  </svg>
);

// Channel SVG
export const ChannelSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="channelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path d="M20 50 C20 30 35 20 50 20 C65 20 80 30 80 50" stroke="url(#channelGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M80 50 C80 70 65 80 50 80 C35 80 20 70 20 50" stroke="url(#channelGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 4" />
    <circle cx="50" cy="50" r="10" fill="url(#channelGradient)" />
  </svg>
);

// Skill SVG
export const SkillSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
    </defs>
    <polygon points="50,10 61,35 88,35 67,52 76,78 50,62 24,78 33,52 12,35 39,35" stroke="url(#skillGradient)" strokeWidth="2" fill="none" />
    <polygon points="50,25 56,42 73,42 60,52 65,68 50,58 35,68 40,52 27,42 44,42" fill="url(#skillGradient)" opacity="0.3" />
  </svg>
);

// History SVG
export const HistorySVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="historyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" stroke="url(#historyGradient)" strokeWidth="3" fill="none" />
    <path d="M50 25 L50 50 L70 60" stroke="url(#historyGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 50 L15 50" stroke="url(#historyGradient)" strokeWidth="2" strokeLinecap="round" />
    <path d="M50 85 L50 95" stroke="url(#historyGradient)" strokeWidth="2" strokeLinecap="round" />
    <path d="M85 50 L75 50" stroke="url(#historyGradient)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Copy SVG
export const CopySVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="copyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <rect x="30" y="10" width="50" height="60" rx="5" stroke="url(#copyGradient)" strokeWidth="3" fill="none" />
    <path d="M20 30 L20 85 C20 88 23 90 26 90 L60 90" stroke="url(#copyGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="30" y="25" width="30" height="3" rx="1" fill="url(#copyGradient)" opacity="0.5" />
    <rect x="30" y="35" width="40" height="3" rx="1" fill="url(#copyGradient)" opacity="0.5" />
    <rect x="30" y="45" width="35" height="3" rx="1" fill="url(#copyGradient)" opacity="0.5" />
  </svg>
);

// Close/X SVG
export const CloseSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="100%" stopColor="#ff4757" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" stroke="url(#closeGradient)" strokeWidth="2" fill="none" opacity="0.3" />
    <path d="M35 35 L65 65 M65 35 L35 65" stroke="url(#closeGradient)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Expand SVG
export const ExpandSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="expandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path d="M20 40 L20 20 L40 20" stroke="url(#expandGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M60 20 L80 20 L80 40" stroke="url(#expandGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M80 60 L80 80 L60 80" stroke="url(#expandGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 80 L20 80 L20 60" stroke="url(#expandGradient)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Minimize SVG
export const MinimizeSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="minimizeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path d="M20 50 L80 50" stroke="url(#minimizeGradient)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Refresh SVG
export const RefreshSVG: React.FC<SVGProps> = ({ className, size = 24 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="refreshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <path d="M75 50 C75 64 64 75 50 75 C36 75 25 64 25 50 C25 36 36 25 50 25 C60 25 68 31 72 40" stroke="url(#refreshGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M72 25 L72 40 L87 40" stroke="url(#refreshGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Empty State SVG
export const EmptyStateSVG: React.FC<SVGProps> = ({ className, size = 80 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="40" stroke="url(#emptyGradient)" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="8 4" />
    <circle cx="35" cy="45" r="4" fill="url(#emptyGradient)" opacity="0.5" />
    <circle cx="65" cy="45" r="4" fill="url(#emptyGradient)" opacity="0.5" />
    <path d="M35 65 Q50 55 65 65" stroke="url(#emptyGradient)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
    <path d="M25 25 L30 30 M75 25 L70 30 M25 75 L30 70 M75 75 L70 70" stroke="url(#emptyGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </svg>
);

export default {
  LogoSVG,
  AIBrainSVG,
  AgentAvatarSVG,
  ChatBubbleSVG,
  SendButtonSVG,
  WalletSVG,
  MobileMenuSVG,
  BackgroundPatternSVG,
  CrownSVG,
  DiamondSVG,
  RocketSVG,
  GiftSVG,
  LightningSVG,
  ShieldSVG,
  MessageSVG,
  SettingsSVG,
  UserSVG,
  SparkleSVG,
  NeuralNetworkSVG,
  WeChatPaySVG,
  AlipaySVG,
  FloatingParticlesSVG,
  VoiceSVG,
  AttachmentSVG,
  ImageSVG,
  CodeSVG,
  MemorySVG,
  WorkflowSVG,
  ChannelSVG,
  SkillSVG,
  HistorySVG,
  CopySVG,
  CloseSVG,
  ExpandSVG,
  MinimizeSVG,
  RefreshSVG,
  EmptyStateSVG,
};
