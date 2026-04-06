import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, RefreshCw, Users, AlertTriangle, RotateCcw } from 'lucide-react';
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
// All use explicit full URLs without {r} retina placeholder.  detectRetina
// is disabled because on some Android devices the @2x tile request fails
// silently (the CDN returns 200 but the image is corrupt or the browser
// rejects it due to GPU memory limits on high-DPI screens).  Regular 256px
// tiles render correctly everywhere and are visually acceptable.
//
// Dark mode: CartoDB Dark Matter (dedicated dark tiles).
// ---------------------------------------------------------------------------

interface TileSource {
  url: string;
  urlDark: string;
  attribution: string;
  maxNativeZoom: number;
}

const TILE_SOURCES: TileSource[] = [
  {
    // CartoDB Voyager — no subdomain sharding, no retina
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
// A typical map view loads ~15 tiles so the threshold must be high enough
// that transient failures (slow DNS, single 503) don't trigger a premature
// switch.
const MAX_ERRORS_BEFORE_SWITCH = 8;

// Maximum automatic retries (full cycle through all sources)
const MAX_AUTO_RETRIES = 2;

// Delay between auto-retries in ms
const AUTO_RETRY_DELAY_MS = 3000;

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
function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    const timers = [0, 100, 300, 600, 1200, 2500].map((delay) =>
      setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, delay),
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => map.invalidateSize({ animate: false }), 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

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

  // Dark mode detection
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
  // Bump this to force TileLayer remount (retry)
  const [retryGeneration, setRetryGeneration] = useState(0);
  const tileErrorCount = useRef(0);
  const totalTileErrorCount = useRef(0);
  const tileLoadedOnce = useRef(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const autoRetryCount = useRef(0);
  const autoRetryTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data: locations = [], refetch } = useTeamLocations(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cleanup auto-retry timer on unmount
  useEffect(() => {
    return () => {
      if (autoRetryTimer.current) clearTimeout(autoRetryTimer.current);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Reset all tile error state and restart from first source
  const resetTileState = useCallback(() => {
    tileErrorCount.current = 0;
    totalTileErrorCount.current = 0;
    tileLoadedOnce.current = false;
    setTilesFailed(false);
    setTileSourceIndex(0);
    setRetryGeneration((g) => g + 1);
  }, []);

  // Manual retry (from button) — also resets auto-retry counter
  const handleManualRetry = useCallback(() => {
    autoRetryCount.current = 0;
    resetTileState();
  }, [resetTileState]);

  // Schedule an automatic retry after a delay
  const scheduleAutoRetry = useCallback(() => {
    if (autoRetryCount.current >= MAX_AUTO_RETRIES) return;
    autoRetryCount.current += 1;

    if (autoRetryTimer.current) clearTimeout(autoRetryTimer.current);
    autoRetryTimer.current = setTimeout(() => {
      resetTileState();
    }, AUTO_RETRY_DELAY_MS);
  }, [resetTileState]);

  const handleTileError = useCallback(
    (e: L.TileErrorEvent) => {
      tileErrorCount.current += 1;
      totalTileErrorCount.current += 1;

      // Hide the broken-image icon immediately on the failed tile.
      // CSS :moz-broken works only in Firefox; for Chrome/Safari we must
      // hide via JS.
      const tile = e.tile as HTMLImageElement;
      if (tile) {
        tile.style.visibility = 'hidden';
      }

      if (import.meta.env.DEV || tileErrorCount.current <= 3) {
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
        setTileSourceIndex((prev) => {
          if (prev < TILE_SOURCES.length - 1) {
            console.warn(`[MapTiles] Switching from source ${prev} to ${prev + 1}`);
            return prev + 1;
          }
          return prev;
        });
        tileErrorCount.current = 0;
      }

      // All sources exhausted
      const allSourcesExhausted =
        totalTileErrorCount.current >= MAX_ERRORS_BEFORE_SWITCH * TILE_SOURCES.length;

      if (allSourcesExhausted && !tileLoadedOnce.current) {
        setTilesFailed(true);
        scheduleAutoRetry();
      }
    },
    [scheduleAutoRetry],
  );

  const handleTileLoad = useCallback(() => {
    tileLoadedOnce.current = true;
    tileErrorCount.current = 0;
    totalTileErrorCount.current = 0;
    autoRetryCount.current = 0;
    if (autoRetryTimer.current) clearTimeout(autoRetryTimer.current);
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
              key={`${safeIndex}-${isDark ? 'dark' : 'light'}-${retryGeneration}`}
              url={tileUrl}
              attribution={currentSource.attribution}
              maxZoom={currentSource.maxNativeZoom}
              maxNativeZoom={currentSource.maxNativeZoom}
              tileSize={256}
              detectRetina={false}
              updateWhenIdle={false}
              updateWhenZooming={false}
              keepBuffer={4}
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

          {/* Visual rounded border overlay */}
          <div
            className="absolute inset-0 rounded-lg border border-border pointer-events-none"
            style={{ zIndex: 1000 }}
          />

          {/* Tile loading error overlay with retry button */}
          {tilesFailed && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg"
              style={{ zIndex: 999 }}
            >
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">
                Nie udało się załadować mapy
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Problem z wczytywaniem kafelków mapy
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRetry}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
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
