import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Image, Alert
} from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { Sparkles, MapPin, Search, ChevronRight, ShoppingBag, Plus, Minus } from 'lucide-react-native'
import { getCategories, getProducts, getBanners, getActiveOffers } from '../../services/productService'
import { getMyOrders } from '../../services/orderService'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { supabase } from '../../services/supabase'

import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function HomeScreen() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [offers, setOffers] = useState([])
  const [lastOrders, setLastOrders] = useState([])
  const [lastOrdersItems, setLastOrdersItems] = useState({})
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [countdown, setCountdown] = useState('00h : 00m : 00s')

  const bannerRef = useRef(null)
  const autoScrollTimer = useRef(null)
  
  const { items, addItem, forceAddItem, updateQuantity, storeName, clearCart } = useCartStore()
  const { user } = useAuthStore()

  // 1. Load data once on mount and when user logs in/out
  useEffect(() => {
    loadData()
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current)
    }
  }, [user?.id])

  // 2. Countdown Timer logic for flash deals (depends on offers)
  useEffect(() => {
    const timer = setInterval(() => {
      // Find a flash deal offer to base the countdown on
      const flashDeal = offers.find(o => o.type === 'flash_deal')
      if (flashDeal) {
        setCountdown(getCountdownText(flashDeal.valid_until))
      } else {
        // Fallback: simulated countdown ends at midnight
        const now = new Date()
        const midnight = new Date()
        midnight.setHours(24, 0, 0, 0)
        setCountdown(getCountdownText(midnight.toISOString()))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [offers])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [catsRes, prodsRes, bannersRes, offersRes] = await Promise.all([
        getCategories(),
        getProducts(),
        getBanners(),
        getActiveOffers()
      ])

      if (catsRes.error) throw new Error(catsRes.error)
      if (prodsRes.error) throw new Error(prodsRes.error)
      if (bannersRes.error) throw new Error(bannersRes.error)
      if (offersRes.error) throw new Error(offersRes.error)

      setCategories(catsRes.data || [])
      setProducts(prodsRes.data || [])
      setBanners(bannersRes.data || [])
      setOffers(offersRes.data || [])

      // Fetch user previous orders if logged in
      if (user?.id) {
        const ordersRes = await getMyOrders(user.id)
        if (ordersRes.data) {
          const recentOrders = ordersRes.data.slice(0, 2)
          setLastOrders(recentOrders)
          
          if (recentOrders.length > 0) {
            const orderIds = recentOrders.map(o => o.id)
            const { data: oItems, error: oItemsErr } = await supabase
              .from('order_items')
              .select('*')
              .in('order_id', orderIds)
              
            if (!oItemsErr && oItems) {
              const mapped = {}
              oItems.forEach(item => {
                if (!mapped[item.order_id]) mapped[item.order_id] = []
                mapped[item.order_id].push(item)
              })
              setLastOrdersItems(mapped)
            }
          }
        }
      }
      
      // Initialize Auto-scroll Banners
      if (bannersRes.data && bannersRes.data.length > 1) {
        startAutoScroll(bannersRes.data.length)
      }
    } catch (err) {
      console.error('HomeScreen loadData error:', err)
      setError(err.message || 'Something went wrong while loading data.')
    } finally {
      setLoading(false)
    }
  }

  const startAutoScroll = (totalBanners) => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current)
    let index = 0
    autoScrollTimer.current = setInterval(() => {
      index = (index + 1) % totalBanners
      setActiveBannerIndex(index)
      bannerRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      })
    }, 3000)
  }

  const getCountdownText = (validUntil) => {
    const diff = new Date(validUntil) - new Date()
    if (diff <= 0) return '00h : 00m : 00s'
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`
  }

  const getCartQty = (productId) => {
    const item = items.find(i => i.id === productId)
    return item?.quantity || 0
  }

  // Calculate product prices with markups and active offers
  const getProductPricing = (product) => {
    const basePrice = Math.min(product.store_price + 1, product.platform_mrp)
    let discountedPrice = basePrice
    let appliedOffer = null

    // Check if any active offers apply to this product or its category
    const productOffers = offers.filter(offer => 
      (offer.type === 'event_sale' || offer.type === 'flash_deal') &&
      (
        (offer.applies_to_products && offer.applies_to_products.includes(product.id)) ||
        (offer.applies_to_categories && offer.applies_to_categories.includes(product.category_id))
      )
    )

    if (productOffers.length > 0) {
      appliedOffer = productOffers[0]
      let discount = 0
      if (appliedOffer.discount_type === 'percentage') {
        discount = basePrice * (appliedOffer.discount_value / 100)
      } else if (appliedOffer.discount_type === 'flat') {
        discount = appliedOffer.discount_value
      }
      discountedPrice = Math.max(0, Math.round(basePrice - discount))
    }

    const discountPct = basePrice > 0 ? Math.round(((basePrice - discountedPrice) / basePrice) * 100) : 0

    return {
      originalPrice: basePrice,
      price: discountedPrice,
      discountPct,
      appliedOffer
    }
  }

  const handleAdd = (product) => {
    const pricing = getProductPricing(product)
    const cartProduct = {
      ...product,
      // Pass pricing details computed on screen
      customer_price: pricing.price,
      discount_pct: pricing.discountPct,
      applied_offer_id: pricing.appliedOffer?.id || null
    }

    const result = addItem(cartProduct)
    if (result && result.needsConfirmation) {
      const targetStore = product.store_name || product.stores?.store_name || 'another store'
      Alert.alert(
        'Start new cart?',
        `Your cart has items from ${storeName}. Clear cart and add from ${targetStore}?`,
        [
          { text: 'Keep Current Cart', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: () => forceAddItem(cartProduct)
          }
        ]
      )
    }
  }

  const handleReorder = async (order) => {
    const orderItems = lastOrdersItems[order.id]
    if (!orderItems || orderItems.length === 0) return

    // Quick check if there is an item from a different store
    const storeIdToCheck = order.store_id
    if (items.length > 0 && items[0].store_id !== storeIdToCheck) {
      Alert.alert(
        'Start new cart?',
        `Reordering will clear your current cart containing items from ${storeName}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Reorder',
            style: 'destructive',
            onPress: () => performReorder(orderItems, storeIdToCheck, order.stores?.store_name)
          }
        ]
      )
    } else {
      performReorder(orderItems, storeIdToCheck, order.stores?.store_name)
    }
  }

  const performReorder = (orderItems, storeId, storeName) => {
    clearCart()
    orderItems.forEach(item => {
      // Find the corresponding product object
      const dbProd = products.find(p => p.id === item.product_id)
      if (dbProd) {
        const pricing = getProductPricing(dbProd)
        addItem({
          ...dbProd,
          customer_price: pricing.price,
          discount_pct: pricing.discountPct,
          applied_offer_id: pricing.appliedOffer?.id || null,
          store_name: storeName
        }, item.quantity)
      }
    })
    router.push('/cart')
  }

  const totalCartValue = items.reduce((sum, item) => sum + (item.customer_price * item.quantity), 0)

  // FILTER PRODUCTS FOR SECTIONS
  // Flash Deals = Products that have a flash_deal offer applying to them
  const flashDeals = products.filter(product => {
    const pricing = getProductPricing(product)
    return pricing.appliedOffer?.type === 'flash_deal'
  })

  // Best Sellers = Top products by units_sold_total (fallback to all active products if units_sold is 0)
  const bestSellers = [...products]
    .sort((a, b) => (b.units_sold_total || 0) - (a.units_sold_total || 0))
    .slice(0, 6)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Header Skeleton */}
        <View style={styles.skeletonHeader}>
          <Skeleton width={180} height={20} />
          <Skeleton width={130} height={12} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={SCREEN_WIDTH - 32} height={48} borderRadius={12} style={{ marginHorizontal: 16, marginBottom: 16 }} />
        
        {/* Banners Skeleton */}
        <Skeleton width={SCREEN_WIDTH - 32} height={150} borderRadius={14} style={{ marginHorizontal: 16, marginBottom: 24 }} />
        
        {/* Category Scroll Skeleton */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScrollList}
        >
          {Array(8).fill(0).map((_, i) => (
            <View key={i} style={styles.catScrollCell}>
              <Skeleton width={56} height={56} borderRadius={28} />
              <Skeleton width={60} height={10} style={{ marginTop: 8 }} />
            </View>
          ))}
        </ScrollView>

        {/* Section Title Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Skeleton width={140} height={18} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Skeleton width={140} height={180} borderRadius={12} />
            <Skeleton width={140} height={180} borderRadius={12} />
            <Skeleton width={140} height={180} borderRadius={12} />
          </View>
        </View>
      </View>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header Location & Delivery Pill */}
        <View style={styles.header}>
          <View style={styles.locationBar}>
            <MapPin color="#FF6B00" size={20} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>📍 Koramangala, Bengaluru</Text>
              <Text style={styles.locationSub}>4th Block, 80 Feet Road</Text>
            </View>
          </View>
          <View style={styles.deliveryPill}>
            <Text style={styles.deliveryPillText}>🟢 Delivery in 15-20 min</Text>
          </View>
        </View>

        {/* Search Bar Redirect */}
        <TouchableOpacity 
          style={styles.searchRow} 
          onPress={() => router.push('/search')}
          activeOpacity={0.9}
        >
          <View style={styles.searchBar}>
            <Search color="#6B7280" size={18} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search "paneer", "milk" or "snacks"...</Text>
          </View>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => router.push('/ai-cart')}
            activeOpacity={0.8}
          >
            <Sparkles color="#FF6B00" size={20} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Banners Carousel */}
        {banners.length > 0 && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={bannerRef}
              data={banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
                setActiveBannerIndex(index)
              }}
              renderItem={({ item }) => (
                <View style={[styles.bannerWrapper, { width: SCREEN_WIDTH }]}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.bannerImage} />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Text style={styles.bannerTitleText}>{item.title || '⚡ FLASH SALE'}</Text>
                      <Text style={styles.bannerSubtitleText}>Up to 50% off on essentials</Text>
                    </View>
                  )}
                </View>
              )}
            />
            <View style={styles.dotContainer}>
              {banners.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    activeBannerIndex === index ? styles.activeDot : null
                  ]} 
                />
              ))}
            </View>
          </View>
        )}

        {/* Category Horizontal Scroll List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScrollList}
        >
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={styles.catScrollCell}
              onPress={() => router.push(`/search?cat=${cat.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.catIconBox}>
                <Text style={styles.catEmojiText}>{cat.emoji || '📦'}</Text>
              </View>
              <Text style={styles.catLabelText} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Order Again Section */}
        {user && lastOrders.length > 0 && (
          <View style={styles.orderAgainSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Again</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.horizontalScrollList}
            >
              {lastOrders.map((order) => {
                const oItems = lastOrdersItems[order.id] || []
                const itemsSummary = oItems.slice(0, 2).map(i => i.name).join(', ')
                
                return (
                  <View key={order.id} style={styles.orderAgainCard}>
                    <View style={styles.orderAgainHeader}>
                      <ShoppingBag color="#FF6B00" size={18} />
                      <Text style={styles.orderAgainStore} numberOfLines={1}>{order.stores?.store_name || 'Store'}</Text>
                    </View>
                    <Text style={styles.orderAgainItems} numberOfLines={1}>
                      {itemsSummary}{oItems.length > 2 ? '...' : ''}
                    </Text>
                    <View style={styles.orderAgainFooter}>
                      <Text style={styles.orderAgainPrice}>₹{Math.round(order.total)}</Text>
                      <TouchableOpacity 
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reorderText}>Reorder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Flash Deals with Countdown */}
        {flashDeals.length > 0 && (
          <View style={styles.flashDealsSection}>
            <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
              <View style={styles.flashTitleRow}>
                <Text style={styles.sectionTitle}>Flash Deals</Text>
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownText}>⏱️ {countdown}</Text>
                </View>
              </View>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.horizontalScrollList}
            >
              {flashDeals.map((prod) => {
                const pricing = getProductPricing(prod)
                const qty = getCartQty(prod.id)
                
                return (
                  <View key={prod.id} style={styles.flashDealCard}>
                    <TouchableOpacity 
                      onPress={() => router.push(`/product/${prod.id}`)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.flashImageArea}>
                        {prod.image_url ? (
                          <Image source={{ uri: prod.image_url }} style={styles.flashProductImage} />
                        ) : (
                          <Text style={styles.flashEmoji}>{prod.emoji || '📦'}</Text>
                        )}
                        <View style={styles.flashBadge}>
                          <Text style={styles.flashBadgeText}>{pricing.discountPct}% OFF</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.flashCardBody}>
                      <Text style={styles.flashProdName} numberOfLines={1}>{prod.name}</Text>
                      <Text style={styles.flashProdUnit}>{prod.unit}</Text>
                      <View style={styles.flashCardFooter}>
                        <View>
                          <Text style={styles.flashPrice}>₹{pricing.price}</Text>
                          <Text style={styles.flashMrp}>₹{pricing.originalPrice}</Text>
                        </View>

                        {qty === 0 ? (
                          <TouchableOpacity 
                            style={styles.flashAddBtn}
                            onPress={() => handleAdd(prod)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.flashAddText}>ADD</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.stepperMini}>
                            <TouchableOpacity 
                              style={styles.stepperMiniBtn}
                              onPress={() => updateQuantity(prod.id, qty - 1)}
                            >
                              <Text style={styles.stepperMiniText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.stepperMiniQty}>{qty}</Text>
                            <TouchableOpacity 
                              style={styles.stepperMiniBtn}
                              onPress={() => updateQuantity(prod.id, qty + 1)}
                            >
                              <Text style={styles.stepperMiniText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Best Sellers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best Sellers</Text>
        </View>
        <View style={styles.bestSellersGrid}>
          {bestSellers.map((prod) => {
            const pricing = getProductPricing(prod)
            const qty = getCartQty(prod.id)
            
            return (
              <View key={prod.id} style={styles.bestSellerCard}>
                <TouchableOpacity 
                  onPress={() => router.push(`/product/${prod.id}`)}
                  activeOpacity={0.9}
                  style={styles.bestImageArea}
                >
                  {prod.image_url ? (
                    <Image source={{ uri: prod.image_url }} style={styles.bestProductImage} />
                  ) : (
                    <Text style={styles.bestEmoji}>{prod.emoji || '📦'}</Text>
                  )}
                  {pricing.discountPct > 0 && (
                    <View style={styles.bestBadge}>
                      <Text style={styles.bestBadgeText}>
                        {pricing.appliedOffer?.type === 'event_sale' ? 'SALE' : `${pricing.discountPct}% OFF`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.bestInfo}>
                  <Text style={styles.bestName} numberOfLines={2}>{prod.name}</Text>
                  <Text style={styles.bestUnit}>{prod.unit}</Text>
                  <View style={styles.bestBottom}>
                    <View>
                      <Text style={styles.bestPrice}>₹{pricing.price}</Text>
                      {pricing.discountPct > 0 && (
                        <Text style={styles.bestMrp}>₹{pricing.originalPrice}</Text>
                      )}
                    </View>
                    
                    {qty === 0 ? (
                      <TouchableOpacity 
                        style={styles.bestAddBtn}
                        onPress={() => handleAdd(prod)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bestAddText}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperMini}>
                        <TouchableOpacity 
                          style={styles.stepperMiniBtn}
                          onPress={() => updateQuantity(prod.id, qty - 1)}
                        >
                          <Text style={styles.stepperMiniText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperMiniQty}>{qty}</Text>
                        <TouchableOpacity 
                          style={styles.stepperMiniBtn}
                          onPress={() => updateQuantity(prod.id, qty + 1)}
                        >
                          <Text style={styles.stepperMiniText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Sticky view cart bar */}
      {items.length > 0 && (
        <View style={styles.stickyCartBar}>
          <View>
            <Text style={styles.stickyCartQty}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
            <Text style={styles.stickyCartPrice}>₹{totalCartValue}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewCartBtn}
            onPress={() => router.push('/cart')}
            activeOpacity={0.9}
          >
            <Text style={styles.viewCartBtnText}>View Cart</Text>
            <ChevronRight color="#FF6B00" size={20} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skeletonHeader: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  skeletonGridCell: {
    width: (SCREEN_WIDTH - 64) / 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  locationSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  deliveryPill: {
    backgroundColor: '#DCFCE7', // Success Soft
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deliveryPillText: {
    color: '#16A34A', // Success
    fontSize: 11,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: '#6B7280',
    fontSize: 13,
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF0E6', // Primary Soft
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF0E6',
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: 160,
    marginBottom: 20,
    position: 'relative',
  },
  bannerWrapper: {
    paddingHorizontal: 16,
    height: 150,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    resizeMode: 'stretch',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#FF6B00',
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  bannerSubtitleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  dotContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E9ECEF',
  },
  activeDot: {
    width: 14,
    backgroundColor: '#FF6B00',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  categoryScrollList: {
    paddingHorizontal: 16,
    gap: 16,
    flexDirection: 'row',
    marginBottom: 24,
  },
  catScrollCell: {
    alignItems: 'center',
    width: 72,
  },
  catIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA', // Surface
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 6,
  },
  catEmojiText: {
    fontSize: 24,
  },
  catLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D0D0D',
    textAlign: 'center',
    width: '90%',
  },
  orderAgainSection: {
    marginBottom: 24,
  },
  horizontalScrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  orderAgainCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  orderAgainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  orderAgainStore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D0D',
    flex: 1,
  },
  orderAgainItems: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 12,
  },
  orderAgainFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAgainPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  reorderBtn: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  reorderText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
  },
  flashDealsSection: {
    marginBottom: 24,
    backgroundColor: '#FFF0E6', // Primary Soft background
    paddingVertical: 16,
  },
  flashTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  countdownBox: {
    backgroundColor: '#EF4444', // Red
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  flashDealCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  flashImageArea: {
    height: 100,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    position: 'relative',
  },
  flashEmoji: {
    fontSize: 40,
  },
  flashBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  flashBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  flashCardBody: {
    padding: 8,
  },
  flashProdName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  flashProdUnit: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  flashCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  flashPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  flashMrp: {
    fontSize: 10,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  flashAddBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  flashAddText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 4,
    height: 24,
  },
  stepperMiniBtn: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMiniText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
  },
  stepperMiniQty: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  bestSellersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  bestSellerCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  bestImageArea: {
    height: 100,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    position: 'relative',
  },
  bestEmoji: {
    fontSize: 40,
  },
  bestBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FFF0E6',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bestBadgeText: {
    color: '#FF6B00',
    fontSize: 9,
    fontWeight: '700',
  },
  bestInfo: {
    padding: 8,
  },
  bestName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D0D0D',
    lineHeight: 16,
    height: 32,
  },
  bestUnit: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  bestBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  bestPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  bestMrp: {
    fontSize: 10,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  bestAddBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bestAddText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stickyCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stickyCartQty: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  stickyCartPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewCartBtnText: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '700',
  },
  flashProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bestProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
})