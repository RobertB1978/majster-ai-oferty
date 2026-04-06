import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { useTeamLocations, TeamLocation } from '@/hooks/useTeamMembers';
import { formatDateTime } from '@/lib/formatters';

// ---------------------------------------------------------------------------
// Marker icon fix — use local assets bundled by Vite instead of CDN.
// CDN URLs (cdnjs.cloudflare.com) can be blocked by ad-blockers and privacy
// extensions on Android, causing broken-image icons on the map.
// ---------------------------------------------------------------------------
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const statusColors: Record<string, string> = {
  idle: '#6b7280',
  traveling: '#3b82f6',
  working: '#22c55e',
  break: '#f59e0b',
};

const statusLabels: Record<string, string> = {
  idle: 'Bezczynny',
  traveling: 'W drodze',
  working: 'Pracuje',
  break: 'Przerwa',
};

// ---------------------------------------------------------------------------
// Tile sources — ordered by reliability for web & mobile WebView.
//
// 1. CartoDB Voyager — free, permissive CORS headers, no strict usage policy,
//    designed for embedding in apps.  Does NOT use {s} subdomain sharding
//    to avoid extra DNS lookups on mobile.
// 2. CartoDB Voyager with subdomain — fallback if the canonical CDN fails.
// 3. OSM — last resort.  Has strict usage policy that can block WebView
//    requests without proper User-Agent or Referer.
//
// Dark mode: CartoDB Dark Matter (dedicated dark tiles) instead of CSS
// filter inversion.  CSS filter: invert() on the tile pane causes severe
// GPU compositing issues on mobile browsers and can completely prevent
// tile rendering.
// ---------------------------------------------------------------------------

interface TileSource {
  url: string;
  urlDark: string;
  attribution: string;
  maxNativeZoom: number;
}

const TILE_SOURCES: TileSource[] = [
  {
    // CartoDB Voyager — no subdomain sharding
    url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    urlDark: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
  },
  {
    // CartoDB Voyager — with subdomain sharding as fallback
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    urlDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
  },
  {
    // OSM — canonical URL, no subdomain sharding
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    urlDark: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
  },
];

// Maximum consecutive tile errors before switching to next source.
// Raised from 4 → 8 to tolerate transient mobile network failures
// without prematurely exhausting all sources.
const MAX_ERRORS_BEFORE_SWITCH = 8;

// Auto-retry delay (ms) after all sources are exhausted
const AUTO_RETRY_DELAY = 5000;

interface TeamLocationMapProps {
  projectId?: string;
  className?: string;
}

// Helper: auto-fit map bounds when markers change
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
}

// Helper: trigger invalidateSize after mount and on visibility change.
// This is critical for:
// 1. Correct sizing after lazy-load/Suspense mount
// 2. Correct sizing after tab switch (Radix TabsContent)
// 3. WebView layout quirks on Android
function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    // Initial invalidation cascade with increasing delays
    const timers = [0, 100, 300, 600, 1200, 2500].map((delay) =>
      setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, delay),
    );

    // Also invalidate when the document becomes visible (tab switch, app resume)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => map.invalidateSize({ animate: false }), 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ResizeObserver for container size changes
    const container = map.getContainer();
    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => map.invalidateSize({ animate: false }), 50);
    });
    ro.observe(container);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      ro.disconnect();
    };
  }, [map]);

  return null;
}

export function TeamLocationMap({ projectId, className }: TeamLocationMapProps) {
  const { i18n } = useTranslation();

  // Dark mode detection — read from document class (set by theme provider)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Tile source management
  const [tileSourceIndex, setTileSourceIndex] = useState(0);
  const tileErrorCount = useRef(0);        // resets to 0 after each source switch
  const totalTileErrorCount = useRef(0);   // cumulative, never reset — detects all-sources-failed
  const tileLoadedOnce = useRef(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Manual retry handler — resets all error state and starts from source 0
  const handleRetry = useCallback(() => {
    tileErrorCount.current = 0;
    totalTileErrorCount.current = 0;
    tileLoadedOnce.current = false;
    setTilesFailed(false);
    setTileSourceIndex(0);
  }, []);

  const { data: locations = [], refetch } = useTeamLocations(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Switch to fallback tile source after consecutive failures.
  // ROOT-CAUSE FIX (MAJ-UNK-001 crash): the guard is now inside the state
  // updater function, NOT in the outer closure.  This prevents the stale-
  // closure race where tileSourceIndex captured at callback-creation time
  // was stale (e.g. 0) while the actual state had already advanced (e.g. 2),
  // allowing `setTileSourceIndex(prev => prev + 1)` to push the index to 3,
  // which is out of bounds for TILE_SOURCES (length 3, indices 0-2).
  // With the guard inside the updater, `prev` is always the current state.
  const handleTileError = useCallback(
    (e: L.TileErrorEvent) => {
      tileErrorCount.current += 1;
      totalTileErrorCount.current += 1;

      // Log detailed error for diagnostics
      if (import.meta.env.DEV || tileErrorCount.current <= 3) {
        const tile = e.tile as HTMLImageElement;
        console.warn(
          `[MapTiles] Error #${tileErrorCount.current} loading tile:`,
          {
            src: tile?.src?.substring(0, 120),
            coords: e.coords,
            errorEvent: e.error,
          },
        );
      }

      if (tileErrorCount.current >= MAX_ERRORS_BEFORE_SWITCH && !tileLoadedOnce.current) {
        // Move guard inside updater so it always reads the CURRENT state (prev),
        // never a stale closure value.
        setTileSourceIndex((prev) => {
          if (prev < TILE_SOURCES.length - 1) {
            console.warn(`[MapTiles] Switching from source ${prev} to ${prev + 1}`);
            return prev + 1;
          }
          return prev; // already at last source — don't go out of bounds
        });
        tileErrorCount.current = 0;
      }

      // Separately detect when all sources have been exhausted.
      // Use totalTileErrorCount (never reset) so this check is not affected
      // by the per-source counter reset above.
      if (
        totalTileErrorCount.current >= MAX_ERRORS_BEFORE_SWITCH * TILE_SOURCES.length &&
        !tileLoadedOnce.current
      ) {
        setTilesFailed(true);

        // Auto-retry after delay — mobile networks can recover quickly
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          console.warn('[MapTiles] Auto-retrying after all sources exhausted');
          tileErrorCount.current = 0;
          totalTileErrorCount.current = 0;
          setTilesFailed(false);
          setTileSourceIndex(0);
        }, AUTO_RETRY_DELAY);
      }
    },
    // No dependency on tileSourceIndex — guard uses `prev` inside the setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Cleanup auto-retry timer on unmount
  useEffect(() => {
    return () => clearTimeout(retryTimerRef.current);
  }, []);

  const handleTileLoad = useCallback(() => {
    tileLoadedOnce.current = true;
    tileErrorCount.current = 0;
    totalTileErrorCount.current = 0;
    if (tilesFailed) setTilesFailed(false);
  }, [tilesFailed]);

  // Deduplicate locations — keep only latest per team member
  const latestLocations = useMemo(() => {
    const map = new Map<string, TeamLocation>();
    locations.forEach((loc: TeamLocation) => {
      const existing = map.get(loc.team_member_id);
      if (!existing || new Date(loc.recorded_at) > new Date(existing.recorded_at)) {
        map.set(loc.team_member_id, loc);
      }
    });
    return Array.from(map.values());
  }, [locations]);

  // Compute bounds for auto-fit
  const bounds = useMemo(() => {
    const validPoints: L.LatLngTuple[] = [];
    latestLocations.forEach((loc) => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        validPoints.push([lat, lng]);
      }
    });
    if (validPoints.length === 0) return null;
    return L.latLngBounds(validPoints);
  }, [latestLocations]);

  const activeWorkers = new Set(locations.map((l: TeamLocation) => l.team_member_id)).size;
  // Safety clamp: ensure index never goes out of bounds (belt-and-suspenders
  // on top of the guard inside handleTileError's state updater).
  const safeIndex = Math.min(tileSourceIndex, TILE_SOURCES.length - 1);
  const currentSource = TILE_SOURCES[safeIndex];
  const tileUrl = isDark ? currentSource.urlDark : currentSource.url;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Lokalizacja ekip
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {activeWorkers} aktywnych
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Fixed pixel height — NEVER use % or flex for Leaflet containers */}
        <div className="relative" style={{ height: 400, width: '100%' }}>
          <MapContainer
            center={[52.0693, 19.4803]}
            zoom={6}
            fadeAnimation={false}
            zoomAnimation={true}
            tap={false}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              key={`${tileSourceIndex}-${isDark ? 'dark' : 'light'}`}
              url={tileUrl}
              attribution={currentSource.attribution}
              maxZoom={currentSource.maxNativeZoom}
              maxNativeZoom={currentSource.maxNativeZoom}
              tileSize={256}
              updateWhenIdle={false}
              updateWhenZooming={false}
              keepBuffer={4}
              // detectRetina disabled — on Android retina screens it requests
              // @2x tiles at zoom+1 which can 404 and rapidly exhaust all
              // tile sources, causing the "failed to load" overlay.
              detectRetina={false}
              // Do NOT set crossOrigin — it forces CORS preflight which can
              // fail on mobile when intermediary proxies strip CORS headers.
              // CartoDB and OSM tiles load fine as plain <img> elements.
              eventHandlers={{
                tileerror: handleTileError,
                tileload: handleTileLoad,
              }}
            />

            {latestLocations.map((loc) => {
              const lat = Number(loc.latitude);
              const lng = Number(loc.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;

              const memberName = loc.team_members?.name || 'Nieznany pracownik';
              const status = loc.status || 'idle';

              const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    background-color: ${statusColors[status]};
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                  ">
                    ${memberName.charAt(0).toUpperCase()}
                  </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              });

              return (
                <Marker key={loc.team_member_id} position={[lat, lng]} icon={customIcon}>
                  <Popup>
                    <div style={{ minWidth: 150 }}>
                      <strong>{memberName}</strong><br />
                      <span style={{ color: statusColors[status] }}>
                        ● {statusLabels[status]}
                      </span><br />
                      <small>
                        Ostatnia aktualizacja: {formatDateTime(loc.recorded_at, i18n.language)}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <FitBounds bounds={bounds} />
            <InvalidateSizeOnMount />
          </MapContainer>

          {/* Visual rounded border overlay — no clipping, just a border on top */}
          <div
            className="absolute inset-0 rounded-lg border border-border pointer-events-none"
            style={{ zIndex: 1000 }}
          />

          {/* Tile loading error overlay — now dismissible with retry button */}
          {tilesFailed && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg"
              style={{ zIndex: 999 }}
            >
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">
                Nie udało się załadować mapy
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sprawdź połączenie z internetem
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleRetry}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Spróbuj ponownie
              </Button>
            </div>
          )}
        </div>

        {/* Status legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors[key] }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
