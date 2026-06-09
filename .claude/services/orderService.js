// Order creation and management
import { supabase } from './supabase'
import { getToken } from './authService'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Place a new order
export async function placeOrder(orderData) {
  try {
    const token = await getToken()
    const response = await fetch(`${API_URL}/orders`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to place order')
    return { data, error: null }
  } catch (error) {
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