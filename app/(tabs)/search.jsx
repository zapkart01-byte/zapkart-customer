import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Alert, Image
} from 'react-native'
import { useState, useEffect } from 'react'
import { Search, Sparkles, ShoppingCart, Plus, Minus, ArrowRight } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { getProducts, getCustomerPrice, getDiscountPct } from '../../services/productService'
import useCartStore from '../../store/cartStore'

const POPULAR_SUGGESTIONS = [
  'Fresh Milk', 'Paneer', 'Aata', 'Basmati Rice', 'Cooking Oil',
  'Chips & Snacks', 'Cold Drinks', 'Chocolates'
]

export default function SearchScreen() {
  const params = useLocalSearchParams()
  const cat = params.cat

  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { addItem, forceAddItem, updateQuantity, items, storeName } = useCartStore()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchErr } = await getProducts()
    if (fetchErr) {
      setError(fetchErr)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const getCartQty = (productId) => {
    const item = items.find(i => i.id === productId)
    return item?.quantity || 0
  }

  const handleAdd = (product) => {
    const result = addItem(product)
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
            onPress: () => forceAddItem(product)
          }
        ]
      )
    }
  }

  const activeCategoryName = products.find(p => p.category_id === cat)?.categories?.name || 'Category'

  const filteredProducts = products.filter(product => {
    // If a category is selected via URL query param
    if (cat && product.category_id === cat) {
      if (query) {
        const term = query.toLowerCase()
        return (
          product.name?.toLowerCase().includes(term) ||
          product.categories?.name?.toLowerCase().includes(term)
        )
      }
      return true
    }

    // Otherwise, normal text search (only show results if query is entered)
    if (!query) return false
    const term = query.toLowerCase()
    return (
      product.name?.toLowerCase().includes(term) ||
      product.categories?.name?.toLowerCase().includes(term)
    )
  })

  return (
    <View style={styles.container}>
      {/* Header Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search color="#6B7280" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items, categories..."
              placeholderTextColor="#6B7280"
              value={query}
              onChangeText={setQuery}
              autoFocus={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push('/ai-cart')}
            activeOpacity={0.8}
          >
            <Sparkles color="#FF6B00" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Fetching products...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Something went wrong!</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {query.length === 0 && !cat ? (
            <View style={styles.suggestSection}>
              <Text style={styles.sectionTitle}>Popular Searches</Text>
              <View style={styles.chipGrid}>
                {POPULAR_SUGGESTIONS.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => setQuery(item)}
                  >
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              {cat && (
                <View style={styles.categoryFilterContainer}>
                  <Text style={styles.categoryFilterLabel}>Filtering by:</Text>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{activeCategoryName}</Text>
                    <TouchableOpacity 
                      style={styles.categoryChipClose} 
                      onPress={() => router.setParams({ cat: undefined })}
                    >
                      <Text style={styles.categoryChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try searching for paneer, milk, or chocolates instead.</Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {cat && (
                <View style={styles.categoryFilterContainer}>
                  <Text style={styles.categoryFilterLabel}>Filtering by:</Text>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{activeCategoryName}</Text>
                    <TouchableOpacity 
                      style={styles.categoryChipClose} 
                      onPress={() => router.setParams({ cat: undefined })}
                    >
                      <Text style={styles.categoryChipCloseText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <Text style={styles.sectionTitle}>Search Results ({filteredProducts.length})</Text>
              <View style={styles.productGrid}>
                {filteredProducts.map(product => {
                  const customerPrice = getCustomerPrice(product.store_price, product.platform_mrp)
                  const discountPct = getDiscountPct(customerPrice, product.platform_mrp)
                  const qty = getCartQty(product.id)

                  return (
                    <View key={product.id} style={styles.productCard}>
                      <View style={styles.productImageArea}>
                        {product.image_url ? (
                          <Image source={{ uri: product.image_url }} style={styles.searchProductImage} />
                        ) : (
                          <Text style={styles.productEmoji}>{product.emoji || '📦'}</Text>
                        )}
                        {discountPct > 0 && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discountPct}% OFF</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        <Text style={styles.productUnit}>{product.unit}</Text>
                        <View style={styles.productBottom}>
                          <View>
                            <Text style={styles.productPrice}>₹{customerPrice}</Text>
                            {discountPct > 0 && (
                              <Text style={styles.productMrp}>₹{product.platform_mrp}</Text>
                            )}
                          </View>

                          {qty === 0 ? (
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => handleAdd(product)}
                            >
                              <Plus color="#FFFFFF" size={16} />
                              <Text style={styles.addButtonText}>ADD</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.stepper}>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => updateQuantity(product.id, qty - 1)}
                              >
                                <Minus color="#FF6B00" size={14} />
                              </TouchableOpacity>
                              <Text style={styles.stepperQty}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() => updateQuantity(product.id, qty + 1)}
                              >
                                <Plus color="#FF6B00" size={14} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0D0D0D',
  },
  clearText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF0E6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  suggestSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  resultsContainer: {
    marginTop: 8,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageArea: {
    height: 100,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    position: 'relative',
  },
  productEmoji: {
    fontSize: 36,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFF0E6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0D0D',
    lineHeight: 18,
    height: 36,
  },
  productUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  productMrp: {
    fontSize: 11,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 6,
  },
  stepperBtn: {
    padding: 6,
  },
  stepperQty: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  searchProductImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#FFE0CC',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '700',
  },
  categoryChipClose: {
    backgroundColor: '#FF6B00',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipCloseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
})

