# Source of Truth — Majster.AI

**Last Updated**: 2026-02-17

## Authoritative References

| Artifact | Path | Purpose |
|----------|------|---------|
| Project overview | CLAUDE.md | Tech stack, repo structure, rules |
| MVP Gate status | docs/mvp-gate/STATUS.md | Per-item PASS/FAIL/BLOCKED |
| Evidence index | docs/evidence/2026-02-17/INDEX.md | Evidence pack artifacts |
| Change log | STAN_PROJEKTU.md | Session-level change log |

## Confirmed Working (Do Not Break)

- Landing page load (`/`)
- Login flow (`/login`)
- Dashboard route (`/app/dashboard`)
- Jobs list (`/app/jobs`) + manual job creation
- Clients list + edit + delete confirm (`/app/customers`)
- Templates list (`/app/templates`)
- Admin blocked for non-admin (`/admin/*`)

## Known Issue Tracker

| ID | Priority | Summary | Status |
|----|----------|---------|--------|
| P0-LOGOUT | P0 | Logout does not clear session / redirect | FIXED (2026-02-17) |
