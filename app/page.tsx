"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email ?? null)
      }
      setLoading(false)
    }
    checkUser()
  }, [supabase.auth])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Navbar/Header */}
      <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">Her Safety</div>
        <div>
          {!loading && userEmail ? (
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden md:inline-block">Welcome, {userEmail}</span>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-4xl px-4 py-24 md:py-32 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Her Safety
          </h1>
          <p className="text-2xl md:text-3xl text-blue-400 font-medium mb-6">
            Community-powered safety insights for your city.
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Empowering women through shared knowledge. Report incidents anonymously, view safety heatmaps, and find the most secure routes to your destination—all powered by real-time community data.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/report"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] text-lg text-center"
            >
              Report an Incident
            </Link>
            
            {!loading && (
              userEmail ? (
                <Link 
                  href="/report"
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all text-lg text-center"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link 
                  href="/login"
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all text-lg text-center"
                >
                  Sign In
                </Link>
              )
            )}
          </div>
        </section>

        {/* How it Works Section */}
        <section className="w-full bg-slate-800/30 py-24 px-4 border-t border-slate-800/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">How it works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-600 transition-colors shadow-xl">
                <div className="text-7xl font-black text-slate-700/30 absolute -top-4 -right-2 transition-transform group-hover:scale-110">1</div>
                <h3 className="text-xl font-bold text-white mb-4 relative z-10 mt-2">Report Incidents</h3>
                <p className="text-slate-400 relative z-10 leading-relaxed">
                  Notice poor lighting, harassment, or unsafe areas? Drop a pin on the map and securely submit a report.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-600 transition-colors shadow-xl">
                <div className="text-7xl font-black text-slate-700/30 absolute -top-4 -right-2 transition-transform group-hover:scale-110">2</div>
                <h3 className="text-xl font-bold text-white mb-4 relative z-10 mt-2">We Aggregate Data</h3>
                <p className="text-slate-400 relative z-10 leading-relaxed">
                  Your reports are anonymized and combined with data from thousands of other women across the city.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-600 transition-colors shadow-xl">
                <div className="text-7xl font-black text-slate-700/30 absolute -top-4 -right-2 transition-transform group-hover:scale-110">3</div>
                <h3 className="text-xl font-bold text-white mb-4 relative z-10 mt-2">See Safer Routes</h3>
                <p className="text-slate-400 relative z-10 leading-relaxed">
                  Use our live map and insights to make informed decisions about your daily commute and evening plans.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 py-8 px-4 text-center">
        <p className="text-slate-300 font-bold mb-2">Her Safety</p>
        <p className="text-slate-600 text-sm">Built for [Hackathon Name]</p>
      </footer>
    </div>
  )
}
