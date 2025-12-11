# Performance Analysis & Refactor Plan

**Sprint:** SUPER-SPRINT A – Core Performance Refactor
**Data:** 2025-12-11
**Status:** Analiza ukończona, implementacja w toku

---

## 📊 Executive Summary

### Główne wnioski
1. ✅ **Aplikacja już używa TanStack React Query** - świetna podstawa!
2. ⚠️ **KRYTYCZNE: Brak pagination** - wszystkie listy ładują 100% danych
3. ⚠️ **WYSOKI: SELECT '*' wszędzie** - transferowane są niepotrzebne kolumny
4. ⚠️ **ŚREDNI: Filtrowanie po stronie klienta** - powinno być w SQL
5. ⚠️ **ŚREDNI: Brak debouncing** - search inputy wywołują re-render przy każdym znaku

### Spodziewane zyski po refaktorze
- **70-90% redukcja** transferu danych przy dużych listach
- **50-80% szybsze** pierwsze ładowanie ekranów z listami
- **Możliwość skalowania** do setek/tysięcy rekordów bez degradacji
- **Lepsza responsywność** UI dzięki debouncing

---

## 🔍 Szczegółowa Analiza

### 1. Architektura React Query (✅ GOTOWE)

**Lokalizacja:** `src/App.tsx:52-61`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minut
      gcTime: 1000 * 60 * 30,          // 30 minut
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Status:** ✅ Dobrze skonfigurowane
**Akcja:** BRAK - konfiguracja jest odpowiednia

---

### 2. Ekrany wymagające PAGINATION (🔴 KRYTYCZNE)

#### 2.1. Projects (`src/pages/Projects.tsx`)
- **Hook:** `useProjects()` → `src/hooks/useProjects.ts:23-39`
- **Query:** `select('*, clients(*)')` bez limitu
- **Problem:** Przy 200+ projektach = ~1-2MB danych
- **Renderowanie:** 183 linie, w tym filtry i search po stronie klienta
- **Priorytet:** 🔴 KRYTYCZNY

**Refaktor:**
```typescript
// Nowy hook
export function useProjectsPaginated({ page = 1, limit = 20, search, status }) {
  return useQuery({
    queryKey: ['projects', 'paginated', { page, limit, search, status }],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id, project_name, status, created_at, clients(id, name)', { count: 'exact' });

      if (search) query = query.ilike('project_name', `%${search}%`);
      if (status && status !== 'all') query = query.eq('status', status);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data, count, totalPages: Math.ceil((count || 0) / limit) };
    },
  });
}
```

#### 2.2. Clients (`src/pages/Clients.tsx`)
- **Hook:** `useClients()` → `src/hooks/useClients.ts:16-32`
- **Query:** `select('*')` bez limitu
- **Problem:** Przy 500+ klientach = znaczący transfer
- **Priorytet:** 🔴 KRYTYCZNY

**Refaktor:** Analogiczny do Projects

#### 2.3. ItemTemplates (`src/pages/ItemTemplates.tsx`)
- **Hook:** `useItemTemplates()` → `src/hooks/useItemTemplates.ts:18-34`
- **Query:** `select('*')` bez limitu
- **Problem:** Może mieć setki/tysiące szablonów
- **Dodatkowa funkcja:** Import szablonów (linia 62-88)
- **Priorytet:** 🔴 KRYTYCZNY

#### 2.4. Analytics (`src/pages/Analytics.tsx`)
- **Największy problem!**
- **Queries:**
  - `useProjects()` - wszystkie projekty
  - `useClients()` - wszyscy klienci
  - Bezpośrednie `supabase.from('quotes').select('*')` (linia 45-49) ⚠️
  - `useCalendarEvents()` - wszystkie wydarzenia
- **Przetwarzanie:** 97 linii `useMemo` (linia 56-153)
- **Priorytet:** 🔴🔴 NAJWYŻSZY

**Refaktor:**
- Przenieś agregacje do Edge Functions lub database views
- Zamiast pobierać wszystko i liczyć w JS, użyj SQL agregacji
- Cachuj wyniki na 15-30 minut

---

### 3. Optymalizacja zapytań SELECT (🟡 WYSOKI)

**Znalezione wystąpienia:** 41 w 24 hookach

#### Najbardziej problematyczne:

| Hook | Linia | Query | Kolumny potrzebne (przykład) |
|------|-------|-------|------------------------------|
| `useProjects.ts` | 31 | `select('*, clients(*)')` | `id, project_name, status, created_at, client_id, clients(id, name)` |
| `useClients.ts` | 24 | `select('*')` | `id, name, email, phone, created_at` (bez address w liście) |
| `useItemTemplates.ts` | 26 | `select('*')` | `id, name, unit, default_qty, default_price, category` (bez description w liście) |
| `useCalendarEvents.ts` | 27 | `select('*')` | `id, title, event_date, event_time, event_type, status` |

**Impact przykład:**
```
Clients SELECT '*' (wszystkie kolumny):
- id, user_id, name, phone, email, address, created_at, updated_at, notes, company_name, nip, etc.
- 500 rekordów × ~500 bytes = 250 KB

Clients SELECT tylko potrzebne:
- id, name, email, phone, created_at
- 500 rekordów × ~150 bytes = 75 KB

Oszczędność: 70%!
```

---

### 4. Filtrowanie (🟡 ŚREDNI)

**Problem:** Wszystkie filtry działają PO pobraniu danych (client-side)

**Przykład:** `Projects.tsx:36-54`
```typescript
const filteredProjects = useMemo(() => {
  let result = projects;  // Już pobrane WSZYSTKIE
  if (searchQuery.trim()) {
    result = result.filter(project =>
      project.project_name.toLowerCase().includes(query) ||
      project.clients?.name?.toLowerCase().includes(query)
    );
  }
  // ...
}, [projects, searchQuery, statusFilter]);
```

**Powinno być:** Filtrowanie w query (parametry `ilike`, `eq`, etc.)

---

### 5. Debouncing (🟡 ŚREDNI)

**Miejsca wymagające debounce (300-500ms):**
- `Projects.tsx:88` - SearchInput onChange
- `Clients.tsx:207` - SearchInput onChange
- `ItemTemplates.tsx:211` - SearchInput onChange

**Rozwiązanie:** Custom hook `useDebounce`

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

### 6. Frontend Performance (🟢 NISKI - nice to have)

#### Potencjalne optymalizacje:
1. **React.memo** dla itemów list (Projects, Clients, Templates)
2. **Lazy loading** dla:
   - `Analytics.tsx` (duże wykresy Recharts)
   - `PdfGenerator.tsx` (ciężki komponent)
   - `QuoteEditor.tsx` (duże formularze)
3. **Dynamic imports** dla rzadko używanych stron:
   - Marketplace, Team, Admin
4. **useMemo/useCallback** dla kosztownych obliczeń w Analytics

**Uwaga:** To najniższy priorytet - najpierw załatwiamy DB queries!

---

## 🎯 Plan Działania (Fazy)

### FAZA 1: Core Pagination (Projekty, Klienci, Szablony)
**Priorytet:** 🔴 KRYTYCZNY
**Czas:** ~2-3 commity

**Zadania:**
1. ✅ Utworzyć utility component `Pagination.tsx`
2. ✅ Refaktor `useProjects` → `useProjectsPaginated`
3. ✅ Aktualizacja `Projects.tsx` - dodać pagination UI
4. ✅ Refaktor `useClients` → `useClientsPaginated`
5. ✅ Aktualizacja `Clients.tsx` - dodać pagination UI
6. ✅ Refaktor `useItemTemplates` → `useItemTemplatesPaginated`
7. ✅ Aktualizacja `ItemTemplates.tsx` - dodać pagination UI
8. ✅ Testy + build verification

**Limit:** Max 300 LOC per commit (bez testów/docs)

---

### FAZA 2: Analytics Refaktor
**Priorytet:** 🔴🔴 NAJWYŻSZY
**Czas:** 1-2 commity

**Zadania:**
1. ✅ Przenieść bezpośrednie zapytanie `quotes` do hooka
2. ✅ Dodać limity/agregacje na poziomie SQL
3. ✅ Opcjonalnie: Edge Function dla aggregated stats
4. ✅ Cache z dłuższym staleTime (15-30 min)
5. ✅ Testy + weryfikacja

---

### FAZA 3: SELECT Optimization
**Priorytet:** 🟡 WYSOKI
**Czas:** 2-3 commity (po ~8 hooków per commit)

**Zadania:**
1. ✅ Grupa 1: useProjects, useClients, useItemTemplates
2. ✅ Grupa 2: useCalendarEvents, useOfferSends, useNotifications
3. ✅ Grupa 3: Pozostałe (useWorkTasks, useTeamMembers, etc.)

**Dla każdego hooka:**
- Określić minimalne potrzebne kolumny dla listy
- Określić pełne kolumny dla detali (single fetch)
- Dodać parametr `select` do hooków list

---

### FAZA 4: Debouncing
**Priorytet:** 🟡 ŚREDNI
**Czas:** 1 commit

**Zadania:**
1. ✅ Utworzyć `useDebounce` hook
2. ✅ Zastosować w Projects, Clients, ItemTemplates search
3. ✅ Opcjonalnie: Throttling dla scroll events (jeśli będzie infinite scroll)

---

### FAZA 5: Frontend Performance (opcjonalnie)
**Priorytet:** 🟢 NISKI
**Czas:** 1-2 commity

**Zadania:**
1. React.memo dla list items
2. Lazy loading dla Analytics, PdfGenerator
3. Bundle size analysis (jeśli Vite ostrzega)

---

## 📈 Metryki Sukcesu

### Przed refaktorem (baseline):
- Projects (100 rekordów): ~150 KB transfer, ~1.5s load
- Clients (200 rekordów): ~120 KB transfer, ~1.2s load
- Analytics: ~500 KB transfer, ~3-4s load

### Po refaktorze (oczekiwane):
- Projects (page 1/5, 20 rekordów): ~30 KB transfer, ~0.3s load ✅
- Clients (page 1/10, 20 rekordów): ~15 KB transfer, ~0.2s load ✅
- Analytics (agregowane): ~50 KB transfer, ~0.8s load ✅

**Zysk:** 70-90% redukcja transferu, 60-80% szybsze ładowanie

---

## 🗄️ Indeksy Bazy Danych (PROPOZYCJE)

**UWAGA:** Te indeksy NIE są tworzone automatycznie. To tylko propozycje dla właściciela projektu.

```sql
-- Projects - sortowanie i filtrowanie
CREATE INDEX IF NOT EXISTS idx_projects_user_created
  ON public.projects(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_projects_search
  ON public.projects USING gin(to_tsvector('simple', project_name));

-- Clients - sortowanie i wyszukiwanie
CREATE INDEX IF NOT EXISTS idx_clients_user_created
  ON public.clients(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_search
  ON public.clients USING gin(to_tsvector('simple', name || ' ' || COALESCE(email, '')));

-- Item Templates - nazwa i kategoria
CREATE INDEX IF NOT EXISTS idx_item_templates_user_name
  ON public.item_templates(user_id, name);

CREATE INDEX IF NOT EXISTS idx_item_templates_category
  ON public.item_templates(category);

-- Calendar Events - data range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date
  ON public.calendar_events(user_id, event_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range
  ON public.calendar_events(event_date, event_time);

-- Offer Sends - project history
CREATE INDEX IF NOT EXISTS idx_offer_sends_project
  ON public.offer_sends(project_id, sent_at DESC);
```

**Kiedy wdrożyć:** Po wdrożeniu pagination i SELECT optimization, jeśli nadal są problemy z wydajnością.

---

## ⚠️ Ryzyka i Edge Cases

### 1. Backward Compatibility
- **Ryzyko:** Zmiana API hooków może zepsuć istniejące komponenty
- **Mitygacja:** Utrzymać stare hooki jako deprecated, dodać nowe z sufiksem `Paginated`

### 2. Cache Invalidation przy Pagination
- **Ryzyko:** Po dodaniu projektu, cache dla wszystkich stron może być nieaktualny
- **Mitygacja:** Invalidować cały queryKey prefix `['projects', 'paginated']`

### 3. Search z Pagination
- **Ryzyko:** Zmiana search restetuje stronę, może być dezorientujące
- **Mitygacja:** Zawsze resetować page=1 przy zmianie filtrów

### 4. Supabase Free Tier Limits
- **Limit:** 500MB transfer/miesiąc, 2GB storage
- **Impact:** Pagination znacząco zmniejsza transfer, ale trzeba monitorować

---

## 🧪 Strategia Testowania

### Dla każdej fazy:
1. ✅ `npm test` - unit testy muszą przechodzić
2. ✅ `npm run build` - build musi się udać
3. ✅ Manualne testy:
   - Pusta lista (0 rekordów)
   - Mała lista (1-5 rekordów)
   - Średnia lista (20-50 rekordów)
   - Duża lista (100+ rekordów)
   - Search/filtry z pagination
   - Nawigacja między stronami

### Testy regresji:
- Dashboard nadal działa (używa useProjects)
- Analytics nadal działa
- Tworzenie/edycja/usuwanie obiektów
- Export CSV (Projects)

---

## 📚 Dokumentacja dla Właściciela

### Co się zmieni dla użytkowników:
1. **Listy będą podzielone na strony** - zamiast przewijać 200 projektów, będzie 10 stron po 20
2. **Dodatkowe kontrolki** - przyciski "Poprzednia/Następna", numeracja stron
3. **Szybsze ładowanie** - szczególnie zauważalne przy dużych zbiorach danych
4. **Search będzie mniej "nerwowy"** - 300ms delay po przestaniu pisać

### Co NIE zmieni się:
- Logika biznesowa pozostaje taka sama
- Wszystkie funkcje (dodawanie, edycja, usuwanie) działają identycznie
- UI wygląda prawie tak samo (tylko dodane pagination)
- Cache/React Query działają w tle tak samo

---

## 🎓 Wnioski dla Przyszłych Sprintów

### SUPER-SPRINT B (propozycje):
1. **Infinite Scroll** jako alternatywa dla pagination (UX improvement)
2. **Server-side sorting** - sortowanie w SQL zamiast JS
3. **Virtual scrolling** dla bardzo długich list (react-virtual)
4. **Optimistic updates** - UI aktualizuje się przed odpowiedzią servera
5. **Background sync** - offline-first z sync po reconnect

### Monitoring wydajności:
- Dodać React DevTools Profiler w development
- Monitorować Supabase Dashboard → Database → Performance
- Opcjonalnie: Sentry dla real-time performance tracking

---

**Dokument wersja:** 1.0
**Ostatnia aktualizacja:** 2025-12-11
**Następna aktualizacja:** Po zakończeniu FAZY 1
