"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Report, RiskCell, calculateRiskCells } from '@/lib/riskScoring'

// Fix for default marker icon in leaflet with webpack/nextjs
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function RiskMapController({ cells }: { cells: RiskCell[] }) {
  const map = useMap()
  useEffect(() => {
    if (cells.length > 0) {
      const validCells = cells.filter(c => c.lat !== 0 && c.lng !== 0)
      if (validCells.length > 0) {
        const lats = validCells.map(c => c.lat)
        const lngs = validCells.map(c => c.lng)
        const bounds = L.latLngBounds(
          L.latLng(Math.min(...lats), Math.min(...lngs)),
          L.latLng(Math.max(...lats), Math.max(...lngs))
        )
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      } else {
        map.setView([28.6139, 77.2090], 11)
      }
    }
  }, [map, cells])
  return null
}



function CellPopup({ cell }: { cell: RiskCell }) {
  const [summary, setSummary] = useState<{ verdict: string, reasoning: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryCounts = cell.reports.reduce((acc, report) => {
    const cat = report.ai_category || report.category
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

  const handleGenerateSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const categories = Array.from(new Set(cell.reports.map(r => r.ai_category || r.category)))
      const severities = Array.from(new Set(cell.reports.map(r => r.ai_severity || r.severity)))

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          data: {
            reportsCount: cell.reportCount,
            categories,
            severities
          }
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch AI summary.")
      }
      const data = await res.json()
      if (data.verdict && data.reasoning && Array.isArray(data.reasoning)) {
        setSummary(data)
      } else {
        throw new Error("Summary generation returned an invalid format.")
      }
    } catch (err: any) {
      setError("Summary temporarily unavailable, please try again shortly.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-slate-800 p-2 min-w-[200px] font-sans">
      <h3 className="font-bold text-lg mb-1">Risk Hotspot</h3>
      <p className="text-sm mb-2 text-slate-600">
        <span className="font-semibold text-rose-500">{cell.reportCount} reports</span> in this area
      </p>

      <div className="mb-3 flex flex-wrap gap-1">
        {sortedCategories.map(([cat, count]) => (
          <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200">
            {cat.replace('_', ' ')}: {count}
          </span>
        ))}
      </div>
      
      {!summary && !loading && (
        <button 
          onClick={handleGenerateSummary}
          className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1 shadow-sm"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Generate AI Summary
        </button>
      )}

      {loading && (
        <div className="mt-3 flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-rose-400"></div>
          <span className="ml-2 text-xs text-slate-500">Analyzing...</span>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm">
          <p className="text-xs text-red-600 font-medium">Warning: {error}</p>
        </div>
      )}

      {summary && (
        <div className="mt-3 bg-rose-50/50 p-3 rounded-lg border border-rose-100 shadow-sm">
          <p className={`font-bold text-sm mb-2 uppercase tracking-wide ${
            summary.verdict.toLowerCase().includes('high') ? 'text-red-600' :
            summary.verdict.toLowerCase().includes('moderate') ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {summary.verdict}
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
            {summary.reasoning.map((reason, idx) => (
              <li key={idx} className="leading-relaxed">{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function RiskMap({ reports, publicDataPoints = [] }: { reports: Report[], publicDataPoints?: any[] }) {
  const [isMounted, setIsMounted] = useState(false)
  const [cells, setCells] = useState<RiskCell[]>([])
  
  useEffect(() => {
    setIsMounted(true)
    setCells(calculateRiskCells(reports, publicDataPoints))
    return () => setIsMounted(false)
  }, [reports, publicDataPoints])

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] rounded-2xl bg-slate-100 border border-rule animate-pulse flex items-center justify-center shadow-sm">
        <span className="text-ash font-medium flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-ash" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Initializing Map...
        </span>
      </div>
    )
  }

  // Helper to determine color based on score
  const getCellColor = (score: number) => {
    if (score >= 10) return '#ef4444' // red-500
    if (score >= 5) return '#f97316'  // orange-500
    return '#eab308'                  // yellow-500
  }

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-rule shadow-sm z-0 relative">
      <MapContainer 
        key="dashboard-risk-map"
        center={[28.6139, 77.2090]} 
        zoom={11} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        {/* Using a lighter basemap to make the risk circles pop */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <RiskMapController cells={cells} />
        
        {cells.map((cell, idx) => (
          <CircleMarker 
            key={idx}
            center={[cell.lat, cell.lng]}
            radius={Math.min(Math.max(cell.score * 2, 10), 40)}
            pathOptions={{ 
              color: getCellColor(cell.score), 
              fillColor: getCellColor(cell.score),
              fillOpacity: 0.5,
              weight: 2
            }}
          >
            <Popup>
              <CellPopup cell={cell} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
