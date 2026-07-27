"use client"
import { useState, useEffect, useRef } from 'react'

interface Suggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface MapSearchPanelProps {
  onLocationSelect: (lat: number, lng: number) => void
}

const POPULAR_CITIES = [
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Raebareli', lat: 26.2236, lng: 81.2403 },
  { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
]

export default function MapSearchPanel({ onLocationSelect }: MapSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
          setShowDropdown(true)
        }
      } catch (err) {
        console.error("Geocoding failed:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (lat: string | number, lon: string | number, displayName: string) => {
    setQuery(displayName)
    setShowDropdown(false)
    onLocationSelect(Number(lat), Number(lon))
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[1000]" ref={wrapperRef}>
      
      {/* Search Input Container */}
      <div className="relative bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex items-center px-4 py-3">
        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          placeholder="Search city or area..."
          className="bg-transparent text-white w-full border-none focus:outline-none focus:ring-0 ml-3 placeholder-slate-500 font-medium"
        />
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-rose-400 absolute right-4"></div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && (debouncedQuery.length >= 3) && (
        <div className="mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            <ul className="divide-y divide-slate-800/50">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button 
                    onClick={() => handleSelect(s.lat, s.lon, s.display_name)}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:bg-slate-800"
                  >
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          ) : !loading ? (
            <div className="px-4 py-3 text-sm text-slate-500 italic">No locations found.</div>
          ) : null}
        </div>
      )}

      {/* Quick Select Chips */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide px-1">
        {POPULAR_CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => handleSelect(city.lat, city.lng, city.name)}
            className="whitespace-nowrap px-3 py-1.5 bg-slate-800/80 backdrop-blur border border-slate-700 text-xs font-semibold text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  )
}
