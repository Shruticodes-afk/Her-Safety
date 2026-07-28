"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthMenu({ isLight = false }: { isLight?: boolean }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUserEmail(session?.user?.email ?? null)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/')
  }

  const textColor = isLight ? "text-ink hover:text-rose-muted" : "text-white hover:text-rose-400"
  
  if (!userEmail) {
    return (
      <Link href="/login" className={`text-sm font-medium transition-colors ${textColor}`}>
        Sign In
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-6" ref={dropdownRef}>
      <Link href="/dashboard" className={`text-sm font-medium transition-colors hidden sm:block ${textColor}`}>
        Dashboard
      </Link>
      <Link href="/report" className={`text-sm font-medium transition-colors hidden sm:block ${textColor}`}>
        Report Incident
      </Link>
      
      <div className="relative">
        <button 
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${textColor}`}
        >
          <div className="w-8 h-8 rounded-full bg-rose-muted text-white flex items-center justify-center font-bold uppercase shrink-0">
            {userEmail.charAt(0)}
          </div>
          <span className="hidden sm:inline-block max-w-[120px] truncate text-left">{userEmail}</span>
          <svg className={`w-4 h-4 transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-rule rounded-xl shadow-lg overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-rule sm:hidden bg-paper/50">
              <p className="text-xs font-bold text-ash uppercase tracking-wider mb-1">Account</p>
              <p className="text-sm font-medium text-ink truncate">{userEmail}</p>
            </div>
            <Link 
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="block sm:hidden w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-paper transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/report"
              onClick={() => setDropdownOpen(false)}
              className="block sm:hidden w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-paper transition-colors"
            >
              Report Incident
            </Link>
            <button 
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
