# Deployment Truth (bez dashboardów)

**Cel:** Ustalić status PASS/FAIL dla Vercel i Supabase wyłącznie na podstawie dowodów z repozytorium, GitHub API (Deployments/Checks) oraz publicznych URL-i widocznych w statusach wdrożeń.

## Zakres dowodów
1. **GitHub Deployments** (API: `/repos/{owner}/{repo}/deployments` + `/statuses`).
2. **Check runs** z Vercel na HEAD domyślnej gałęzi (API: `/commits/{sha}/check-runs`).
3. **Publiczny URL** z `environment_url` w GitHub Deployment Status (jeżeli istnieje).

> **Zakaz używania dashboardów**: żadnych paneli Vercel/Supabase, żadnych screenów od właściciela.

## PASS/FAIL — Vercel
**PASS (Production/Preview)** tylko jeśli **łącznie**:
- istnieje GitHub Deployment dla danego środowiska, **i**
- ostatni status deploymentu ma `state=success`, **i**
- status zawiera **publiczny URL** (`environment_url`).

**FAIL** jeśli brakuje któregokolwiek z ww. dowodów.

## PASS/FAIL — Supabase
**PASS** możliwy tylko, gdy istnieje publiczny, weryfikowalny dowód z GitHub (np. statusy z integracji lub healthcheck z publicznego URL). Bez tego — **FAIL**.

Jeżeli nie da się potwierdzić wdrożeń Supabase bez sekretów:
- **Status: FAIL** (brak dowodów poza dashboardem).
- **Obejścia (opcjonalne, nie w tym PR):**
  - **(A) Minimalny, 1‑razowy sekret w GitHub Actions** (np. token do odczytu statusu deploy z API Supabase) → tylko do odczytu, bez dostępu do danych.
  - **(B) Publiczny healthcheck endpoint** (np. Edge Function `healthcheck`) → wymaga osobnego PR w kodzie, aby wystawić publiczny URL do weryfikacji.

## Skrypt dowodowy (GitHub API)
Dodany skrypt: `scripts/verify/github_deploy_evidence.sh`.

Przykład uruchomienia lokalnie (wymaga tokenu):
```bash
export GITHUB_TOKEN=...  # token z minimalnym read-only dostępem do repo
export GITHUB_REPOSITORY=owner/repo
./scripts/verify/github_deploy_evidence.sh
```

W CI uruchamiany automatycznie w jobie **Deployment Evidence** (read-only).

## Interpretacja wyniku
Skrypt raportuje:
- listę GitHub Deployments i ich statusów,
- obecność środowisk `production` / `preview`,
- check runy zawierające „Vercel”,
- końcowy PASS/FAIL dla Production i Preview na podstawie `success + environment_url`.

Jeżeli którykolwiek z wymogów jest niespełniony → **FAIL**.
