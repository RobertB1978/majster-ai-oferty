# DSAR Inbox Workflow — PR-L3

## Co było nie tak (przed PR-L3)

`GDPRCenter.tsx` obsługiwał żądania usunięcia danych (`handleDeleteRequest`) w następujący sposób:

1. Logował event `user.data_delete_request` do `compliance_audit_log` ✅
2. **Wstawiał rekord do tabeli `notifications`** ❌ — to była jedyna "trwała" reprezentacja wniosku

### Dlaczego to był problem

- Tabela `notifications` nie jest source of truth dla wniosków RODO — to system powiadomień UX, nie rejestr compliance.
- Brak dedykowanej tabeli = brak SLA tracking, brak statusu, brak historii.
- Admin nie miał inbox — musiał czytać notyfikacje, żeby wiedzieć o wnioskach.
- Każde żądanie inne niż "usunięcie" (dostęp, sprostowanie, przeniesienie) nie miało żadnego przepływu — jedynie tekst na stronie.

---

## Źródło prawdy po PR-L3

### Tabela: `dsar_requests`

```
id                uuid  PK
requester_user_id uuid  → auth.users (requester)
request_type      text  CHECK: access|deletion|rectification|portability|restriction|objection|other
status            text  CHECK: open|in_progress|waiting_for_user|resolved|rejected
description       text  nullable
created_at        timestamptz
updated_at        timestamptz  auto-updated via trigger
due_at            timestamptz  DEFAULT now() + 30 days (SLA)
assigned_to       uuid  nullable → auth.users (admin handler)
resolved_at       timestamptz  nullable, set when status = resolved|rejected
resolution_note   text  nullable
```

### Audit trail: `compliance_audit_log` (PR-L8)

Każda operacja na DSAR jest rejestrowana w `compliance_audit_log` (append-only, immutable):

| Event type | Kiedy |
|---|---|
| `dsar.request_created` | Użytkownik składa wniosek |
| `dsar.status_changed` | Admin zmienia status (pośredni) |
| `dsar.resolved` | Admin oznacza jako rozwiązane |
| `dsar.rejected` | Admin odrzuca wniosek |

---

## Model SLA

- **Termin**: 30 dni od złożenia (kolumna `due_at = created_at + 30 days`)
- **Wyświetlanie**: Obie strony (user i admin) widzą countdown do terminu
- **Przekroczenie**: Wyróżnione wizualnie (kolor destructive + ikona AlertTriangle)
- **Zamknięcie SLA**: Countdown chowany gdy `status IN ('resolved', 'rejected')`

**Uwaga:** Aplikacja nie wysyła automatycznych przypomnień o zbliżającym się terminie — to zadanie dla PR-L7 (scheduled reminders).

---

## Architektura dostępu (RLS)

| Rola | Operacja | Warunek |
|---|---|---|
| authenticated user | INSERT | `requester_user_id = auth.uid()` |
| authenticated user | SELECT | `requester_user_id = auth.uid()` |
| admin | SELECT | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')` |
| admin | UPDATE | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')` |
| everyone | DELETE | ❌ ZABRONIONE |

Soft-close przez status (`resolved` / `rejected`) zamiast DELETE.

---

## Ścieżki UI

### Użytkownik (`/legal/rodo`)

- `GDPRCenter.tsx` — zaktualizowany w PR-L3
- Karta "Usunięcie danych" → dialog potwierdzenia → `useCreateDsarRequest()` → insert do `dsar_requests`
- Sekcja "Moje wnioski RODO" — pokazuje listę własnych wniosków ze statusem i countdown SLA

### Admin (`/admin/dsar`)

- `AdminDsarPage.tsx` — nowa strona w panelu admin (PR-L3)
- Inbox lista posortowana wg `due_at ASC`
- Filtr statusu
- Dialog "Zarządzaj" → `useUpdateDsarRequest()` → zmiana statusu + notatka → audit log

---

## Co PR-L3 NIE robi (odroczono)

| Temat | Powód | Następny PR |
|---|---|---|
| Automatyczne przypomnienia o SLA | Wymaga scheduled Edge Function | PR-L7 |
| Email do użytkownika przy zmianie statusu | Wymaga email integration | PR-L4 |
| Widok "Moje wnioski" jako osobna strona | Obecna lista w GDPRCenter wystarczy na start | PR-L6 |
| Breach register | Odrębny compliance feature | PR-L5 |
| Retention automation (auto-delete po resolved) | Ryzyko danych, wymaga decyzji architektonicznej | Follow-up |

---

## Rollback

### Jeśli migracja powoduje problemy:

```sql
-- Cofnij PR-L3 migrację (tylko jeśli tabela jest pusta / brak produkcyjnych danych)
DROP TABLE IF EXISTS public.dsar_requests;
DROP FUNCTION IF EXISTS public.dsar_requests_set_updated_at();
```

### Jeśli UI powoduje problemy:

Przywróć poprzednią wersję `GDPRCenter.tsx` z git:

```bash
git revert HEAD  # jeśli to ostatni commit
# LUB
git checkout <poprzedni-commit> -- src/pages/legal/GDPRCenter.tsx
```

### Jeśli Admin DSAR page powoduje problemy:

- Usuń route `<Route path="dsar" element={<AdminDsarPage />} />` z `App.tsx`
- Usuń import `AdminDsarPage` z `App.tsx`
- Pozostałe zmiany (migracja, typy, hooki) są nieszkodliwe

---

## Decyzja: Feature flag

**Nie zastosowano feature flagi** dla PR-L3. Uzasadnienie:

- Zmiana zastępuje broken hack (notification insert), który nie działał prawidłowo
- Nie ma ryzyka regresu funkcjonalności — poprzedni flow był notoriously weak
- Nowy flow jest addytywny (dodaje tabelę) a nie modyfikujący istniejących danych
- AdminDsarPage jest dostępna tylko dla roli `admin` (RLS enforcement)

---

## Autorzy

- PR-L3 zaimplementowany przez: Claude Sonnet 4.6 (agent)
- Przegląd: Robert Bielecki (właściciel projektu)
- Data: 2026-04-20
