"use client"
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, useMapEvents, Polyline, useMap } from 'react-leaflet'
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
        
        {cells.map((cell: RiskCell, idx: number) => (
          <CircleMarker 
            key={idx}
            center={[cell.lat, cell.lng]}
            radius={Math.min(Math.max(cell.score * 2, 10), 40)}
            pathOptions={{ 
              color: getCellColor(cell.score), 
              fillColor: getCellColor(cell.score),
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.3
            }}
          />
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
    </div>
  )
}
