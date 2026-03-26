interface Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function FeatureProjects({ className = '', size = 240, animated = true }: Props) {
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
        @keyframes fp-bar1 { from { height: 0; y: 152; } to { height: 32; y: 120; } }
        @keyframes fp-bar2 { from { height: 0; y: 152; } to { height: 50; y: 102; } }
        @keyframes fp-bar3 { from { height: 0; y: 152; } to { height: 22; y: 130; } }
        @keyframes fp-bar4 { from { height: 0; y: 152; } to { height: 40; y: 112; } }
        @keyframes fp-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        ${shouldAnimate ? `
          .fp-bar1 { animation: fp-bar1 0.6s ease-out 0.3s both; }
          .fp-bar2 { animation: fp-bar2 0.6s ease-out 0.45s both; }
          .fp-bar3 { animation: fp-bar3 0.6s ease-out 0.6s both; }
          .fp-bar4 { animation: fp-bar4 0.6s ease-out 0.75s both; }
          .fp-folder { animation: fp-float 4s ease-in-out infinite; transform-origin: 120px 90px; }
        ` : ''}
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="100" fill="hsl(220 82% 53% / 0.07)" />
      <circle cx="120" cy="120" r="78" fill="hsl(220 82% 53% / 0.04)" />

      {/* Folder */}
      <g className="fp-folder">
        <path d="M72 82 Q72 74 80 74 L108 74 L114 68 L160 68 Q168 68 168 76 L168 102 Q168 110 160 110 L80 110 Q72 110 72 102 Z"
          fill="hsl(38 92% 50% / 0.18)"
          stroke="hsl(38 92% 50% / 0.4)"
          strokeWidth="1.5"
        />
        <path d="M72 86 L168 86" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="1" />

        {/* Folder tab label */}
        <rect x="78" y="74" width="30" height="8" rx="2" fill="hsl(38 92% 50% / 0.3)" />
      </g>

      {/* Chart area */}
      <rect x="70" y="112" width="100" height="54" rx="8"
        fill="hsl(var(--card, 220 26% 11%))"
        stroke="hsl(var(--border, 215 28% 17%))"
        strokeWidth="1.5"
      />

      {/* Baseline */}
      <line x1="78" y1="152" x2="162" y2="152"
        stroke="hsl(var(--border, 215 28% 17%))"
        strokeWidth="1"
      />

      {/* Bars */}
      <rect className="fp-bar1" x="84" y="120" width="14" height="32" rx="3"
        fill="hsl(38 92% 50%)"
      />
      <rect className="fp-bar2" x="104" y="102" width="14" height="50" rx="3"
        fill="hsl(220 82% 53%)"
      />
      <rect className="fp-bar3" x="124" y="130" width="14" height="22" rx="3"
        fill="hsl(38 92% 50% / 0.5)"
      />
      <rect className="fp-bar4" x="144" y="112" width="14" height="40" rx="3"
        fill="hsl(142 71% 45%)"
      />

      {/* Status pill */}
      <rect x="90" y="172" width="60" height="18" rx="9"
        fill="hsl(142 71% 45% / 0.12)"
        stroke="hsl(142 71% 45% / 0.3)"
        strokeWidth="1"
      />
      <circle cx="104" cy="181" r="3" fill="hsl(142 71% 45%)" />
      <text x="120" y="185" textAnchor="middle" fontSize="7" fontWeight="600" fill="hsl(142 71% 45%)">aktywne</text>

      {/* Decorative elements */}
      <circle cx="170" cy="108" r="4" fill="hsl(38 92% 50% / 0.2)" />
      <circle cx="68" cy="170" r="5" fill="hsl(220 82% 53% / 0.15)" />
    </svg>
  );
}
