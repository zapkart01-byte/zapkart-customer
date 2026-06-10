import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Linking, ScrollView, Platform
} from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { getOrderById, subscribeToOrder } from '../../.claude/services/orderService'

// Conditional import for MapLibre - only on native
let MapLibreGL = null
if (Platform.OS !== 'web') {
  try {
    MapLibreGL = require('@maplibre/maplibre-react-native').default
    MapLibreGL.setAccessToken(null)
  } catch (e) {
    console.warn('MapLibre not available:', e.message)
  }
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams()
  const [order, setOrder] = useState(null)
  const [riderLocation, setRiderLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadOrder()
    startPulseAnimation()
  }, [orderId])

  const loadOrder = async () => {
    const { data } = await getOrderById(orderId)
    if (data) {
      setOrder(data)
      if (data.riders?.lat && data.riders?.lng) {
        setRiderLocation({
          latitude: data.riders.lat,
          longitude: data.riders.lng
        })
      } else if (data.stores?.lat && data.stores?.lng) {
        setRiderLocation({
          latitude: data.stores.lat,
          longitude: data.stores.lng
        })
      }
    }
    setLoading(false)

    // Subscribe to real-time order updates
    subscribeToOrder(orderId, (updatedOrder) => {
      setOrder(prev => ({ ...prev, ...updatedOrder }))
    })
  }

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start()
  }

  const callRider = () => {
    if (order?.riders?.phone) {
      Linking.openURL(`tel:${order.riders.phone}`)
    }
  }

  const getStatusSteps = () => {
    const statuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']
    const currentIndex = statuses.indexOf(order?.status || 'placed')
    return statuses.map((status, index) => ({
      label: status.replace(/_/g, ' ').toUpperCase(),
      active: index <= currentIndex,
      completed: index < currentIndex
    }))
  }

  const getInitials = (name) => {
    if (!name) return 'R'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tracking...</Text>
      </View>
    )
  }

  const statusSteps = getStatusSteps()
  const hasMap = MapLibreGL !== null && Platform.OS !== 'web'

  return (
    <View style={styles.container}>
      {/* Map Section */}
      {hasMap && riderLocation ? (
        <View style={styles.mapContainer}>
          <MapLibreGL.MapView
            style={styles.map}
            styleURL={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
          >
            <MapLibreGL.Camera
              zoomLevel={14}
              centerCoordinate={[
                riderLocation.longitude,
                riderLocation.latitude
              ]}
            />

            {/* Store Marker */}
            {order?.stores?.lat && order?.stores?.lng && (
              <MapLibreGL.PointAnnotation
                id="store"
                coordinate={[order.stores.lng, order.stores.lat]}
              >
                <View style={styles.markerStore}>
                  <Text style={styles.markerText}>🏪</Text>
                </View>
              </MapLibreGL.PointAnnotation>
            )}

            {/* Rider Marker with Pulse */}
            {riderLocation && (
              <MapLibreGL.PointAnnotation
                id="rider"
                coordinate={[riderLocation.longitude, riderLocation.latitude]}
              >
                <View style={styles.riderMarkerContainer}>
                  <Animated.View style={[
                    styles.riderPulse,
                    { transform: [{ scale: pulseAnim }] }
                  ]} />
                  <View style={styles.markerRider}>
                    <Text style={styles.markerText}>🛵</Text>
                  </View>
                </View>
              </MapLibreGL.PointAnnotation>
            )}
          </MapLibreGL.MapView>
        </View>
      ) : (
        // Fallback: Show status banner instead of map
        <View style={styles.noMapContainer}>
          <View style={[styles.statusBanner, { backgroundColor: '#FF6B00' }]}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.statusBannerIcon}>
                {order?.status === 'delivered' ? '✅' : 
                 order?.status === 'out_for_delivery' ? '🛵' :
                 order?.status === 'preparing' ? '👨‍🍳' : '📦'}
              </Text>
            </Animated.View>
            <View style={styles.statusBannerInfo}>
              <Text style={styles.statusBannerTitle}>
                {order?.status?.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.statusBannerSubtitle}>
                Order #{order?.id?.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Rider Card */}
          {order?.riders && (
            <View style={styles.riderCard}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderInitials}>{getInitials(order.riders.name)}</Text>
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{order.riders.name}</Text>
                <Text style={styles.riderPhone}>
                  {order.riders.phone} • ⭐ {order.riders.rating || '4.8'}
                </Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={callRider}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Progress Timeline */}
          <View style={styles.progressContainer}>
            {statusSteps.map((step, index) => (
              <View key={index} style={styles.progressItem}>
                <View style={styles.progressLeft}>
                  <View style={[
                    styles.progressDot,
                    step.completed && styles.progressDotCompleted,
                    step.active && !step.completed && styles.progressDotActive
                  ]}>
                    {step.completed && <Text style={styles.progressCheck}>✓</Text>}
                  </View>
                  {index < statusSteps.length - 1 && (
                    <View style={[
                      styles.progressLine,
                      step.completed && styles.progressLineCompleted
                    ]} />
                  )}
                </View>
                <View style={styles.progressRight}>
                  <Text style={[
                    styles.progressLabel,
                    step.active && styles.progressLabelActive
                  ]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery Address */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={styles.infoValue}>{order?.delivery_address?.fullAddress}</Text>
            {order?.delivery_address?.landmark && (
              <Text style={styles.infoSubtext}>Landmark: {order.delivery_address.landmark}</Text>
            )}
          </View>

          {/* Store Info */}
          {order?.stores && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Store</Text>
              <Text style={styles.infoValue}>{order.stores.store_name}</Text>
              <Text style={styles.infoSubtext}>{order.stores.address}</Text>
            </View>
          )}

          {/* Order Summary */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{order?.subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{order?.delivery_fee}</Text>
            </View>
            {order?.discount_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#16A34A' }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#16A34A' }]}>-₹{order.discount_amount}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Total</Text>
              <Text style={styles.summaryValueBold}>₹{order?.total}</Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:        { color: '#FF6B00', fontSize: 16 },
  mapContainer:       { height: '45%' },
  map:                { flex: 1 },
  noMapContainer:     { height: '25%', backgroundColor: '#F8F9FA', justifyContent: 'center',
                        paddingHorizontal: 16 },
  statusBanner:       { flexDirection: 'row', alignItems: 'center', padding: 20,
                        borderRadius: 16 },
  statusBannerIcon:   { fontSize: 48, marginRight: 16 },
  statusBannerInfo:   { flex: 1 },
  statusBannerTitle:  { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  statusBannerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  markerStore:        { width: 40, height: 40, backgroundColor: '#16A34A', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center', borderWidth: 3,
                        borderColor: '#FFFFFF' },
  riderMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  riderPulse:         { position: 'absolute', width: 60, height: 60, borderRadius: 30,
                        backgroundColor: 'rgba(255, 107, 0, 0.3)' },
  markerRider:        { width: 40, height: 40, backgroundColor: '#FF6B00', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center', borderWidth: 3,
                        borderColor: '#FFFFFF' },
  markerText:         { fontSize: 20 },
  bottomSheet:        { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 24,
                        borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 16 },
  riderCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
                        borderRadius: 12, padding: 16, marginBottom: 16 },
  riderAvatar:        { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B00',
                        alignItems: 'center', justifyContent: 'center' },
  riderInitials:      { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  riderInfo:          { flex: 1, marginLeft: 16 },
  riderName:          { fontSize: 16, fontWeight: '700', color: '#0D0D0D', marginBottom: 4 },
  riderPhone:         { fontSize: 13, color: '#6B7280' },
  callButton:         { width: 48, height: 48, backgroundColor: '#FF6B00', borderRadius: 24,
                        alignItems: 'center', justifyContent: 'center' },
  callIcon:           { fontSize: 20 },
  progressContainer:  { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  progressItem:       { flexDirection: 'row', minHeight: 56 },
  progressLeft:       { width: 32, alignItems: 'center' },
  progressDot:        { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E9ECEF',
                        alignItems: 'center', justifyContent: 'center', borderWidth: 2,
                        borderColor: '#FFFFFF' },
  progressDotActive:  { backgroundColor: '#FF6B00', borderColor: '#FFE5D3' },
  progressDotCompleted: { backgroundColor: '#16A34A', borderColor: '#DCFCE7' },
  progressCheck:      { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  progressLine:       { width: 2, flex: 1, backgroundColor: '#E9ECEF', marginTop: 4 },
  progressLineCompleted: { backgroundColor: '#16A34A' },
  progressRight:      { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  progressLabel:      { fontSize: 14, color: '#6B7280' },
  progressLabelActive: { color: '#0D0D0D', fontWeight: '600' },
  infoCard:           { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  infoLabel:          { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8,
                        textTransform: 'uppercase' },
  infoValue:          { fontSize: 15, fontWeight: '600', color: '#0D0D0D', marginBottom: 4 },
  infoSubtext:        { fontSize: 13, color: '#6B7280' },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel:       { fontSize: 14, color: '#6B7280' },
  summaryValue:       { fontSize: 14, color: '#0D0D0D' },
  summaryLabelBold:   { fontSize: 16, fontWeight: '700', color: '#0D0D0D' },
  summaryValueBold:   { fontSize: 16, fontWeight: '700', color: '#FF6B00' },
  divider:            { height: 1, backgroundColor: '#E9ECEF', marginVertical: 8 },
})
