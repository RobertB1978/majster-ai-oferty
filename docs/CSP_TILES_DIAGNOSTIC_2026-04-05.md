# Diagnostyka CSP vs. tiles w module „Zespół"

Data: 2026-04-05

## Aktualny stan

Moduł „Zespół" korzysta z mapy Leaflet z tilesami OpenStreetMap.
Mapa wyświetla się jako szara — tiles nie ładują się poprawnie.
Marker, popup, geolokalizacja i zapis danych działają prawidłowo.

## Analiza CSP (`vercel.json`)

### Aktualny nagłówek `img-src`

```
img-src 'self' data: https: blob:
```

### Wniosek

Dyrektywa `https:` to **scheme-source wildcard** — zezwala na ładowanie
obrazów z **dowolnego** źródła HTTPS. Tiles OSM (`https://tile.openstreetmap.org/...`)
są już objęte tym wildcardem.

Dodanie explicit hostów (`https://tile.openstreetmap.org`,
`https://*.tile.openstreetmap.org`) byłoby **redundantne** i nie zmieniłoby
zachowania przeglądarki.

### Dlaczego `connect-src` nie ma tu znaczenia

Standardowe Leaflet raster tiles są ładowane przez elementy `<img>`,
nie przez `fetch()` ani `XMLHttpRequest`. Dyrektywa `connect-src`
kontroluje tylko te drugie mechanizmy. Dla standardowego tile loadingu
`connect-src` jest nieistotne.

## Co testuje ten PR

Ten PR potwierdza, że **obecna polityka CSP w `vercel.json` nie blokuje
tiles OSM** na poziomie `img-src`. Żadna zmiana `vercel.json` nie została
wprowadzona, ponieważ byłaby redundantna.

## Czego ten PR NIE dowodzi

- Nie dowodzi, że CSP nie ma żadnego wpływu na mapę (mogą istnieć
  inne mechanizmy poza `img-src`).
- Nie dowodzi, że tiles działają poprawnie — to wymaga testu runtime.
- Nie dowodzi, że problem leży w innym miejscu — jedynie eliminuje
  `img-src` jako przyczynę.

## Następne kroki po wyniku

1. **Test runtime w DevTools** — sprawdzić w zakładce Network/Console
   czy przeglądarka w ogóle wysyła requesty do `tile.openstreetmap.org`
   i jakie kody odpowiedzi otrzymuje.
2. Jeśli requesty nie wychodzą — problem jest w konfiguracji Leaflet
   lub TileLayer (np. brak URL, zły format, race condition z mount).
3. Jeśli requesty wychodzą ale zwracają błędy (403, CORS) — problem
   jest po stronie serwera tiles lub konfiguracji CORS.
4. Jeśli requesty zwracają 200 ale mapa jest szara — problem jest
   w renderowaniu (CSS, z-index, rozmiar kontenera, brak `invalidateSize()`).
5. Dopiero po runtime diagnostyce można podjąć decyzję architektoniczną
   (zmiana providera, proxy itp.).

## Decyzja

`vercel.json` **NIE został zmieniony**. Obecny `img-src 'self' data: https: blob:`
już przepuszcza tiles OSM. Zmiana byłaby no-op.
