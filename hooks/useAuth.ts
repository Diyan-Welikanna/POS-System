import { useAuth } from '@/context/AuthContext'

export function useRole() {
  const { profile } = useAuth()

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager' || isAdmin
  const isCashier = profile?.role === 'cashier' || isManager

  const hasRole = (roles: string[]) => {
    return profile?.role ? roles.includes(profile.role) : false
  }

  return {
    role: profile?.role,
    isAdmin,
    isManager,
    isCashier,
    hasRole,
  }
}
