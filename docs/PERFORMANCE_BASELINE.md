# PERFORMANCE BASELINE (FROZEN)

> Baseline created before PR1 execution. This file is frozen for the sprint.

- Commit SHA: `cd89a0057687049045381a2384f873e69bd5998a`
- UTC timestamp: `2026-03-08T15:51:22Z`
- Branch: `work`

## Baseline checks

- Build result: ✅ `npm run build` passed
- Test result: ✅ `npm test` passed (50 files, 723 tests passed, 5 skipped)

## Chunk summary (build baseline)

Top JS chunks by raw size from baseline build:

1. `dist/assets/js/exceljs.min-DH-xOR-o.js` — **937.03 kB** (gzip 270.79 kB)
2. `dist/assets/js/index-DbZhE37O.js` — **816.89 kB** (gzip 248.89 kB)
3. `dist/assets/js/charts-vendor-CWKIVBSw.js` — **420.59 kB** (gzip 113.50 kB)
4. `dist/assets/js/pdf-vendor-BDwWAooN.js` — **418.19 kB** (gzip 136.42 kB)
5. `dist/assets/js/html2canvas.esm-DXEQVQnt.js` — **201.09 kB** (gzip 47.47 kB)

- Largest chunk: `exceljs.min-DH-xOR-o.js` (**937.03 kB** raw)

## Warning count snapshot

- Build warnings observed: **2**
  - npm env warning: `Unknown env config "http-proxy"`
  - Vite chunk warning: `Generated an empty chunk: "leaflet-vendor"`

## Known quick-win metrics from Claude diagnosis scope

(Execution source of truth: provided sprint instruction scope)

- Public pages should stop bypassing query cache:
  - `src/pages/OfferApproval.tsx`
  - `src/pages/OfferPublicPage.tsx`
  - `src/pages/ProjectPublicStatus.tsx`
- `staleTime: 0` should be removed or justified in:
  - `src/components/offers/OfferPreviewModal.tsx`
  - `src/hooks/useOfferWizard.ts`
- Animation ceilings target:
  - sheet open ≤ 200ms
  - content fades ≤ 200ms
- Auth pages should be lazy-loaded if still static imports

## Known unknowns requiring live verification

- Real-user INP/LCP/CLS impact after deploy (local build/test cannot prove RUM outcomes)
- Perceived interaction speed on mobile hardware
- Runtime cache hit behavior across repeated navigation in production networking conditions
- Any UX regressions in modal/sheet interactions that require manual exploratory checks on live Vercel
