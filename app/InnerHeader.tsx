"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthMenu from '@/app/components/AuthMenu'
import Logo from '@/app/components/Logo'

export default function InnerHeader({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const router = useRouter()
  const isLight = theme === 'light'
  
  const headerBg = isLight ? "bg-paper/80 border-rule" : "bg-slate-900/80 border-slate-800"
  const backText = isLight ? "text-ash hover:text-ink" : "text-slate-400 hover:text-white"
  const logoText = isLight ? "text-ink" : "text-white"
  
  return (
    <header className={`w-full backdrop-blur-md border-b sticky top-0 z-50 transition-all ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 grid grid-cols-3 items-center">
        <div className="flex justify-start">
          <button 
            type="button"
            onClick={() => router.push('/')} 
            className={`flex items-center gap-2 transition-colors text-sm font-medium group ${backText}`}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

      <div className="flex justify-center">
        <Logo isLight={isLight} />
      </div>

        <div className="flex justify-end">
          <AuthMenu isLight={isLight} />
        </div>
      </div>
    </header>
  )
}
