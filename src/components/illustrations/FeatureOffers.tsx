interface Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function FeatureOffers({ className = '', size = 240, animated = true }: Props) {
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
        @keyframes fo-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fo-badge-pop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fo-line-grow {
          from { stroke-dashoffset: 80; }
          to { stroke-dashoffset: 0; }
        }
        ${shouldAnimate ? `
          .fo-doc { animation: fo-float 3.8s ease-in-out infinite; transform-origin: 120px 120px; }
          .fo-badge { animation: fo-badge-pop 0.5s ease-out 0.4s both; transform-origin: 163px 77px; }
          .fo-line1 { stroke-dasharray: 80; animation: fo-line-grow 0.6s ease-out 0.6s both; }
          .fo-line2 { stroke-dasharray: 60; stroke-dashoffset: 60; animation: fo-line-grow 0.6s ease-out 0.75s both; }
          .fo-line3 { stroke-dasharray: 40; stroke-dashoffset: 40; animation: fo-line-grow 0.6s ease-out 0.9s both; }
        ` : ''}
      `}</style>

      {/* Background circle */}
      <circle cx="120" cy="120" r="100" fill="hsl(38 92% 50% / 0.08)" />
      <circle cx="120" cy="120" r="80" fill="hsl(38 92% 50% / 0.05)" />

      {/* PDF Document */}
      <g className="fo-doc">
        {/* Document body */}
        <rect x="72" y="58" width="90" height="116" rx="8"
          fill="hsl(var(--card, 220 26% 11%))"
          stroke="hsl(38 92% 50% / 0.3)"
          strokeWidth="1.5"
        />
        {/* Header bar */}
        <rect x="72" y="58" width="90" height="22" rx="8"
          fill="hsl(38 92% 50% / 0.15)"
        />
        <rect x="72" y="70" width="90" height="10" rx="0" fill="hsl(38 92% 50% / 0.15)" />

        {/* PDF label */}
        <rect x="84" y="63" width="28" height="11" rx="4"
          fill="hsl(38 92% 50%)"
        />
        <text x="98" y="72" textAnchor="middle" fontSize="6" fontWeight="700" fill="hsl(220 26% 11%)">PDF</text>

        {/* Content lines */}
        <line x1="84" y1="96" x2="162" y2="96" stroke="hsl(var(--muted-foreground, 218 8% 46%))" strokeWidth="2.5" strokeLinecap="round" className="fo-line1" />
        <line x1="84" y1="110" x2="148" y2="110" stroke="hsl(var(--muted-foreground, 218 8% 46%))" strokeWidth="2" strokeLinecap="round" className="fo-line2" />
        <line x1="84" y1="122" x2="136" y2="122" stroke="hsl(var(--muted-foreground, 218 8% 46%))" strokeWidth="2" strokeLinecap="round" className="fo-line3" />

        {/* Price row */}
        <rect x="84" y="138" width="78" height="20" rx="6"
          fill="hsl(38 92% 50% / 0.08)"
          stroke="hsl(38 92% 50% / 0.2)"
          strokeWidth="1"
        />
        <text x="123" y="152" textAnchor="middle" fontSize="8" fontWeight="700" fill="hsl(38 92% 50%)">4 800 zł</text>
      </g>

      {/* Check badge */}
      <g className="fo-badge">
        <circle cx="163" cy="77" r="20" fill="hsl(142 71% 45%)" />
        <path d="M154 77 l6 6 l10 -12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Decorative dots */}
      <circle cx="68" cy="160" r="5" fill="hsl(38 92% 50% / 0.25)" />
      <circle cx="175" cy="155" r="4" fill="hsl(38 92% 50% / 0.18)" />
      <circle cx="80" cy="175" r="3" fill="hsl(38 92% 50% / 0.12)" />
    </svg>
  );
}
