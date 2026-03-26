/**
 * EmptyDashboard — SVG illustration for empty dashboard state (240px)
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * "horyzont budowy" — construction horizon with crane silhouette.
 * Colours via CSS custom properties — automatic dark mode.
 */

interface EmptyDashboardProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function EmptyDashboard({
  className = '',
  size = 240,
  animated = true,
}: EmptyDashboardProps) {
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
        @keyframes ed-sky {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes ed-crane {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(2px); }
        }
        @keyframes ed-cloud {
          0% { transform: translateX(0); }
          100% { transform: translateX(16px); }
        }
        .ed-sky { animation: ${animated ? 'ed-sky 4s ease-in-out infinite' : 'none'}; }
        .ed-crane { transform-origin: 148px 120px; animation: ${animated ? 'ed-crane 3s ease-in-out infinite' : 'none'}; }
        .ed-cloud { animation: ${animated ? 'ed-cloud 8s ease-in-out infinite alternate' : 'none'}; }
      `}</style>

      {/* Sky gradient circle */}
      <defs>
        <radialGradient id="ed-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="96" fill="url(#ed-bg)" />

      {/* Clouds */}
      <g className="ed-cloud">
        <ellipse cx="80" cy="84" rx="18" ry="8" fill="hsl(var(--card))" opacity="0.7" />
        <ellipse cx="92" cy="80" rx="14" ry="9" fill="hsl(var(--card))" opacity="0.7" />
        <ellipse cx="68" cy="80" rx="12" ry="7" fill="hsl(var(--card))" opacity="0.5" />
      </g>
      <ellipse cx="164" cy="76" rx="14" ry="6" fill="hsl(var(--card))" opacity="0.5" />
      <ellipse cx="172" cy="72" rx="10" ry="7" fill="hsl(var(--card))" opacity="0.5" />

      {/* Ground */}
      <rect x="24" y="172" width="192" height="24" rx="4" fill="hsl(var(--border))" opacity="0.5" />

      {/* Building 1 (left) */}
      <rect x="44" y="120" width="40" height="52" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.2" />
      <rect x="50" y="128" width="8" height="10" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
      <rect x="64" y="128" width="8" height="10" rx="1" fill="hsl(var(--primary))" opacity="0.3" />
      <rect x="50" y="144" width="8" height="10" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
      <rect x="64" y="144" width="8" height="10" rx="1" fill="hsl(var(--primary))" opacity="0.4" />

      {/* Building 2 (right) */}
      <rect x="152" y="132" width="44" height="40" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.15" />
      <rect x="158" y="140" width="8" height="8" rx="1" fill="hsl(var(--primary))" opacity="0.25" />
      <rect x="172" y="140" width="8" height="8" rx="1" fill="hsl(var(--primary))" opacity="0.35" />
      <rect x="158" y="154" width="8" height="8" rx="1" fill="hsl(var(--primary))" opacity="0.2" />
      <rect x="172" y="154" width="8" height="8" rx="1" fill="hsl(var(--primary))" opacity="0.3" />

      {/* Crane */}
      <g className="ed-crane">
        {/* Mast */}
        <rect x="146" y="80" width="6" height="92" rx="2" fill="hsl(var(--primary))" opacity="0.7" />
        {/* Boom */}
        <rect x="100" y="80" width="64" height="5" rx="2" fill="hsl(var(--primary))" opacity="0.7" />
        {/* Counter jib */}
        <rect x="100" y="80" width="20" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.5" />
        {/* Cable */}
        <line x1="132" y1="85" x2="128" y2="110" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
        {/* Hook block */}
        <rect x="123" y="108" width="10" height="8" rx="2" fill="hsl(var(--primary))" opacity="0.6" />
        {/* Load */}
        <rect x="119" y="116" width="18" height="14" rx="2" fill="hsl(var(--primary))" opacity="0.5" />

        {/* Amber sun / spotlight */}
        <circle cx="120" cy="72" r="8" fill="hsl(var(--primary))" opacity="0.6" className="ed-sky" />
        <circle cx="120" cy="72" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" className="ed-sky" />
      </g>
    </svg>
  );
}
