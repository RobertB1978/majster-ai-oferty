# PR-21 — VISUAL_SYSTEM_V2 Evidence Pack

## Screenshot matrix

### BEFORE (Dark)
| Route | Desktop 1440x900 | Mobile 390x844 |
|---|---|---|
| `/login` | ![before dark desktop login](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/desktop_login.png) | ![before dark mobile login](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/mobile_login.png) |
| `/app/offers` | ![before dark desktop offers](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/desktop_app_offers.png) | ![before dark mobile offers](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/mobile_app_offers.png) |
| `/app/projects` | ![before dark desktop projects](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/desktop_app_projects.png) | ![before dark mobile projects](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/mobile_app_projects.png) |
| `/app/settings` (Subscription tab) | ![before dark desktop settings](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/desktop_app_settings.png) | ![before dark mobile settings](browser:/tmp/codex_browser_invocations/2427a3b401fd2572/artifacts/docs/evidence/pr-21/before/dark/mobile_app_settings.png) |

### AFTER (Dark)
| Route | Desktop 1440x900 | Mobile 390x844 |
|---|---|---|
| `/login` | ![after dark desktop login](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/desktop_login.png) | ![after dark mobile login](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/mobile_login.png) |
| `/app/offers` | ![after dark desktop offers](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/desktop_app_offers.png) | ![after dark mobile offers](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/mobile_app_offers.png) |
| `/app/projects` | ![after dark desktop projects](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/desktop_app_projects.png) | ![after dark mobile projects](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/mobile_app_projects.png) |
| `/app/settings` (Subscription tab) | ![after dark desktop settings](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/desktop_app_settings.png) | ![after dark mobile settings](browser:/tmp/codex_browser_invocations/4aca333b96c35a20/artifacts/artifacts/pr21/after/dark/mobile_app_settings.png) |

### AFTER (Light)
| Route | Desktop 1440x900 | Mobile 390x844 |
|---|---|---|
| `/login` | ![after light desktop login](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/desktop_login.png) | ![after light mobile login](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/mobile_login.png) |
| `/app/offers` | ![after light desktop offers](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/desktop_app_offers.png) | ![after light mobile offers](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/mobile_app_offers.png) |
| `/app/projects` | ![after light desktop projects](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/desktop_app_projects.png) | ![after light mobile projects](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/mobile_app_projects.png) |
| `/app/settings` (Subscription tab) | ![after light desktop settings](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/desktop_app_settings.png) | ![after light mobile settings](browser:/tmp/codex_browser_invocations/e77a23617e491d8f/artifacts/artifacts/pr21/after/light/mobile_app_settings.png) |

## Changed files
- `docs/evidence/PR-21_VISUAL_SYSTEM_V2_EVIDENCE.md`

## Verification steps
1. Run quality gates:
   - `npm run lint`
   - `npm run type-check`
   - `npm run build`
   - `npm test`
2. Review screenshot matrix above for before/after parity on all required routes and breakpoints.
