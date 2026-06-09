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
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, otp, userType: 'customer' })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Invalid OTP')
    await AsyncStorage.setItem('auth_token', data.token)
    return { success: true, token: data.token, user: data.user, isNew: data.isNew }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Get stored auth token
export async function getToken() {
  return await AsyncStorage.getItem('auth_token')
}

// Logout
export async function logout() {
  await AsyncStorage.removeItem('auth_token')
  await AsyncStorage.removeItem('user_data')
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