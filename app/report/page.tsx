"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import the map to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse flex items-center justify-center">
      <span className="text-slate-500">Loading map...</span>
    </div>
  )
})

export default function ReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form State
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [category, setCategory] = useState('harassment')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('3')
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
      } else {
        setUserId(session.user.id)
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!position) {
      setError("Please select a location on the map.")
      return
    }
    
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: userId,
      latitude: position[0],
      longitude: position[1],
      category,
      description,
      severity: parseInt(severity)
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      // Clear form
      setPosition(null)
      setCategory('harassment')
      setDescription('')
      setSeverity('3')
      // Optional: hide success message after some time
      setTimeout(() => setSuccess(false), 5000)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Report a Safety Incident</h1>
          <p className="text-slate-400 mb-8">Your report helps keep the community safe.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 transition-all">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg mb-6 flex items-start transition-all">
              <svg className="w-6 h-6 mr-3 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="font-medium">Report submitted successfully.</p>
                <p className="text-sm opacity-80 mt-1">Thank you for contributing to community safety.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
              <p className="text-xs text-slate-400 mb-3">Click on the map to drop a pin marking the incident location.</p>
              <MapPicker position={position} setPosition={setPosition} />
              {!position && (
                <p className="text-amber-400 text-xs mt-2">* Location is required</p>
              )}
              {position && (
                <p className="text-emerald-400 text-xs mt-2 flex items-center">
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   Location selected: {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <div className="relative">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="harassment">Harassment</option>
                  <option value="poor_lighting">Poor Lighting</option>
                  <option value="isolated_area">Isolated Area</option>
                  <option value="stalking">Stalking</option>
                  <option value="unsafe_transport">Unsafe Transport</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Severity (1 = Low, 5 = High)</label>
              <div className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={severity} 
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="bg-slate-800 text-blue-400 font-bold py-1.5 px-4 rounded-lg border border-slate-600 min-w-[3rem] text-center shadow-inner">
                  {severity}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y min-h-[120px]"
                placeholder="Provide any additional details about the incident..."
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] flex justify-center items-center mt-8"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Report...
                </>
              ) : (
                'Submit Safety Report'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
