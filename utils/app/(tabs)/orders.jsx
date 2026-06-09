import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getMyOrders, getOrderById } from '../../services/orderService'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'

const Skeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonCircle} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
    </View>
  </View>
)

export default function OrdersScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const { user } = useAuthStore()
  const { addItem } = useCartStore()

  useEffect(() => {
    if (user?.id) loadOrders()
  }, [user])

  const loadOrders = async () => {
    setLoading(true)
    const { data } = await getMyOrders(user.id)
    if (data) setOrders(data)
    setLoading(false)
  }

  const handleReorder = async (orderId) => {
    const { data, error } = await getOrderById(orderId)
    if (error) {
      Alert.alert('Error', 'Failed to load order details')
      return
    }

    // Parse items from order
    const items = JSON.parse(data.items || '[]')
    let addedCount = 0

    items.forEach(item => {
      const result = addItem({
        id: item.productId,
        name: item.name,
        store_price: item.price,
        platform_mrp: item.mrp || item.price,
        unit: item.unit || '1 unit',
        store_id: data.store_id,
        store_name: data.stores?.store_name
      }, item.quantity)

      if (!result.needsConfirmation) addedCount++
    })

    if (addedCount > 0) {
      Alert.alert('Success', `${addedCount} items added to cart`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/cart') }
      ])
    }
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      out_for_delivery: '🛵',
      delivered: '📦',
      cancelled: '❌'
    }
    return icons[status] || '📋'
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      preparing: '#8B5CF6',
      out_for_delivery: '#FF6B00',
      delivered: '#16A34A',
      cancelled: '#EF4444'
    }
    return colors[status] || '#6B7280'
  }

  const filterOrders = () => {
    if (activeTab === 'all') return orders
    if (activeTab === 'active') {
      return orders.filter(o => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status))
    }
    if (activeTab === 'delivered') {
      return orders.filter(o => o.status === 'delivered')
    }
    if (activeTab === 'cancelled') {
      return orders.filter(o => o.status === 'cancelled')
    }
    return orders
  }

  const filteredOrders = filterOrders()

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Orders</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
        </ScrollView>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Start shopping to place your first order</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredOrders.map(order => {
            const itemsArray = JSON.parse(order.items || '[]')
            const itemCount = itemsArray.reduce((sum, item) => sum + item.quantity, 0)
            const isActive = ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status)
            const isDelivered = order.status === 'delivered'

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={[
                    styles.statusIcon,
                    { backgroundColor: getStatusColor(order.status) + '20' }
                  ]}>
                    <Text style={styles.statusEmoji}>{getStatusIcon(order.status)}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle}>
                      {itemCount} items · ₹{order.total}
                    </Text>
                    <Text style={styles.orderStatus}>
                      {order.status.replace(/_/g, ' ').toUpperCase()} · {' '}
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.orderStore}>{order.stores?.store_name}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  {isActive && (
                    <TouchableOpacity
                      style={styles.trackButton}
                      onPress={() => router.push(`/tracking/${order.id}`)}
                    >
                      <Text style={styles.trackButtonText}>Track →</Text>
                    </TouchableOpacity>
                  )}
                  {isDelivered && (
                    <TouchableOpacity
                      style={styles.reorderButton}
                      onPress={() => handleReorder(order.id)}
                    >
                      <Text style={styles.reorderButtonText}>Reorder</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F8F9FA' },
  heading:          { fontSize: 24, fontWeight: '800', color: '#0D0D0D',
                      padding: 16, paddingTop: 56 },
  tabs:             { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  tab:              { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  tabActive:        { backgroundColor: '#FF6B00' },
  tabText:          { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  tabTextActive:    { color: '#FFFFFF' },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji:       { fontSize: 64 },
  emptyTitle:       { fontSize: 20, fontWeight: '700', color: '#0D0D0D', marginTop: 16 },
  emptySub:         { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  shopButton:       { backgroundColor: '#FF6B00', borderRadius: 14, paddingHorizontal: 24,
                      paddingVertical: 12, marginTop: 24 },
  shopButtonText:   { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  orderCard:        { backgroundColor: '#FFFFFF', borderRadius: 12, margin: 16,
                      marginTop: 0, padding: 16 },
  orderHeader:      { flexDirection: 'row', marginBottom: 12 },
  statusIcon:       { width: 48, height: 48, borderRadius: 24, alignItems: 'center',
                      justifyContent: 'center' },
  statusEmoji:      { fontSize: 24 },
  orderInfo:        { flex: 1, marginLeft: 12, justifyContent: 'center' },
  orderTitle:       { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  orderStatus:      { fontSize: 12, color: '#6B7280', marginTop: 4 },
  orderStore:       { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  orderActions:     { flexDirection: 'row', gap: 8 },
  trackButton:      { flex: 1, backgroundColor: '#FF6B00', borderRadius: 10,
                      paddingVertical: 12, alignItems: 'center' },
  trackButtonText:  { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  reorderButton:    { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 10,
                      paddingVertical: 12, alignItems: 'center', borderWidth: 1,
                      borderColor: '#E9ECEF' },
  reorderButtonText: { color: '#0D0D0D', fontSize: 14, fontWeight: '700' },
  skeletonCard:     { backgroundColor: '#FFFFFF', borderRadius: 12, margin: 16,
                      marginTop: 0, padding: 16, flexDirection: 'row' },
  skeletonCircle:   { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E9ECEF' },
  skeletonContent:  { flex: 1, marginLeft: 12, justifyContent: 'center' },
  skeletonLine:     { height: 14, backgroundColor: '#E9ECEF', borderRadius: 4,
                      marginBottom: 8 },
  skeletonLineShort: { height: 12, backgroundColor: '#E9ECEF', borderRadius: 4, width: '60%' },
})
