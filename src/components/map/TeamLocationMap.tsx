import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, RefreshCw, Users } from 'lucide-react';
import { useTeamLocations, TeamLocation } from '@/hooks/useTeamMembers';
import { formatDateTime } from '@/lib/formatters';
import { useEffect, useState } from 'react';

// Fix Leaflet default marker icons (webpack/vite bundler issue)
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

// Multiple tile sources as fallback chain.
// Primary: OpenStreetMap canonical URL (no API key, ad-blocker safe).
// Fallback: OSM Germany mirror (same tiles, different CDN).
const TILE_SOURCES = [
  {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
];

interface TeamLocationMapProps {
  projectId?: string;
  className?: string;
}

// Helper component to auto-fit map bounds when markers change
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
}

// Helper component to trigger invalidateSize after mount for correct sizing
function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    // Staggered invalidateSize to handle delayed layout on mobile
    const timers = [100, 300, 600, 1200].map((delay) =>
      setTimeout(() => map.invalidateSize({ animate: false }), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);

  return null;
}

export function TeamLocationMap({ projectId, className }: TeamLocationMapProps) {
  const { i18n } = useTranslation();
  const [tileSourceIndex, setTileSourceIndex] = useState(0);
  const [tileErrorCount, setTileErrorCount] = useState(0);

  const { data: locations = [], refetch } = useTeamLocations(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Switch to fallback tile source after multiple consecutive failures
  useEffect(() => {
    if (tileErrorCount >= 6 && tileSourceIndex < TILE_SOURCES.length - 1) {
      setTileSourceIndex((prev) => prev + 1);
      setTileErrorCount(0);
    }
  }, [tileErrorCount, tileSourceIndex]);

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

  const currentTileSource = TILE_SOURCES[tileSourceIndex];

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
        <div className="h-[400px] relative">
          <MapContainer
            center={[52.0693, 19.4803]}
            zoom={6}
            fadeAnimation={false}
            zoomAnimation={true}
            // Disable tap emulation — modern Android Chrome handles touch
            // natively; Leaflet's tap handler can conflict and block events.
            tap={false}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          >
            <TileLayer
              key={tileSourceIndex}
              url={currentTileSource.url}
              attribution={currentTileSource.attribution}
              maxZoom={19}
              // updateWhenIdle defaults to true on mobile — known to cause
              // grey tiles during pinch-zoom (Leaflet #3683).
              updateWhenIdle={false}
              updateWhenZooming={false}
              // Extra tile buffer around viewport — reduces grey edges
              // when panning quickly on mobile.
              keepBuffer={4}
              eventHandlers={{
                tileerror: () => {
                  setTileErrorCount((c) => c + 1);
                },
                tileload: () => {
                  // Reset error count on successful loads
                  setTileErrorCount(0);
                },
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
