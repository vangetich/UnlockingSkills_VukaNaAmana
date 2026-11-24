import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Architectural bridge-arc emblem for "Vuka na Amana" ("Cross Over with Trust").
 */
export const VukaBridgeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M4 22C7.5 12.5 13 9 16 9C19 9 24.5 12.5 28 22"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <path
      d="M8.5 22C11 16 14 14 16 14C18 14 21 16 23.5 22"
      stroke="#C4622D"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M3 22H29"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M16 9V22"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      opacity="0.45"
    />
  </svg>
);

export interface ResilienceMotifProps {
  variant?: 'default' | 'landing';
}

/**
 * Motif 1: Topographic Ascent lines behind the Hero Threshold (radial edge-faded).
 * On the Landing Funnel in light mode, renders at 15% opacity with a gentle breeze sway.
 * Symbolizes overcoming steep terrain with poise and direction.
 */
export const TopographicAscentMotif: React.FC<ResilienceMotifProps> = ({
  variant = 'default',
}) => {
  const isLanding = variant === 'landing';
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        data-testid={isLanding ? 'landing-motif-topographic' : undefined}
        className={`w-full h-full text-[#17191C] dark:text-[#F4F2EE] ${
          isLanding
            ? 'opacity-[0.15] dark:opacity-[0.075]'
            : 'opacity-[0.065] dark:opacity-[0.075]'
        }`}
      >
        <defs>
          <radialGradient id="vuka-topo-fade" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="62%" stopColor="white" stopOpacity="0.65" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="vuka-topo-mask">
            <rect width="1440" height="720" fill="url(#vuka-topo-fade)" />
          </mask>
        </defs>
        <g
          mask="url(#vuka-topo-mask)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
        >
          <path
            d="M-80 620 C 210 560, 420 430, 740 410 C 1020 392, 1210 260, 1520 180"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-1.2s' } : undefined}
          />
          <path
            d="M-80 570 C 230 505, 440 385, 760 362 C 1050 342, 1230 218, 1520 135"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-3.6s' } : undefined}
          />
          <path
            d="M-80 520 C 250 450, 460 338, 780 315 C 1070 295, 1255 178, 1520 92"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-6.1s' } : undefined}
          />
          <path
            d="M-80 468 C 265 398, 480 292, 800 268 C 1090 246, 1280 138, 1520 52"
            className={isLanding ? 'vuka-wind-line-c' : undefined}
            style={isLanding ? { animationDelay: '-2.4s' } : undefined}
          />
          <path
            d="M-80 415 C 280 345, 505 245, 825 220 C 1110 198, 1300 96, 1520 12"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-8.5s' } : undefined}
          />
          <path
            d="M-80 358 C 295 292, 525 198, 850 172 C 1125 150, 1315 62, 1520 -24"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-10.8s' } : undefined}
          />
          <path
            d="M-80 672 C 205 612, 410 486, 730 462 C 1015 442, 1205 312, 1520 232"
            className={isLanding ? 'vuka-wind-line-c' : undefined}
            style={isLanding ? { animationDelay: '-5.2s' } : undefined}
          />
          <path
            d="M120 740 C 390 650, 560 545, 860 515 C 1120 488, 1310 385, 1540 310"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-12.3s' } : undefined}
          />
          <path
            d="M40 280 C 310 220, 540 148, 870 122 C 1140 100, 1320 30, 1520 -55"
            strokeDasharray="4 7"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-4.0s' } : undefined}
          />
        </g>
      </svg>
    </div>
  );
};

/**
 * Motif 2: Hairline Woven-Bridge arcs behind the 3-Pillar Crossing Strip (radial fade).
 * On the Landing Funnel in light mode, renders at 15% opacity with a gentle breeze sway.
 * Celebrates East African woven craft geometry and crossing institutional barriers.
 */
export const WovenBridgeArcsMotif: React.FC<ResilienceMotifProps> = ({
  variant = 'default',
}) => {
  const isLanding = variant === 'landing';
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
        data-testid={isLanding ? 'landing-motif-bridge' : undefined}
        className={`w-full h-full text-[#146C53] dark:text-[#2EB88B] ${
          isLanding
            ? 'opacity-[0.15] dark:opacity-[0.08]'
            : 'opacity-[0.065] dark:opacity-[0.08]'
        }`}
      >
        <defs>
          <radialGradient id="vuka-bridge-fade" cx="50%" cy="50%" r="54%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="68%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="vuka-bridge-mask">
            <rect width="1440" height="520" fill="url(#vuka-bridge-fade)" />
          </mask>
        </defs>
        <g
          mask="url(#vuka-bridge-mask)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.05"
        >
          {/* Spanning bridge arches */}
          <path
            d="M-40 420 Q 240 100 520 420"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-0.8s' } : undefined}
          />
          <path
            d="M220 420 Q 500 100 780 420"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-3.4s' } : undefined}
          />
          <path
            d="M480 420 Q 760 100 1040 420"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-6.2s' } : undefined}
          />
          <path
            d="M740 420 Q 1020 100 1300 420"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-9.1s' } : undefined}
          />
          <path
            d="M1000 420 Q 1280 100 1560 420"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-11.5s' } : undefined}
          />

          {/* Secondary counter-woven arcs */}
          <path
            d="M-40 120 Q 240 440 520 120"
            strokeDasharray="3 6"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-2.1s' } : undefined}
          />
          <path
            d="M220 120 Q 500 440 780 120"
            strokeDasharray="3 6"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-5.5s' } : undefined}
          />
          <path
            d="M480 120 Q 760 440 1040 120"
            strokeDasharray="3 6"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-8.3s' } : undefined}
          />
          <path
            d="M740 120 Q 1020 440 1300 120"
            strokeDasharray="3 6"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-11.2s' } : undefined}
          />
          <path
            d="M1000 120 Q 1280 440 1560 120"
            strokeDasharray="3 6"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-13.8s' } : undefined}
          />

          {/* Horizontal woven warp threads */}
          <line
            x1="0"
            y1="210"
            x2="1440"
            y2="210"
            opacity="0.6"
            className={isLanding ? 'vuka-wind-line-c' : undefined}
            style={isLanding ? { animationDelay: '-1.8s' } : undefined}
          />
          <line
            x1="0"
            y1="260"
            x2="1440"
            y2="260"
            opacity="0.75"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-7.0s' } : undefined}
          />
          <line
            x1="0"
            y1="310"
            x2="1440"
            y2="310"
            opacity="0.6"
            className={isLanding ? 'vuka-wind-line-c' : undefined}
            style={isLanding ? { animationDelay: '-12.4s' } : undefined}
          />
        </g>
      </svg>
    </div>
  );
};

/**
 * Motif 3: Subtle Ripple Constellation lines behind the Age-Versatility & Final CTA band.
 * On the Landing Funnel in light mode, renders at 15% opacity with a gentle breeze sway.
 * Evokes mentorship ripples and community-wide solution impact.
 */
export const RippleConstellationMotif: React.FC<ResilienceMotifProps> = ({
  variant = 'default',
}) => {
  const isLanding = variant === 'landing';
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 620"
        preserveAspectRatio="xMidYMid slice"
        data-testid={isLanding ? 'landing-motif-ripple' : undefined}
        className={`w-full h-full text-[#C4622D] dark:text-[#E07B46] ${
          isLanding
            ? 'opacity-[0.15] dark:opacity-[0.08]'
            : 'opacity-[0.065] dark:opacity-[0.08]'
        }`}
      >
        <defs>
          <radialGradient id="vuka-ripple-fade" cx="50%" cy="54%" r="52%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="65%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="vuka-ripple-mask">
            <rect width="1440" height="620" fill="url(#vuka-ripple-fade)" />
          </mask>
        </defs>
        <g
          mask="url(#vuka-ripple-mask)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
        >
          {/* Concentric community ripples */}
          <circle
            cx="720"
            cy="340"
            r="95"
            className={isLanding ? 'vuka-wind-line-c' : undefined}
            style={isLanding ? { animationDelay: '-1.5s' } : undefined}
          />
          <circle
            cx="720"
            cy="340"
            r="175"
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-4.8s' } : undefined}
          />
          <circle
            cx="720"
            cy="340"
            r="265"
            strokeDasharray="4 6"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-7.2s' } : undefined}
          />
          <circle
            cx="720"
            cy="340"
            r="365"
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-10.6s' } : undefined}
          />
          <circle
            cx="720"
            cy="340"
            r="475"
            strokeDasharray="2 7"
            className={isLanding ? 'vuka-wind-dash' : undefined}
            style={isLanding ? { animationDelay: '-14.0s' } : undefined}
          />

          {/* Intergenerational mentorship constellation vectors & nodes drifting gently together */}
          <g
            className={isLanding ? 'vuka-wind-line-a' : undefined}
            style={isLanding ? { animationDelay: '-2.6s' } : undefined}
          >
            <polyline points="260,210 460,290 720,340 990,265 1190,195" />
            <circle cx="460" cy="290" r="3.5" fill="currentColor" />
            <circle cx="720" cy="340" r="4.5" fill="currentColor" />
            <circle cx="990" cy="265" r="3.5" fill="currentColor" />
            <circle cx="260" cy="210" r="2.5" fill="currentColor" />
            <circle cx="1190" cy="195" r="2.5" fill="currentColor" />
          </g>

          <g
            className={isLanding ? 'vuka-wind-line-b' : undefined}
            style={isLanding ? { animationDelay: '-8.4s' } : undefined}
          >
            <polyline points="320,465 535,380 720,340 930,420 1135,485" />
            <line x1="460" y1="290" x2="535" y2="380" />
            <line x1="990" y1="265" x2="930" y2="420" />
            <circle cx="535" cy="380" r="3" fill="currentColor" />
            <circle cx="930" cy="420" r="3" fill="currentColor" />
          </g>
        </g>
      </svg>
    </div>
  );
};
