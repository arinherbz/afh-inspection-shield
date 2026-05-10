import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const checkSessionTimeout = useCallback(() => {
    const now = Date.now()
    if (session && now - lastActivity > SESSION_TIMEOUT) {
      signOut()
      toast.error('Session expired due to inactivity. Please log in again.')
    }
    setLastActivity(now)
  }, [session, lastActivity])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLastActivity(Date.now())
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLastActivity(Date.now())
        setLoading(false)

        if (event === 'SIGNED_IN') {
          toast.success('Welcome back!')
        } else if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully')
        }
      }
    )

    // Track user activity for session timeout
    const handleActivity = () => setLastActivity(Date.now())
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)

    // Check for session timeout periodically
    const interval = setInterval(checkSessionTimeout, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      clearInterval(interval)
    }
  }, [checkSessionTimeout])

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setLastActivity(Date.now())
      return data
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const signUp = async (email, password, options = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      })
      if (error) throw error
      toast.success('Sign up successful! Please check your email to confirm your account.')
      return data
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully!')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const sendMagicLink = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      toast.success('Magic link sent! Check your email.')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    sendMagicLink,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
