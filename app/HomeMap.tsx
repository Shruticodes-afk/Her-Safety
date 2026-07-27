"use client"
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { createClient } from '@/lib/supabase/client'

// Fix for default marker icon in leaflet with webpack/nextjs
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function MapController({ targetPosition }: { targetPosition?: [number, number] | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (targetPosition) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        map.setView(targetPosition, 13)
      } else {
        map.flyTo(targetPosition, 13, { duration: 1.5 })
      }
    }
  }, [map, targetPosition])
  
  return null
}

export default function HomeMap({ targetPosition }: { targetPosition?: [number, number] | null }) {
  const [reports, setReports] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const fetchReports = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('reports')
        .select('latitude, longitude, category, severity, description, created_at')
      if (data) setReports(data)
    }
    fetchReports()
  }, [isMounted])

  if (!isMounted) return null

  return (
    <div className="h-full w-full z-0 relative">
      <MapContainer 
        key="home-community-map"
        center={[26.8467, 80.9462]} 
        zoom={12} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController targetPosition={targetPosition} />
        {reports.map((report, index) => (
          <Marker key={index} position={[report.latitude, report.longitude]}>
            <Popup>
              <div className="text-slate-800 p-1 min-w-[150px] font-sans">
                <p className="font-bold text-base capitalize mb-1 border-b pb-1">
                  {report.category.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span className="font-semibold text-sm">Severity:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white
                    ${report.severity >= 4 ? 'bg-red-500' : report.severity === 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                    {report.severity} / 5
                  </span>
                </div>
                {report.description && (
                  <p className="text-sm mt-2 italic text-slate-600 bg-slate-50 p-2 rounded">
                    "{report.description}"
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
