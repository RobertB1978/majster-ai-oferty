/**
 * OnboardingStep2 — Document + amber pen (dokument + amber pióro)
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Step 2: Create first offer
 */

interface OnboardingStep2Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function OnboardingStep2({
  className = '',
  size = 240,
  animated = true,
}: OnboardingStep2Props) {
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
        @keyframes os2-write {
          0%, 40%, 100% { transform: translate(0, 0) rotate(-35deg); }
          20% { transform: translate(4px, -4px) rotate(-35deg); }
        }
        @keyframes os2-line {
          0% { stroke-dashoffset: 80; opacity: 0; }
          40% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .os2-pen { transform-origin: 152px 108px; animation: ${animated ? 'os2-write 2.5s ease-in-out infinite' : 'none'}; }
        .os2-line1 { stroke-dasharray: 80; animation: ${animated ? 'os2-line 2.5s ease-in-out infinite' : 'none'}; }
        .os2-line2 { stroke-dasharray: 60; animation: ${animated ? 'os2-line 2.5s ease-in-out infinite 0.3s' : 'none'}; }
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--primary))" opacity="0.06" />

      {/* Document */}
      <rect x="68" y="60" width="100" height="130" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

      {/* Header strip */}
      <rect x="68" y="60" width="100" height="22" rx="8" fill="hsl(var(--primary))" opacity="0.12" />
      <rect x="68" y="74" width="100" height="8" fill="hsl(var(--primary))" opacity="0.1" />

      {/* Logo area */}
      <circle cx="85" cy="72" r="7" fill="hsl(var(--primary))" opacity="0.6" />

      {/* Title bar */}
      <rect x="96" y="68" width="48" height="7" rx="3.5" fill="hsl(var(--primary))" opacity="0.4" />

      {/* Lines of text */}
      <rect x="78" y="94" className="os2-line1" stroke="none" width="84" height="6" rx="3" fill="hsl(var(--border))" />
      <rect x="78" y="106" className="os2-line2" stroke="none" width="62" height="6" rx="3" fill="hsl(var(--border))" />
      <rect x="78" y="118" width="74" height="6" rx="3" fill="hsl(var(--border))" opacity="0.5" />
      <rect x="78" y="130" width="52" height="6" rx="3" fill="hsl(var(--border))" opacity="0.4" />

      {/* Divider */}
      <line x1="78" y1="146" x2="158" y2="146" stroke="hsl(var(--border))" strokeWidth="1" />

      {/* Total line */}
      <rect x="78" y="154" width="36" height="8" rx="4" fill="hsl(var(--muted))" />
      <rect x="120" y="154" width="38" height="8" rx="4" fill="hsl(var(--primary))" opacity="0.5" />

      {/* CTA button */}
      <rect x="88" y="170" width="60" height="12" rx="6" fill="hsl(var(--primary))" opacity="0.4" />

      {/* Amber pen */}
      <g className="os2-pen">
        {/* Pen body */}
        <rect x="142" y="76" width="10" height="44" rx="5" fill="hsl(var(--primary))" />
        {/* Pen clip */}
        <rect x="148" y="78" width="2.5" height="30" rx="1.25" fill="hsl(var(--primary))" opacity="0.6" />
        {/* Pen tip */}
        <polygon points="142,120 152,120 147,134" fill="hsl(var(--muted-foreground))" opacity="0.7" />
        <circle cx="147" cy="133" r="2" fill="hsl(var(--primary))" />
      </g>

      {/* Ink trail */}
      <path d="M147 134 Q140 142 130 148" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" strokeDasharray="4 3" />

      {/* Decorative dots */}
      <circle cx="68" cy="72" r="3.5" fill="hsl(var(--primary))" opacity="0.3" />
      <circle cx="172" cy="60" r="5" fill="hsl(var(--primary))" opacity="0.4" />
      <circle cx="176" cy="176" r="3" fill="hsl(var(--success))" opacity="0.5" />
    </svg>
  );
}
