# Raport Jakości Aplikacji Majster.AI

**Data skanu:** 2026-03-10
**Domeny:** www.majsterai.com / majster-ai-oferty.vercel.app
**Hosting:** Vercel

---

## Podsumowanie Ogólne

| Obszar | Ocena | Status |
|--------|-------|--------|
| Nagłówki bezpieczeństwa HTTP | **A+** | PASS |
| SSL/TLS (HTTPS) | **A** | PASS |
| Content Security Policy (CSP) | **A** | PASS |
| Ochrona przed XSS | **A+** | PASS |
| Walidacja danych wejściowych | **A+** | PASS |
| Dostępność (WCAG) | **B+** | PASS z uwagami |
| Wydajność / Code Splitting | **A** | PASS |
| Optymalizacja obrazów | **C** | WYMAGA POPRAWY |
| Prywatność / trackery | **A** | PASS |
| SEO / meta tagi | **A** | PASS |
| Stack technologiczny | **A** | PASS |
| Zarządzanie sekretami | **A+** | PASS |

**Ogólna ocena: B+ / A-** (bardzo dobra, z kilkoma obszarami do poprawy)

---

## 1. Nagłówki Bezpieczeństwa HTTP (SecurityHeaders)

**Ocena: A+** | **PASS**

Wszystkie kluczowe nagłówki bezpieczeństwa są obecne:

| Nagłówek | Wartość | Status |
|----------|---------|--------|
| `Content-Security-Policy` | Rozbudowana polityka (patrz sekcja CSP) | PASS |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | PASS |
| `X-Content-Type-Options` | `nosniff` | PASS |
| `X-Frame-Options` | `DENY` | PASS |
| `X-XSS-Protection` | `1; mode=block` | PASS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | PASS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | PASS |
| `Access-Control-Allow-Origin` | `*` | UWAGA |

**Komentarz:** Nagłówki bezpieczeństwa to klasa A+. Jedyna uwaga to `Access-Control-Allow-Origin: *` - dla publicznej strony frontendowej jest OK, ale warto rozważyć ograniczenie do konkretnych domen w Edge Functions.

---

## 2. Content Security Policy (CSP)

**Ocena: A** | **PASS**

Pełna polityka CSP:

```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://unpkg.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com
             https://api.anthropic.com https://generativelanguage.googleapis.com
             https://sentry.io https://*.sentry.io;
media-src 'self' blob:;
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

**Co jest dobrze:**
- `object-src 'none'` - blokuje pluginy (Flash, Java)
- `frame-ancestors 'none'` - chroni przed clickjacking
- `base-uri 'self'` - chroni przed base tag injection
- `upgrade-insecure-requests` - wymusza HTTPS
- Ścisła lista dozwolonych domen w `connect-src`

**Drobna uwaga:**
- `style-src 'unsafe-inline'` - konieczne ze względu na biblioteki UI (Radix/Tailwind), ale ideałem byłoby nonce-based

---

## 3. SSL/TLS (HTTPS)

**Ocena: A** | **PASS**

| Parametr | Wartość |
|----------|---------|
| Protokół | HTTP/2 |
| HSTS | Tak, z preload |
| Redirect HTTP→HTTPS | Tak (307) |
| Redirect non-www→www | Tak (majsterai.com → www.majsterai.com) |

**Komentarz:** Vercel automatycznie obsługuje certyfikaty SSL z Let's Encrypt, z TLS 1.3 i strong cipher suites. Ocena SSL Labs powinna być A lub A+.

---

## 4. Bezpieczeństwo Kodu

**Ocena: A+** | **PASS**

### 4.1 Ochrona przed XSS

| Element | Status |
|---------|--------|
| `dangerouslySetInnerHTML` | 1 instancja (bezpieczna - CSS theming w chart-internal.tsx) |
| React auto-escaping | Aktywne |
| Sanityzacja HTML w Edge Functions | Tak (`_shared/sanitization.ts`) |
| Sanityzacja outputu AI | Tak (`sanitizeAiOutput()` z iteracyjnym strip tagów) |
| Brak `innerHTML` w kodzie frontendu | Potwierdzone |

### 4.2 Walidacja Danych Wejściowych

| Warstwa | Narzędzie | Status |
|---------|-----------|--------|
| Frontend | Zod + React Hook Form | PASS |
| Edge Functions | `_shared/validation.ts` | PASS |
| Normalizacja danych | `dataValidation.ts` | PASS |

Walidowane typy danych:
- Email, hasło (8+ znaków, wielkie/małe litery, cyfry)
- NIP (10 cyfr), kod pocztowy (XX-XXX), telefon (9+ cyfr)
- URL, UUID, daty ISO
- Pozycje kosztorysu (nazwa, ilość, jednostka, cena, kategoria)
- Limity rozmiaru payload (domyślnie 1MB)
- Limity długości stringów

### 4.3 Zapytania do Bazy Danych

| Element | Status |
|---------|--------|
| Parametryzowane zapytania Supabase | PASS (`.eq()`, `.filter()`, `.select()`) |
| Brak raw SQL w frontendzie | PASS |
| Brak service_role key w frontendzie | PASS |
| RLS policies | Referencje w kodzie prawidłowe |

### 4.4 Zarządzanie Sekretami

| Element | Status |
|---------|--------|
| Brak zahardkodowanych kluczy API | PASS |
| `VITE_` prefix dla zmiennych frontendowych | PASS |
| `Deno.env.get()` w Edge Functions | PASS |
| `.env` w `.gitignore` | PASS |
| Walidacja formatu klucza API (64-char hex) | PASS |

### 4.5 Rate Limiting

| Element | Status |
|---------|--------|
| Per-endpoint rate limiting | PASS (w `_shared/rate-limiter.ts`) |
| Fail-closed design | PASS |

---

## 5. Dostępność (WCAG)

**Ocena: B+** | **PASS z uwagami**

### Co działa dobrze:

| Element | Status | Szczegóły |
|---------|--------|-----------|
| ARIA labels | PASS | 270 instancji `aria-*` w kodzie |
| Hierarchia nagłówków | PASS | Prawidłowe h1 → h2 → h3 |
| Etykiety formularzy | PASS | 74 instancje `htmlFor=`, `aria-invalid`, `aria-describedby` |
| Nawigacja klawiaturą | PASS | Skip-to-content link, obsługa Enter/Space/Escape |
| Focus indicators | PASS | `focus-visible:ring-2` na wszystkich elementach interaktywnych |
| Reduced motion | PASS | `useReducedMotion()` hook + Framer Motion config |
| Dark mode | PASS | Pełne wsparcie z HSL color system |

### Co wymaga poprawy:

| Problem | Priorytet | Szczegóły |
|---------|-----------|-----------|
| Brak `alt` na obrazkach | WYSOKI | Tylko 3 instancje `alt=` w tagach `<img>` |
| SVG bez `aria-hidden` | ŚREDNI | Logo.tsx i ilustracje dekoracyjne |
| Brak focus trap w modalkach | ŚREDNI | Dialog.tsx nie blokuje focus wewnątrz |
| Brak przywracania focus | NISKI | Po zamknięciu modala focus nie wraca |
| Kontrast szarego tekstu | NISKI | `text-gray-400` może nie spełniać WCAG AA |

---

## 6. Wydajność

**Ocena: A** | **PASS**

### 6.1 Code Splitting (Lazy Loading)

| Element | Status |
|---------|--------|
| Wszystkie strony lazy-loaded | PASS (React.lazy w App.tsx) |
| Recharts (410KB) izolowany w osobnym chunku | PASS |
| Framer Motion (100KB) w osobnym chunku | PASS |
| Leaflet (mapy) w osobnym chunku | PASS |
| jsPDF w osobnym chunku | PASS |
| AI Chat Agent lazy-loaded | PASS |

### 6.2 Vendor Chunks (vite.config.ts)

```
react-vendor:          React + ReactDOM + React Router
ui-vendor:             Radix UI (14 pakietów)
supabase-vendor:       Supabase JS client
form-vendor:           React Hook Form + Zod
charts-vendor:         Recharts (410KB)
framer-motion-vendor:  Framer Motion (100KB)
leaflet-vendor:        Leaflet (mapy)
pdf-vendor:            jsPDF + autotable
```

### 6.3 Caching (TanStack Query)

| Parametr | Wartość |
|----------|---------|
| staleTime | 5 minut |
| gcTime | 30 minut |
| retry | 1 |
| refetchOnWindowFocus | false |

### 6.4 Inne optymalizacje

| Element | Status |
|---------|--------|
| Debounced search (300ms) | PASS |
| Server-side pagination | PASS |
| Hash-based asset naming | PASS |
| esbuild minification | PASS |
| CSS minification | PASS |
| HTTP/2 | PASS |
| Vercel CDN caching | PASS |

### 6.5 Co wymaga poprawy:

| Problem | Priorytet |
|---------|-----------|
| Brak `loading="lazy"` na obrazkach | ŚREDNI |
| Brak wirtualizacji list (60+ elementów) | NISKI |
| Brak `srcSet` / responsive images | NISKI |
| Główny bundle ~1.5MB (458KB gzip) | AKCEPTOWALNY dla SaaS |

---

## 7. SEO / Meta Tagi

**Ocena: A** | **PASS**

| Meta tag | Obecny | Wartość |
|----------|--------|---------|
| `<title>` | TAK | "Majster.AI — Wyceny i oferty PDF dla fachowców" |
| `<meta description>` | TAK | Pełny opis po polsku |
| `<meta viewport>` | TAK | `width=device-width, initial-scale=1` |
| `<meta keywords>` | TAK | Trafne słowa kluczowe PL |
| `og:title` | TAK | Prawidłowy |
| `og:description` | TAK | Prawidłowy |
| `og:image` | TAK | icon-512.png |
| `og:type` | TAK | website |
| `og:locale` | TAK | pl_PL |
| `og:site_name` | TAK | Majster.AI |
| `twitter:card` | TAK | summary_large_image |
| `twitter:title` | TAK | Prawidłowy |
| `twitter:description` | TAK | Prawidłowy |
| `twitter:image` | TAK | icon-512.png |
| `<html lang="pl">` | TAK | Prawidłowy |
| `manifest.json` | TAK | PWA manifest |
| `apple-touch-icon` | TAK | icon-192.png |
| `theme-color` | TAK | #9b5208 |
| `sitemap.xml` | TAK | Z hreflang (pl, en, uk) |
| `robots.txt` | TAK | Obecny |
| Canonical URL | BRAK | Powinien być dodany |
| Structured data (JSON-LD) | BRAK | Warto dodać dla LocalBusiness |

---

## 8. Prywatność / Trackery

**Ocena: A** | **PASS**

Na podstawie analizy kodu i nagłówków:

| Element | Status |
|---------|--------|
| Brak Google Analytics | PASS (brak trackerów) |
| Brak Facebook Pixel | PASS |
| Brak TikTok Pixel | PASS |
| Brak third-party tracking scripts | PASS |
| Sentry (error tracking) | OBECNY - ale to monitoring błędów, nie tracking użytkowników |
| Brak reklamowych cookies | PASS |
| Permissions-Policy restrykcyjna | PASS (camera/mic/geo wyłączone) |

**Komentarz:** Aplikacja jest bardzo czysta pod kątem prywatności. Jedyny zewnętrzny serwis to Sentry do monitorowania błędów, co jest standardem branżowym i nie jest trackerem reklamowym.

---

## 9. Stack Technologiczny

**Ocena: A** | **PASS**

| Warstwa | Technologia | Wersja |
|---------|------------|--------|
| Frontend | React | 18.3.1 |
| Language | TypeScript | 5.8 |
| Build | Vite | 5.4 |
| Routing | React Router | 6.30 |
| CSS | Tailwind CSS | 3.4 |
| UI Components | shadcn/ui (Radix UI) | Aktualne |
| Animacje | Framer Motion | 11.18 |
| State | TanStack Query | 5.83 |
| Formularze | React Hook Form + Zod | 7.61 / 3.25 |
| Wykresy | Recharts | 2.15 |
| Mapy | Leaflet | 1.9 |
| PDF | jsPDF | 4.1 |
| i18n | i18next | Aktualne |
| Backend | Supabase (PostgreSQL + Edge Functions) | Aktualne |
| Hosting | Vercel | Aktualne |
| Mobile | Capacitor | 7.4 |
| Error Tracking | Sentry | Skonfigurowany w CSP |
| AI | OpenAI / Anthropic / Gemini | Konfigurowalne |

**Komentarz:** Stack jest nowoczesny, dobrze dobrany i aktualny. Wszystkie kluczowe zależności mają aktualne wersje.

---

## 10. Reputacja Domeny

**Status:** Nie udało się uzyskać wyników VirusTotal programowo (wymaga sesji przeglądarki).

**Rekomendacja:** Ręcznie sprawdź na:
- https://www.virustotal.com/gui/domain/majsterai.com
- https://www.virustotal.com/gui/domain/majster-ai-oferty.vercel.app

---

## Checklist: 7 Narzędzi do Ręcznego Testu

Poniżej lista narzędzi do ręcznego sprawdzenia (wklej URL i oceń PASS/FAIL):

| # | Narzędzie | URL do Wklejenia | Co Sprawdza | Oczekiwany Wynik |
|---|-----------|------------------|-------------|------------------|
| 1 | **PageSpeed Insights** | [pagespeed.web.dev](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.majsterai.com) | Wydajność, dostępność, SEO | 70+ mobile, 90+ desktop |
| 2 | **Mozilla Observatory** | [developer.mozilla.org/observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=www.majsterai.com) | Nagłówki HTTP | A lub A+ |
| 3 | **SecurityHeaders** | [securityheaders.com](https://securityheaders.com/?q=https://www.majsterai.com&followRedirects=on) | Nagłówki bezpieczeństwa | A lub A+ |
| 4 | **SSL Labs** | [ssllabs.com](https://www.ssllabs.com/ssltest/analyze.html?d=www.majsterai.com) | Certyfikat SSL/TLS | A lub A+ |
| 5 | **WAVE** | [wave.webaim.org](https://wave.webaim.org/report#/https://www.majsterai.com) | Dostępność WCAG | <5 błędów krytycznych |
| 6 | **Blacklight** | [themarkup.org/blacklight](https://themarkup.org/blacklight?url=https%3A%2F%2Fwww.majsterai.com) | Trackery/prywatność | Minimalny tracking |
| 7 | **BuiltWith** | [builtwith.com](https://builtwith.com/www.majsterai.com) | Stack technologiczny | Informacyjne |

---

## Rekomendacje Priorytetowe

### Priorytet WYSOKI (zrób w najbliższym sprincie):

1. **Dodaj `alt` do wszystkich obrazków** - tylko 3 instancje `alt=` w całym kodzie
2. **Dodaj canonical URL** w `<head>` - ważne dla SEO
3. **Dodaj `loading="lazy"` do obrazków** - poprawa LCP

### Priorytet ŚREDNI (w następnych 2-3 sprintach):

4. **Dodaj `aria-hidden="true"` do dekoracyjnych SVG** (Logo.tsx, ilustracje)
5. **Zaimplementuj focus trap w modalkach** (Dialog.tsx)
6. **Dodaj JSON-LD structured data** (typ: LocalBusiness/SoftwareApplication)
7. **Ogranicz CORS w Edge Functions** do konkretnych domen produkcyjnych

### Priorytet NISKI (backlog):

8. **Wirtualizacja długich list** (Photos, Dashboard)
9. **Responsive images z `srcSet`**
10. **Zamień `style-src 'unsafe-inline'` na nonce-based CSP** (trudne z Tailwind)

---

## Podsumowanie

Majster.AI to aplikacja o **bardzo wysokiej jakości technicznej**:

- **Bezpieczeństwo:** Najwyższa klasa. CSP, HSTS, XSS protection, walidacja danych, sanityzacja, rate limiting - wszystko zaimplementowane prawidłowo.
- **Wydajność:** Bardzo dobra. Code splitting, lazy loading, vendor chunking - solidna architektura.
- **Dostępność:** Dobra baza (ARIA, formularze, klawiatura), ale potrzebuje pracy przy obrazkach i modalach.
- **SEO:** Pełny zestaw meta tagów, sitemap, hreflang. Brakuje canonical i structured data.
- **Prywatność:** Czysta - zero trackerów reklamowych.
- **Stack:** Nowoczesny, aktualny, dobrze zorganizowany.

**Najważniejsze do zrobienia:** Dodaj `alt` do obrazków, canonical URL, i `loading="lazy"`.
