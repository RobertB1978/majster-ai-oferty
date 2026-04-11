/**
 * teamStatusColors — shared colour constants for team member status indicators.
 *
 * Used by:
 *   - src/components/map/TeamLocationMap.tsx  (Leaflet map markers / popups)
 *   - src/pages/Team.tsx                       (status badge dots)
 *
 * Values are kept as resolved hex strings because they are consumed in
 * contexts that cannot evaluate CSS custom properties at runtime:
 *   - SVG/Canvas `fill` / `stroke` attributes
 *   - Leaflet `DivIcon` inline style strings
 *
 * Design-system mapping (src/index.css):
 *   working   → --state-success  (#22C55E dark / #16A34A light)  → green-500
 *   traveling → --state-info     (#2563EB)                        → blue-600
 *   break     → --accent-amber   (#F59E0B)                        → amber-500
 *   idle      → --text-muted     (#6B7280)                        → slate-500
 */
export const TEAM_STATUS_COLORS: Record<string, string> = {
  working:   '#22c55e',   // --state-success (dark mode value; readable on all backgrounds)
  traveling: '#3b82f6',   // blue-500 — visible on dark map tiles
  break:     '#f59e0b',   // --accent-amber (#F59E0B)
  idle:      '#6b7280',   // --text-muted (#6B7280)
} as const;
