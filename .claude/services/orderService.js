// Order creation and management
import { supabase } from './supabase'
import { getToken } from './authService'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Place a new order
export async function placeOrder(orderData) {
  try {
    console.log('🚀 placeOrder called')
    console.log('📍 API_URL:', API_URL)
    
    const token = await getToken()
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN!')
    
    if (!token) {
      throw new Error('Authentication token missing. Please login again.')
    }
    
    if (!API_URL) {
      throw new Error('API URL not configured. Check .env file.')
    }
    
    console.log('📦 Order data:', JSON.stringify(orderData, null, 2))
    console.log('🌐 Calling:', `${API_URL}/orders`)
    
    const response = await fetch(`${API_URL}/orders`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    })
    
    console.log('📨 Response status:', response.status)
    console.log('📨 Response OK:', response.ok)
    
    const data = await response.json()
    console.log('📨 Response data:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      const errorMsg = data.error || data.message || 'Failed to place order'
      console.error('❌ Order failed:', errorMsg)
      throw new Error(errorMsg)
    }
    
    console.log('✅ Order placed successfully!')
    return { data, error: null }
  } catch (error) {
    console.error('💥 placeOrder error:', error)
    console.error('💥 Error message:', error.message)
    console.error('💥 Error stack:', error.stack)
    return { data: null, error: error.message }
  }
}

// Get customer order history
export async function getMyOrders(customerId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores (store_name),
        riders (name, phone)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Get single order with full details
export async function getOrderById(orderId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores (store_name, address, lat, lng),
        riders (name, phone, rating)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Subscribe to order status changes (Realtime)
export function subscribeToOrder(orderId, callback) {
  return supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'orders',
      filter: `id=eq.${orderId}`
    }, (payload) => callback(payload.new))
    .subscribe()
}

// Validate coupon code
export async function validateCoupon(code, cartValue) {
  try {
    const token = await getToken()
    const response = await fetch(`${API_URL}/offers/validate`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code, cartValue })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Invalid coupon')
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}