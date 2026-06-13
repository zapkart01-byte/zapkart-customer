import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  try {
    return decodeURIComponent(escape(atobPolyfill(base64)))
  } catch {
    return atobPolyfill(base64)
  }
}

function atobPolyfill(input) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let output = ''
  let chr1, chr2, chr3
  let enc1, enc2, enc3, enc4
  let i = 0
  input = input.replace(/[^A-Za-z0-9+/=]/g, '')
  while (i < input.length) {
    enc1 = chars.indexOf(input.charAt(i++))
    enc2 = chars.indexOf(input.charAt(i++))
    enc3 = chars.indexOf(input.charAt(i++))
    enc4 = chars.indexOf(input.charAt(i++))
    chr1 = (enc1 << 2) | (enc2 >> 4)
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    chr3 = ((enc3 & 3) << 6) | enc4
    output += String.fromCharCode(chr1)
    if (enc3 !== 64) output += String.fromCharCode(chr2)
    if (enc4 !== 64) output += String.fromCharCode(chr3)
  }
  return output
}

function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    const exp = payload.exp * 1000
    return Date.now() >= exp - 60000
  } catch {
    return true
  }
}

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
    
    const tokens = data.tokens || data.session
    const accessToken = tokens?.access_token || data.token
    const refreshToken = tokens?.refresh_token
    const user = data.user
    const isNew = data.isNewUser || false
    
    if (!accessToken) {
      throw new Error('No access token received from server')
    }
    
    // Save tokens to AsyncStorage
    await AsyncStorage.setItem('auth_token', accessToken)
    if (refreshToken) {
      await AsyncStorage.setItem('refresh_token', refreshToken)
    }
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

// Get stored auth token (with auto-refresh if expired)
export async function getToken() {
  try {
    let asyncToken = await AsyncStorage.getItem('auth_token')
    
    if (asyncToken && !isTokenExpired(asyncToken)) {
      return asyncToken
    }
    
    if (asyncToken && isTokenExpired(asyncToken)) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return refreshed
    }
    
    try {
      const useAuthStore = require('../store/authStore').default
      const storeToken = useAuthStore.getState().token
      if (storeToken && !isTokenExpired(storeToken)) {
        await AsyncStorage.setItem('auth_token', storeToken)
        return storeToken
      }
      if (storeToken && isTokenExpired(storeToken)) {
        const refreshed = await refreshAccessToken()
        if (refreshed) return refreshed
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

async function refreshAccessToken() {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token')
    if (!refreshToken) {
      console.warn('No refresh token available')
      return null
    }
    
    const response = await fetch(`${API_URL}/auth/mobile/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    
    const data = await response.json()
    if (!response.ok) {
      console.error('Token refresh failed:', data.message || data.error)
      await clearAuthTokens()
      return null
    }
    
    const newAccessToken = data.session?.access_token || data.tokens?.access_token
    const newRefreshToken = data.session?.refresh_token || data.tokens?.refresh_token
    
    if (!newAccessToken) {
      console.error('No new access token in refresh response')
      await clearAuthTokens()
      return null
    }
    
    await AsyncStorage.setItem('auth_token', newAccessToken)
    if (newRefreshToken) {
      await AsyncStorage.setItem('refresh_token', newRefreshToken)
    }
    
    try {
      const useAuthStore = require('../store/authStore').default
      const user = useAuthStore.getState().user
      useAuthStore.getState().setUser(user, newAccessToken)
    } catch (storeError) {
      console.error('Could not sync Zustand store:', storeError.message)
    }
    
    console.log('Token refreshed successfully')
    return newAccessToken
  } catch (error) {
    console.error('refreshAccessToken error:', error)
    await clearAuthTokens()
    return null
  }
}

async function clearAuthTokens() {
  await AsyncStorage.removeItem('auth_token')
  await AsyncStorage.removeItem('refresh_token')
  try {
    const useAuthStore = require('../store/authStore').default
    useAuthStore.getState().clearUser()
  } catch (storeError) {
    // Ignored
  }
}

// Logout - Clear all local data
export async function logout() {
  try {
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('refresh_token')
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
