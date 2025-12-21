# GitHub Settings Checklist

Instrukcja „kliknij i gotowe” dla właściciela repo.

## Branch protection (main)
1. Wejdź: **Repository → Settings → Branches → Branch protection rules → Add rule**.
2. W polu **Branch name pattern** wpisz `main`.
3. Zaznacz:
   - ✅ **Require a pull request before merging** (co najmniej 1 approval).
   - ✅ **Require status checks to pass before merging**.
   - ✅ Dodaj statusy: `ci/lint`, `ci/test`, `ci/build`, `ci/security`, `e2e` (opcjonalnie jako non-blocking jeśli Supabase nie jest dostępne).
   - ✅ **Require commit signatures** (jeśli organizacja tego wymaga).
   - 🚫 **Do NOT allow force pushes**.
4. Zapisz rule.

## GitHub Secrets (CI)
Ustaw w **Settings → Secrets and variables → Actions**:
- `VITE_SUPABASE_URL` – URL projektu Supabase (wymagane dla build/e2e).
- `VITE_SUPABASE_ANON_KEY` – anon/public key Supabase (wymagane dla build/e2e).
- `SNYK_TOKEN` – opcjonalny, potrzebny tylko jeśli chcesz uruchamiać Snyk w `ci.yml`.

## Environments (opcjonalne)
Jeśli używasz GitHub Environments (staging/production), skopiuj powyższe secrety do każdego środowiska, bo Actions nie dziedziczą ich automatycznie.

## Required reviewers (opcjonalne)
- **Settings → Collaborators & teams**: dodaj zespół/ownerów jako **Code owners**.
- Dodaj plik `.github/CODEOWNERS` jeśli chcesz automatycznego przypisywania (np. `* @org/maintainers`).
