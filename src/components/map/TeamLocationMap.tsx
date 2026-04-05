import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, RefreshCw, Users } from 'lucide-react';
import { useTeamLocations, TeamLocation } from '@/hooks/useTeamMembers';
import { formatDateTime } from '@/lib/formatters';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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

// CartoDB tiles: fast global CDN, light and dark variants, free for reasonable usage.
// Attribution required by CARTO terms of service.
const TILE_URL_LIGHT = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
const TILE_URL_DARK  = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface TeamLocationMapProps {
  projectId?: string;
  className?: string;
}

export function TeamLocationMap({ projectId, className }: TeamLocationMapProps) {
  const { i18n } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detect dark mode to select the matching tile theme.
  // Computed once on mount — theme-switching remounts the component via key change
  // or the user would need to reload anyway.
  const isDark = useMemo(
    () => document.documentElement.classList.contains('dark'),
    [],
  );

  const { data: locations = [], refetch } = useTeamLocations(projectId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Collect cleanup resources inside refs so the outer cleanup can reach them
    // even if they were created inside the requestAnimationFrame callback.
    const timers: ReturnType<typeof setTimeout>[] = [];
    let resizeObserver: ResizeObserver | null = null;

    // Defer Leaflet initialization to the NEXT animation frame.
    // This guarantees the browser has finished at least one layout pass and
    // Leaflet can read real pixel dimensions from the container.
    const rafId = requestAnimationFrame(() => {
      const container = mapContainer.current;
      if (!container || mapRef.current) return;

      // Guard: if Leaflet already owns this DOM node (React Strict-Mode
      // double-effect, or remount), skip re-initialization to avoid the
      // "Map container is already initialized" error.
      if ((container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id) {
        return;
      }

      // --- Create the Leaflet map ---
      mapRef.current = L.map(container, {
        // Disable the tile fade-in animation.
        // On Android Chrome the CSS opacity transition can get stuck at 0
        // when tiles are rendered inside a GPU-composited layer stack —
        // disabling fade makes tiles appear immediately and reliably.
        fadeAnimation: false,
        // Keep zoom animation enabled; it does not trigger the same bug.
        zoomAnimation: true,
      }).setView([52.0693, 19.4803], 6);

      const tileUrl = isDark ? TILE_URL_DARK : TILE_URL_LIGHT;

      const tl = L.tileLayer(tileUrl, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
        // Do NOT set crossOrigin here.
        // With crossOrigin:'anonymous' the browser sends an Origin header and
        // requires Access-Control-Allow-Origin in the response.  CDN caches
        // (CartoDB uses Fastly) can return a cached response that was stored
        // without CORS headers, causing every affected tile to show as a broken
        // image.  We only need tiles to DISPLAY — no canvas pixel-access needed —
        // so no-cors loading (the browser default) is the right choice.
        // Keep a larger buffer of off-screen tiles to reduce blank areas when
        // panning on a slow connection.
        keepBuffer: 4,
        // Load tiles immediately — do not wait for the map to be idle.
        updateWhenIdle: false,
        updateWhenZooming: false,
      }).addTo(mapRef.current);

      tileLayerRef.current = tl;

      // Staggered invalidateSize calls.
      // On Android Chrome the reported container size can be incorrect right
      // after mount (e.g. because parent elements are still reflowing).
      // Calling invalidateSize multiple times with increasing delays ensures
      // Leaflet eventually gets the correct size and requests the right tiles.
      [50, 200, 500, 1000, 2000].forEach((delay) => {
        timers.push(
          setTimeout(() => {
            mapRef.current?.invalidateSize({ animate: false });
          }, delay),
        );
      });

      // ResizeObserver: re-sync map size whenever the container is resized.
      // This covers tab switches (display:none → block), device rotation, etc.
      resizeObserver = new ResizeObserver(() => {
        mapRef.current?.invalidateSize({ animate: false });
      });
      resizeObserver.observe(container);
    });

    // Cleanup: runs on unmount or when isDark changes
    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
      resizeObserver?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileLayerRef.current = null;
    };
  }, [isDark]);

  // --- Markers effect ---
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (locations.length === 0) return;

    // Group locations by team member — keep only the latest record per member
    const latestLocations = new Map<string, TeamLocation>();
    locations.forEach((loc: TeamLocation) => {
      const existing = latestLocations.get(loc.team_member_id);
      if (!existing || new Date(loc.recorded_at) > new Date(existing.recorded_at)) {
        latestLocations.set(loc.team_member_id, loc);
      }
    });

    // Place a marker for each team member with a known position
    const bounds: L.LatLngExpression[] = [];
    latestLocations.forEach((loc) => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

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

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${memberName}</strong><br/>
            <span style="color: ${statusColors[status]};">● ${statusLabels[status]}</span><br/>
            <small>Ostatnia aktualizacja: ${formatDateTime(loc.recorded_at, i18n.language)}</small>
          </div>
        `);

      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
    }
  }, [locations, i18n.language]);

  const activeWorkers = new Set(locations.map((l: TeamLocation) => l.team_member_id)).size;

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
        {/*
          Map container structure — engineered to avoid the Android Chrome
          GPU-compositing bug that prevents Leaflet tiles from rendering:

          ROOT CAUSE: When ANY ancestor of the Leaflet container has both
          `overflow:hidden/clip` AND `border-radius`, Chrome on Android can
          fail to show GPU-accelerated tile images (translate3d layers) — the
          tiles are present in the DOM and loaded but never painted on screen.

          SOLUTION: The outer wrapper has NO overflow property whatsoever.
          A thin overlay <div> (pointer-events:none, z-index above Leaflet
          controls) is painted on top to draw the visual rounded border without
          creating any clip stencil that could interfere with tile compositing.
        */}
        <div
          className="h-[400px]"
          style={{ position: 'relative' }}
        >
          {/* Leaflet mounts here — rectangular, no clipping on this element or its ancestors */}
          <div
            ref={mapContainer}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Visual overlay: rounded border drawn ON TOP of tiles.
              pointer-events:none passes all interactions through to the map. */}
          <div
            className="absolute inset-0 rounded-lg border border-border"
            style={{ pointerEvents: 'none', zIndex: 1000 }}
          />
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
