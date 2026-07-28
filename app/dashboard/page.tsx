"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import InnerHeader from '@/app/InnerHeader'
import dynamic from 'next/dynamic'

const RiskMap = dynamic(() => import('./RiskMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-2xl bg-slate-100 border border-rule animate-pulse flex items-center justify-center">
      <span className="text-ash font-medium">Loading Risk Map...</span>
    </div>
  )
})

function LocationDetails({ lat, lon, description }: { lat: number, lon: number, description?: string | null }) {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAddress() {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
        const data = await res.json()
        setAddress(data.display_name)
      } catch (e) {
        setAddress("Could not load address data.")
      } finally {
        setLoading(false)
      }
    }
    fetchAddress()
  }, [lat, lon])

  return (
    <div className="p-5 bg-white rounded-xl border border-rule flex flex-col gap-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="mt-1 text-rose-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-ink mb-1">Incident Location</p>
          {loading ? (
            <p className="text-sm text-ash animate-pulse">Resolving address...</p>
          ) : (
            <p className="text-sm text-ash leading-relaxed max-w-2xl">{address}</p>
          )}
          <p className="text-xs text-ash mt-2 font-mono bg-paper inline-block px-2 py-1 rounded">
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </p>
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="mt-1 text-ash">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-ink mb-1">Description</p>
          <p className="text-sm text-ash leading-relaxed max-w-2xl">
            {description || <span className="italic">No description provided</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [myReports, setMyReports] = useState<any[]>([])
  const [allReports, setAllReports] = useState<any[]>([])
  const [publicDataPoints, setPublicDataPoints] = useState<any[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }
      
      // Fetch user profile for name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
        
      if (profileData && profileData.full_name) {
        setUserName(profileData.full_name)
      } else {
        setUserName(session.user.email ?? null) // fallback
      }

      // Fetch current user's reports for the list
      const { data: userData } = await supabase
        .from('reports')
        .select('category, severity, description, created_at, latitude, longitude')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (userData) {
        setMyReports(userData)
      }

      // Fetch all reports for the community risk map
      const { data: allData } = await supabase
        .from('reports')
        .select('latitude, longitude, category, severity, description, created_at, ai_category, ai_severity')
      
      if (allData) {
        setAllReports(allData)
      }

      // Fetch public infrastructure data
      const { data: publicData } = await supabase
        .from('public_data_points')
        .select('latitude, longitude, weight, data_type')
      
      if (publicData) {
        setPublicDataPoints(publicData)
      }

      setLoading(false)
    }
    
    fetchDashboardData()
  }, [router, supabase.auth, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-muted"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper font-sans flex flex-col">
      <InnerHeader theme="light" />
      <div className="p-4 md:p-8 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-rule">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-1 tracking-tight">Dashboard</h1>
            <p className="text-ash">
              Welcome back, <span className="text-rose-muted font-medium">{userName}</span>
            </p>
          </div>
          <Link 
            href="/report" 
            className="bg-rose-muted hover:bg-rose-400 text-white font-medium py-3 px-6 rounded-full transition-all shadow-sm text-center whitespace-nowrap"
          >
            Report an Incident
          </Link>
        </header>

        {/* Community Risk Map Section */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-rule">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink mb-2">Community Risk Overview</h2>
            <p className="text-ash">AI-powered hotspots based on recent community incident reports.</p>
          </div>
          <RiskMap reports={allReports} publicDataPoints={publicDataPoints} />
        </section>

        {/* My Reports Section */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-rule">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink mb-2">My Reports</h2>
            <p className="text-ash">Your recent contributions to community safety.</p>
          </div>

          {myReports.length === 0 ? (
            <div className="bg-paper rounded-xl border border-rule p-8 md:p-12 text-center flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-ash mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h3 className="text-lg font-bold text-ink mb-2">No reports yet</h3>
              <p className="text-ash max-w-md">You haven't submitted any incidents yet. When you do, they will appear here for you to track.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-rule text-xs font-bold text-ink uppercase tracking-wider">
                    <th className="py-4 px-4 w-[20%]">Date</th>
                    <th className="py-4 px-4 w-[30%]">Category</th>
                    <th className="py-4 px-4 w-[25%]">Severity</th>
                    <th className="py-4 px-4 w-[25%] text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/50">
                  {myReports.map((report, index) => (
                    <React.Fragment key={index}>
                      <tr 
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        className="hover:bg-paper/50 transition-colors group cursor-pointer"
                      >
                        <td className="py-4 px-4 text-ink whitespace-nowrap text-sm font-medium w-[20%]">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-ink font-medium capitalize text-sm w-[30%]">
                          {report.category.replace('_', ' ')}
                        </td>
                        <td className="py-4 px-4 w-[25%]">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold
                            ${report.severity >= 4 ? 'bg-red-50 text-red-600 border border-red-200' : 
                              report.severity === 3 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
                              'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                            {report.severity} / 5
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right w-[25%]">
                          <span className="text-xs font-bold text-rose-muted group-hover:text-rose-400 flex items-center justify-end gap-1 transition-colors uppercase tracking-wide">
                            View details
                            <svg className={`w-4 h-4 transition-transform duration-200 ${expandedIndex === index ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </span>
                        </td>
                      </tr>
                      {expandedIndex === index && (
                        <tr className="bg-paper/30">
                          <td colSpan={4} className="p-4 border-b border-rule/50">
                            <LocationDetails lat={report.latitude} lon={report.longitude} description={report.description} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
    </div>
  )
}
