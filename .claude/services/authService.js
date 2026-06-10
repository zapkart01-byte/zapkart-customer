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
    
    // Verify it was saved
    const savedToken = await AsyncStorage.getItem('auth_token')
    console.log('✅ Token saved:', savedToken ? 'YES' : 'NO')
    
    if (!savedToken) {
      console.error('❌ Token was NOT saved to AsyncStorage!')
    }
    
    return { success: true, token: data.token, user: data.user, isNew: data.isNew }
  } catch (error) {
    console.error('💥 verifyOTP error:', error)
    return { success: false, error: error.message }
  }
}

// Get stored auth token
export async function getToken() {
  try {
    console.log('📖 getToken called')
    
    // Try AsyncStorage first
    const token = await AsyncStorage.getItem('auth_token')
    console.log('🔑 Token from AsyncStorage:', token ? `${token.substring(0, 30)}...` : 'NULL')
    
    if (token) {
      return token
    }
    
    // Fallback: Try to get from authStore (for web compatibility)
    try {
      const { default: useAuthStore } = await import('../store/authStore')
      const storeToken = useAuthStore.getState().token
      console.log('🔑 Token from authStore:', storeToken ? `${storeToken.substring(0, 30)}...` : 'NULL')
      
      if (storeToken) {
        // Save back to AsyncStorage for next time
        await AsyncStorage.setItem('auth_token', storeToken)
        return storeToken
      }
    } catch (storeError) {
      console.error('⚠️ Could not access authStore:', storeError.message)
    }
    
    console.warn('⚠️ No token found anywhere!')
    console.warn('⚠️ User needs to login')
    return null
    
  } catch (error) {
    console.error('💥 getToken error:', error)
    return null
  }
}

// Logout - Clear all local data
export async function logout() {
  try {
    // Clear authentication data
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('user_data')
    
    // Clear cart data
    await AsyncStorage.removeItem('cart-storage')
    
    console.log('Logout successful - all data cleared')
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
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