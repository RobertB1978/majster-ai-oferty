# Polityka usuwania konta — Majster.AI

> **Wersja:** 1.0 (PR-05)
> **Data:** 2026-03-01
> **Właściciel:** Product Owner (Robert B.) + Tech Lead (Claude)
> **Podstawa prawna:** Art. 17 RODO (Rozporządzenie UE 2016/679) + Apple App Store Review Guideline 5.1.1

---

## 1. Opis funkcjonalności

Funkcja „Usuń konto" pozwala użytkownikowi na **nieodwracalne, trwałe usunięcie konta** wraz ze wszystkimi danymi osobowymi, zgodnie z:

- **Art. 17 RODO** — Prawo do bycia zapomnianym (Right to Erasure)
- **Apple App Store Review Guideline 5.1.1** — Aplikacje umożliwiające zakładanie kont muszą umożliwiać ich usunięcie
- **GDPR Article 17** — Right to erasure

---

## 2. Sposób działania (flow)

```
Użytkownik → Ustawienia → Usuń konto
  ↓
  Modal potwierdzenia (AlertDialog)
  ↓
  Wpisz słowo "USUŃ" (potwierdzenie intencji)
  ↓
  Klik "Usuń konto trwale"
  ↓
  supabase.functions.invoke('delete-user-account', { confirmationPhrase: 'USUŃ' })
  ↓
  Edge Function (server-side):
    1. Weryfikacja tokenu JWT (auth header)
    2. Weryfikacja frazy "USUŃ" (server-side, nie tylko client-side)
    3. Rate limiting: max 3 próby/godzinę
    4. Usunięcie danych PII:
       - company_profiles (dane firmy PDF)
       - profiles (email/auth settings)
       - quotes + quote_items
       - projects
       - clients
       - calendar_events
       - item_templates
       - notifications
       - offer_approvals
       - user_subscriptions
    5. Usunięcie konta auth (supabaseAdmin.auth.admin.deleteUser)
    6. Audit log (bez PII, z obfuskowanym user_id)
  ↓
  Wylogowanie (supabase.auth.signOut())
  ↓
  Przekierowanie na /login
```

---

## 3. Tabele objęte usunięciem

| Tabela | Zawiera PII? | Metoda | Uwagi |
|--------|-------------|--------|-------|
| `company_profiles` | TAK | DELETE WHERE user_id | Dane firmy PDF (NIP, adres, tel) |
| `profiles` | TAK | DELETE WHERE user_id | Email, ustawienia konta |
| `quotes` + `quote_items` | TAK | DELETE WHERE user_id | Wyceny i pozycje |
| `projects` | TAK | DELETE WHERE user_id | Projekty |
| `clients` | TAK | DELETE WHERE user_id | Dane klientów |
| `calendar_events` | TAK | DELETE WHERE user_id | Zdarzenia kalendarza |
| `item_templates` | NIE | DELETE WHERE user_id | Szablony pozycji |
| `notifications` | NIE | DELETE WHERE user_id | Powiadomienia |
| `offer_approvals` | TAK | DELETE WHERE user_id | Historia akceptacji |
| `user_subscriptions` | TAK | DELETE WHERE user_id | Subskrypcja |
| `auth.users` | TAK | admin.deleteUser() | Konto logowania |

### Tabele NIE objęte automatycznym usunięciem:

| Tabela | Powód zatrzymania | Retencja |
|--------|------------------|----------|
| **Kopie zapasowe bazy** | Automatyczne snapshoty Supabase | **30 dni** — potem usunięte automatycznie |
| **Dane finansowe** | Wymóg prawny (ustawa o rachunkowości, Art. 74) | **5 lat** — wymagane przez polskie prawo |
| **Logi systemowe** | Obfuskowane (bez PII) | 90 dni |

> ⚠️ **Uwaga dla użytkownika:** Usunięcie konta jest natychmiastowe z perspektywy dostępu. Dane mogą jednak pozostawać w kopiach zapasowych do 30 dni. Dane finansowe (wymagane prawnie) są przechowywane oddzielnie przez 5 lat, ale bez możliwości identyfikacji osoby po usunięciu konta.

---

## 4. Bezpieczeństwo implementacji

### Zabezpieczenia po stronie serwera (Edge Function)

```typescript
// 1. Weryfikacja tokenu — nie ufamy danym z body
const token = authHeader.replace('Bearer ', '');
const { user } = await supabaseAdmin.auth.getUser(token);

// 2. Weryfikacja frazy — server-side, nie tylko client-side
const expectedPhrase = 'USUŃ';
if (confirmationPhrase !== expectedPhrase) { reject() }

// 3. Rate limiting — max 3 próby/godzinę
checkRateLimit({ maxRequests: 3, windowMs: 3600000 })

// 4. Brak PII w logach — obfuskowany user_id
userId.substring(0, 8) + '***'
```

### Zabezpieczenia po stronie klienta

- Słowo potwierdzające: **"USUŃ"** (polskie słowo, trudne do przypadkowego wpisania)
- Przycisk aktywny dopiero po wpisaniu pełnego słowa
- Komunikaty błędów nie ujawniają szczegółów technicznych

---

## 5. Weryfikacja RLS (test IDOR)

Tabela `company_profiles` ma RLS na poziomie bazy danych:

```sql
-- Policy: users can only see their own data
CREATE POLICY "company_profiles_select_own"
ON public.company_profiles
FOR SELECT
USING (auth.uid() = user_id);
```

**Test 2 kont (IDOR verification):**

```sql
-- Krok 1: Zaloguj się jako User A w Supabase Studio (Set role = auth user A)
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub": "<user_A_uuid>"}';

-- Krok 2: Spróbuj odczytać dane User B
SELECT * FROM company_profiles WHERE user_id = '<user_B_uuid>';
-- Wynik: 0 wierszy (RLS blokuje)

-- Krok 3: Spróbuj zaktualizować dane User B
UPDATE company_profiles SET company_name = 'HACKED' WHERE user_id = '<user_B_uuid>';
-- Wynik: 0 rows updated (RLS blokuje)

-- Krok 4: Spróbuj usunąć dane User B
DELETE FROM company_profiles WHERE user_id = '<user_B_uuid>';
-- Wynik: 0 rows deleted (RLS blokuje)
```

Analogiczna procedura dla tabeli `profiles` jest opisana w `docs/SECURITY_BASELINE.md Sekcja 3`.

---

## 6. Weryfikacja flow usuwania konta (test manualny)

```
1. Utwórz konto testowe (email: test-deletion@example.com)
2. Dodaj dane firmowe w Profil firmy
3. Przejdź do Ustawienia → Usuń konto
4. Kliknij "Usuń konto całkowicie"
5. W modalu wpisz "USUŃ" i kliknij potwierdź
6. Oczekiwany rezultat:
   ✓ Toast "Konto zostało usunięte"
   ✓ Przekierowanie na /login
   ✓ Próba logowania → błąd (konto nie istnieje)
   ✓ W Supabase Auth Dashboard → user_id nieobecny
   ✓ W tabeli company_profiles → 0 wierszy dla user_id
   ✓ W tabeli profiles → 0 wierszy dla user_id
7. Weryfikacja ochrony:
   ✓ Wpisanie "delete" (małe litery) → przycisk nieaktywny
   ✓ Wpisanie "DELETE" (angielski) → przycisk nieaktywny
   ✓ Kliknięcie "Anuluj" → modal zamknięty, konto nienaruszone
```

---

## 7. Ograniczenia znane (PR-05)

| Ograniczenie | Powód | Follow-up |
|-------------|-------|-----------|
| Dane finansowe w kopiach zapasowych 30 dni | Supabase automatic backups | PR-X: zautomatyzowane żądanie erasure do Supabase |
| Brak emaila potwierdzającego usunięcie | Poza zakresem PR-05 | PR-X: dodać email "Twoje konto zostało usunięte" |
| Brak eksportu danych (RODO Art. 20) | Poza zakresem PR-05 | PR-X: "Pobierz swoje dane" przed usunięciem |
| Logo w Supabase Storage nie jest czyszczone | Brak bucket cleanup w Edge Function | PR-X: dodać `storage.remove()` dla logos/{user_id}/ |

---

## 8. Kontakt

W przypadku pytań dotyczących usuwania danych osobowych:
- Email: kontakt@majster.ai (w przyszłości)
- Realizacja żądań RODO: do 30 dni roboczych od zgłoszenia (Art. 12 RODO)

---

*Dokument: v1.0 | PR-05 | Data: 2026-03-01 | Autor: Claude (Tech Lead)*
