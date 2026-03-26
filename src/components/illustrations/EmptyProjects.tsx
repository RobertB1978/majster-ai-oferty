/**
 * EmptyProjects — SVG illustration for empty projects state
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §7 (Faza 4)
 * Construction-friendly isometric flat style — hard-hat + blueprint.
 */

interface EmptyProjectsProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function EmptyProjects({
  className = '',
  size = 240,
  animated = true,
}: EmptyProjectsProps) {
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
        @keyframes ep-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ep-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .ep-hat { transform-origin: 120px 100px; animation: ${animated ? 'ep-bounce 3s ease-in-out infinite' : 'none'}; }
        .ep-dot { animation: ${animated ? 'ep-pulse 2.4s ease-in-out infinite' : 'none'}; }
      `}</style>

      {/* Background */}
      <circle cx="120" cy="120" r="96" fill="hsl(var(--muted))" opacity="0.4" />

      {/* Blueprint paper */}
      <rect x="68" y="82" width="104" height="86" rx="6" fill="hsl(var(--accent-blue-subtle, #DBEAFE))" opacity="0.6" stroke="hsl(var(--accent-blue, #1E40AF))" strokeWidth="1" opacity="0.3" />

      {/* Blueprint grid lines */}
      {[96, 110, 124, 138, 152].map((y) => (
        <line key={`h${y}`} x1="68" y1={y} x2="172" y2={y} stroke="hsl(var(--accent-blue, #1E40AF))" strokeWidth="0.5" opacity="0.2" />
      ))}
      {[88, 104, 120, 136, 152, 168].map((x) => (
        <line key={`v${x}`} x1={x} y1="82" x2={x} y2="168" stroke="hsl(var(--accent-blue, #1E40AF))" strokeWidth="0.5" opacity="0.2" />
      ))}

      {/* Blueprint house outline */}
      <polyline points="90,148 90,116 120,96 150,116 150,148" stroke="hsl(var(--accent-blue, #1E40AF))" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.6" />
      <rect x="108" y="130" width="24" height="18" stroke="hsl(var(--accent-blue, #1E40AF))" strokeWidth="1.5" fill="none" opacity="0.5" />

      {/* Hard hat */}
      <g className="ep-hat">
        {/* Hat brim */}
        <ellipse cx="120" cy="78" rx="32" ry="8" fill="hsl(var(--primary))" opacity="0.9" />
        {/* Hat dome */}
        <path d="M92 78 Q92 52 120 52 Q148 52 148 78" fill="hsl(var(--primary))" />
        {/* Hat stripe */}
        <path d="M100 68 Q120 60 140 68" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
      </g>

      {/* Floating measurement dots */}
      <circle className="ep-dot" cx="72" cy="76" r="4" fill="hsl(var(--primary))" style={{ animationDelay: '0s' }} />
      <circle className="ep-dot" cx="168" cy="76" r="3" fill="hsl(var(--primary))" style={{ animationDelay: '0.8s' }} />
      <circle className="ep-dot" cx="168" cy="172" r="3.5" fill="hsl(var(--success))" style={{ animationDelay: '1.6s' }} />

      {/* Plus badge */}
      <circle cx="168" cy="168" r="16" fill="hsl(var(--primary))" />
      <line x1="168" y1="162" x2="168" y2="174" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="162" y1="168" x2="174" y2="168" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
