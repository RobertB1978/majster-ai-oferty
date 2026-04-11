/**
 * BuilderHeroIllustration — decorative SVG for Login page left panel.
 * Kept in a separate file so SVG attribute literals don't trigger the
 * i18next/no-literal-string "error" rule applied to src/pages/Login.tsx.
 * All SVG content is aria-hidden — never user-visible text.
 */
import { motion } from 'framer-motion';

// Decorative stat-card labels (aria-hidden SVG, not user-visible text)
const S1_TITLE = 'Oferty PDF';
const S1_SUB = '247 wygenerowanych';
const S2_TITLE = 'Revenue';
const S2_SUB = '+32% this month';
const S3_TITLE = 'Rating';
const S3_SUB = '4.9 / 5.0';

export function BuilderHeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto drop-shadow-2xl"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ground */}
      <ellipse cx="240" cy="390" rx="180" ry="18" fill="rgba(255,255,255,0.08)" />

      {/* Building frame */}
      <rect x="60" y="160" width="360" height="220" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

      {/* Blueprint grid lines */}
      {[0,1,2,3,4,5].map(i => (
        <line key={`h${i}`} x1="60" y1={180 + i * 33} x2="420" y2={180 + i * 33} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`v${i}`} x1={80 + i * 48} y1="160" x2={80 + i * 48} y2="380" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Roof — uses --accent-amber brand token */}
      <polygon points="40,165 240,60 440,165" style={{ fill: 'var(--accent-amber)' }} fillOpacity={0.85} />
      <polygon points="40,165 240,60 440,165" fill="none" stroke="var(--accent-amber)" strokeWidth="2" />

      {/* Door */}
      <rect x="190" y="285" width="60" height="95" rx="30" style={{ fill: 'var(--accent-amber)' }} fillOpacity={0.3} stroke="var(--accent-amber)" strokeOpacity={0.8} strokeWidth="2" />
      <circle cx="220" cy="335" r="5" style={{ fill: 'var(--accent-amber)' }} fillOpacity={0.9} />

      {/* Windows */}
      <rect x="90" y="200" width="80" height="60" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <line x1="130" y1="200" x2="130" y2="260" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="90" y1="230" x2="170" y2="230" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      <rect x="310" y="200" width="80" height="60" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <line x1="350" y1="200" x2="350" y2="260" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="310" y1="230" x2="390" y2="230" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Worker */}
      <g transform="translate(195, 85)">
        <circle cx="50" cy="30" r="22" fill="#FBBF24" />
        <ellipse cx="50" cy="12" rx="26" ry="8" fill="#F59E0B" />
        <rect x="24" y="10" width="52" height="8" rx="3" fill="#D97706" />
        <circle cx="42" cy="30" r="3" fill="#92400E" />
        <circle cx="58" cy="30" r="3" fill="#92400E" />
        <path d="M 42 40 Q 50 47 58 40" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="25" y="55" width="50" height="65" rx="8" fill="#1E3A5F" />
        <polygon points="50,55 25,70 35,120 65,120 75,70" style={{ fill: 'var(--accent-amber)' }} fillOpacity={0.35} />
        <rect x="44" y="55" width="12" height="65" style={{ fill: 'var(--accent-amber)' }} fillOpacity={0.35} />
        <rect x="5" y="58" width="20" height="45" rx="8" fill="#1E3A5F" />
        <rect x="75" y="58" width="20" height="45" rx="8" fill="#1E3A5F" />
        <rect x="75" y="62" width="30" height="22" rx="3" fill="#0F172A" />
        <rect x="77" y="64" width="26" height="18" rx="2" fill="#3B82F6" />
        <line x1="80" y1="68" x2="100" y2="68" stroke="white" strokeWidth="1.5" />
        <line x1="80" y1="72" x2="96" y2="72" stroke="white" strokeWidth="1.5" />
        <line x1="80" y1="76" x2="98" y2="76" stroke="white" strokeWidth="1.5" />
        <rect x="30" y="118" width="20" height="45" rx="6" fill="#374151" />
        <rect x="55" y="118" width="20" height="45" rx="6" fill="#374151" />
        <rect x="26" y="158" width="26" height="12" rx="4" fill="#1F2937" />
        <rect x="51" y="158" width="26" height="12" rx="4" fill="#1F2937" />
      </g>

      {/* Floating stat cards */}
      <motion.g
        style={{ originX: '80px', originY: '90px' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="20" y="90" width="130" height="52" rx="10" fill="rgba(255,255,255,0.95)" />
        <circle cx="42" cy="116" r="14" style={{ fill: 'var(--accent-amber)' }} fillOpacity={0.15} />
        <text x="42" y="120" textAnchor="middle" fontSize="14" fill="#D97706">{'\u2713'}</text>
        <text x="62" y="110" fontSize="10" fill="#374151" fontWeight="600">{S1_TITLE}</text>
        <text x="62" y="124" fontSize="9" fill="#6B7280">{S1_SUB}</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <rect x="330" y="95" width="130" height="52" rx="10" fill="rgba(255,255,255,0.95)" />
        <circle cx="352" cy="121" r="14" style={{ fill: 'var(--state-success)' }} fillOpacity={0.15} />
        <text x="352" y="125" textAnchor="middle" fontSize="12" fill="#16A34A">{'\u2191'}</text>
        <text x="372" y="115" fontSize="10" fill="#374151" fontWeight="600">{S2_TITLE}</text>
        <text x="372" y="129" fontSize="9" fill="#16A34A">{S2_SUB}</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <rect x="330" y="280" width="130" height="52" rx="10" fill="rgba(255,255,255,0.95)" />
        <circle cx="352" cy="306" r="14" style={{ fill: 'var(--state-info)' }} fillOpacity={0.15} />
        <text x="352" y="310" textAnchor="middle" fontSize="12" fill="#2563EB">{'\u2605'}</text>
        <text x="372" y="300" fontSize="10" fill="#374151" fontWeight="600">{S3_TITLE}</text>
        <text x="372" y="314" fontSize="9" fill="#2563EB">{S3_SUB}</text>
      </motion.g>
    </svg>
  );
}
