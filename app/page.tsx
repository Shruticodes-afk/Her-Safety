"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AuthMenu from '@/app/components/AuthMenu'
import Logo from '@/app/components/Logo'

const HomeMap = dynamic(() => import('./HomeMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-[#f0ede6] text-ash animate-pulse">Loading live map data...</div>
})

function SignatureBadge() {
  const text = "REAL-TIME · VERIFIED · REPORTS · "
  
  return (
    <div className="relative flex-shrink-0 w-24 h-24 md:w-36 md:h-36 mt-2 md:mt-4 hidden sm:block">
      {/* Rotating text ring */}
      <div className="absolute inset-0 animate-[spin_20s_linear_infinite] opacity-80 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-ink text-[11px] font-bold font-sans tracking-[2px]">
          <path id="circlePath" d="M 50, 50 m -42, 0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none" />
          <text>
            <textPath href="#circlePath" startOffset="0%">
              {text}
            </textPath>
          </text>
        </svg>
      </div>
      
      {/* Static center icon (Stylized Venus) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-8 h-8 md:w-9 md:h-9 text-rose-muted opacity-90 motion-safe:animate-[pulse_4s_ease-in-out_infinite]"
        >
          <circle cx="12" cy="9" r="5" />
          <line x1="12" y1="14" x2="12" y2="21" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
      </div>
    </div>
  )
}

function HeroWaves() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const mouseRef = useRef({ targetY: 0, currentY: 0 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion || !svgRef.current) return

    const svg = svgRef.current
    const paths = Array.from(svg.querySelectorAll('path'))
    
    // Wave configurations: different speeds, frequencies, and phase offsets
    const waves = [
      { speed: 0.0008, frequency: 0.008, amplitude: 20, phase: 0 },
      { speed: 0.0012, frequency: 0.006, amplitude: 25, phase: 2 },
      { speed: 0.0009, frequency: 0.010, amplitude: 15, phase: 4 },
      { speed: 0.0015, frequency: 0.007, amplitude: 18, phase: 1 },
    ]

    let animationFrameId: number
    
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse Y between -1 and 1
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1
      // Bias amplitude up to 20px max based on cursor Y
      mouseRef.current.targetY = normalizedY * 20
    }
    
    window.addEventListener('mousemove', handleMouseMove)

    const draw = (time: number) => {
      // Smoothly interpolate current mouse bias towards target
      mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.05
      const mouseBias = mouseRef.current.currentY
      
      const width = 1000
      const height = 150
      const baseY = height / 2

      paths.forEach((path, i) => {
        const wave = waves[i]
        let d = `M 0 ${baseY}`
        
        for (let x = 0; x <= width; x += 10) {
          // Subtle mouse pull. Alternate directions per wave for a more organic, un-synced feel
          const currentAmp = wave.amplitude + (mouseBias * (i % 2 === 0 ? 1 : -0.5))
          
          const y = baseY + currentAmp * Math.sin(x * wave.frequency + wave.phase + time * wave.speed)
          d += ` L ${x} ${y}`
        }
        
        path.setAttribute('d', d)
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    animationFrameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [reducedMotion])

  // Static fallback paths for SSR / Reduced motion
  const staticPaths = [
    "M0 75 Q 125 55 250 75 T 500 75 T 750 75 T 1000 75",
    "M0 75 Q 125 95 250 75 T 500 75 T 750 75 T 1000 75",
    "M0 75 Q 100 60 200 75 T 400 75 T 600 75 T 800 75 T 1000 75",
    "M0 75 Q 150 90 300 75 T 600 75 T 900 75 T 1200 75"
  ]

  return (
    <div className="absolute bottom-0 left-0 w-full h-[33%] pointer-events-none z-0 overflow-hidden">
      <svg 
        ref={svgRef}
        className="w-full h-full text-rose-muted"
        preserveAspectRatio="none"
        viewBox="0 0 1000 150"
      >
        {staticPaths.map((d, i) => (
          <path 
            key={i}
            stroke="currentColor" 
            fill="none" 
            strokeWidth={i === 0 ? "2" : "1.5"} 
            opacity={[0.4, 0.3, 0.2, 0.15][i]} 
            d={d} 
          />
        ))}
      </svg>
    </div>
  )
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('home')
  const supabase = createClient()

  useEffect(() => {

    const handleScroll = () => {
      const sections = ['home', 'how-it-works', 'live-map', 'why-report']
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [supabase.auth])

  const navItems = [
    { id: 'home', label: '01 Home' },
    { id: 'how-it-works', label: '02 How it works' },
    { id: 'live-map', label: '03 Live Map' },
    { id: 'why-report', label: '04 Why report' }
  ]

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      
      {/* Scroll-Linked Progress Nav */}
      <nav className="fixed top-0 left-0 w-full bg-paper/90 backdrop-blur-md z-50 border-b border-rule transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Logo />
          
          <div className="hidden md:flex gap-8 items-center h-full">
            {navItems.map((item) => (
              <a 
                key={item.id} 
                href={`#${item.id}`}
                className="relative h-full flex items-center font-serif italic text-lg text-ash hover:text-ink transition-colors"
              >
                {item.label}
                {/* Progress Underline */}
                <div className={`absolute bottom-0 left-0 h-[2px] bg-rose-muted transition-all duration-300 ease-out ${
                  activeSection === item.id ? 'w-full' : 'w-0'
                }`} />
              </a>
            ))}
          </div>

          <div>
            <AuthMenu isLight={true} />
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* HERO SECTION */}
        <section id="home" className="relative min-h-[90vh] flex items-center pt-10 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 relative z-10 w-full flex flex-col md:flex-row items-start gap-8 md:gap-12 lg:gap-16">
            <SignatureBadge />
            
            <div className="relative">
              <h1 className="text-6xl md:text-[5.5rem] leading-[1.05] tracking-tight font-medium text-ink mb-8 max-w-4xl">
                Your street deserves <br />
                <em className="font-serif italic text-rose-muted pr-2">careful eyes.</em>
              </h1>
              
              <p className="text-xl md:text-2xl text-ash max-w-2xl leading-relaxed mb-12">
                Report incidents, view community heatmaps, and stay informed on local safety—built for and by the women of our city.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/report"
                  className="px-8 py-4 bg-rose-muted hover:bg-rose-muted/90 text-white font-medium rounded-sm transition-all text-center focus:ring-4 focus:ring-rose-muted/20 outline-none"
                >
                  Report an Incident
                </Link>
                <Link 
                  href="#live-map"
                  className="px-8 py-4 bg-transparent border border-rule hover:border-ash text-ink font-medium rounded-sm transition-all text-center"
                >
                  View the Map
                </Link>
              </div>
            </div>
          </div>
          
          <HeroWaves />
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-32 bg-white border-t border-rule">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-medium mb-16 tracking-tight">
              A shared map for a <em className="font-serif italic text-rose-muted">safer city</em>.
            </h2>
            
            <div className="grid md:grid-cols-3 gap-0 border-t border-l border-rule">
              {[
                { step: '01', title: 'Spot something', desc: 'Notice poor lighting, harassment, or an unsafe area during your commute.' },
                { step: '02', title: 'Report instantly', desc: 'Drop a pin on the map. Submit a report anonymously in under 30 seconds.' },
                { step: '03', title: 'Community aware', desc: 'Your report appears on the live heatmap, helping others choose safer routes.' }
              ].map((item, i) => (
                <div key={i} className="p-10 border-r border-b border-rule hover:bg-paper transition-colors group">
                  <div className="text-sm font-bold text-rose-muted mb-8 tracking-widest">{item.step}</div>
                  <h3 className="text-2xl font-medium mb-4">{item.title}</h3>
                  <p className="text-ash leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE MAP PREVIEW */}
        <section id="live-map" className="py-32 bg-paper border-t border-rule">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 w-full relative h-[400px] md:h-[500px]">
              {/* Real Leaflet Map */}
              <div className="w-full h-full rounded-sm border border-rule overflow-hidden relative shadow-sm">
                <HomeMap />
                
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 text-sm border border-rule rounded-sm z-[1000] pointer-events-none">
                  <p className="font-bold mb-1">Lucknow Area</p>
                  <p className="text-ash">Live community incidents</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <h2 className="text-4xl md:text-5xl font-medium mb-8 tracking-tight">
                Real-time insights <br/><em className="font-serif italic text-rose-muted">you can trust.</em>
              </h2>
              <p className="text-lg text-ash leading-relaxed mb-8">
                We aggregate verified reports into a comprehensive heat map. Whether you're heading home late or exploring a new neighborhood, consult the map to make informed decisions.
              </p>
              <Link 
                href="/map"
                className="inline-flex items-center text-rose-muted font-bold hover:text-ink transition-colors group"
              >
                Explore the Live Map 
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* WHY REPORT SECTION */}
        <section id="why-report" className="py-32 bg-white border-t border-rule text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-serif italic text-ink mb-8">
              "A single report can change someone's route."
            </h2>
            <p className="text-lg text-ash leading-relaxed mb-12">
              Our safety is collective. We don't rely on panic, but on presence. By sharing what you see, you actively contribute to the well-being of the women around you. No incident is too small to record if it makes you feel unsafe.
            </p>
            <Link 
              href="/report"
              className="px-10 py-5 bg-ink hover:bg-ash text-white font-medium rounded-sm transition-all text-center inline-block focus:ring-4 focus:ring-ink/20 outline-none"
            >
              Make Your First Report
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-paper border-t border-rule py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <div className="text-ash text-sm text-center md:text-left">
            Open source on <a href="https://github.com/Shruticodes-afk/her-safety" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">GitHub</a>.
          </div>
        </div>
      </footer>
    </div>
  )
}
