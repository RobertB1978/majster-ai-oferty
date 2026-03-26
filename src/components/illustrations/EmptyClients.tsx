/**
 * EmptyClients — SVG illustration for empty clients state
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Construction-friendly flat style — person silhouette + contact card.
 */

interface EmptyClientsProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function EmptyClients({
  className = '',
  size = 240,
  animated = true,
}: EmptyClientsProps) {
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
        @keyframes ec-wave {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes ec-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .ec-person { transform-origin: 120px 110px; animation: ${animated ? 'ec-wave 3s ease-in-out infinite' : 'none'}; }
        .ec-dot { animation: ${animated ? 'ec-glow 2s ease-in-out infinite' : 'none'}; }
      `}</style>

      {/* Background circle */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--muted))" opacity="0.4" />

      {/* Contact card background */}
      <rect x="64" y="104" width="112" height="76" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

      {/* Card lines */}
      <rect x="106" y="116" width="60" height="6" rx="3" fill="hsl(var(--border))" />
      <rect x="106" y="128" width="42" height="5" rx="2.5" fill="hsl(var(--border))" opacity="0.7" />
      <rect x="106" y="140" width="50" height="5" rx="2.5" fill="hsl(var(--border))" opacity="0.6" />

      {/* Card accent line */}
      <line x1="64" y1="155" x2="176" y2="155" stroke="hsl(var(--border))" strokeWidth="1" />

      {/* Card bottom badges */}
      <rect x="74" y="163" width="36" height="8" rx="4" fill="hsl(var(--primary))" opacity="0.3" />
      <rect x="116" y="163" width="24" height="8" rx="4" fill="hsl(var(--success))" opacity="0.3" />

      {/* Person silhouette */}
      <g className="ec-person">
        {/* Head */}
        <circle cx="84" cy="126" r="14" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Face features */}
        <circle cx="79" cy="124" r="2" fill="hsl(var(--muted-foreground))" opacity="0.6" />
        <circle cx="89" cy="124" r="2" fill="hsl(var(--muted-foreground))" opacity="0.6" />
        <path d="M79 131 Q84 135 89 131" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* People icons background (faded) */}
      <circle cx="66" cy="78" r="12" fill="hsl(var(--muted))" opacity="0.3" />
      <circle cx="120" cy="68" r="10" fill="hsl(var(--muted))" opacity="0.2" />
      <circle cx="174" cy="78" r="12" fill="hsl(var(--muted))" opacity="0.3" />

      {/* Floating amber dots */}
      <circle className="ec-dot" cx="172" cy="70" r="5" fill="hsl(var(--primary))" style={{ animationDelay: '0s' }} />
      <circle className="ec-dot" cx="64" cy="176" r="3.5" fill="hsl(var(--primary))" style={{ animationDelay: '0.7s' }} />

      {/* Plus badge */}
      <circle cx="168" cy="168" r="16" fill="hsl(var(--primary))" />
      <line x1="168" y1="162" x2="168" y2="174" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="168" x2="174" y2="168" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
