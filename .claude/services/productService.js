// Product fetching and search operations
import { supabase } from './supabase'

// Get all active products with customer pricing applied
export async function getProducts(categoryId = null) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories (id, name, emoji, commission_rate),
        stores!inner (id, store_name, status, is_open)
      `)
      .eq('is_active', true)
      .eq('stores.status', 'active')
      .gt('stock', 0)
      .order('units_sold_total', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Get product variants (same group)
export async function getProductVariants(productGroupId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_group_id', productGroupId)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('variant_label')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Get single product by ID
export async function getProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, commission_rate)')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Get active categories
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Get active banners
export async function getBanners() {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('sort_order')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Get platform settings (for pricing)
export async function getPlatformSettings() {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

// Calculate customer price with markup applied
export function getCustomerPrice(storePrice, platformMrp, markupPerItem = 1) {
  return Math.min(storePrice + markupPerItem, platformMrp)
}

// Calculate discount percentage for customer display
export function getDiscountPct(customerPrice, platformMrp) {
  if (customerPrice >= platformMrp) return 0
  return Math.round(((platformMrp - customerPrice) / platformMrp) * 100)
}
