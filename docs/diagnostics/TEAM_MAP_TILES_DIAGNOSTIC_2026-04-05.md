# Diagnostyka mapy zespołu — szare kafelki (basemap)

**Data:** 2026-04-05
**Moduł:** Zespół → Mapa lokalizacji ekip
**Plik główny:** `src/components/map/TeamLocationMap.tsx`
**Status:** DIAGNOSTYKA — root cause nie jest pewny bez runtime evidence

---

## 1. Executive Summary

Mapa w module „Zespół" wyświetla markery, popupy, legendę statusów i licznik aktywnych pracowników — te elementy **działają poprawnie**. Problem dotyczy wyłącznie **warstwy basemap (kafelki/tiles)**, która pozostaje szara mimo 10 iteracji naprawczych (PR #596–#606). Dotychczasowe poprawki rozwiązały problemy z CSS (Tailwind Preflight, overflow/border-radius compositor bug), geolokalizacją (Permissions-Policy), URL tiles (kanoniczny OSM), i resize lifecycle (ResizeObserver + invalidateSize). Szare tiles wskazują na jeden z pięciu możliwych czynników: zły URL, blokada Referer/CSP, ukryte CSS, nieodpowiedni provider, lub problem mieszany. **Bez runtime evidence z debug overlay (`?mapDebug=1`) nie można jednoznacznie wskazać root cause.**

---

## 2. Co już zostało zrobione i co z tego działa

| # | Zmiana | PR | Plik | Działa? | Uwagi |
|---|--------|----|------|---------|-------|
| 1 | Fix Tailwind Preflight (`img max-width: none`) | #596 | `index.css` | ✅ TAK | Krytyczny fix — Tailwind resetuje img do max-width:100%, co łamie pozycjonowanie tiles |
| 2 | `invalidateSize()` po 100ms | #596 | `TeamLocationMap.tsx` | ✅ TAK | Wymusza przerysowanie tiles po ustabilizowaniu layoutu |
| 3 | `maxZoom: 19` | #597 | `TeamLocationMap.tsx` | ✅ TAK | Zgodne z polityką OSM |
| 4 | Permissions-Policy `geolocation=(self)` | #598 | `vercel.json` | ✅ TAK | Odblokowana geolokalizacja |
| 5 | ResizeObserver + invalidateSize | #599 | `TeamLocationMap.tsx` | ✅ TAK | Obsługuje przełączanie tabów |
| 6 | Klucze i18n geolokalizacji | #600 | `pl.json`, `en.json`, `uk.json` | ✅ TAK | Poprawne komunikaty błędów |
| 7 | Wrapper/container pattern (final) | #605 | `TeamLocationMap.tsx` | ✅ TAK | Outer div: rounded + overflow-hidden; inner div: absolute inset-0 |
| 8 | Kanoniczny URL OSM (bez `{s}`) | #606 | `TeamLocationMap.tsx` | ✅ TAK | `tile.openstreetmap.org` zamiast `{s}.tile.openstreetmap.org` |
| 9 | Debug overlay `?mapDebug=1` | #604 | `TeamLocationMap.tsx` | ✅ TAK | Panel diagnostyczny z licznikami eventów |
| 10 | Toast deduplication (`id`) | #602/#603 | `Team.tsx` | ✅ TAK | Zapobiega duplikatom toastów |

**Oscylacja wrapper pattern (ślad naprawczy):**
- PR #596: jeden div → PR #601: dwa divy + translateZ(0) → PR #602: powrót do jednego → PR #603: overflow:clip → PR #605: **dwa divy (finalne)**

---

## 3. Co nadal jest problemem

| Problem | Objaw | Root cause pewny/niepewny | Priorytet |
|---------|-------|--------------------------|-----------|
| Szare kafelki basemap | Tło mapy jest jednolicie szare, brak widocznych tiles OSM | **NIEPEWNY** — brak runtime evidence | P0 (blocker wizualny) |
| Lista pracowników vs status mapy | Możliwa niespójność między statusem wyświetlanym na liście a statusem na mapie | Niepewny — wymaga weryfikacji danych | P2 |

---

## 4. Porównanie z oficjalnymi źródłami

### A) OSM Tile Usage Policy

| Aspekt | Wymaganie OSM | Aktualny stan w kodzie | Ocena |
|--------|---------------|----------------------|-------|
| URL tiles | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | ✅ Dokładnie taki (linia 34) | OK |
| Attribution | Wymagany link do copyright OSM | ✅ Jest (linia 132) | OK |
| maxZoom | Nie przekraczać 19 | ✅ `maxZoom: 19` (linia 133) | OK |
| User-Agent | Musi identyfikować aplikację | ⚠️ Domyślny przeglądarki — wystarczający dla webapps | OK |
| Referer | Musi być wysyłany — zakaz `no-referrer` | ✅ `strict-origin-when-cross-origin` wysyła origin | OK |
| Użycie produkcyjne | **Zabronione** dla heavy use bez zgody OSMF | ⚠️ **RYZYKO** — SaaS produkcyjny bez zgody | **UWAGA** |
| Rate limiting | Max 2 połączenia/s, max 250 req/s globalnie z IP | ⚠️ Zależy od hostingu (Vercel = shared IP?) | RYZYKO |

**Kluczowe:** OSM tile policy [wymaga](https://operations.osmfoundation.org/policies/tiles/) aby aplikacje produkcyjne z większą liczbą użytkowników korzystały z własnego serwera tiles lub komercyjnego providera. Publiczny OSM tile server jest przeznaczony głównie do prototypowania i małego ruchu.

### B) Leaflet

| Aspekt | Dokumentacja Leaflet | Stan w kodzie | Ocena |
|--------|---------------------|---------------|-------|
| Tile pane z-index | tilePane = z-index 200 (domyślnie) | Brak nadpisywania — OK | OK |
| markerPane z-index | markerPane = z-index 600 (domyślnie) | Markery widoczne nawet gdy tiles niewidoczne — spójne | OK |
| invalidateSize po resize | Wymagane przy zmianie rozmiaru kontenera | ✅ ResizeObserver + setTimeout 100ms | OK |
| Container musi mieć wymiary | Map container musi mieć niezerowe width/height | ✅ h-[400px] + absolute inset-0 | OK |
| CSS Leaflet | leaflet.css musi być załadowany | ✅ `import 'leaflet/dist/leaflet.css'` (linia 4) | OK |

**Ważne:** Leaflet markery (divIcon) są w `markerPane` (z-index 600), a tiles w `tilePane` (z-index 200). Fakt, że markery są widoczne a tiles nie, **nie dowodzi** problemu CSS pane — tiles mogą po prostu nie ładować się z sieci.

### C) Referrer-Policy

| Aspekt | Stan | Ocena |
|--------|------|-------|
| Header HTTP | `Referrer-Policy: strict-origin-when-cross-origin` | OK |
| Zachowanie cross-origin | Wysyła origin (`https://majsterai.com`) do `tile.openstreetmap.org` | OK |
| Meta tag | Brak dodatkowego `<meta name="referrer">` | OK — header wystarczy |
| CSP img-src | `img-src 'self' data: https: blob:` | ✅ Pozwala na HTTPS tiles |

**Wniosek:** Konfiguracja Referrer-Policy i CSP **nie powinna** blokować tiles. Ale nie można tego w 100% potwierdzić bez sprawdzenia rzeczywistych requestów w DevTools.

---

## 5. Pięć wariantów rozwiązania

| # | Wariant | Opis | Ryzyko | Koszt | Kiedy wybrać | Jak sprawdzić |
|---|---------|------|--------|-------|-------------|---------------|
| 1 | **Weryfikacja runtime z debug overlay** | Użyć istniejącego `?mapDebug=1` aby zebrać evidence: ile tiles się żąda, ile ładuje, ile errors | Zerowe | Brak zmian w kodzie | **ZAWSZE PIERWSZY** — bez tego nie wiadomo co naprawiać | Otworzyć mapę z `?mapDebug=1`, odczytać verdict |
| 2 | **Rozszerzony debug: tile pane CSS + img naturalWidth** | Dodać do debug overlay: computed styles tile pane (nie tylko container), sprawdzenie czy img tiles mają naturalWidth > 0 | Minimalne | ~30 LOC | Gdy wariant 1 mówi „tiles ładują się poprawnie" ale ekran szary | Sprawdzić tilePaneOverflow, tilePaneOpacity, tilesLoaded w overlay |
| 3 | **Naprawa CSS tile pane** | Wymusić `visibility: visible; opacity: 1;` na `.leaflet-tile-pane` | Niskie | ~5 LOC w index.css | Gdy debug pokazuje CSS hiding problem | Wizualnie — tiles powinny się pojawić |
| 4 | **Zmiana providera na Carto / Stamen / MapTiler (free tier)** | Zastąpić OSM tiles providerem, który oficjalnie wspiera produkcyjne SaaS | Średnie — wymaga wyboru i testowania | ~5 LOC URL change | Gdy OSM serwer blokuje requesty (403/429) lub tiles losowo się nie ładują | Zamienić TILE_URL, sprawdzić wizualnie |
| 5 | **Self-hosted tile server lub dedykowany klucz API** | Uruchomić własny tile server lub użyć providera z kluczem API (MapTiler, Thunderforest) | Wysokie — wymaga konta, konfiguracji, kosztów | Infrastruktura + config | Gdy aplikacja ma > 1000 użytkowników i potrzebuje gwarancji SLA | Monitoring dostępności tiles |

### Szczegóły wariantu 4 — alternatywni providerzy bez rejestracji:

| Provider | URL | Rejestracja? | Limit | Styl |
|----------|-----|-------------|-------|------|
| CartoDB Voyager | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` | NIE | Rozsądne limity | Nowoczesny, czytelny |
| CartoDB Positron | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` | NIE | Rozsądne limity | Jasny, minimalistyczny |
| CartoDB Dark Matter | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | NIE | Rozsądne limity | Ciemny |

**Uwaga:** CartoDB (CARTO) basemaps są darmowe i nie wymagają rejestracji ani klucza API dla rozsądnego użycia. Mają lepszy SLA niż publiczny OSM tile server.

---

## 6. Rekomendacja końcowa

**Rekomendowany wariant: #1 + #2 (diagnostyka), potem decyzja.**

Uzasadnienie:
- Bez runtime evidence nie wiemy czy problem to sieć (403/429), CSS, czy coś innego.
- Debug overlay już istnieje (`?mapDebug=1`), ale brakuje sprawdzenia tile pane CSS i stanu załadowanych obrazków.
- Po zebraniu evidence z debug overlay, będzie jasne czy iść w wariant 3 (CSS fix), 4 (zmiana providera), czy problem leży gdzie indziej.
- **Nie powinniśmy** zmieniać providera ani CSS na ślepo — to już było robione 10 razy i nie pomogło.

---

## 7. Czy robić teraz mały PR diagnostyczny?

**TAK.**

Dlaczego:
- Debug overlay już istnieje, ale wymaga drobnego rozszerzenia.
- Rozszerzenie to ~30 LOC — bezpieczne, nie zmienia zachowania dla zwykłego użytkownika.
- Daje runtime evidence potrzebny do podjęcia decyzji o finalnym fixie.
- Aktywowany **wyłącznie** przez `?mapDebug=1` — zero wpływu na produkcję.

---

## 8. Zmiany w PR diagnostycznym

### Zmienione pliki:
1. `src/components/map/TeamLocationMap.tsx` — rozszerzony debug overlay o:
   - computed styles `.leaflet-tile-pane` (overflow, visibility, opacity, transform)
   - liczba tile images z `naturalWidth > 0` (czy tiles rzeczywiście się załadowały)
   - czy `crossOrigin` attribute jest ustawiony na tile images
   - rozszerzony verdict o nowe przypadki

2. `docs/diagnostics/TEAM_MAP_TILES_DIAGNOSTIC_2026-04-05.md` — ten raport

### Jak użyć:
1. Otwórz stronę Zespół z parametrem `?mapDebug=1`
2. W prawym górnym rogu mapy pojawi się czarny panel diagnostyczny
3. Odczytaj verdict i liczniki
4. Zrób screenshot i wyślij do analizy

### Rollback:
- Usunięcie pliku raportu: `git rm docs/diagnostics/TEAM_MAP_TILES_DIAGNOSTIC_2026-04-05.md`
- Debug overlay jest warunkowy (`?mapDebug=1`) — można zostawić lub usunąć diagnostykę z komponentu

---

## 9. Czy trzeba się rejestrować?

| Provider | Rejestracja wymagana? | Klucz API? | Koszt |
|----------|-----------------------|------------|-------|
| **OSM tile.openstreetmap.org** (obecny) | NIE, ale wymaga zgody dla heavy use | NIE | Darmowy, ale zakazany dla produkcyjnego SaaS z dużym ruchem |
| **CartoDB/CARTO basemaps** | NIE | NIE | Darmowy dla rozsądnego użycia |
| **MapTiler** | TAK | TAK | Free tier: 100k tiles/miesiąc |
| **Thunderforest** | TAK | TAK | Free tier: 150k tiles/miesiąc |
| **Stadia Maps** | TAK | TAK | Free tier dostępny |

**Rekomendacja:** Jeśli OSM okaże się problematyczny, **CartoDB Voyager** jest najlepsza alternatywa — nie wymaga rejestracji, nie wymaga klucza API, ma lepszą niezawodność niż publiczny OSM, i ma ładny nowoczesny styl mapy.

---

## Następne kroki (dla właściciela projektu)

1. **TERAZ:** Otwórz mapę zespołu z `?mapDebug=1` i zrób screenshot panelu diagnostycznego
2. **Na podstawie screenshot:** Podejmij decyzję o fixie:
   - Jeśli `tileerror > 0` → prawdopodobnie OSM blokuje → rozważ CartoDB
   - Jeśli `tileload > 0` ale szare → problem CSS → naprawiamy CSS
   - Jeśli `tileloadstart = 0` → mapa się nie inicjalizuje prawidłowo → deeper debug
3. **Długoterminowo:** Rozważ migrację z publicznego OSM na CartoDB lub MapTiler dla stabilności produkcyjnej
