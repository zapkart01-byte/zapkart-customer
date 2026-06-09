import {
  View, Text, ScrollView, TouchableOpacity,
  FlatList, TextInput, StyleSheet, RefreshControl
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { getCategories, getProducts, getBanners } from '../../services/productService'
import { getCustomerPrice, getDiscountPct } from '../../services/productService'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

export default function HomeScreen() {
  const [categories,    setCategories]    = useState([])
  const [products,      setProducts]      = useState([])
  const [banners,       setBanners]       = useState([])
  const [selectedCat,   setSelectedCat]   = useState(null)
  const [search,        setSearch]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const { addItem, updateQuantity, items } = useCartStore()
  const { user }                          = useAuthStore()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [cats, prods, bans] = await Promise.all([
      getCategories(), getProducts(), getBanners()
    ])
    if (cats.data)   setCategories(cats.data)
    if (prods.data)  setProducts(prods.data)
    if (bans.data)   setBanners(bans.data)
    setLoading(false)
    setRefreshing(false)
  }

  const filteredProducts = products.filter(p => {
    const matchesCat    = !selectedCat || p.category_id === selectedCat
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const getCartQty = (productId) => {
    const item = items.find(i => i.id === productId)
    return item?.quantity || 0
  }

  const handleAdd = (product) => {
    const result = addItem(product)
    if (result.needsConfirmation) {
      // Show alert about clearing cart
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }}
          colors={['#FF6B00']} />
      }
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.location}>📍 Select Location ▾</Text>
          <Text style={styles.city}>Bengaluru, Karnataka</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.bell}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Delivery time pill */}
      <View style={styles.deliveryPill}>
        <Text style={styles.deliveryText}>🟢 Delivery in 28-35 min</Text>
      </View>

      {/* Search + AI button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder='Search groceries, snacks...'
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => router.push('/ai-cart')}
        >
          <Text style={styles.aiButtonText}>✨</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      {banners.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>⚡ FLASH SALE</Text>
          <Text style={styles.bannerTitle}>Flat ₹100 OFF</Text>
          <Text style={styles.bannerSub}>On orders above ₹299</Text>
        </View>
      )}

      {/* Shop by Category */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, selectedCat === item.id && styles.catChipActive]}
            onPress={() => setSelectedCat(selectedCat === item.id ? null : item.id)}
          >
            <Text style={styles.catEmoji}>{item.emoji}</Text>
            <Text style={[styles.catName, selectedCat === item.id && styles.catNameActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Products Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCat
            ? categories.find(c => c.id === selectedCat)?.name
            : 'All Products'}{' '}
          <Text style={styles.productCount}>({filteredProducts.length})</Text>
        </Text>
      </View>

      <View style={styles.productGrid}>
        {filteredProducts.map(product => {
          const customerPrice = getCustomerPrice(product.store_price, product.platform_mrp)
          const discountPct   = getDiscountPct(customerPrice, product.platform_mrp)
          const qty           = getCartQty(product.id)

          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <View style={styles.productImageArea}>
                <Text style={styles.productEmoji}>🛒</Text>
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
                      <Text style={styles.addButtonText}>ADD</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(product.id, qty - 1)}
                      >
                        <Text style={styles.stepperText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(product.id, qty + 1)}
                      >
                        <Text style={styles.stepperText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:      { color: '#FF6B00', fontSize: 16 },
  topBar:           { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', padding: 16, paddingTop: 56 },
  location:         { fontSize: 14, fontWeight: '700', color: '#0D0D0D' },
  city:             { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  bell:             { fontSize: 22 },
  deliveryPill:     { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#DCFCE7',
                      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
                      alignSelf: 'flex-start' },
  deliveryText:     { color: '#16A34A', fontSize: 12, fontWeight: '600' },
  searchRow:        { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 },
  searchBar:        { flex: 1, flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#F8F9FA', borderRadius: 10, paddingHorizontal: 12,
                      height: 44 },
  searchIcon:       { fontSize: 16, marginRight: 8 },
  searchInput:      { flex: 1, fontSize: 14, color: '#0D0D0D' },
  aiButton:         { backgroundColor: '#FFF0E6', borderRadius: 10, width: 44, height: 44,
                      alignItems: 'center', justifyContent: 'center' },
  aiButtonText:     { fontSize: 20 },
  banner:           { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FF6B00',
                      borderRadius: 14, padding: 16 },
  bannerTag:        { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  bannerTitle:      { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 4 },
  bannerSub:        { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', marginHorizontal: 16, marginBottom: 12 },
  sectionTitle:     { fontSize: 17, fontWeight: '700', color: '#0D0D0D' },
  productCount:     { fontSize: 14, color: '#9CA3AF', fontWeight: '400' },
  seeAll:           { color: '#FF6B00', fontSize: 13, fontWeight: '600' },
  catList:          { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  catChip:          { backgroundColor: '#FFFFFF', borderRadius: 999, borderWidth: 1,
                      borderColor: '#E9ECEF', paddingHorizontal: 16, paddingVertical: 8,
                      flexDirection: 'row', alignItems: 'center', gap: 6 },
  catChipActive:    { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  catEmoji:         { fontSize: 16 },
  catName:          { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  catNameActive:    { color: '#FFFFFF', fontWeight: '700' },
  productGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  productCard:      { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  productImageArea: { height: 100, backgroundColor: '#F8F9FA', borderRadius: 12,
                      alignItems: 'center', justifyContent: 'center',
                      borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  productEmoji:     { fontSize: 40 },
  discountBadge:    { position: 'absolute', top: 8, left: 8, backgroundColor: '#FFF0E6',
                      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discountText:     { color: '#FF6B00', fontSize: 10, fontWeight: '700' },
  productInfo:      { padding: 10 },
  productName:      { fontSize: 13, fontWeight: '700', color: '#0D0D0D', lineHeight: 18 },
  productUnit:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  productBottom:    { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'flex-end', marginTop: 8 },
  productPrice:     { fontSize: 14, fontWeight: '700', color: '#0D0D0D' },
  productMrp:       { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  addButton:        { backgroundColor: '#FF6B00', borderRadius: 6, paddingHorizontal: 12,
                      paddingVertical: 6 },
  addButtonText:    { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  stepper:          { flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#FFF0E6', borderRadius: 6, overflow: 'hidden' },
  stepperBtn:       { paddingHorizontal: 10, paddingVertical: 6 },
  stepperText:      { color: '#FF6B00', fontSize: 16, fontWeight: '700' },
  stepperQty:       { color: '#FF6B00', fontSize: 14, fontWeight: '700', paddingHorizontal: 6 },
})