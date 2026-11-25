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
      className="vuka-bg-motif pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        data-testid={isLanding ? 'landing-motif-topographic' : undefined}
        className={`w-full h-full text-[#17191C] dark:text-[#F4F2EE] ${
          isLanding
            ? 'vuka-landing-motif vuka-landing-motif--topo'
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
      className="vuka-bg-motif pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
        data-testid={isLanding ? 'landing-motif-bridge' : undefined}
        className={`w-full h-full text-[#146C53] dark:text-[#2EB88B] ${
          isLanding
            ? 'vuka-landing-motif'
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
export const RippleConstellationMotif: React.FC<
  ResilienceMotifProps & { className?: string }
> = ({ variant = 'default', className = '' }) => {
  const isLanding = variant === 'landing';
  return (
    <div
      aria-hidden="true"
      className="vuka-bg-motif pointer-events-none select-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 620"
        preserveAspectRatio="xMidYMid slice"
        data-testid={isLanding ? 'landing-motif-ripple' : undefined}
        className={`w-full h-full text-[#C4622D] dark:text-[#E07B46] ${
          isLanding
            ? 'vuka-landing-motif'
            : className || 'opacity-[0.065] dark:opacity-[0.08]'
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

/**
 * Motif 4: Unbroken Meridian & Compass Arc (Compliance Readiness Section)
 * Conveys lawful global navigation, cross-border dignity, and unbroken rights at work.
 * Rendered at subtle 5% opacity with pointer-events: none.
 */
export const UnbrokenMeridianCompassMotif: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      data-testid="unbroken-meridian-motif"
      className={`vuka-bg-motif pointer-events-none select-none absolute inset-0 overflow-hidden opacity-[0.05] text-[#146C53] dark:text-[#2EB88B] ${className}`}
    >
      <svg
        viewBox="0 0 1200 480"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.25">
          {/* Outer meridian arcs */}
          <path d="M-40 390 C 260 120, 620 90, 1240 280" />
          <path d="M-20 440 C 310 190, 680 155, 1230 330" strokeDasharray="5 7" />
          <path d="M80 495 C 400 250, 740 215, 1180 395" />

          {/* Compass rose & longitudinal bearings centered right */}
          <circle cx="960" cy="210" r="150" />
          <circle cx="960" cy="210" r="102" strokeDasharray="3 6" />
          <circle cx="960" cy="210" r="54" />
          <line x1="780" y1="210" x2="1140" y2="210" />
          <line x1="960" y1="30" x2="960" y2="390" />
          <path d="M960 72 L978 210 L960 348 L942 210 Z" />
          <circle cx="960" cy="210" r="5" fill="currentColor" />
          <circle cx="340" cy="196" r="4" fill="currentColor" />
          <circle cx="635" cy="158" r="4" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Motif 5: Open Horizon & Ascending Dawn Arc (Tab 5 Cleared View)
 * Delicate rising horizon arcs with a faint compass star in the upper right, radial edge-faded, pointer-events: none.
 */
export const OpenHorizonDawnMotif: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      data-testid="open-horizon-dawn-motif"
      className={`vuka-bg-motif pointer-events-none select-none absolute inset-0 overflow-hidden opacity-[0.05] text-[#146C53] dark:text-[#2EB88B] ${className}`}
    >
      <svg
        viewBox="0 0 1200 480"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          <radialGradient id="vuka-horizon-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="vuka-horizon-mask">
            <rect width="1200" height="480" fill="url(#vuka-horizon-fade)" />
          </mask>
        </defs>
        <g mask="url(#vuka-horizon-mask)" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M-60 380 Q 300 120 720 280 T 1260 210" />
          <path d="M-40 430 Q 340 170 760 330 T 1280 260" strokeDasharray="4 6" />
          <path d="M0 470 Q 380 220 800 380 T 1320 310" />
          {/* Compass star upper right */}
          <g transform="translate(1020, 110)">
            <circle cx="0" cy="0" r="42" strokeDasharray="2 4" />
            <circle cx="0" cy="0" r="18" />
            <path d="M0 -36 L6 -10 L32 0 L6 10 L0 36 L-6 10 L-32 0 L-6 -10 Z" fill="currentColor" opacity="0.4" />
            <circle cx="0" cy="0" r="3" fill="currentColor" />
          </g>
        </g>
      </svg>
    </div>
  );
};


