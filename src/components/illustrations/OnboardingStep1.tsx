/**
 * OnboardingStep1 — Hard hat + tools (kask + narzędzia)
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Step 1: Welcome / Profile setup
 */

interface OnboardingStep1Props {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function OnboardingStep1({
  className = '',
  size = 240,
  animated = true,
}: OnboardingStep1Props) {
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
        @keyframes os1-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes os1-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .os1-hat { transform-origin: 120px 108px; animation: ${animated ? 'os1-float 3s ease-in-out infinite' : 'none'}; }
        .os1-gear { transform-origin: 178px 160px; animation: ${animated ? 'os1-spin 8s linear infinite' : 'none'}; }
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--primary))" opacity="0.08" />

      {/* Toolbox base */}
      <rect x="70" y="148" width="100" height="44" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <rect x="70" y="148" width="100" height="12" rx="8" fill="hsl(var(--primary))" opacity="0.15" />
      {/* Handle */}
      <path d="M100 148 Q120 138 140 148" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />

      {/* Tools inside */}
      <rect x="80" y="164" width="6" height="20" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.5" transform="rotate(-10, 83, 174)" />
      <rect x="92" y="162" width="5" height="22" rx="2.5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
      <circle cx="110" cy="174" r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx="110" cy="174" r="4" fill="hsl(var(--muted-foreground))" opacity="0.3" />

      {/* Wrench */}
      <path d="M126 162 L138 178" stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <circle cx="126" cy="162" r="4" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.5" />

      {/* Hard hat */}
      <g className="os1-hat">
        {/* Brim */}
        <ellipse cx="120" cy="120" rx="38" ry="9" fill="hsl(var(--primary))" />
        {/* Dome */}
        <path d="M84 120 Q84 88 120 88 Q156 88 156 120" fill="hsl(var(--primary))" />
        {/* Amber highlight stripe */}
        <path d="M95 110 Q120 100 145 110" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
        {/* Vent holes */}
        <circle cx="104" cy="104" r="2" fill="white" opacity="0.4" />
        <circle cx="136" cy="104" r="2" fill="white" opacity="0.4" />
      </g>

      {/* Gear (animated) */}
      <g className="os1-gear">
        <circle cx="178" cy="160" r="10" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
        <circle cx="178" cy="160" r="5" fill="hsl(var(--primary))" opacity="0.4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 178 + 10 * Math.cos(rad);
          const y1 = 160 + 10 * Math.sin(rad);
          const x2 = 178 + 14 * Math.cos(rad);
          const y2 = 160 + 14 * Math.sin(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          );
        })}
      </g>

      {/* Amber sparkle */}
      <circle cx="68" cy="88" r="5" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="172" cy="84" r="3.5" fill="hsl(var(--primary))" opacity="0.4" />
    </svg>
  );
}
