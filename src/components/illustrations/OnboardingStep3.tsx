/**
 * OnboardingStep3 — Envelope + amber wings (koperta + amber skrzydła)
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Step 3: Send offer to client
 */

interface OnboardingStep3Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function OnboardingStep3({
  className = '',
  size = 240,
  animated = true,
}: OnboardingStep3Props) {
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
        @keyframes os3-fly {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(6px, -8px) rotate(2deg); }
          75% { transform: translate(-4px, -4px) rotate(-1deg); }
        }
        @keyframes os3-wing {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.7); }
        }
        @keyframes os3-trail {
          0% { opacity: 0; transform: translateX(0); }
          50% { opacity: 0.5; }
          100% { opacity: 0; transform: translateX(-16px); }
        }
        .os3-env { transform-origin: 120px 120px; animation: ${animated ? 'os3-fly 3s ease-in-out infinite' : 'none'}; }
        .os3-wing-l { transform-origin: 88px 110px; animation: ${animated ? 'os3-wing 1.2s ease-in-out infinite' : 'none'}; }
        .os3-wing-r { transform-origin: 152px 110px; animation: ${animated ? 'os3-wing 1.2s ease-in-out infinite 0.1s' : 'none'}; }
        .os3-trail { animation: ${animated ? 'os3-trail 2s ease-in-out infinite' : 'none'}; }
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--primary))" opacity="0.07" />

      {/* Motion trails */}
      <g className="os3-trail">
        <line x1="72" y1="116" x2="88" y2="116" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="68" y1="124" x2="80" y2="124" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="76" y1="132" x2="84" y2="132" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
      </g>

      {/* Wings */}
      <g className="os3-wing-l">
        <path d="M88 110 Q64 90 56 112 Q72 108 88 110" fill="hsl(var(--primary))" opacity="0.7" />
      </g>
      <g className="os3-wing-r">
        <path d="M152 110 Q176 90 184 112 Q168 108 152 110" fill="hsl(var(--primary))" opacity="0.7" />
      </g>

      {/* Envelope body */}
      <g className="os3-env">
        <rect x="88" y="96" width="64" height="48" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />

        {/* Envelope flap (open) */}
        <path d="M88 96 L120 116 L152 96" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
        <path d="M88 96 Q120 80 152 96 L120 116 Z" fill="hsl(var(--primary))" opacity="0.15" />

        {/* Letter inside */}
        <rect x="96" y="110" width="48" height="26" rx="3" fill="hsl(var(--muted))" opacity="0.6" />
        <rect x="100" y="116" width="36" height="4" rx="2" fill="hsl(var(--border))" />
        <rect x="100" y="124" width="28" height="4" rx="2" fill="hsl(var(--border))" />

        {/* Amber seal */}
        <circle cx="120" cy="123" r="7" fill="hsl(var(--primary))" opacity="0.8" />
        <text x="120" y="127" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">✓</text>
      </g>

      {/* Destination dot */}
      <circle cx="184" cy="88" r="8" fill="hsl(var(--success))" opacity="0.5" />
      <circle cx="184" cy="88" r="4" fill="hsl(var(--success))" opacity="0.8" />

      {/* Dashed flight path */}
      <path d="M152 116 Q168 96 184 88" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.4" />

      {/* Sparkles */}
      <circle cx="60" cy="156" r="3.5" fill="hsl(var(--primary))" opacity="0.4" />
      <circle cx="180" cy="160" r="4" fill="hsl(var(--primary))" opacity="0.3" />
    </svg>
  );
}
