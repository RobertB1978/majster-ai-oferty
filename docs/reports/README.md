# Audit & Hardening Reports

Central place for repository-wide audits, hardening reports, and large PR narratives. These files were previously scattered in the repo root; they now live under `docs/reports` to reduce duplication and make historical context easier to find.

## Inventory

| Document | Date | Focus | Status / Rationale |
| --- | --- | --- | --- |
| [PRODUCTION_AUDIT_REPORT_2025-12-17.md](./PRODUCTION_AUDIT_REPORT_2025-12-17.md) | 2025-12-17 | Production audit follow-up | Historical reference; contains the last end-to-end production readiness review. |
| [AUDIT_REPORT_2025-12-12.md](./AUDIT_REPORT_2025-12-12.md) | 2025-12-12 | Comprehensive pre-production audit | Historical baseline; kept for traceability of earlier findings. |
| [CSP_HARDENING_DELTA3.md](./CSP_HARDENING_DELTA3.md) | 2025-12-13 | CSP hardening implementation report | Implemented changes are documented here; kept to explain the CSP decisions. |
| [RUNTIME_HARDENING_REPORT_DELTA2.md](./RUNTIME_HARDENING_REPORT_DELTA2.md) | 2025-12-13 | Runtime resilience and dependency hygiene analysis | Archived for context on runtime guardrails and dependency constraints. |
| [PR_DESCRIPTION.md](./PR_DESCRIPTION.md) | 2025-12-17 | Bundle optimization + Stripe integration PR draft | Archived; retains narrative for the historical branch `claude/app-analysis-review-MoS8a`. |

## Usage

- Add future audits or fix-pack reports to this directory to keep the repository root lean.
- When superseding a document, keep the original here and note the successor in the table to avoid ambiguity.
- If a report recommends configuration changes to Supabase, Vercel, or CI, document the decision separately instead of editing infrastructure files directly.
