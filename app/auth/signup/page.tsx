'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('==========================================')
    console.log('🔵 SIGNUP FORM SUBMITTED')
    console.log('==========================================')
    console.log('📧 Email value:', email)
    console.log('📧 Email state:', { email })
    console.log('👤 Full Name:', fullName)
    console.log('🔒 Password value exists:', password ? 'YES' : 'NO')
    console.log('🔒 Password length:', password.length)
    console.log('🔒 Confirm Password length:', confirmPassword.length)
    console.log('🔒 Passwords match:', password === confirmPassword)
    
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match')
      alert('Passwords do not match')
      return
    }

    if (password.length < 6) {
      console.error('❌ Password too short:', password.length)
      alert('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    console.log('🔄 Loading state: true')

    try {
      console.log('-------------------------------------------')
      console.log('🌐 Supabase Environment Check:')
      console.log('URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
      console.log('-------------------------------------------')
      
      const signupData = {
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      }
      
      console.log('📤 Signup data prepared:', {
        email: signupData.email,
        passwordLength: signupData.password.length,
        fullName: signupData.options.data.full_name
      })
      
      console.log('📤 Calling supabase.auth.signUp...')
      const { data, error } = await supabase.auth.signUp(signupData)

      console.log('-------------------------------------------')
      console.log('📥 SUPABASE RESPONSE:')
      console.log('Data:', JSON.stringify(data, null, 2))
      console.log('Error:', JSON.stringify(error, null, 2))
      console.log('-------------------------------------------')

      if (error) {
        console.error('❌ Supabase returned error:', error)
        console.error('Error code:', error.status)
        console.error('Error message:', error.message)
        
        // Provide user-friendly error messages
        let errorMsg = error.message
        if (error.message.includes('invalid')) {
          errorMsg = 'Please use a valid email address (e.g., user@example.com or user@gmail.com)'
        } else if (error.message.includes('already registered')) {
          errorMsg = 'This email is already registered. Please try logging in instead.'
        }
        
        alert(errorMsg)
        return // Don't throw, just return to keep form data
      }

      console.log('✅ SIGNUP SUCCESSFUL!')
      console.log('User created:', data?.user?.id)
      console.log('Email:', data?.user?.email)
      console.log('Email confirmed:', data?.user?.email_confirmed_at)
      
      alert('Account created successfully! Please log in.')
      console.log('🔄 Redirecting to /auth/login')
      router.push('/auth/login')
    } catch (error: any) {
      console.error('==========================================')
      console.error('❌ SIGNUP FAILED')
      console.error('==========================================')
      console.error('Error object:', error)
      console.error('Error name:', error?.name)
      console.error('Error message:', error?.message)
      console.error('Error status:', error?.status)
      console.error('Full error:', JSON.stringify(error, null, 2))
      console.error('==========================================')
      alert(error.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
      console.log('🔄 Loading state: false')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="bg-white/90 backdrop-blur-md p-12 rounded-3xl shadow-2xl border-2 border-white/40 w-full max-w-lg relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-gradient-to-tr from-purple-400 to-indigo-600 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg -rotate-3 hover:rotate-3 transition-transform">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 leading-tight">
            Get Started
          </h1>
          <p className="text-gray-600 font-semibold text-lg">Create your account in seconds</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-5 relative z-10">
          <div className="group">
            <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 text-gray-900 font-medium transition-all placeholder:text-gray-400 hover:border-gray-300"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="group">
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                console.log('Email changed:', e.target.value)
                setEmail(e.target.value)
              }}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 text-gray-900 font-medium transition-all placeholder:text-gray-400 hover:border-gray-300"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  console.log('Password changed, length:', e.target.value.length)
                  setPassword(e.target.value)
                }}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 text-gray-900 font-medium transition-all placeholder:text-gray-400 hover:border-gray-300"
                placeholder="••••••••"
                required
                minLength={6}
                style={{ WebkitTextSecurity: 'disc' }}
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">Min. 6 characters</p>
            </div>

            <div className="group">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  console.log('Confirm password changed, length:', e.target.value.length)
                  setConfirmPassword(e.target.value)
                }}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 text-gray-900 font-medium transition-all placeholder:text-gray-400 hover:border-gray-300"
                placeholder="••••••••"
                required
                minLength={6}
                style={{ WebkitTextSecurity: 'disc' }}
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">Must match</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-5 rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group mt-6"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your account...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-semibold">Already a member?</span>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">
            Have an account?{' '}
            <a href="/auth/login" className="text-blue-600 hover:text-indigo-600 font-bold hover:underline transition-colors">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
