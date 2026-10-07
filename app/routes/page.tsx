"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateRiskCells, RiskCell, Report, PublicDataPoint } from '@/lib/riskScoring'
import { scoreRoutes, RouteStats } from '@/lib/routeScoring'
import InnerHeader from '@/app/InnerHeader'
import dynamic from 'next/dynamic'

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] border border-rule rounded-xl animate-pulse bg-slate-100 flex items-center justify-center text-ash font-medium">Loading Map...</div>
})

export default function SafeRoutesPage() {
  const [loading, setLoading] = useState(true)
  const [cells, setCells] = useState<RiskCell[]>([])
  const [dataError, setDataError] = useState<string | null>(null)
  
  const [start, setStart] = useState<[number, number] | null>(null)
  const [dest, setDest] = useState<[number, number] | null>(null)
  const [routes, setRoutes] = useState<RouteStats[]>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null)
  
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [mode, setMode] = useState<'foot' | 'driving'>('foot')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log(`[ROUTES-DEBUG] Supabase session exists: ${!!session}`)
      
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('latitude, longitude, category, severity, description, created_at, ai_category, ai_severity')
      console.log(`[ROUTES-DEBUG] Reports fetched: ${reportsData?.length || 0}`, reportsError)
      
      const { data: publicData, error: publicError } = await supabase
        .from('public_data_points')
        .select('latitude, longitude, weight, data_type')
      console.log(`[ROUTES-DEBUG] Public data points fetched: ${publicData?.length || 0}`, publicError)
      
      if (!session && (!reportsData || reportsData.length === 0)) {
        setDataError("Sign in to load risk data")
      } else if (reportsError) {
        setDataError(reportsError.message)
      }

      if (reportsData) {
        const generatedCells = calculateRiskCells(reportsData as Report[], (publicData || []) as PublicDataPoint[])
        setCells(generatedCells)
        console.log(`[ROUTES-DEBUG] RiskCells returned: ${generatedCells.length}`)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!start || !dest) return

    const fetchRoutes = async () => {
      setRouteLoading(true)
      setRouteError(null)
      setRoutes([])
      setMode('foot')
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        
        let url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start[1]},${start[0]};${dest[1]},${dest[0]}?alternatives=true&overview=full&geometries=geojson`
        let res = await fetch(url, { signal: controller.signal }).catch(() => null)
        let data = res ? await res.json().catch(() => null) : null
        
        if (!data || data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          setMode('driving')
          url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${dest[1]},${dest[0]}?alternatives=true&overview=full&geometries=geojson`
          res = await fetch(url, { signal: controller.signal })
          data = await res.json()
        }
        
        clearTimeout(timeoutId)
        
        if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const scored = scoreRoutes(data.routes.slice(0, 3), cells)
          scored.sort((a, b) => {
            if (Math.abs(a.riskScore - b.riskScore) < 0.001) {
              return a.durationMin - b.durationMin
            }
            return a.riskScore - b.riskScore
          })
          const finalRoutes = scored.map((r, i) => ({ ...r, routeIndex: i }))
          setRoutes(finalRoutes)
          setSelectedRouteIndex(0)
        } else {
          setRouteError("No route found between these locations.")
        }
      } catch (err: any) {
        if (err.name === 'AbortError') setRouteError("Routing request timed out.")
        else setRouteError("Network failure or routing service unavailable.")
      } finally {
        setRouteLoading(false)
      }
    }
    fetchRoutes()
  }, [start, dest, cells])

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setStart([pos.coords.latitude, pos.coords.longitude]),
        () => alert("Unable to retrieve location.")
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const reset = () => {
    setStart(null)
    setDest(null)
    setRoutes([])
    setSelectedRouteIndex(null)
    setRouteError(null)
  }

  const fastestDuration = routes.length > 0 ? Math.min(...routes.map(r => r.durationMin)) : 0;
  let fastestRouteIndex = routes.length > 0 ? routes.findIndex(r => r.durationMin === fastestDuration) : -1;

  let showSafestBadge = false;
  let showNeutralNote = false;

  if (cells.length === 0) {
    fastestRouteIndex = -1;
  } else if (routes.length === 1) {
    showSafestBadge = !routes[0].isLowCoverage;
  } else if (routes.length > 1) {
    const best = routes[0];
    const next = routes[1];
    const threshold = Math.max(0.5, best.riskScore * 0.15);
    const difference = next.riskScore - best.riskScore;
    
    if (difference >= threshold && !best.isLowCoverage) {
      showSafestBadge = true;
    } else {
      showNeutralNote = true;
    }
  }

  return (
    <div className="min-h-screen bg-paper font-sans flex flex-col">
      <InnerHeader theme="light" />
      <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-8">
        
        <header className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-rule">
          <h1 className="text-3xl font-bold text-ink mb-2">Safe Routing</h1>
          <p className="text-ash mb-6">Find the safest path to your destination using community risk data.</p>
          <div className="flex gap-4">
            <button onClick={useMyLocation} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink text-sm font-medium rounded-lg transition-colors">
              Use My Location
            </button>
            <button onClick={reset} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors">
              Reset
            </button>
          </div>
          {(!start || !dest) && (
            <p className="mt-6 text-sm font-bold text-rose-muted tracking-wide">
              {!start ? "1. Click on the map to set starting point." : "2. Click on the map to set destination."}
            </p>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-2/3">
            {dataError && (
              <div className="mb-4 bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 font-medium shadow-sm">
                {dataError}
              </div>
            )}
            {loading ? (
              <div className="w-full h-[500px] border border-rule rounded-xl animate-pulse bg-slate-100 flex items-center justify-center text-ash font-medium">Loading risk data...</div>
            ) : (
              <RouteMap cells={cells} start={start} dest={dest} setStart={setStart} setDest={setDest} routes={routes} selectedRouteIndex={selectedRouteIndex} />
            )}
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            {routeLoading && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-rule animate-pulse">
                <p className="font-bold text-ash">Finding safest routes...</p>
              </div>
            )}
            
            {routeError && (
              <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200 text-red-700">
                <p className="font-bold">Error</p>
                <p className="text-sm">{routeError}</p>
              </div>
            )}

            {!routeLoading && mode === 'driving' && routes.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm font-medium">
                Showing driving route (walking route unavailable)
              </div>
            )}

            {!routeLoading && showNeutralNote && (
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium">
                No meaningful risk difference found between these routes - data is limited here.
              </div>
            )}

            {!routeLoading && routes.map((r, i) => {
              const label = `Route ${String.fromCharCode(65 + i)}`
              const isSelected = selectedRouteIndex === i
              const colorClass = i === 0 ? "border-emerald-500 bg-emerald-50" : i === 1 ? "border-orange-400 bg-orange-50" : "border-red-400 bg-red-50"
              const unselectedClass = "border-rule bg-white hover:border-slate-300"
              
              const isSafest = showSafestBadge && i === 0
              const isFastest = !showSafestBadge && i === fastestRouteIndex
              const isLongWalking = mode === 'foot' && r.distanceKm > 8
              
              const extraTime = Math.max(0, r.durationMin - fastestDuration)
              
              return (
                <button 
                  key={i} 
                  onClick={() => setSelectedRouteIndex(i)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all shadow-sm ${isSelected ? colorClass : unselectedClass}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">
                      {label}
                      {isSafest && <span className="text-xs ml-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full">Safest</span>}
                      {isFastest && <span className="text-xs ml-2 bg-blue-500 text-white px-2 py-0.5 rounded-full">Fastest</span>}
                    </h3>
                    <span className="font-mono font-bold text-lg">{r.riskScore.toFixed(1)}</span>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-1 mb-3">
                    <p>Distance: {r.distanceKm.toFixed(1)} km</p>
                    <p>
                      Duration: {Math.round(r.durationMin)} min 
                      {Math.round(extraTime) >= 1 && <span className="text-xs text-rose-500 ml-1">(+{Math.round(extraTime)} min)</span>}
                    </p>
                    <p className={r.highRiskCellsCrossed > 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                      High-risk zones crossed: {r.highRiskCellsCrossed}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {r.isLowCoverage && (
                      <div className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium">
                        Low data coverage
                      </div>
                    )}
                    {isLongWalking && (
                      <div className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded font-medium">
                        Long walking route
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
            
            {routes.length > 0 && (
              <p className="text-xs text-ash text-center mt-4 px-4 italic">
                Scores are based on community reports and public infrastructure data and may be incomplete.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
