interface Props {
  className?: string;
  animated?: boolean;
}

/**
 * Isometric-style hero composition: dashboard panel + offer card + mobile frame.
 * Three layers with staggered float animations for a subtle parallax effect.
 * All colors via CSS custom properties → auto dark mode.
 */
export default function HeroComposition({ className = '', animated = true }: Props) {
  const shouldAnimate =
    animated && typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  return (
    <svg
      viewBox="0 0 400 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <style>{`
        @keyframes hc-float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes hc-float-mid {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes hc-float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-11px); }
        }
        @keyframes hc-bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes hc-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        ${shouldAnimate ? `
          .hc-dashboard { animation: hc-float-slow 4s ease-in-out infinite; transform-origin: 180px 160px; }
          .hc-offer-card { animation: hc-float-mid 3.2s ease-in-out 0.4s infinite; transform-origin: 300px 120px; }
          .hc-mobile { animation: hc-float-fast 3.8s ease-in-out 0.8s infinite; transform-origin: 330px 240px; }
          .hc-bar1 { transform-origin: 105px 210px; animation: hc-bar-grow 0.5s ease-out 0.6s both; }
          .hc-bar2 { transform-origin: 125px 210px; animation: hc-bar-grow 0.5s ease-out 0.75s both; }
          .hc-bar3 { transform-origin: 145px 210px; animation: hc-bar-grow 0.5s ease-out 0.9s both; }
          .hc-bar4 { transform-origin: 165px 210px; animation: hc-bar-grow 0.5s ease-out 1.05s both; }
          .hc-glow { animation: hc-glow 3s ease-in-out infinite; }
        ` : ''}
      `}</style>

      {/* Ambient glow */}
      <ellipse className="hc-glow" cx="200" cy="300" rx="160" ry="30"
        fill="hsl(38 92% 50% / 0.12)"
      />

      {/* ── Layer 1: Dashboard panel (bottom, largest) ── */}
      <g className="hc-dashboard">
        {/* Panel body */}
        <rect x="60" y="120" width="240" height="180" rx="16"
          fill="hsl(var(--card, 220 26% 11%))"
          stroke="hsl(var(--border, 215 28% 17%))"
          strokeWidth="1.5"
        />
        {/* Header */}
        <rect x="60" y="120" width="240" height="36" rx="16"
          fill="hsl(38 92% 50% / 0.06)"
        />
        <rect x="60" y="140" width="240" height="16" rx="0"
          fill="hsl(38 92% 50% / 0.06)"
        />

        {/* Title */}
        <rect x="80" y="132" width="60" height="8" rx="4"
          fill="hsl(var(--foreground, 220 14% 98%) / 0.6)"
        />
        {/* Status pill */}
        <rect x="256" y="130" width="32" height="12" rx="6"
          fill="hsl(142 71% 45% / 0.15)"
          stroke="hsl(142 71% 45% / 0.4)"
          strokeWidth="1"
        />
        <circle cx="264" cy="136" r="3" fill="hsl(142 71% 45%)" />

        {/* KPI row */}
        <rect x="80" y="166" width="48" height="28" rx="6"
          fill="hsl(38 92% 50% / 0.08)"
          stroke="hsl(38 92% 50% / 0.15)"
          strokeWidth="1"
        />
        <rect x="138" y="166" width="48" height="28" rx="6"
          fill="hsl(220 82% 53% / 0.08)"
          stroke="hsl(220 82% 53% / 0.15)"
          strokeWidth="1"
        />
        <rect x="196" y="166" width="48" height="28" rx="6"
          fill="hsl(142 71% 45% / 0.08)"
          stroke="hsl(142 71% 45% / 0.15)"
          strokeWidth="1"
        />
        <text x="104" y="183" textAnchor="middle" fontSize="8" fontWeight="700"
          fill="hsl(38 92% 50%)">12</text>
        <text x="162" y="183" textAnchor="middle" fontSize="8" fontWeight="700"
          fill="hsl(220 82% 53%)">8</text>
        <text x="220" y="183" textAnchor="middle" fontSize="8" fontWeight="700"
          fill="hsl(142 71% 45%)">94%</text>

        {/* Bar chart */}
        <rect x="80" y="208" width="210" height="74" rx="6"
          fill="hsl(var(--background, 221 50% 8%) / 0.4)"
        />
        <line x1="88" y1="268" x2="282" y2="268"
          stroke="hsl(var(--border, 215 28% 17%))"
          strokeWidth="1"
        />
        <rect className="hc-bar1" x="98" y="236" width="18" height="32" rx="3"
          fill="hsl(38 92% 50%)"
        />
        <rect className="hc-bar2" x="122" y="222" width="18" height="46" rx="3"
          fill="hsl(38 92% 50% / 0.6)"
        />
        <rect className="hc-bar3" x="146" y="244" width="18" height="24" rx="3"
          fill="hsl(38 92% 50% / 0.4)"
        />
        <rect className="hc-bar4" x="170" y="230" width="18" height="38" rx="3"
          fill="hsl(38 92% 50% / 0.8)"
        />
        <rect x="194" y="238" width="18" height="30" rx="3"
          fill="hsl(220 82% 53% / 0.5)"
        />
        <rect x="218" y="246" width="18" height="22" rx="3"
          fill="hsl(220 82% 53% / 0.3)"
        />
        <rect x="242" y="228" width="18" height="40" rx="3"
          fill="hsl(220 82% 53% / 0.7)"
        />
      </g>

      {/* ── Layer 2: Offer card (top-right, elevated) ── */}
      <g className="hc-offer-card">
        <rect x="256" y="48" width="126" height="110" rx="12"
          fill="hsl(var(--card, 220 26% 11%))"
          stroke="hsl(38 92% 50% / 0.35)"
          strokeWidth="1.5"
        />
        {/* Amber top accent */}
        <rect x="256" y="48" width="126" height="4" rx="12"
          fill="hsl(38 92% 50%)"
        />
        <rect x="256" y="52" width="126" height="4" rx="0"
          fill="hsl(38 92% 50%)"
        />

        <rect x="270" y="62" width="40" height="6" rx="3"
          fill="hsl(var(--foreground, 220 14% 98%) / 0.7)"
        />
        <rect x="270" y="74" width="30" height="4" rx="2"
          fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.5)"
        />

        {/* Line items */}
        <line x1="270" y1="88" x2="370" y2="88"
          stroke="hsl(var(--border, 215 28% 17%))"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <rect x="270" y="94" width="55" height="4" rx="2"
          fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.4)"
        />
        <rect x="340" y="94" width="22" height="4" rx="2"
          fill="hsl(var(--foreground, 220 14% 98%) / 0.5)"
        />
        <rect x="270" y="104" width="45" height="4" rx="2"
          fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.4)"
        />
        <rect x="340" y="104" width="22" height="4" rx="2"
          fill="hsl(var(--foreground, 220 14% 98%) / 0.5)"
        />

        {/* Total */}
        <rect x="270" y="116" width="98" height="28" rx="8"
          fill="hsl(38 92% 50% / 0.1)"
          stroke="hsl(38 92% 50% / 0.25)"
          strokeWidth="1"
        />
        <text x="319" y="133" textAnchor="middle" fontSize="9" fontWeight="700"
          fill="hsl(38 92% 50%)">4 800 zł</text>
      </g>

      {/* ── Layer 3: Mobile frame (right side, smallest) ── */}
      <g className="hc-mobile">
        {/* Phone body */}
        <rect x="312" y="176" width="72" height="130" rx="14"
          fill="hsl(var(--card, 220 26% 11%))"
          stroke="hsl(var(--border, 215 28% 17%))"
          strokeWidth="1.5"
        />
        {/* Notch */}
        <rect x="336" y="180" width="24" height="6" rx="3"
          fill="hsl(var(--background, 221 50% 8%))"
        />
        {/* Screen content */}
        <rect x="320" y="192" width="56" height="8" rx="4"
          fill="hsl(38 92% 50% / 0.2)"
        />
        <rect x="320" y="206" width="56" height="32" rx="6"
          fill="hsl(var(--background, 221 50% 8%) / 0.4)"
          stroke="hsl(var(--border, 215 28% 17%))"
          strokeWidth="1"
        />
        <rect x="328" y="212" width="16" height="4" rx="2"
          fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.4)"
        />
        <text x="348" y="228" textAnchor="middle" fontSize="8" fontWeight="700"
          fill="hsl(38 92% 50%)">12</text>

        <rect x="320" y="246" width="56" height="20" rx="6"
          fill="hsl(142 71% 45% / 0.1)"
          stroke="hsl(142 71% 45% / 0.3)"
          strokeWidth="1"
        />
        <text x="348" y="260" textAnchor="middle" fontSize="6" fontWeight="600"
          fill="hsl(142 71% 45%)">aktywne</text>

        {/* Bottom bar */}
        <rect x="338" y="294" width="24" height="4" rx="2"
          fill="hsl(var(--border, 215 28% 17%))"
        />
      </g>

      {/* Connecting dots between layers */}
      <circle cx="258" cy="156" r="4" fill="hsl(38 92% 50% / 0.3)" />
      <circle cx="308" cy="178" r="3" fill="hsl(38 92% 50% / 0.2)" />
    </svg>
  );
}
