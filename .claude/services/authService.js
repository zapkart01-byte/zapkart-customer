// Authentication via 2Factor.in OTP through backend
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Send OTP to phone number
export async function sendOTP(phone) {
  try {
    console.log('sendOTP called with:', phone)
    console.log('API_URL:', API_URL)
    
    if (!API_URL) {
      throw new Error('API_URL is not configured. Check your .env file.')
    }

    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, userType: 'customer' })
    })
    
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)
    
    if (!response.ok) throw new Error(data.error || 'Failed to send OTP')
    return { success: true }
  } catch (error) {
    console.error('sendOTP error:', error)
    return { success: false, error: error.message }
  }
}

// Verify OTP and get session token
export async function verifyOTP(phone, otp) {
  try {
    console.log('🔐 verifyOTP called')
    console.log('📞 Phone:', phone)
    console.log('🔢 OTP:', otp)
    
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, otp, userType: 'customer' })
    })
    
    console.log('📨 Response status:', response.status)
    
    const data = await response.json()
    console.log('📨 Response data:', data)
    
    if (!response.ok) throw new Error(data.error || 'Invalid OTP')
    
    // Save token to AsyncStorage
    console.log('💾 Saving token to AsyncStorage...')
    await AsyncStorage.setItem('auth_token', data.token)
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user))
    
    // Also save to web localStorage if available (web compatibility)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        console.log('💾 Also saving to localStorage (web)...')
        const authData = {
          state: {
            user: data.user,
            token: data.token
          },
          version: 0
        }
        window.localStorage.setItem('auth-storage', JSON.stringify(authData))
      } catch (webError) {
        console.error('⚠️ localStorage save failed:', webError.message)
      }
    }
    
    // Verify it was saved
    const savedToken = await AsyncStorage.getItem('auth_token')
    console.log('✅ Token saved to AsyncStorage:', savedToken ? 'YES' : 'NO')
    
    if (!savedToken) {
      console.error('❌ Token was NOT saved to AsyncStorage!')
    }
    
    return { success: true, token: data.token, user: data.user, isNew: data.isNew }
  } catch (error) {
    console.error('💥 verifyOTP error:', error)
    return { success: false, error: error.message }
  }
}

// Get stored auth token with platform-specific fallbacks
export async function getToken() {
  try {
    console.log('📖 getToken called')
    
    // Strategy 1: Try AsyncStorage (works on native)
    const asyncToken = await AsyncStorage.getItem('auth_token')
    console.log('🔑 AsyncStorage token:', asyncToken ? `${asyncToken.substring(0, 30)}...` : 'NULL')
    
    if (asyncToken) {
      return asyncToken
    }
    
    // Strategy 2: Try Zustand store (persists better on web)
    try {
      // Direct import works better than dynamic import
      const useAuthStore = require('../store/authStore').default
      const storeToken = useAuthStore.getState().token
      console.log('🔑 Zustand store token:', storeToken ? `${storeToken.substring(0, 30)}...` : 'NULL')
      
      if (storeToken) {
        // Sync back to AsyncStorage for next time
        await AsyncStorage.setItem('auth_token', storeToken)
        return storeToken
      }
    } catch (storeError) {
      console.error('⚠️ Could not access Zustand store:', storeError.message)
    }
    
    // Strategy 3: Web-specific localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const authStorage = window.localStorage.getItem('auth-storage')
        if (authStorage) {
          const parsed = JSON.parse(authStorage)
          const webToken = parsed?.state?.token
          console.log('🔑 localStorage token:', webToken ? `${webToken.substring(0, 30)}...` : 'NULL')
          
          if (webToken) {
            // Sync to AsyncStorage
            await AsyncStorage.setItem('auth_token', webToken)
            return webToken
          }
        }
      } catch (webError) {
        console.error('⚠️ localStorage parse error:', webError.message)
      }
    }
    
    console.warn('❌ NO TOKEN FOUND IN ANY STORAGE!')
    console.warn('⚠️ User must login again')
    console.warn('💡 TIP: If on web, try testing on native app (Expo Go)')
    return null
    
  } catch (error) {
    console.error('💥 getToken error:', error)
    return null
  }
}

// Logout - Clear all local data across all storage mechanisms
export async function logout() {
  try {
    console.log('🚪 Logout called')
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('user_data')
    await AsyncStorage.removeItem('cart-storage')
    await AsyncStorage.removeItem('auth-storage')
    console.log('✅ AsyncStorage cleared')
    
    // Clear web localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('auth-storage')
        window.localStorage.removeItem('auth_token')
        window.localStorage.removeItem('user_data')
        window.localStorage.removeItem('cart-storage')
        console.log('✅ localStorage cleared')
      } catch (webError) {
        console.error('⚠️ localStorage clear failed:', webError.message)
      }
    }
    
    // Clear Zustand store
    try {
      const useAuthStore = require('../store/authStore').default
      useAuthStore.getState().clearUser()
      console.log('✅ Zustand store cleared')
    } catch (storeError) {
      console.error('⚠️ Zustand clear failed:', storeError.message)
    }
    
    console.log('✅ Logout successful - all data cleared')
    return { success: true }
  } catch (error) {
    console.error('💥 Logout error:', error)
    // Still return success as we want to logout even if clearing fails
    return { success: true }
  }
}

// Check if user is logged in
export async function getStoredUser() {
  const userData = await AsyncStorage.getItem('user_data')
  return userData ? JSON.parse(userData) : null
}

// Save user data locally
export async function saveUser(user) {
  await AsyncStorage.setItem('user_data', JSON.stringify(user))
}