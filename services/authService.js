import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Send OTP to phone number
export async function sendOTP(phone) {
  try {
    console.log('sendOTP called with:', phone)
    if (!API_URL) {
      throw new Error('API_URL is not configured. Check your .env file.')
    }

    const response = await fetch(`${API_URL}/auth/mobile/send-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone })
    })
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || data.error || 'Failed to send OTP')
    return { success: true }
  } catch (error) {
    console.error('sendOTP error:', error)
    return { success: false, error: error.message }
  }
}

// Verify OTP and get session token
export async function verifyOTP(phone, otp) {
  try {
    console.log('verifyOTP called')
    const response = await fetch(`${API_URL}/auth/mobile/verify-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, otp })
    })
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || data.error || 'Invalid OTP')
    
    const accessToken = data.tokens?.access_token || data.token
    const user = data.user
    const isNew = data.isNewUser || false
    
    if (!accessToken) {
      throw new Error('No access token received from server')
    }
    
    // Save token to AsyncStorage
    await AsyncStorage.setItem('auth_token', accessToken)
    await AsyncStorage.setItem('user_data', JSON.stringify(user))
    
    // Sync to Zustand store if it exists
    try {
      const useAuthStore = require('../store/authStore').default
      useAuthStore.getState().setUser(user, accessToken)
    } catch (storeError) {
      console.error('Could not sync Zustand store:', storeError.message)
    }
    
    return { success: true, token: accessToken, user: user, isNew: isNew }
  } catch (error) {
    console.error('verifyOTP error:', error)
    return { success: false, error: error.message }
  }
}

// Get stored auth token
export async function getToken() {
  try {
    const asyncToken = await AsyncStorage.getItem('auth_token')
    if (asyncToken) return asyncToken
    
    try {
      const useAuthStore = require('../store/authStore').default
      const storeToken = useAuthStore.getState().token
      if (storeToken) {
        await AsyncStorage.setItem('auth_token', storeToken)
        return storeToken
      }
    } catch (storeError) {
      // Ignored
    }
    return null
  } catch (error) {
    console.error('getToken error:', error)
    return null
  }
}

// Logout - Clear all local data
export async function logout() {
  try {
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('user_data')
    await AsyncStorage.removeItem('cart-storage')
    await AsyncStorage.removeItem('auth-storage')
    
    try {
      const useAuthStore = require('../store/authStore').default
      useAuthStore.getState().clearUser()
    } catch (storeError) {
      // Ignored
    }
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
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
