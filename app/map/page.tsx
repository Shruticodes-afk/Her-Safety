"use client"
import { useState } from 'react'
import InnerHeader from '@/app/InnerHeader'
import dynamic from 'next/dynamic'
import LocationSearch from '@/app/components/LocationSearch'

const FullScreenMap = dynamic(() => import('@/app/HomeMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-400 mr-3"></div>
      Loading live map data...
    </div>
  )
})

export default function MapPage() {
  const [targetPosition, setTargetPosition] = useState<[number, number] | null>(null)

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      <InnerHeader />
      <div className="flex-1 w-full relative">
        <LocationSearch onLocationSelect={(lat, lng) => setTargetPosition([lat, lng])} isOverlay={true} />
        <FullScreenMap targetPosition={targetPosition} />
      </div>
    </div>
  )
}
