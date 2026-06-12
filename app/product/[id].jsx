import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Dimensions, SafeAreaView
} from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, ShoppingBag, Plus, Minus, Tag, ShieldCheck } from 'lucide-react-native'
import { getProductById, getProductVariants, getActiveOffers, getCustomerPrice, getDiscountPct } from '../../services/productService'
import useCartStore from '../../store/cartStore'
import VariantSelector from '../../components/product/VariantSelector'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams()
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { items, addItem, forceAddItem, updateQuantity, storeName } = useCartStore()

  useEffect(() => {
    loadProductData()
  }, [id])

  const loadProductData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch product details
      const prodRes = await getProductById(id)
      if (prodRes.error) throw new Error(prodRes.error)
      if (!prodRes.data) throw new Error('Product not found')

      const currentProduct = prodRes.data
      setProduct(currentProduct)

      // 2. Fetch variants if group exists
      if (currentProduct.product_group_id) {
        const variantsRes = await getProductVariants(currentProduct.product_group_id)
        if (!variantsRes.error && variantsRes.data) {
          setVariants(variantsRes.data)
        }
      } else {
        setVariants([])
      }

      // 3. Fetch active offers
      const offersRes = await getActiveOffers()
      if (!offersRes.error && offersRes.data) {
        setOffers(offersRes.data)
      }

    } catch (err) {
      console.error('ProductDetail load error:', err)
      setError(err.message || 'Failed to load product details.')
    } finally {
      setLoading(false)
    }
  }

  const getCartQty = () => {
    if (!product) return 0
    const item = items.find(i => i.id === product.id)
    return item?.quantity || 0
  }

  // Calculate pricing based on markups and offers
  const getProductPricing = () => {
    if (!product) return { originalPrice: 0, price: 0, discountPct: 0, appliedOffer: null }
    
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

  const handleAdd = () => {
    if (!product) return
    const pricing = getProductPricing()
    const cartProduct = {
      ...product,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#0D0D0D" size={24} />
          </TouchableOpacity>
        </View>
        <Skeleton width={SCREEN_WIDTH} height={300} style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />
        <View style={{ padding: 16 }}>
          <Skeleton width={180} height={24} />
          <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
          <Skeleton width={120} height={20} style={{ marginTop: 16 }} />
          <Skeleton width={SCREEN_WIDTH - 32} height={80} style={{ marginTop: 24 }} />
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.navBar, { borderBottomWidth: 1, borderBottomColor: '#E9ECEF' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#0D0D0D" size={24} />
          </TouchableOpacity>
        </View>
        <ErrorState message={error} onRetry={loadProductData} />
      </View>
    )
  }

  const pricing = getProductPricing()
  const qty = getCartQty()

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft color="#0D0D0D" size={22} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Product Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image Area */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.detailProductImage} />
          ) : (
            <Text style={styles.bigEmoji}>{product.emoji || '📦'}</Text>
          )}
          {pricing.discountPct > 0 && (
            <View style={styles.saleBadge}>
              <Tag color="#FFFFFF" size={12} />
              <Text style={styles.saleBadgeText}>
                {pricing.appliedOffer?.type === 'event_sale' ? 'EVENT SALE' : `${pricing.discountPct}% OFF`}
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productUnit}>{product.unit}</Text>

          {/* Price Container */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₹{pricing.price}</Text>
            {pricing.discountPct > 0 && (
              <Text style={styles.originalPrice}>₹{pricing.originalPrice}</Text>
            )}
          </View>

          {/* Offer Banner details */}
          {pricing.appliedOffer && (
            <View style={styles.offerCard}>
              <Text style={styles.offerTitle}>🏷️ Active Offer Applied</Text>
              <Text style={styles.offerDesc}>{pricing.appliedOffer.name || 'Promo discount applied on this item.'}</Text>
            </View>
          )}

          {/* Variant Selector */}
          <VariantSelector 
            variants={variants}
            currentProductId={product.id}
            onSelect={(newId) => router.replace(`/product/${newId}`)}
          />

          <View style={styles.divider} />

          {/* Product Description */}
          <View style={styles.descContainer}>
            <Text style={styles.descTitle}>Product Description</Text>
            <Text style={styles.descText}>
              {product.description || `Fresh and high-quality ${product.name} delivered straight to your doorstep. Perfect for your daily household needs.`}
            </Text>
          </View>

          {/* Trust Banner */}
          <View style={styles.trustBanner}>
            <ShieldCheck color="#16A34A" size={20} />
            <Text style={styles.trustText}>100% Quality Guaranteed | Superfast Delivery</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.9}>
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => updateQuantity(product.id, qty - 1)}
              activeOpacity={0.8}
            >
              <Minus color="#FF6B00" size={20} />
            </TouchableOpacity>
            <Text style={styles.stepperQty}>{qty}</Text>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => updateQuantity(product.id, qty + 1)}
              activeOpacity={0.8}
            >
              <Plus color="#FF6B00" size={20} />
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  navBar: {
    height: 96,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
    marginLeft: 12,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    height: 280,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  detailProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bigEmoji: {
    fontSize: 120,
  },
  saleBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  infoSection: {
    padding: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  productUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D0D0D',
  },
  originalPrice: {
    fontSize: 18,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  offerCard: {
    backgroundColor: '#FFF0E6', // Primary Soft
    borderWidth: 1,
    borderColor: '#FF6B00', // Primary
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B00',
  },
  offerDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 24,
  },
  descContainer: {
    marginBottom: 24,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  trustText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 10,
  },
  addBtn: {
    backgroundColor: '#FF6B00', // Primary
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0E6',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
    overflow: 'hidden',
  },
  stepperBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B00',
    paddingHorizontal: 24,
  },
})
