import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const HomeContext = createContext({})

export const useHome = () => useContext(HomeContext)

export function HomeProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [staffRole, setStaffRole] = useState(null)

  const fetchHomeData = useCallback(async () => {
    if (!user) {
      setHome(null)
      setStaffRole(null)
      setLoading(false)
      return
    }

    try {
      const { data: homeData, error: homeError } = await supabase
        .from('homes')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (homeError && homeError.code !== 'PGRST116') throw homeError

      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (staffError && staffError.code !== 'PGRST116') throw staffError

      if (staffData && !homeData) {
        const { data: staffHome } = await supabase
          .from('homes')
          .select('*')
          .eq('id', staffData.home_id)
          .single()
        setHome(staffHome)
        setStaffRole(staffData.role)
      } else {
        setHome(homeData)
        setStaffRole(staffData?.role || 'owner')
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
      toast.error('Failed to load home data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchHomeData()
    } else {
      setHome(null)
      setStaffRole(null)
      setLoading(false)
    }
  }, [isAuthenticated, fetchHomeData])

  const updateHome = async (updates) => {
    if (!home) return
    try {
      const { error } = await supabase.from('homes').update(updates).eq('id', home.id)
      if (error) throw error
      setHome(prev => ({ ...prev, ...updates }))
      toast.success('Home updated successfully')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const hasPermission = useCallback((requiredRole) => {
    const roleHierarchy = { owner: 4, manager: 3, nurse: 2, caregiver: 1 }
    return (roleHierarchy[staffRole] || 0) >= (roleHierarchy[requiredRole] || 0)
  }, [staffRole])

  const value = {
    home, loading, staffRole, updateHome, hasPermission, refreshHome: fetchHomeData,
    isOwner: staffRole === 'owner',
    isManager: staffRole === 'manager' || staffRole === 'owner',
    isCaregiver: staffRole === 'caregiver',
    isNurse: staffRole === 'nurse' || staffRole === 'manager' || staffRole === 'owner',
  }

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>
}

export default HomeContext