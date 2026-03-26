interface Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function FeatureClients({ className = '', size = 240, animated = true }: Props) {
  const shouldAnimate =
    animated && typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <style>{`
        @keyframes fc-pulse {
          0%, 100% { r: 6; opacity: 1; }
          50% { r: 8; opacity: 0.7; }
        }
        @keyframes fc-card-in {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fc-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        ${shouldAnimate ? `
          .fc-card { animation: fc-card-in 0.5s ease-out 0.2s both; }
          .fc-card2 { animation: fc-card-in 0.5s ease-out 0.4s both; }
          .fc-dot { animation: fc-pulse 2s ease-in-out infinite 0.8s; transform-origin: 155px 85px; }
          .fc-group { animation: fc-float 4.2s ease-in-out infinite; transform-origin: 120px 120px; }
        ` : ''}
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="100" fill="hsl(142 71% 45% / 0.07)" />
      <circle cx="120" cy="120" r="76" fill="hsl(142 71% 45% / 0.04)" />

      <g className="fc-group">
        {/* Main contact card */}
        <g className="fc-card">
          <rect x="68" y="72" width="104" height="70" rx="10"
            fill="hsl(var(--card, 220 26% 11%))"
            stroke="hsl(var(--border, 215 28% 17%))"
            strokeWidth="1.5"
          />
          {/* Avatar circle */}
          <circle cx="94" cy="99" r="18"
            fill="hsl(142 71% 45% / 0.15)"
            stroke="hsl(142 71% 45% / 0.4)"
            strokeWidth="1.5"
          />
          {/* Person icon */}
          <circle cx="94" cy="93" r="7" fill="hsl(142 71% 45% / 0.6)" />
          <path d="M80 110 Q80 102 94 102 Q108 102 108 110" fill="hsl(142 71% 45% / 0.4)" />

          {/* Text lines */}
          <rect x="120" y="90" width="38" height="6" rx="3"
            fill="hsl(var(--foreground, 220 14% 98%) / 0.7)"
          />
          <rect x="120" y="102" width="28" height="4" rx="2"
            fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.6)"
          />
          <rect x="120" y="112" width="34" height="4" rx="2"
            fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.4)"
          />

          {/* Status dot */}
          <circle className="fc-dot" cx="155" cy="85" r="6" fill="hsl(142 71% 45%)" />
        </g>

        {/* Second card (smaller, offset) */}
        <g className="fc-card2">
          <rect x="78" y="148" width="84" height="46" rx="8"
            fill="hsl(var(--card, 220 26% 11%))"
            stroke="hsl(var(--border, 215 28% 17%))"
            strokeWidth="1.5"
          />
          {/* Mini avatar */}
          <circle cx="96" cy="171" r="12"
            fill="hsl(38 92% 50% / 0.15)"
            stroke="hsl(38 92% 50% / 0.35)"
            strokeWidth="1.5"
          />
          <circle cx="96" cy="167" r="5" fill="hsl(38 92% 50% / 0.6)" />
          <path d="M86 180 Q86 175 96 175 Q106 175 106 180" fill="hsl(38 92% 50% / 0.4)" />

          {/* Text */}
          <rect x="114" y="164" width="32" height="5" rx="2.5"
            fill="hsl(var(--foreground, 220 14% 98%) / 0.5)"
          />
          <rect x="114" y="175" width="24" height="4" rx="2"
            fill="hsl(var(--muted-foreground, 218 8% 46%) / 0.4)"
          />
        </g>
      </g>

      {/* Connecting line between cards */}
      <line x1="120" y1="142" x2="120" y2="148"
        stroke="hsl(var(--border, 215 28% 17%))"
        strokeWidth="1"
        strokeDasharray="3 2"
      />

      {/* Decorative */}
      <circle cx="172" cy="130" r="5" fill="hsl(142 71% 45% / 0.15)" />
      <circle cx="66" cy="155" r="4" fill="hsl(38 92% 50% / 0.12)" />
    </svg>
  );
}
