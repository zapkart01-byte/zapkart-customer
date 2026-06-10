import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import { placeOrder } from '../.claude/services/orderService'

export default function CheckoutScreen() {
  const { items, subtotal, storeId, clearCart } = useCartStore()
  const { user } = useAuthStore()
  
  // Delivery address state
  const [fullAddress, setFullAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('cod')
  
  // Coupon code
  const [couponCode, setCouponCode] = useState('')
  
  // Loading states
  const [loading, setLoading] = useState(false)
  
  // Pricing calculations (simplified - backend will recalculate)
  const cartSubtotal = subtotal()
  const deliveryFee = 30
  const estimatedTotal = cartSubtotal + deliveryFee

  // Validate form
  const isFormValid = () => {
    return fullAddress.trim().length > 10 && phone.trim().length === 10
  }

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please provide complete delivery address and phone number')
      return
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout')
      return
    }

    setLoading(true)

    // Prepare order data
    const orderData = {
      storeId: storeId,
      distanceKm: 5, // Default distance - in real app would use GPS/maps
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      deliveryAddress: {
        fullAddress: fullAddress.trim(),
        landmark: landmark.trim(),
        phone: phone.trim()
      },
      payment_method: paymentMethod,
      couponCode: couponCode.trim() || undefined
    }

    const { data, error } = await placeOrder(orderData)
    setLoading(false)

    if (error) {
      Alert.alert('Order Failed', error)
      return
    }

    // Success!
    clearCart()
    Alert.alert(
      'Order Placed! 🎉',
      `Your order #${data.order.id.slice(0, 8)} has been placed successfully. You can track it from Orders tab.`,
      [
        {
          text: 'View Orders',
          onPress: () => router.replace('/(tabs)/orders')
        }
      ]
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Items Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          <View style={styles.card}>
            {items.map((item, index) => (
              <View key={item.id}>
                <View style={styles.orderItem}>
                  <View style={styles.orderItemLeft}>
                    <Text style={styles.itemQty}>{item.quantity}×</Text>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemUnit}>{item.unit}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>
                    ₹{(item.store_price * item.quantity).toFixed(2)}
                  </Text>
                </View>
                {index < items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Address - REQUIRED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address *</Text>
          {!isFormValid() && (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Fill address (min 10 chars) and phone (10 digits) to enable order button
              </Text>
            </View>
          )}
          <View style={styles.card}>
            <TextInput
              style={styles.textInput}
              placeholder="Full Address (House/Flat, Street, Area)"
              placeholderTextColor="#9CA3AF"
              value={fullAddress}
              onChangeText={setFullAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.textInput}
              placeholder="Landmark (Optional)"
              placeholderTextColor="#9CA3AF"
              value={landmark}
              onChangeText={setLandmark}
            />
            <View style={styles.divider} />
            <TextInput
              style={styles.textInput}
              placeholder="Contact Phone"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => setPaymentMethod('cod')}
            >
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentIcon}>💵</Text>
                <Text style={styles.paymentText}>Cash on Delivery</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'cod' && styles.radioSelected]}>
                {paymentMethod === 'cod' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => setPaymentMethod('online')}
            >
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentIcon}>💳</Text>
                <Text style={styles.paymentText}>Online Payment</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'online' && styles.radioSelected]}>
                {paymentMethod === 'online' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coupon Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon (Optional)</Text>
          <View style={styles.card}>
            <View style={styles.couponRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#9CA3AF"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <Text style={styles.couponHint}>🏷️</Text>
            </View>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.card}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹{cartSubtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.billLabelBold}>Total</Text>
              <Text style={styles.billValueBold}>₹{estimatedTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>₹{estimatedTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, (!isFormValid() || loading) && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order →</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:                { flex: 1, backgroundColor: '#F8F9FA' },
  header:                   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                              padding: 16, paddingTop: 56, backgroundColor: '#FFFFFF',
                              borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backArrow:                { fontSize: 24, color: '#0D0D0D' },
  headerTitle:              { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  section:                  { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle:             { fontSize: 15, fontWeight: '700', color: '#0D0D0D', marginBottom: 8 },
  card:                     { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  orderItem:                { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  orderItemLeft:            { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemQty:                  { fontSize: 14, fontWeight: '700', color: '#FF6B00', marginRight: 12, width: 24 },
  itemName:                 { fontSize: 14, fontWeight: '600', color: '#0D0D0D' },
  itemUnit:                 { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemPrice:                { fontSize: 14, fontWeight: '700', color: '#0D0D0D' },
  divider:                  { height: 1, backgroundColor: '#F8F9FA', marginVertical: 8 },
  textInput:                { fontSize: 14, color: '#0D0D0D', padding: 8 },
  paymentOption:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                              paddingVertical: 12 },
  paymentLeft:              { flexDirection: 'row', alignItems: 'center' },
  paymentIcon:              { fontSize: 24, marginRight: 12 },
  paymentText:              { fontSize: 15, fontWeight: '600', color: '#0D0D0D' },
  radio:                    { width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                              borderColor: '#E9ECEF', alignItems: 'center', justifyContent: 'center' },
  radioSelected:            { borderColor: '#FF6B00' },
  radioDot:                 { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B00' },
  couponRow:                { flexDirection: 'row', alignItems: 'center' },
  couponInput:              { flex: 1, fontSize: 14, color: '#0D0D0D', padding: 8 },
  couponHint:               { fontSize: 20 },
  billRow:                  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  billLabel:                { fontSize: 14, color: '#6B7280' },
  billValue:                { fontSize: 14, color: '#0D0D0D' },
  billLabelBold:            { fontSize: 16, fontWeight: '700', color: '#0D0D0D' },
  billValueBold:            { fontSize: 16, fontWeight: '700', color: '#0D0D0D' },
  warningBox:               { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED',
                              padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1,
                              borderColor: '#FFEDD5' },
  warningIcon:              { fontSize: 18, marginRight: 8 },
  warningText:              { flex: 1, fontSize: 12, color: '#9A3412', lineHeight: 16 },
  footer:                   { position: 'absolute', bottom: 0, left: 0, right: 0,
                              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                              backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 32,
                              borderTopWidth: 1, borderTopColor: '#E9ECEF' },
  footerLeft:               { flex: 1 },
  footerLabel:              { fontSize: 12, color: '#6B7280' },
  footerPrice:              { fontSize: 20, fontWeight: '700', color: '#0D0D0D', marginTop: 2 },
  placeOrderButton:         { backgroundColor: '#FF6B00', borderRadius: 12, paddingHorizontal: 24,
                              paddingVertical: 14 },
  placeOrderButtonDisabled: { backgroundColor: '#E9ECEF' },
  placeOrderText:           { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  emptyContainer:           { flex: 1, alignItems: 'center', justifyContent: 'center',
                              backgroundColor: '#FFFFFF', padding: 24 },
  emptyIcon:                { fontSize: 64, marginBottom: 16 },
  emptyText:                { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  shopButton:               { backgroundColor: '#FF6B00', borderRadius: 12, paddingHorizontal: 32,
                              paddingVertical: 14 },
  shopButtonText:           { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
})
