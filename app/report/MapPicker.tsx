"use client"
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in leaflet with webpack/nextjs
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

function MapController({ targetPosition }: { targetPosition?: [number, number] | null }) {
  const map = useMapEvents({})
  
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

export default function MapPicker({ position, setPosition, targetPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void, targetPosition?: [number, number] | null }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  if (!isMounted) return null

  // Use Lucknow as default center
  return (
    <div className="w-full h-64 lg:h-full lg:min-h-[450px] rounded-xl overflow-hidden border border-rule shadow-sm z-0 relative">
      <MapContainer 
        key="report-map-picker"
        center={[26.8467, 80.9462]} 
        zoom={13} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController targetPosition={targetPosition} />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  )
}
