"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InnerHeader from '@/app/InnerHeader'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [homeArea, setHomeArea] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: fullName,
        age: parseInt(age),
        home_area: homeArea
      })

      if (profileError) {
        setError("Account created, but failed to save profile details: " + profileError.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      <InnerHeader theme="light" />
      
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-12 lg:py-0">
        
        {/* Left Column: Display Headline */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center lg:pr-12 mb-12 lg:mb-0 pt-8 lg:pt-0">
          <h1 className="text-5xl md:text-6xl tracking-tight font-medium text-ink mb-6">
            Join the <br className="hidden md:block" /><em className="font-serif italic text-rose-muted pr-2">community.</em>
          </h1>
          <p className="text-lg text-ash max-w-md leading-relaxed">
            Report incidents, check the community map, and stay informed — sign up to start contributing.
          </p>
        </div>

        {/* Right Column: Form Card */}
        <div className="w-full lg:w-[55%] flex items-center justify-center lg:justify-end py-8">
          <div className="w-full max-w-md bg-white border border-rule p-8 md:p-10 rounded-3xl shadow-sm my-auto">
            <form onSubmit={handleSignUp} className="flex flex-col">
              
              <div className="mb-6">
                <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                  placeholder="Your Full Name"
                  required
                />
              </div>

              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Age</label>
                  <input
                    type="number"
                    min="13"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                    placeholder="e.g. 25"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Home Area</label>
                  <input
                    type="text"
                    value={homeArea}
                    onChange={(e) => setHomeArea(e.target.value)}
                    className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                    placeholder="e.g. Aminabad, Lucknow"
                    required
                  />
                </div>
              </div>

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

              <div className="mb-6">
                <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="mb-8">
                <label className="block text-[10px] tracking-widest font-bold text-ash uppercase mb-3">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-rule pb-2 text-ink placeholder-ash/50 focus:outline-none focus:border-rose-muted transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs font-medium mb-6 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !fullName || !age || !homeArea || !email || !password || !confirmPassword}
                className="w-full bg-rose-muted hover:bg-rose-400 text-white font-bold py-4 px-6 rounded-full transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex justify-center items-center group"
              >
                {loading ? (
                  'Creating account...'
                ) : (
                  <>
                    Create Account 
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              <div className="mt-8 text-center">
                <p className="text-sm text-ash">
                  Already have an account?{' '}
                  <Link href="/login" className="text-ink font-bold hover:text-rose-muted transition-colors">
                    Log in
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
