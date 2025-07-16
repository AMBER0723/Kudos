// hooks/useAuth.ts

import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  organization_id: string
  position: string
  is_admin: boolean
  created_at: string
  organization?: {
    id: string
    name: string
    short_code: string
    color: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`*, organization:organizations (id, name, short_code, color) `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }


  useEffect(() => {
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const isExpired = session?.expires_at && session.expires_at * 1000 < Date.now()

      if (isExpired) {
        console.warn('Session expired on load. Signing out.')
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setLoading(false)
        navigate('/auth')
        return
      }

      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).finally(() => setLoading(false))
        if (location.pathname === '/auth') {
          navigate('/feed')
        }
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
        if (location.pathname !== '/auth') {
          navigate('/auth')
        }
      }
    }

    restoreSession()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // console.log('Auth state changed:', event)

      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)

      if (event === 'SIGNED_IN') {
        // console.log('➡️ Signed in - Navigating to /feed')
        navigate('/', { replace: true })
      }

      if (event === 'SIGNED_OUT') {
        // console.log('➡️ Signed out - Navigating to /auth')
        navigate('/auth', { replace: true })
      }

      if (event === 'INITIAL_SESSION') {
        // Don't navigate here. Just set session.
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])


  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      // console.log('Sign in response:', { data, error })
      if (error || !data?.session?.user?.email_confirmed_at) {
        return {
          data: null,
          error: { message: error?.message || 'An unexpected error occurred' },
        }
      }

      return { data, error }
    } finally {
      setLoading(false)
    }
  }

  

  // const signUpWithEmail = async (
  //   email: string,
  //   password: string,
  //   userData: {
  //     full_name: string
  //     organization_id: string
  //     position: string
  //   }
  // ) => {
  //   try {
  //     setLoading(true)
  //     const { data, error } = await supabase.auth.signUp({ email, password })
  //     // console.log('Sign up response:', { data, error })
  //     if (!error && data.user) {
  //       localStorage.setItem('user_profile_draft', JSON.stringify(userData))
  //     }
  //     return { data, error }
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const signUpWithEmail = async (
  email: string,
  password: string,
  userData: {
    full_name: string
    organization_id: string
    position: string
  }
) => {
  try {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          organization_id: userData.organization_id,
          position: userData.position,
        },
      },
    })

    // Optional: keep the localStorage backup
    if (!error && data.user) {
      localStorage.setItem('user_profile_draft', JSON.stringify(userData))
    }

    return { data, error }
  } finally {
    setLoading(false)
  }
}


  const signOut = async () => {
    try {
      setLoading(true)
      // console.log('Current user before sign out:', user)

      if (!user) {
        console.warn('No user is currently signed in.')
        return { error: { message: 'No user is currently signed in.' } }
      }

      // Await the sign out call and log the response
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error }
      } else {
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      return { error: { message: 'Unexpected error during sign out' } }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`*, organization:organizations (id, name, short_code, color) `)
      .eq('id', user?.id)
      .single()

    if (error) {
      console.error('Failed to refresh profile', error)
    } else {
      setProfile(data)
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    refreshProfile,
    signOut,
  }
}
