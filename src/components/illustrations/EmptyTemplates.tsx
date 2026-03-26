/**
 * EmptyTemplates — SVG illustration for empty templates state
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Construction-friendly flat style — stacked document templates.
 */

interface EmptyTemplatesProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function EmptyTemplates({
  className = '',
  size = 240,
  animated = true,
}: EmptyTemplatesProps) {
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
        @keyframes et-rise {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .et-doc1 { transform-origin: 106px 130px; animation: ${animated ? 'et-rise 3.2s ease-in-out infinite' : 'none'}; }
        .et-doc2 { transform-origin: 120px 126px; animation: ${animated ? 'et-rise 3.2s ease-in-out infinite 0.4s' : 'none'}; }
        .et-doc3 { transform-origin: 134px 122px; animation: ${animated ? 'et-rise 3.2s ease-in-out infinite 0.8s' : 'none'}; }
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--muted))" opacity="0.4" />

      {/* Back document (shadow) */}
      <g className="et-doc1">
        <rect x="86" y="90" width="80" height="100" rx="7" fill="hsl(var(--border))" opacity="0.5" transform="rotate(-8, 126, 140)" />
      </g>

      {/* Middle document */}
      <g className="et-doc2">
        <rect x="84" y="86" width="82" height="102" rx="7" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.2" transform="rotate(-3, 125, 137)" />
      </g>

      {/* Front document */}
      <g className="et-doc3">
        <rect x="82" y="82" width="84" height="104" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Header accent */}
        <rect x="82" y="82" width="84" height="20" rx="8" fill="hsl(var(--primary))" opacity="0.15" />
        <rect x="82" y="94" width="84" height="8" fill="hsl(var(--primary))" opacity="0.1" />

        {/* Template star badge */}
        <circle cx="97" cy="92" r="7" fill="hsl(var(--primary))" opacity="0.8" />
        <text x="97" y="96" textAnchor="middle" fontSize="9" fill="white">★</text>

        {/* Content rows */}
        <rect x="92" y="112" width="64" height="5" rx="2.5" fill="hsl(var(--border))" />
        <rect x="92" y="122" width="48" height="5" rx="2.5" fill="hsl(var(--border))" />
        <rect x="92" y="132" width="56" height="5" rx="2.5" fill="hsl(var(--border))" />

        {/* Divider */}
        <line x1="92" y1="146" x2="156" y2="146" stroke="hsl(var(--border))" strokeWidth="0.8" />

        {/* Price */}
        <rect x="92" y="152" width="30" height="8" rx="4" fill="hsl(var(--muted))" />
        <rect x="128" y="152" width="28" height="8" rx="4" fill="hsl(var(--primary))" opacity="0.5" />

        {/* Use template CTA */}
        <rect x="100" y="166" width="48" height="10" rx="5" fill="hsl(var(--primary))" opacity="0.4" />
      </g>

      {/* Floating dots */}
      <circle cx="174" cy="74" r="4" fill="hsl(var(--primary))" opacity="0.6" />
      <circle cx="62" cy="86" r="3" fill="hsl(var(--primary))" opacity="0.4" />

      {/* Plus badge */}
      <circle cx="168" cy="168" r="16" fill="hsl(var(--primary))" />
      <line x1="168" y1="162" x2="168" y2="174" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="168" x2="174" y2="168" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
