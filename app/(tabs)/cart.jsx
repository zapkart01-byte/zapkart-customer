import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator, Dimensions, Image
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { ShoppingCart, Trash2, Tag, ChevronRight, Plus, Minus, Info } from 'lucide-react-native'
import useCartStore from '../../store/cartStore'
import { calculateOrderPricing } from '../../utils/pricingCalculator'
import { getPlatformSettings, getActiveOffers } from '../../services/productService'
import { validateCoupon } from '../../services/orderService'
import EmptyState from '../../components/ui/EmptyState'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function CartScreen() {
  const { items, updateQuantity, removeItem, cartItemsForPricing } = useCartStore()
  const [settings, setSettings] = useState(null)
  const [pricing, setPricing] = useState(null)
  
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (settings) {
      calculatePricing()
    }
  }, [items, settings, couponApplied])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data } = await getPlatformSettings()
      if (data) {
        setSettings(data)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculatePricing = () => {
    const cartItems = cartItemsForPricing()
    if (cartItems.length === 0) {
      setPricing(null)
      return
    }
    // We pass 1.5km as the mock default distance for local estimation on cart screen
    const result = calculateOrderPricing(cartItems, 1.5, settings, couponApplied)
    setPricing(result)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !pricing) return
    setCouponLoading(true)
    
    try {
      const { data, error } = await validateCoupon(couponCode, pricing.cartValue)
      if (data) {
        setCouponApplied(data)
        Alert.alert('Success', `Coupon ${couponCode.toUpperCase()} applied successfully!`)
      } else {
        Alert.alert('Invalid Coupon', error || 'Failed to validate coupon code')
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred during coupon validation')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponApplied(null)
    setCouponCode('')
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading cart settings...</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Your cart is empty"
        description="Browse our fresh groceries and snacks to place your first order!"
        actionText="Start Shopping"
        onAction={() => router.push('/(tabs)')}
      />
    )
  }

  const finalTotal = pricing ? pricing.finalCustomerPays : 0
  const toFreeDelivery = pricing ? pricing.amountToFreeDelivery : 0
  const freeThreshold = settings?.free_delivery_above || 499

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Cart</Text>
        <Text style={styles.itemCount}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Free Delivery Banner */}
        {pricing && (
          <View style={styles.deliveryProgressCard}>
            {toFreeDelivery > 0 ? (
              <View>
                <Text style={styles.deliveryProgressText}>
                  Add <Text style={styles.boldText}>₹{Math.ceil(toFreeDelivery)}</Text> more for <Text style={styles.greenText}>FREE delivery</Text>
                </Text>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, (pricing.cartValue / freeThreshold) * 100)}%` }
                    ]} 
                  />
                </View>
              </View>
            ) : (
              <View style={styles.freeDeliveryUnlocked}>
                <Text style={styles.freeDeliveryUnlockedText}>🎉 Your order qualifies for FREE delivery!</Text>
              </View>
            )}
          </View>
        )}

        {/* Cart Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Selected Items</Text>
          {items.map((item, index) => {
            const hasDiscount = item.discount_pct > 0
            return (
              <View key={item.id}>
                <View style={styles.itemRow}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.cartProductImage} />
                  ) : (
                    <Text style={styles.itemEmoji}>{item.emoji || '📦'}</Text>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemUnit}>{item.unit}</Text>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>₹{item.customer_price}</Text>
                      {hasDiscount && (
                        <Text style={styles.itemOriginalPrice}>₹{Math.min(item.store_price + 1, item.platform_mrp)}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      activeOpacity={0.7}
                    >
                      <Minus color="#FF6B00" size={16} />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      activeOpacity={0.7}
                    >
                      <Plus color="#FF6B00" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
                {index < items.length - 1 && <View style={styles.divider} />}
              </View>
            )
          })}
        </View>

        {/* Coupon Code Section */}
        <View style={styles.couponContainer}>
          <View style={styles.couponInputRow}>
            <Tag color="#FF6B00" size={20} />
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code (e.g. FIRST50)"
              placeholderTextColor="#6B7280"
              value={couponCode}
              onChangeText={(txt) => setCouponCode(txt.toUpperCase())}
              autoCapitalize="characters"
              editable={!couponApplied}
            />
            {couponApplied ? (
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                {couponLoading ? (
                  <ActivityIndicator size="small" color="#FF6B00" />
                ) : (
                  <Text style={[styles.applyText, !couponCode.trim() && styles.disabledApply]}>Apply</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {couponApplied && (
            <View style={styles.couponAppliedBadge}>
              <Text style={styles.couponAppliedBadgeText}>
                🎉 {couponApplied.code} applied! Saving ₹{couponApplied.discountAmount}
              </Text>
            </View>
          )}
        </View>

        {/* Bill Details Breakdown */}
        {pricing && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{pricing.cartValue}</Text>
            </View>
            
            {pricing.discountAmount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Coupon Discount</Text>
                <Text style={[styles.billValue, styles.greenText]}>-₹{pricing.discountAmount}</Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>
                {pricing.isFreeDelivery ? (
                  <Text style={styles.greenText}>FREE</Text>
                ) : (
                  `₹${pricing.deliveryFee}`
                )}
              </Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{pricing.finalCustomerPays}</Text>
            </View>
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info color="#6B7280" size={16} />
          <Text style={styles.infoBannerText}>
            Our delivery partners are sanitized regularly. Delivery fee varies with distance and order values.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Checkout Bar */}
      {pricing && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutTotal}>₹{pricing.finalCustomerPays}</Text>
            <Text style={styles.checkoutSubText}>Incl. taxes & delivery</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push('/checkout')}
            activeOpacity={0.9}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Surface background
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
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  itemCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 12,
  },
  deliveryProgressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  deliveryProgressText: {
    fontSize: 13,
    color: '#0D0D0D',
    marginBottom: 10,
  },
  boldText: {
    fontWeight: '700',
  },
  greenText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 3,
  },
  freeDeliveryUnlocked: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeDeliveryUnlockedText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cartProductImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  itemUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  itemOriginalPrice: {
    fontSize: 11,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 8,
    height: 36,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  couponContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#0D0D0D',
    fontWeight: '500',
  },
  applyText: {
    color: '#FF6B00',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  disabledApply: {
    color: '#6B7280',
  },
  removeCouponText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  couponAppliedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  couponAppliedBadgeText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D0D0D',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B00',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: '#E9ECEF',
    padding: 12,
    borderRadius: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  checkoutBar: {
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
  checkoutTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  checkoutSubText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    gap: 4,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
})