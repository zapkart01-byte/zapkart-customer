import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Linking
} from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import MapLibreGL from '@maplibre/maplibre-react-native'
import io from 'socket.io-client'
import { getOrderById, subscribeToOrder } from '../../.claude/services/orderService'

// Set MapLibre access token to null (using MapTiler)
MapLibreGL.setAccessToken(null)

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY
const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams()
  const [order, setOrder] = useState(null)
  const [riderLocation, setRiderLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadOrder()
    connectSocket()
    startPulseAnimation()
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-order', { orderId })
        socketRef.current.disconnect()
        socketRef.current.removeAllListeners()
      }
    }
  }, [orderId])

  const loadOrder = async () => {
    const { data } = await getOrderById(orderId)
    if (data) {
      setOrder(data)
      setRiderLocation({
        latitude: data.riders?.lat || data.stores?.lat,
        longitude: data.riders?.lng || data.stores?.lng
      })
    }
    setLoading(false)

    // Subscribe to real-time order updates
    subscribeToOrder(orderId, (updatedOrder) => {
      setOrder(prev => ({ ...prev, ...updatedOrder }))
    })
  }

  const connectSocket = () => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
      socket.emit('join-order', { orderId })
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
    })

    socket.on('location:update', (data) => {
      console.log('📍 Location update received:', data)
      if (data.orderId === orderId) {
        setRiderLocation({
          latitude: data.latitude,
          longitude: data.longitude
        })
      }
    })

    socket.on('order:status', (data) => {
      console.log('📦 Order status update:', data)
      if (data.orderId === orderId) {
        setOrder(prev => ({ ...prev, status: data.status }))
      }
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
    const statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']
    const currentIndex = statuses.indexOf(order?.status || 'pending')
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

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapLibreGL.MapView
          style={styles.map}
          styleURL={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
        >
          <MapLibreGL.Camera
            zoomLevel={14}
            centerCoordinate={[
              order?.stores?.lng || 77.5946,
              order?.stores?.lat || 12.9716
            ]}
          />

          {/* Store Marker */}
          {order?.stores && (
            <MapLibreGL.PointAnnotation
              id="store"
              coordinate={[order.stores.lng, order.stores.lat]}
            >
              <View style={styles.markerStore}>
                <Text style={styles.markerText}>🛍️</Text>
              </View>
            </MapLibreGL.PointAnnotation>
          )}

          {/* Customer Marker */}
          {order?.delivery_lat && order?.delivery_lng && (
            <MapLibreGL.PointAnnotation
              id="customer"
              coordinate={[order.delivery_lng, order.delivery_lat]}
            >
              <View style={styles.markerCustomer}>
                <Text style={styles.markerText}>🏠</Text>
              </View>
            </MapLibreGL.PointAnnotation>
          )}

          {/* Rider Marker with Pulse Animation */}
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

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {order?.status?.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>

        {/* Order ID */}
        <Text style={styles.orderId}>Order #{orderId}</Text>

        {/* Rider Card */}
        {order?.riders && (
          <View style={styles.riderCard}>
            <View style={styles.riderAvatar}>
              <Text style={styles.riderInitials}>{getInitials(order.riders.name)}</Text>
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{order.riders.name}</Text>
              <Text style={styles.riderRating}>
                ⭐ {order.riders.rating || '4.8'}
              </Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={callRider}>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {statusSteps.map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                step.completed && styles.progressDotCompleted,
                step.active && !step.completed && styles.progressDotActive
              ]}>
                {step.completed && <Text style={styles.progressCheck}>✓</Text>}
              </View>
              <Text style={[
                styles.progressLabel,
                step.active && styles.progressLabelActive
              ]}>
                {step.label.split(' ')[0]}
              </Text>
              {index < statusSteps.length - 1 && (
                <View style={[
                  styles.progressLine,
                  step.completed && styles.progressLineCompleted
                ]} />
              )}
            </View>
          ))}
        </View>

        {/* Arriving Time */}
        <View style={styles.arrivingBox}>
          <Text style={styles.arrivingText}>Arriving in ~12 minutes</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:        { color: '#FF6B00', fontSize: 16 },
  mapContainer:       { height: '52%' },
  map:                { flex: 1 },
  markerStore:        { width: 40, height: 40, backgroundColor: '#FF6B00', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center' },
  markerCustomer:     { width: 40, height: 40, backgroundColor: '#6B7280', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center' },
  riderMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  riderPulse:         { position: 'absolute', width: 60, height: 60, borderRadius: 30,
                        backgroundColor: 'rgba(255, 107, 0, 0.2)' },
  markerRider:        { width: 40, height: 40, backgroundColor: '#FF6B00', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center', borderWidth: 3,
                        borderColor: '#FFFFFF' },
  markerText:         { fontSize: 20 },
  bottomSheet:        { height: '48%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
                        borderTopRightRadius: 24, padding: 20, paddingBottom: 32,
                        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  statusBadge:        { backgroundColor: '#FFF0E6', borderRadius: 8, paddingHorizontal: 12,
                        paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 8 },
  statusText:         { color: '#FF6B00', fontSize: 12, fontWeight: '700' },
  orderId:            { fontSize: 16, fontWeight: '700', color: '#0D0D0D', marginBottom: 16 },
  riderCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
                        borderRadius: 12, padding: 12, marginBottom: 16 },
  riderAvatar:        { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF6B00',
                        alignItems: 'center', justifyContent: 'center' },
  riderInitials:      { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  riderInfo:          { flex: 1, marginLeft: 12 },
  riderName:          { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  riderRating:        { fontSize: 13, color: '#6B7280', marginTop: 2 },
  callButton:         { width: 40, height: 40, backgroundColor: '#FF6B00', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center' },
  callIcon:           { fontSize: 18 },
  progressContainer:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressStep:       { flex: 1, alignItems: 'center', position: 'relative' },
  progressDot:        { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E9ECEF',
                        marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  progressDotActive:  { backgroundColor: '#FF6B00' },
  progressDotCompleted: { backgroundColor: '#16A34A' },
  progressCheck:      { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  progressLabel:      { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },
  progressLabelActive: { color: '#0D0D0D', fontWeight: '600' },
  progressLine:       { position: 'absolute', top: 12, left: '50%', width: '100%',
                        height: 2, backgroundColor: '#E9ECEF' },
  progressLineCompleted: { backgroundColor: '#16A34A' },
  arrivingBox:        { backgroundColor: '#FFF0E6', borderRadius: 12, padding: 16,
                        alignItems: 'center' },
  arrivingText:       { color: '#FF6B00', fontSize: 16, fontWeight: '700' },
})
