# PERFORMANCE BASELINE FOLLOW-UP (2026-03-09)

> This file extends `docs/PERFORMANCE_BASELINE.md` with missing execution metadata required for this sprint kickoff. Original baseline remains frozen.

- Commit SHA: `d63ee444f19b7ea16afbd200e363048d3771570b`
- UTC timestamp: `2026-03-09T14:06:34Z`
- Branch: `work`

## Baseline checks

- Build result: ✅ `npm run build`
- Test result: ✅ `npm test`
- Type-check result: ✅ `npx tsc --noEmit`
- Lint result: ✅ `npm run lint`

## Chunk summary (from baseline build)

Top JS chunks:

1. `dist/assets/js/exceljs.min-DH-xOR-o.js` — 937.03 kB (gzip 270.79 kB)
2. `dist/assets/js/index-Buap2Yd-.js` — 781.83 kB (gzip 240.38 kB)
3. `dist/assets/js/charts-vendor-CWKIVBSw.js` — 420.59 kB (gzip 113.50 kB)
4. `dist/assets/js/pdf-vendor-BDwWAooN.js` — 418.19 kB (gzip 136.42 kB)
5. `dist/assets/js/html2canvas.esm-DXEQVQnt.js` — 201.09 kB (gzip 47.47 kB)

- Largest chunk: `dist/assets/js/exceljs.min-DH-xOR-o.js` (937.03 kB)

## Warning count snapshot

- Build warnings observed: **2**
  - npm warning: `Unknown env config "http-proxy"`
  - Vite warning: `Generated an empty chunk: "leaflet-vendor"`

## PR1 target metrics

- Remove direct `recharts` import from `src/pages/Analytics.tsx` so charts are lazy-loaded via dedicated boundary.
- Prevent eager notification center code from inflating authenticated startup path in `TopBar`.
- Remove route switch serialization caused by `AnimatePresence mode="wait"`.
