'use client'

import { useUserStore } from '@/store/userStore'
import { login } from '@/services/authService'

export function useAuth() {
  const { user, setUser, updateCredits, updateSubscription, clearUser, setLoading } = useUserStore()

  const refreshUserData = async () => {
    if (!user?.googleId) return
    
    try {
      setLoading(true)
      const response = await login({
        email: user.email!,
        name: user.name!,
        sub: user.googleId
      })
      
      setUser({
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        credits: response.data.credits,
        subscriptionStatus: response.data.subscriptionStatus as 'free' | 'premium' | 'pro'
      })
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const useCredits = async (amount: number = 1) => {
    if (!user?.googleId || user.credits < amount) {
      throw new Error('Insufficient credits')
    }
    
    const newCredits = user.credits - amount
    updateCredits(newCredits)
    
    // Optionally sync with backend
    await refreshUserData()
  }

  return {
    user,
    refreshUserData,
    useCredits,
    updateCredits,
    updateSubscription,
    clearUser,
    isLoggedIn: !!user?.googleId
  }
}