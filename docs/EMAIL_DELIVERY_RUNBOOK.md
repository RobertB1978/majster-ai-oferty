# EMAIL_DELIVERY_RUNBOOK.md — Produkcyjna konfiguracja dostarczania e-maili

**Majster.AI | Wersja:** 1.0 | **Data:** 2026-03-11
**Odbiorca:** Właściciel projektu (operator)

---

## Co ten dokument opisuje

Majster.AI wysyła e-maile w trzech przypadkach:

| Skąd jest wysyłany | Co się dzieje |
|---|---|
| Kliknięcie "Wyślij ofertę" w aplikacji | E-mail z ofertą do klienta (Edge Function `send-offer-email`) |
| Automatyczny cron (raz dziennie) | Przypomnienie o wygasającej ofercie (Edge Function `send-expiring-offer-reminders`) |
| Supabase Auth | E-mail weryfikacyjny do nowego użytkownika (konfiguracja Supabase) |

Wszystkie trzy ścieżki wymagają osobnej konfiguracji. **Jeśli konfiguracja jest niekompletna, e-maile nie są wysyłane — aplikacja nie symuluje sukcesu.**

---

## Wymagane sekrety (Supabase Edge Functions Secrets)

Przejdź do: **Supabase Dashboard → Edge Functions → Secrets**

### 1. `RESEND_API_KEY` ✅ WYMAGANE

- Format: `re_xxxxxxxxxxxx`
- Gdzie wygenerować: [https://resend.com/api-keys](https://resend.com/api-keys)
- Bez tego klucza: wszystkie e-maile z ofertami i przypomnieniami są blokowane zwracając HTTP 503

**Kroki:**
1. Zaloguj się na [resend.com](https://resend.com)
2. Kliknij **API Keys** → **Create API Key**
3. Nazwa: `Majster.AI Production`
4. Permissions: **Sending access** (nie Full access)
5. Skopiuj klucz (`re_...`) i dodaj go w Supabase Secrets jako `RESEND_API_KEY`

---

### 2. `SENDER_EMAIL` ✅ WYMAGANE — BLOKUJE WYSYŁKĘ JEŚLI BRAK

- Format: `noreply@twoja-domena.pl` lub `kontakt@twoja-domena.pl`
- **Domena MUSI być zweryfikowana w panelu Resend** (patrz niżej)
- Bez tego: wszystkie e-maile są blokowane zwracając HTTP 503

**⚠️ WAŻNE — czego NIE używać jako SENDER_EMAIL:**

| Adres | Dlaczego nie działa |
|---|---|
| `kontakt.majsterai@gmail.com` | Gmail to domena Google, której nie możesz zweryfikować w Resend |
| `cokolwiek@yahoo.com` | Jak wyżej |
| `cokolwiek@wp.pl` | Jak wyżej |
| `noreply@resend.dev` | To jest adres testowy Resend — działa TYLKO dla adresu e-mail właściciela konta Resend, nie dotrze do żadnych innych odbiorców |

**Prawidłowe wartości SENDER_EMAIL:**
```
noreply@majster.ai
kontakt@majster.ai
oferty@twoja-domena.pl
```
(Gdzie `majster.ai` lub `twoja-domena.pl` to domena, którą zweryfikujesz w Resend)

---

### 3. `FRONTEND_URL` ✅ WYMAGANE

- Format: `https://majster-ai-oferty.vercel.app` (lub Twoja własna domena)
- Bez tego: e-maile są blokowane (linki do ofert byłyby uszkodzone)
- Wartość musi to być dokładny URL produkcyjnej aplikacji

---

## Weryfikacja domeny w Resend (krok po kroku)

> Weryfikacja domeny jest niezbędna żeby Resend mógł wysyłać e-maile "od Ciebie".
> Bez niej Resend odrzuci każdą próbę wysyłki z Twoją domeną w polu `from`.

### Krok 1: Dodaj domenę w Resend

1. Zaloguj się na [resend.com](https://resend.com)
2. Kliknij **Domains** → **Add Domain**
3. Wpisz swoją domenę: np. `majster.ai`
4. Kliknij **Add**

### Krok 2: Dodaj rekordy DNS

Resend pokaże Ci kilka rekordów DNS do dodania:

| Typ rekordu | Co dodać | Gdzie |
|---|---|---|
| `MX` | Resend MX record | Panel DNS Twojego rejestratora domeny |
| `TXT` (SPF) | `v=spf1 include:amazonses.com ~all` | Panel DNS |
| `TXT` (DKIM) | Długi klucz `resend._domainkey.twoja-domena` | Panel DNS |

**Gdzie jest panel DNS?**
- Jeśli domenę kupiłeś w OVH → panel OVH → DNS Zone
- Jeśli w home.pl → panel home.pl → Domeny → DNS
- Jeśli w nazwa.pl → panel nazwa.pl → Zarządzaj DNS
- Jeśli w Cloudflare → Cloudflare Dashboard → twoja-domena → DNS

### Krok 3: Czekaj na weryfikację

Po dodaniu rekordów DNS Resend potrzebuje **5–30 minut** na weryfikację.
Poczekaj aż status domeny w Resend zmieni się na ✅ **Verified**.

### Krok 4: Ustaw SENDER_EMAIL

Po weryfikacji dodaj sekret w Supabase:
```
SENDER_EMAIL = noreply@twoja-domena.pl
```

---

## Konfiguracja e-maili uwierzytelniania Supabase (rejestracja, reset hasła)

E-maile weryfikacyjne (rejestracja nowego użytkownika, reset hasła) są wysyłane przez **Supabase Auth** — to osobna konfiguracja od wysyłki ofert.

### Opcja A: Użyj własnego dostawcy SMTP (zalecane dla produkcji)

1. Przejdź do: **Supabase Dashboard → Authentication → Email Settings**
2. Włącz **Custom SMTP**
3. Wprowadź dane SMTP — możesz użyć tych samych danych co Resend:
   - SMTP Host: `smtp.resend.com`
   - SMTP Port: `465` (SSL) lub `587` (TLS)
   - Użytkownik: `resend`
   - Hasło: Twój `RESEND_API_KEY`
   - Nadawca: `noreply@twoja-domena.pl` (ta sama co `SENDER_EMAIL`)

4. Kliknij **Save**

### Opcja B: Domyślny serwer Supabase (tylko dla testów!)

Supabase domyślnie używa własnego serwera e-mail, który:
- Ma limit **3 e-maile na godzinę** dla projektów za darmo
- Używa adresu `noreply@mail.app.supabase.io`
- **Nie jest odpowiedni dla produkcji** — e-maile często trafiają do spamu

**Dla produkcji MUSISZ skonfigurować własny SMTP** (Opcja A).

---

## Sprawdzenie czy konfiguracja działa (healthcheck)

Endpoint `/functions/v1/healthcheck` sprawdza stan konfiguracji e-mail:

```bash
curl https://xwxvqhhnozfrjcjmcltv.supabase.co/functions/v1/healthcheck
```

Prawidłowa odpowiedź (e-mail skonfigurowany):
```json
{
  "status": "healthy",
  "checks": {
    "email": { "status": "pass" }
  }
}
```

Odpowiedź gdy konfiguracja jest niekompletna:
```json
{
  "status": "degraded",
  "checks": {
    "email": {
      "status": "not_configured",
      "missing": ["SENDER_EMAIL", "FRONTEND_URL"]
    }
  }
}
```

Odpowiedź gdy adres nadawcy jest nieprawidłowy:
```json
{
  "status": "degraded",
  "checks": {
    "email": {
      "status": "misconfigured",
      "warnings": ["SENDER_EMAIL uses \"gmail.com\" which is a consumer domain..."]
    }
  }
}
```

---

## Tabela wszystkich wymaganych sekretów dla e-mail

| Sekret | Wymagane przez | Konsekwencja braku |
|---|---|---|
| `RESEND_API_KEY` | `send-offer-email`, `send-expiring-offer-reminders` | HTTP 503 przy próbie wysyłki |
| `SENDER_EMAIL` | `send-offer-email`, `send-expiring-offer-reminders` | HTTP 503 przy próbie wysyłki |
| `FRONTEND_URL` | `send-offer-email`, `send-expiring-offer-reminders` | HTTP 503 (lub uszkodzone linki w e-mailach) |
| SMTP w Supabase Auth | E-maile weryfikacyjne Supabase | E-maile trafiają do spamu / limit 3/h |

---

## Najczęstsze błędy

### "Email delivery is not properly configured" (HTTP 503)

**Diagnoza:** Brak `RESEND_API_KEY`, `SENDER_EMAIL` lub `FRONTEND_URL` w sekretach Supabase.

**Rozwiązanie:**
1. Supabase Dashboard → Edge Functions → Secrets
2. Sprawdź czy wszystkie trzy sekrety są ustawione
3. Upewnij się że `SENDER_EMAIL` używa domeny, którą zweryfikowałeś w Resend
4. Odczekaj 1–2 minuty po zmianie sekretów

---

### E-maile trafiają do spamu

**Przyczyny:**
- Domena nie ma rekordów SPF/DKIM (nie przeszła weryfikacji w Resend)
- `SENDER_EMAIL` jest adresem Gmaila lub innym niezweryfikowanym

**Rozwiązanie:**
1. Wejdź na [resend.com/domains](https://resend.com/domains) i sprawdź czy Twoja domena ma status ✅ Verified
2. Jeśli nie — dodaj brakujące rekordy DNS (patrz sekcja "Weryfikacja domeny")

---

### "Resend API error: 403 Forbidden" lub "Domain not verified"

**Przyczyna:** `SENDER_EMAIL` używa domeny, która NIE jest zweryfikowana w Resend.

**Rozwiązanie:** Zweryfikuj domenę w Resend (patrz wyżej) lub użyj już zweryfikowanej domeny.

---

### E-maile weryfikacyjne nie docierają po rejestracji

**Przyczyna:** Supabase Auth nie jest skonfigurowany do używania własnego SMTP.

**Rozwiązanie:** Skonfiguruj SMTP w Supabase Auth → Email Settings (Opcja A powyżej).

---

## Checklist przed uruchomieniem produkcji

- [ ] `RESEND_API_KEY` ustawiony w Supabase Secrets
- [ ] `SENDER_EMAIL` ustawiony — adres z zweryfikowanej domeny
- [ ] `FRONTEND_URL` ustawiony — URL produkcyjnej aplikacji Vercel
- [ ] Domena w `SENDER_EMAIL` ma status ✅ Verified w Resend
- [ ] Supabase Auth SMTP skonfigurowany (nie domyślny serwer Supabase)
- [ ] Healthcheck zwraca `"email": { "status": "pass" }` — zweryfikowane `curl`
- [ ] Testowy e-mail z ofertą wysłany i odebrany przez klienta testowego

---

*Dokument stworzony: 2026-03-11 | PR fix-email-delivery*
