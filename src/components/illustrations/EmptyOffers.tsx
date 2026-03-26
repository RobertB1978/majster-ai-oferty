/**
 * EmptyOffers — SVG illustration for empty offers state
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 *
 * Construction-friendly isometric flat style.
 * Colours via CSS custom properties — automatic dark mode.
 * Max 15KB after minification.
 * @keyframes only — not Framer Motion.
 */

interface EmptyOffersProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function EmptyOffers({
  className = '',
  size = 240,
  animated = true,
}: EmptyOffersProps) {
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
        @keyframes eo-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes eo-shine {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .eo-doc { transform-origin: 120px 140px; animation: ${animated ? 'eo-float 3.5s ease-in-out infinite' : 'none'}; }
        .eo-star { animation: ${animated ? 'eo-shine 2s ease-in-out infinite' : 'none'}; }
      `}</style>

      {/* Background circle */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--muted))" opacity="0.4" />

      {/* Document body */}
      <g className="eo-doc">
        {/* Paper */}
        <rect x="72" y="68" width="96" height="120" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Header accent */}
        <rect x="72" y="68" width="96" height="24" rx="8" fill="hsl(var(--primary))" opacity="0.12" />
        <rect x="72" y="84" width="96" height="8" fill="hsl(var(--primary))" opacity="0.12" />

        {/* Amber top-left badge */}
        <rect x="82" y="76" width="32" height="8" rx="4" fill="hsl(var(--primary))" opacity="0.8" />

        {/* Lines of content */}
        <rect x="82" y="104" width="76" height="6" rx="3" fill="hsl(var(--border))" />
        <rect x="82" y="116" width="56" height="6" rx="3" fill="hsl(var(--border))" />
        <rect x="82" y="128" width="68" height="6" rx="3" fill="hsl(var(--border))" />

        {/* Divider */}
        <line x1="82" y1="144" x2="158" y2="144" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Price line */}
        <rect x="82" y="152" width="40" height="10" rx="4" fill="hsl(var(--muted))" />
        <rect x="128" y="152" width="30" height="10" rx="4" fill="hsl(var(--primary))" opacity="0.6" />

        {/* Bottom CTA stub */}
        <rect x="90" y="170" width="60" height="10" rx="5" fill="hsl(var(--primary))" opacity="0.5" />
      </g>

      {/* Floating stars (decorative) */}
      <circle className="eo-star" cx="176" cy="72" r="5" fill="hsl(var(--primary))" opacity="0.7" style={{ animationDelay: '0s' }} />
      <circle className="eo-star" cx="60" cy="88" r="3.5" fill="hsl(var(--primary))" opacity="0.5" style={{ animationDelay: '0.6s' }} />
      <circle className="eo-star" cx="184" cy="160" r="4" fill="hsl(var(--success))" opacity="0.5" style={{ animationDelay: '1.2s' }} />

      {/* Plus badge — call to action hint */}
      <circle cx="168" cy="168" r="16" fill="hsl(var(--primary))" />
      <line x1="168" y1="162" x2="168" y2="174" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="168" x2="174" y2="168" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
