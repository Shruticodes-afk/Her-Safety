"use client"
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { RiskCell } from '@/lib/riskScoring'

// Fix for default marker icon in leaflet with webpack/nextjs
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const getCellColor = (score: number) => {
  if (score >= 10) return '#ef4444'
  if (score >= 5) return '#f97316'
  return '#eab308'
}

function ClickHandler({ setStart, setDest, start, dest }: any) {
  useMapEvents({
    click(e) {
      if (!start) setStart([e.latlng.lat, e.latlng.lng])
      else if (!dest) setDest([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

function RoutesBoundsController({ routes }: { routes: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords: [number, number][] = [];
      routes.forEach((route: any) => {
        if (route.geometry && route.geometry.coordinates) {
          route.geometry.coordinates.forEach((c: any) => allCoords.push([c[1], c[0]]));
        }
      });
      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
      }
    }
  }, [routes, map]);
  return null;
}

function MapBoundsController({ geometry, selected }: { geometry: any, selected: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (selected && geometry && geometry.coordinates.length > 0) {
      const coords = geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [selected, geometry, map]);
  return null;
}

export default function RouteMap({ cells, start, dest, setStart, setDest, routes, selectedRouteIndex }: any) {
  return (
    <div className="w-full h-[500px] border border-rule rounded-xl overflow-hidden relative shadow-sm z-0">
      <MapContainer 
        center={[28.6139, 77.2090]} 
        zoom={11} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler setStart={setStart} setDest={setDest} start={start} dest={dest} />
        <RoutesBoundsController routes={routes} />
        
        {cells.map((cell: RiskCell, idx: number) => (
          <CircleMarker 
            key={idx}
            center={[cell.lat, cell.lng]}
            radius={12}
            pathOptions={{ 
              color: getCellColor(cell.score), 
              fillColor: getCellColor(cell.score),
              fillOpacity: 0.45,
              weight: 0,
            }}
          >
            <Popup>
              <div className="text-ink font-sans text-sm">
                <span className="font-bold">Risk Score:</span> {cell.score.toFixed(1)}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {start && <Marker position={start} />}
        {dest && <Marker position={dest} />}

        {routes.map((route: any, idx: number) => {
          const isSelected = idx === selectedRouteIndex;
          const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
          const color = isSelected ? (idx === 0 ? '#10b981' : idx === 1 ? '#f97316' : '#ef4444') : '#94a3b8';
          const weight = isSelected ? 5 : 3;
          const opacity = isSelected ? 1 : 0.5;

          return (
             <div key={idx}>
               <Polyline positions={coords} pathOptions={{ color, weight, opacity }} />
               {isSelected && <MapBoundsController geometry={route.geometry} selected={isSelected} />}
             </div>
          )
        })}
      </MapContainer>
      {cells.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 text-xs border border-rule rounded-lg z-[1000] shadow-sm flex flex-col gap-1.5 pointer-events-none">
          <div className="font-bold mb-1 text-ink">Risk Level</div>
          <div className="flex items-center gap-2 text-ink"><span className="w-3 h-3 rounded-full bg-red-500 opacity-60"></span> High (&ge;10)</div>
          <div className="flex items-center gap-2 text-ink"><span className="w-3 h-3 rounded-full bg-orange-500 opacity-60"></span> Medium (5-9)</div>
          <div className="flex items-center gap-2 text-ink"><span className="w-3 h-3 rounded-full bg-yellow-500 opacity-60"></span> Low (&lt;5)</div>
        </div>
      )}
    </div>
  )
}
