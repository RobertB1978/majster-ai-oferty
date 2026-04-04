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

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// --- Debug overlay types (used only when ?mapDebug=1) ---
interface MapDebugInfo {
  mapInitialized: boolean;
  tileLayerAdded: boolean;
  tileUrl: string;
  tileloadstartCount: number;
  tileloadCount: number;
  tileerrorCount: number;
  lastTileUrl: string | null;
  lastTileError: string | null;
  containerW: number;
  containerH: number;
  tilePaneExists: boolean;
  tileImgCount: number;
  overflowStyle: string;
  visibilityStyle: string;
  opacityStyle: string;
}

function computeVerdict(info: MapDebugInfo): string {
  if (!info.mapInitialized) return 'mapa nie zainicjalizowana';
  if (!info.tileLayerAdded) return 'TileLayer nie został dodany';
  if (info.containerW === 0 || info.containerH === 0) return 'kontener mapy ma zerowe wymiary';
  if (!info.tilePaneExists) return 'brak .leaflet-tile-pane w DOM';
  if (info.tileerrorCount > 0) return 'tileerror występuje';
  if (info.tileloadstartCount === 0) return 'brak requestów tiles';
  if (info.visibilityStyle === 'hidden' || info.opacityStyle === '0') return 'tiles ukryte przez CSS';
  if (info.tileloadstartCount > 0 && info.tileloadCount === 0 && info.tileerrorCount === 0)
    return 'tiles żądane, brak odpowiedzi (sieć / CSP?)';
  if (info.tileImgCount > 0 && info.tileloadCount === 0) return 'tiles w DOM, ale niewidoczne (CSS?)';
  if (info.tileloadCount > 0) return 'tiles ładują się poprawnie';
  return 'UNKNOWN';
}
// --- end debug types ---

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

  // Debug mode: aktywowany wyłącznie przez ?mapDebug=1 — bez tego parametru nic się nie zmienia
  const debugMode = useMemo(
    () => new URLSearchParams(window.location.search).get('mapDebug') === '1',
    []
  );

  // Liczniki eventów tiles — refs żeby nie powodować re-renderów podczas ładowania kafelków
  const debugCountersRef = useRef({
    tileloadstart: 0,
    tileload: 0,
    tileerror: 0,
    lastTileUrl: null as string | null,
    lastTileError: null as string | null,
  });

  const [debugInfo, setDebugInfo] = useState<MapDebugInfo>({
    mapInitialized: false,
    tileLayerAdded: false,
    tileUrl: TILE_URL,
    tileloadstartCount: 0,
    tileloadCount: 0,
    tileerrorCount: 0,
    lastTileUrl: null,
    lastTileError: null,
    containerW: 0,
    containerH: 0,
    tilePaneExists: false,
    tileImgCount: 0,
    overflowStyle: '',
    visibilityStyle: '',
    opacityStyle: '',
  });

  const { data: locations = [], refetch } = useTeamLocations(projectId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map centered on Poland
    mapRef.current = L.map(mapContainer.current).setView([52.0693, 19.4803], 6);

    const tl = L.tileLayer(TILE_URL, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    tileLayerRef.current = tl;

    // Tile event listeners — overhead pomijalny, działają niezależnie od trybu debug
    tl.on('tileloadstart', (e: L.TileEvent) => {
      debugCountersRef.current.tileloadstart++;
      debugCountersRef.current.lastTileUrl = (e.tile as HTMLImageElement).src;
    });
    tl.on('tileload', () => {
      debugCountersRef.current.tileload++;
    });
    tl.on('tileerror', (e: L.TileErrorEvent) => {
      debugCountersRef.current.tileerror++;
      debugCountersRef.current.lastTileError = (e.tile as HTMLImageElement).src;
    });

    if (debugMode) {
      setDebugInfo(prev => ({ ...prev, mapInitialized: true, tileLayerAdded: true }));
    }

    // Force tile redraw after layout settles (fixes blank tiles on first render)
    const sizeTimer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    // Re-calculate map size whenever the container is resized (e.g. after tab switch
    // that hides the element via display:none — Leaflet misses the layout change)
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      clearTimeout(sizeTimer);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileLayerRef.current = null;
    };
  }, []);

  // Debug polling: odświeża snapshot DOM co sekundę — działa tylko przy ?mapDebug=1
  useEffect(() => {
    if (!debugMode) return;

    const interval = setInterval(() => {
      const container = mapContainer.current;
      const rect = container?.getBoundingClientRect();
      const computed = container ? window.getComputedStyle(container) : null;
      const tilePaneEl = container?.querySelector('.leaflet-tile-pane');
      const tileImgs = container?.querySelectorAll('img.leaflet-tile') ?? [];
      const c = debugCountersRef.current;

      setDebugInfo({
        mapInitialized: mapRef.current !== null,
        tileLayerAdded: tileLayerRef.current !== null,
        tileUrl: TILE_URL,
        tileloadstartCount: c.tileloadstart,
        tileloadCount: c.tileload,
        tileerrorCount: c.tileerror,
        lastTileUrl: c.lastTileUrl,
        lastTileError: c.lastTileError,
        containerW: rect?.width ?? 0,
        containerH: rect?.height ?? 0,
        tilePaneExists: !!tilePaneEl,
        tileImgCount: tileImgs.length,
        overflowStyle: computed?.overflow ?? '',
        visibilityStyle: computed?.visibility ?? '',
        opacityStyle: computed?.opacity ?? '',
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [debugMode]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (locations.length === 0) return;

    // Group locations by team member (get latest for each)
    const latestLocations = new Map<string, TeamLocation>();
    locations.forEach((loc: TeamLocation) => {
      const existing = latestLocations.get(loc.team_member_id);
      if (!existing || new Date(loc.recorded_at) > new Date(existing.recorded_at)) {
        latestLocations.set(loc.team_member_id, loc);
      }
    });

    // Add markers for each team member
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
  }, [locations]);

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
        {/* Outer wrapper owns all visual styling (rounded corners, border, overflow).
            Leaflet container is plain — no border-radius on it, so Leaflet's own
            overflow:hidden works correctly on Android Chrome/WebView without
            triggering the translate3d compositing-layer bug. */}
        <div className="h-[400px] rounded-lg border border-border overflow-hidden" style={{ position: 'relative' }}>
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Debug overlay — widoczny TYLKO przy ?mapDebug=1, niewidoczny dla zwykłego użytkownika */}
          {debugMode && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.88)',
                color: '#00ff88',
                fontFamily: 'monospace',
                fontSize: 11,
                padding: '8px 10px',
                borderRadius: 6,
                maxWidth: 290,
                lineHeight: 1.7,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#fff', fontSize: 12 }}>
                MAP DEBUG
              </div>
              <div>mapInit: {debugInfo.mapInitialized ? '✓' : '✗'}</div>
              <div>tileLayer: {debugInfo.tileLayerAdded ? '✓' : '✗'}</div>
              <div style={{ color: '#aaa', fontSize: 9, wordBreak: 'break-all' }}>
                url: {debugInfo.tileUrl}
              </div>
              <div>tileloadstart: {debugInfo.tileloadstartCount}</div>
              <div>tileload: {debugInfo.tileloadCount}</div>
              <div style={{ color: debugInfo.tileerrorCount > 0 ? '#ff4444' : 'inherit' }}>
                tileerror: {debugInfo.tileerrorCount}
              </div>
              <div style={{ color: '#aaa', fontSize: 9, wordBreak: 'break-all' }}>
                lastTile: {debugInfo.lastTileUrl ? '…' + debugInfo.lastTileUrl.slice(-38) : '—'}
              </div>
              {debugInfo.lastTileError && (
                <div style={{ color: '#ff4444', fontSize: 9, wordBreak: 'break-all' }}>
                  lastErr: …{debugInfo.lastTileError.slice(-38)}
                </div>
              )}
              <div>
                container: {debugInfo.containerW.toFixed(0)}×{debugInfo.containerH.toFixed(0)} px
              </div>
              <div>tilePaneExists: {debugInfo.tilePaneExists ? '✓' : '✗'}</div>
              <div>img.leaflet-tile: {debugInfo.tileImgCount}</div>
              <div>overflow: {debugInfo.overflowStyle || '—'}</div>
              <div>visibility: {debugInfo.visibilityStyle || '—'}</div>
              <div>opacity: {debugInfo.opacityStyle || '—'}</div>
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: '1px solid #333',
                  color: '#ffcc00',
                  fontWeight: 'bold',
                  fontSize: 11,
                }}
              >
                → {computeVerdict(debugInfo)}
              </div>
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
