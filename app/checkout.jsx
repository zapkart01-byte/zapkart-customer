import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from 'react-native'
import { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, MapPin, Plus, DollarSign, CreditCard, ChevronRight, Check } from 'lucide-react-native'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import { placeOrder, validateCoupon } from '../services/orderService'
import { getPlatformSettings } from '../services/productService'
import { getAddresses } from '../services/addressService'
import { calculateOrderPricing } from '../utils/pricingCalculator'
import { supabase } from '../services/supabase'

export default function CheckoutScreen() {
  const { items, storeId, storeName, clearCart, cartItemsForPricing } = useCartStore()
  const { user } = useAuthStore()
  const params = useLocalSearchParams()
  
  // Address selection
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  
  // Store details for distance calculation
  const [storeCoords, setStoreCoords] = useState(null)
  const [distanceKm, setDistanceKm] = useState(1.5) // Fallback default
  
  // Settings & calculations
  const [settings, setSettings] = useState(null)
  const [pricing, setPricing] = useState(null)
  
  // Coupon
  const [couponCode, setCouponCode] = useState(params.couponCode || '')
  const [couponApplied, setCouponApplied] = useState(null)
  
  // Checkout configurations
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    initializeCheckout()
  }, [])

  // Reload addresses when screen focuses (if navigating back from address addition)
  useEffect(() => {
    const focusInterval = setInterval(() => {
      fetchUserAddresses()
    }, 1500)
    return () => clearInterval(focusInterval)
  }, [])

  useEffect(() => {
    if (selectedAddress && storeCoords) {
      const dist = haversineDistance(
        storeCoords.lat,
        storeCoords.lng,
        selectedAddress.lat,
        selectedAddress.lng
      )
      setDistanceKm(dist)
    }
  }, [selectedAddress, storeCoords])

  useEffect(() => {
    if (settings) {
      calculatePricing()
    }
  }, [items, distanceKm, settings, couponApplied])

  const initializeCheckout = async () => {
    setLoading(true)
    try {
      // 1. Fetch settings, addresses, store coordinates
      const [settingsRes, addrList, storeRes] = await Promise.all([
        getPlatformSettings(),
        getAddresses(),
        supabase.from('stores').select('lat, lng, store_name').eq('id', storeId).single()
      ])

      if (settingsRes.data) setSettings(settingsRes.data)
      setAddresses(addrList || [])
      if (addrList && addrList.length > 0) {
        setSelectedAddress(addrList[0])
      }

      if (storeRes.data) {
        setStoreCoords(storeRes.data)
      }

      // 2. Auto-validate coupon if passed from Cart page
      if (params.couponCode) {
        const couponValRes = await validateCoupon(params.couponCode, items.reduce((s, i) => s + (i.customer_price * i.quantity), 0))
        if (couponValRes.data) {
          setCouponApplied(couponValRes.data)
        }
      }
    } catch (err) {
      console.error('Initialization error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserAddresses = async () => {
    const list = await getAddresses()
    setAddresses(list || [])
    if (list && list.length > 0 && !selectedAddress) {
      setSelectedAddress(list[0])
    }
  }

  const calculatePricing = () => {
    const calculatorItems = cartItemsForPricing()
    if (calculatorItems.length === 0) return
    const result = calculateOrderPricing(calculatorItems, distanceKm, settings, couponApplied)
    setPricing(result)
  }

  // Haversine formula to compute exact distance between store and delivery address
  function haversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5
    const R = 6371 // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const d = R * c
    return Number(Math.max(0.1, Number(d.toFixed(2))))
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Missing Address', 'Please select or add a delivery address.')
      return
    }

    if (!pricing) return

    setSubmitting(true)

    try {
      const orderPayload = {
        storeId,
        distanceKm,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        deliveryAddress: {
          fullAddress: selectedAddress.fullAddress,
          landmark: selectedAddress.landmark || '',
          phone: user?.phone || '+91XXXXXXXXXX',
          lat: selectedAddress.lat,
          lng: selectedAddress.lng
        },
        payment_method: paymentMethod,
        couponCode: couponApplied?.code || undefined
      }

      const { data, error } = await placeOrder(orderPayload)

      if (error) {
        Alert.alert('Order Placement Failed', error)
        setSubmitting(false)
        return
      }

      if (data && data.order) {
        const backendTotal = Math.round(Number(data.order.total))
        const clientTotal = Math.round(pricing.finalCustomerPays)

        // Rule 66 / CHECKOUT verify totals match
        if (backendTotal !== clientTotal) {
          Alert.alert(
            'Pricing Mismatch',
            `Calculated checkout total (₹${clientTotal}) does not match server (₹${backendTotal}). Order aborted.`,
            [{ text: 'OK' }]
          )
          setSubmitting(false)
          return
        }

        // Success - clear cart and route to order success screen
        const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
        const itemCountStr = `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}`
        
        clearCart()
        setSubmitting(false)
        router.replace({
          pathname: '/order-success',
          params: {
            orderId: data.order.id,
            deliveryTime: '30-40 mins',
            total: backendTotal,
            itemCount: itemCountStr,
            paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'
          }
        })
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to place your order. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Configuring checkout...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft color="#0D0D0D" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Saved Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity 
              style={styles.addAddrBtn}
              onPress={() => router.push('/address/add')}
              activeOpacity={0.8}
            >
              <Plus color="#FF6B00" size={16} />
              <Text style={styles.addAddrText}>Add New</Text>
            </TouchableOpacity>
          </View>
          
          {addresses.length === 0 ? (
            <View style={styles.emptyAddressCard}>
              <MapPin color="#EF4444" size={24} />
              <Text style={styles.emptyAddressText}>No saved addresses found. Please add a delivery address to place your order.</Text>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((item) => {
                const isSelected = selectedAddress?.id === item.id
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.addressCard, isSelected ? styles.selectedCard : null]}
                    onPress={() => setSelectedAddress(item)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.radio}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLabel}>{item.label}</Text>
                      <Text style={styles.addressText}>{item.fullAddress}</Text>
                      {!!item.landmark && (
                        <Text style={styles.landmarkText}>Landmark: {item.landmark}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        {/* Order Items Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items from {storeName}</Text>
          <View style={styles.card}>
            {items.map((item, index) => (
              <View key={item.id}>
                <View style={styles.orderItem}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.checkoutItemImage} />
                  ) : (
                    <Text style={styles.itemEmoji}>{item.emoji || '📦'}</Text>
                  )}
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemQty}>{item.quantity} x {item.unit}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.customer_price * item.quantity}</Text>
                </View>
                {index < items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.card}>
            
            {/* Cash on Delivery */}
            <TouchableOpacity
              style={styles.paymentRow}
              onPress={() => setPaymentMethod('cod')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentIcon}>💵</Text>
                <View>
                  <Text style={styles.paymentLabelText}>Cash on Delivery</Text>
                  <Text style={styles.paymentSubtext}>Pay cash or scan QR code at delivery</Text>
                </View>
              </View>
              <View style={styles.radio}>
                {paymentMethod === 'cod' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* UPI Payment */}
            <TouchableOpacity
              style={styles.paymentRow}
              onPress={() => setPaymentMethod('upi')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentIcon}>📱</Text>
                <View>
                  <Text style={styles.paymentLabelText}>UPI Payment</Text>
                  <Text style={styles.paymentSubtext}>Pay instantly via GPay, PhonePe, Paytm</Text>
                </View>
              </View>
              <View style={styles.radio}>
                {paymentMethod === 'upi' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Bill Details */}
        {pricing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
            <View style={styles.card}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Subtotal</Text>
                <Text style={styles.billVal}>₹{pricing.cartValue}</Text>
              </View>
              {pricing.discountAmount > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coupon Discount</Text>
                  <Text style={[styles.billVal, styles.greenText]}>-₹{pricing.discountAmount}</Text>
                </View>
              )}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee ({distanceKm} km)</Text>
                <Text style={styles.billVal}>
                  {pricing.isFreeDelivery ? (
                    <Text style={styles.greenText}>FREE</Text>
                  ) : (
                    `₹${pricing.deliveryFee}`
                  )}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.billRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalVal}>₹{pricing.finalCustomerPays}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order CTA Bar */}
      {pricing && (
        <View style={styles.footerBar}>
          <View>
            <Text style={styles.footerTotal}>₹{pricing.finalCustomerPays}</Text>
            <Text style={styles.footerSub}>Payable via {paymentMethod === 'cod' ? 'Cash' : 'UPI'}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.placeOrderBtn,
              (!selectedAddress || submitting) && styles.disabledPlaceOrderBtn
            ]}
            onPress={handlePlaceOrder}
            disabled={!selectedAddress || submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>Place Order</Text>
                <ChevronRight color="#FFFFFF" size={18} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    height: 96,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
    marginLeft: 12,
  },
  scrollContent: {
    paddingTop: 12,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addAddrText: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyAddressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyAddressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCard: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF0E6',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '750',
    color: '#0D0D0D',
    marginBottom: 3,
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  landmarkText: {
    fontSize: 11,
    color: '#FF6B00',
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  checkoutItemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  itemQty: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentIcon: {
    fontSize: 24,
  },
  paymentLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  paymentSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D0D0D',
  },
  greenText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B00',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 10,
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  footerSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 20,
    gap: 4,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledPlaceOrderBtn: {
    backgroundColor: '#E9ECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
})
