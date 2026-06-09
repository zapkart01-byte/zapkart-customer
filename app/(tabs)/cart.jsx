import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import useCartStore from '../../store/cartStore'
import { calculateOrderPricing } from '../../utils/pricingCalculator'
import { getPlatformSettings } from '../../.claude/services/productService'
import { validateCoupon } from '../../.claude/services/orderService'
import { formatCurrency } from '../../utils/formatters'

export default function CartScreen() {
  const { items, updateQuantity, removeItem, cartItemsForPricing } = useCartStore()
  const [settings,     setSettings]     = useState(null)
  const [pricing,      setPricing]      = useState(null)
  const [couponCode,   setCouponCode]   = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)

  useEffect(() => { loadSettings() }, [])
  useEffect(() => { if (settings) calculatePricing() }, [items, settings])

  const loadSettings = async () => {
    const { data } = await getPlatformSettings()
    if (data) setSettings(data)
  }

  const calculatePricing = () => {
    const cartItems = cartItemsForPricing()
    if (cartItems.length === 0) { setPricing(null); return }
    const result = calculateOrderPricing(cartItems, 1.5, settings)
    setPricing(result)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    const { data, error } = await validateCoupon(couponCode, pricing?.cartValue || 0)
    setCouponLoading(false)
    if (data) {
      setCouponApplied(data)
    } else {
      Alert.alert('Invalid Coupon', error || 'Coupon not valid')
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add items to get started</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const discount    = couponApplied?.discountAmount || 0
  const finalTotal  = pricing ? pricing.totalCustomerPays - discount : 0
  const toFreeDelivery = pricing?.amountToFreeDelivery || 0

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Cart <Text style={styles.count}>{items.length} items</Text></Text>

      {/* Free delivery progress */}
      {toFreeDelivery > 0 && pricing && (
        <View style={styles.freeDeliveryBar}>
          <Text style={styles.freeDeliveryText}>
            Add ₹{Math.ceil(toFreeDelivery)} more for FREE delivery
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${Math.min(100, ((pricing.cartValue) / (settings?.free_delivery_above || 499)) * 100)}%`
            }]} />
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsCard}>
          {items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemImage}>
                  <Text style={{ fontSize: 28 }}>🛒</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit}</Text>
                  <Text style={styles.itemPrice}>₹{item.store_price + 1}</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Text style={styles.stepperText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={styles.stepperText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {index < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.couponRow}>
          <Text style={styles.couponIcon}>🏷️</Text>
          <TextInput
            style={styles.couponInput}
            placeholder="Apply promo code"
            placeholderTextColor="#9CA3AF"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity onPress={handleApplyCoupon} disabled={couponLoading}>
            <Text style={styles.applyText}>
              {couponLoading ? '...' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>

        {couponApplied && (
          <View style={styles.couponApplied}>
            <Text style={styles.couponAppliedText}>
              🎉 {couponApplied.code} applied — saving ₹{couponApplied.discountAmount}
            </Text>
          </View>
        )}

        {/* Bill Details */}
        {pricing && (
          <View style={styles.billCard}>
            <Text style={styles.billTitle}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{pricing.cartValue}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>
                {pricing.isFreeDelivery ? (
                  <Text style={{ color: '#16A34A' }}>FREE 🎉</Text>
                ) : `₹${pricing.deliveryFee}`}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, { color: '#16A34A' }]}>-₹{discount}</Text>
              </View>
            )}
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotal}>Total Payable</Text>
              <Text style={[styles.billTotal, { color: '#FF6B00' }]}>₹{finalTotal}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutTotal}>₹{finalTotal}</Text>
          <Text style={styles.checkoutLabel}>TOTAL</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F8F9FA' },
  empty:              { flex: 1, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#FFFFFF', padding: 24 },
  emptyEmoji:         { fontSize: 64 },
  emptyTitle:         { fontSize: 20, fontWeight: '700', color: '#0D0D0D', marginTop: 16 },
  emptySub:           { fontSize: 14, color: '#6B7280', marginTop: 8 },
  shopButton:         { backgroundColor: '#FF6B00', borderRadius: 14, paddingHorizontal: 24,
                        paddingVertical: 12, marginTop: 24 },
  shopButtonText:     { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  heading:            { fontSize: 24, fontWeight: '800', color: '#0D0D0D', padding: 16, paddingTop: 56 },
  count:              { fontSize: 14, color: '#9CA3AF', fontWeight: '400' },
  freeDeliveryBar:    { marginHorizontal: 16, marginBottom: 12 },
  freeDeliveryText:   { fontSize: 13, color: '#0D0D0D', marginBottom: 6 },
  progressTrack:      { height: 4, backgroundColor: '#E9ECEF', borderRadius: 2 },
  progressFill:       { height: 4, backgroundColor: '#FF6B00', borderRadius: 2 },
  itemsCard:          { backgroundColor: '#FFFFFF', borderRadius: 12, margin: 16,
                        marginBottom: 8, padding: 16 },
  itemRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  itemImage:          { width: 52, height: 52, backgroundColor: '#F8F9FA', borderRadius: 8,
                        alignItems: 'center', justifyContent: 'center' },
  itemInfo:           { flex: 1, marginLeft: 12 },
  itemName:           { fontSize: 14, fontWeight: '700', color: '#0D0D0D' },
  itemUnit:           { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemPrice:          { fontSize: 14, fontWeight: '700', color: '#0D0D0D', marginTop: 4 },
  divider:            { height: 1, backgroundColor: '#F8F9FA' },
  stepper:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B00',
                        borderRadius: 8, overflow: 'hidden' },
  stepperBtn:         { paddingHorizontal: 10, paddingVertical: 8 },
  stepperText:        { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  stepperQty:         { color: '#FFFFFF', fontSize: 14, fontWeight: '700', paddingHorizontal: 6 },
  couponRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
                        borderRadius: 12, marginHorizontal: 16, marginVertical: 8, padding: 12 },
  couponIcon:         { fontSize: 18, marginRight: 8 },
  couponInput:        { flex: 1, fontSize: 14, color: '#0D0D0D' },
  applyText:          { color: '#FF6B00', fontSize: 14, fontWeight: '700' },
  couponApplied:      { marginHorizontal: 16, backgroundColor: '#DCFCE7', borderRadius: 8,
                        padding: 10, marginBottom: 8 },
  couponAppliedText:  { color: '#16A34A', fontSize: 13, fontWeight: '600' },
  billCard:           { backgroundColor: '#FFFFFF', borderRadius: 12, margin: 16,
                        marginTop: 8, padding: 16 },
  billTitle:          { fontSize: 15, fontWeight: '700', color: '#0D0D0D', marginBottom: 12 },
  billRow:            { flexDirection: 'row', justifyContent: 'space-between',
                        marginBottom: 8 },
  billLabel:          { fontSize: 14, color: '#6B7280' },
  billValue:          { fontSize: 14, color: '#0D0D0D' },
  billDivider:        { height: 1, backgroundColor: '#E9ECEF', marginVertical: 8 },
  billTotal:          { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  checkoutBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 32,
                        borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  checkoutTotal:      { fontSize: 20, fontWeight: '700', color: '#0D0D0D' },
  checkoutLabel:      { fontSize: 11, color: '#9CA3AF' },
  checkoutButton:     { backgroundColor: '#FF6B00', borderRadius: 14, paddingHorizontal: 20,
                        paddingVertical: 14 },
  checkoutButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
})