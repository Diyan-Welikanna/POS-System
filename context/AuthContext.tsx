'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
  full_name: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle infinite recursion error - use fallback profile
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn('⚠️ RLS policy issue detected. Using fallback profile. Please run fix_infinite_recursion.sql in Supabase!');
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Create a temporary profile from user data without saving to DB
            const fallbackProfile = {
              id: user.id,
              email: user.email!,
              role: 'cashier' as const,
              full_name: user.user_metadata?.full_name || null,
            }
            setProfile(fallbackProfile)
            console.log('✅ Using fallback profile:', fallbackProfile)
          }
        }
        // If profile doesn't exist, create it from auth user data
        else if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile...')
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const newProfile = {
              id: user.id,
              email: user.email!,
              role: 'cashier' as const,
              full_name: user.user_metadata?.full_name || null,
            }
            
            const { data: createdProfile, error: createError } = await (supabase as any)
              .from('profiles')
              .insert([newProfile])
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating profile:', createError)
              // Use fallback even if insert fails
              setProfile(newProfile)
            } else {
              console.log('✅ Profile created successfully')
              setProfile(createdProfile)
            }
          }
        } else {
          throw error
        }
      } else {
        setProfile(data)
        console.log('✅ Profile loaded successfully')
      }
    } catch (error: any) {
      console.error('❌ ERROR FETCHING PROFILE:', error?.message || error);
      
      // Create fallback profile to allow app to work
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fallbackProfile = {
          id: user.id,
          email: user.email!,
          role: 'cashier' as const,
          full_name: user.user_metadata?.full_name || 'User',
        }
        setProfile(fallbackProfile)
        console.warn('⚠️ Using fallback profile. Please fix database RLS policies!')
      }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    router.push('/')
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    router.push('/auth/login')
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/auth/login')
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
