"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InnerHeader from '@/app/InnerHeader'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email || !password) {
      setError("Please fill out all fields.")
      setLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      <InnerHeader theme="light" />
      
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-12 lg:py-0">
        
        {/* Left Column: Display Headline */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center lg:pr-12 mb-12 lg:mb-0 pt-8 lg:pt-0">
          <h1 className="text-5xl md:text-6xl tracking-tight font-medium text-ink mb-6">
            Welcome <br className="hidden md:block" /><em className="font-serif italic text-rose-muted pr-2">back.</em>
          </h1>
          <p className="text-lg text-ash max-w-md leading-relaxed">
            Report incidents, check the community map, and stay informed — sign in to continue.
          </p>
        </div>

        {/* Right Column: Form Card */}
        <div className="w-full lg:w-[55%] flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white border border-rule p-8 md:p-10 rounded-3xl shadow-sm">
            <form onSubmit={handleSignIn} className="flex flex-col">
              
              <div className="mb-6">
                <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs font-medium mb-6 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-rose-muted hover:bg-rose-400 text-white font-bold py-4 px-6 rounded-full transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex justify-center items-center group"
              >
                {loading ? (
                  'Authenticating...'
                ) : (
                  <>
                    Log In 
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              <div className="mt-8 text-center">
                <p className="text-sm text-ash">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-ink font-bold hover:text-rose-muted transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
