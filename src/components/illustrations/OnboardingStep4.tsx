/**
 * OnboardingStep4 — Success + green check (sukces + zielony check)
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Step 4: Completion / celebration
 */

interface OnboardingStep4Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function OnboardingStep4({
  className = '',
  size = 240,
  animated = true,
}: OnboardingStep4Props) {
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
        @keyframes os4-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }
        @keyframes os4-check {
          0% { stroke-dashoffset: 60; opacity: 0; }
          60% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes os4-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(40px) rotate(180deg); opacity: 0; }
        }
        .os4-ring { transform-origin: 120px 112px; animation: ${animated ? 'os4-pulse 2.5s ease-in-out infinite' : 'none'}; }
        .os4-check { stroke-dasharray: 60; animation: ${animated ? 'os4-check 1.2s ease-out forwards' : 'none'}; }
        .os4-c1 { animation: ${animated ? 'os4-confetti 2s ease-in infinite 0.2s' : 'none'}; }
        .os4-c2 { animation: ${animated ? 'os4-confetti 2.2s ease-in infinite 0.5s' : 'none'}; }
        .os4-c3 { animation: ${animated ? 'os4-confetti 1.8s ease-in infinite 0.8s' : 'none'}; }
        .os4-c4 { animation: ${animated ? 'os4-confetti 2.4s ease-in infinite 0.1s' : 'none'}; }
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--success))" opacity="0.07" />

      {/* Outer pulse ring */}
      <circle className="os4-ring" cx="120" cy="112" r="56" fill="none" stroke="hsl(var(--success))" strokeWidth="2" opacity="0.25" />
      <circle className="os4-ring" cx="120" cy="112" r="44" fill="none" stroke="hsl(var(--success))" strokeWidth="1.5" opacity="0.35" style={{ animationDelay: '0.3s' }} />

      {/* Success circle */}
      <circle cx="120" cy="112" r="36" fill="hsl(var(--success))" opacity="0.12" />
      <circle cx="120" cy="112" r="36" fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" />

      {/* Checkmark */}
      <polyline
        className="os4-check"
        points="104,112 116,124 136,100"
        stroke="hsl(var(--success))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Star badge */}
      <circle cx="120" cy="156" r="12" fill="hsl(var(--primary))" />
      <text x="120" y="161" textAnchor="middle" fontSize="13" fill="white">★</text>

      {/* Confetti */}
      <rect className="os4-c1" x="72" y="68" width="8" height="8" rx="2" fill="hsl(var(--primary))" opacity="0.8" transform="rotate(15, 76, 72)" />
      <rect className="os4-c2" x="156" y="64" width="6" height="6" rx="1" fill="hsl(var(--success))" opacity="0.8" transform="rotate(-20, 159, 67)" />
      <circle className="os4-c3" cx="64" cy="92" r="4" fill="hsl(var(--primary))" opacity="0.7" />
      <rect className="os4-c4" x="168" y="80" width="7" height="5" rx="1.5" fill="hsl(var(--warning))" opacity="0.8" transform="rotate(30, 171, 82)" />
      <circle cx="80" cy="148" r="3" fill="hsl(var(--success))" opacity="0.5" />
      <rect x="160" y="148" width="6" height="6" rx="1" fill="hsl(var(--primary))" opacity="0.4" transform="rotate(10, 163, 151)" />

      {/* Text below */}
      <rect x="92" y="172" width="56" height="8" rx="4" fill="hsl(var(--success))" opacity="0.3" />
      <rect x="100" y="184" width="40" height="6" rx="3" fill="hsl(var(--success))" opacity="0.2" />
    </svg>
  );
}
