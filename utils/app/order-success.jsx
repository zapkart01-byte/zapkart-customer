import {
  View, Text, TouchableOpacity, StyleSheet, Animated
} from 'react-native'
import { useEffect, useRef } from 'react'
import { router, useLocalSearchParams } from 'expo-router'

export default function OrderSuccessScreen() {
  const { orderId, itemCount, total, deliveryTime } = useLocalSearchParams()
  const checkmarkAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animate checkmark on mount
    Animated.timing(checkmarkAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start()
  }, [])

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1]
  })

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <Animated.View style={[
        styles.successCircle,
        { transform: [{ scale: checkmarkScale }] }
      ]}>
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>

      {/* Success Message */}
      <Text style={styles.heading}>Order Placed! 🎉</Text>
      
      {/* Order ID */}
      <Text style={styles.orderId}>Order ID: #{orderId}</Text>

      {/* Delivery Time */}
      <View style={styles.deliveryBox}>
        <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
        <Text style={styles.deliveryTime}>{deliveryTime || '28 minutes'}</Text>
      </View>

      {/* Order Summary */}
      <View style={styles.divider} />
      <Text style={styles.summary}>
        {itemCount || 3} items · ₹{total || 237} · Cash on Delivery
      </Text>
      <View style={styles.divider} />

      {/* Buttons */}
      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => router.push(`/tracking/${orderId}`)}
      >
        <Text style={styles.trackButtonText}>Track My Order →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.continueButtonText}>Continue Shopping</Text>
      </TouchableOpacity>

      {/* SMS Note */}
      <Text style={styles.smsNote}>
        You'll receive an SMS with tracking details shortly
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center',
                        justifyContent: 'center', padding: 24 },
  successCircle:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6B00',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  checkmark:          { color: '#FFFFFF', fontSize: 48, fontWeight: '700' },
  heading:            { fontSize: 28, fontWeight: '700', color: '#0D0D0D', textAlign: 'center' },
  orderId:            { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  deliveryBox:        { marginTop: 24, alignItems: 'center' },
  deliveryLabel:      { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  deliveryTime:       { fontSize: 24, fontWeight: '700', color: '#FF6B00' },
  divider:            { width: '100%', height: 1, backgroundColor: '#E9ECEF', marginVertical: 16 },
  summary:            { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  trackButton:        { width: '100%', backgroundColor: '#FF6B00', borderRadius: 14,
                        paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  trackButtonText:    { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  continueButton:     { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 14,
                        paddingVertical: 16, alignItems: 'center', marginTop: 12,
                        borderWidth: 1, borderColor: '#E9ECEF' },
  continueButtonText: { color: '#0D0D0D', fontSize: 16, fontWeight: '600' },
  smsNote:            { fontSize: 12, color: '#9CA3AF', textAlign: 'center',
                        marginTop: 24, lineHeight: 18 },
})
