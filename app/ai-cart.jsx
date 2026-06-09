import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { parseTextList, parseImageList } from '../.claude/services/aiCartService'
import useCartStore from '../store/cartStore'

export default function AICartScreen() {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const { addItem } = useCartStore()

  const exampleChips = [
    '2L milk, 6 eggs, bread',
    'Weekly groceries',
    'Party snacks'
  ]

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true
    })

    if (!result.canceled && result.assets[0].base64) {
      processImage(result.assets[0].base64)
    }
  }

  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true
    })

    if (!result.canceled && result.assets[0].base64) {
      processImage(result.assets[0].base64)
    }
  }

  const processImage = async (base64) => {
    setLoading(true)
    setResults(null)
    const { data, error } = await parseImageList(base64)
    setLoading(false)

    if (error) {
      Alert.alert('Error', error)
    } else if (data) {
      setResults(data)
      // Auto-select all matched items
      setSelectedItems(data.matched.map(item => item.id))
    }
  }

  const handleSend = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setResults(null)
    const { data, error } = await parseTextList(inputText.trim())
    setLoading(false)

    if (error) {
      Alert.alert('Error', error)
    } else if (data) {
      setResults(data)
      // Auto-select all matched items
      setSelectedItems(data.matched.map(item => item.id))
    }
  }

  const toggleItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const getItemQuantity = (itemId) => {
    const item = results?.matched.find(m => m.id === itemId)
    return item?.quantity || 1
  }

  const updateItemQuantity = (itemId, delta) => {
    setResults(prev => ({
      ...prev,
      matched: prev.matched.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item
      )
    }))
  }

  const handleProceed = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please select at least one item')
      return
    }

    // Add all selected items to cart
    results.matched.forEach(item => {
      if (selectedItems.includes(item.id)) {
        addItem(item.product, item.quantity || 1)
      }
    })

    router.push('/checkout')
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Add ✨</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!results && !loading && (
          <>
            {/* Center Content */}
            <View style={styles.centerContent}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.instruction}>
                Add items by typing or photo
              </Text>
              
              {/* Example Chips */}
              <View style={styles.chipsContainer}>
                {exampleChips.map((chip, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => setInputText(chip)}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Finding your items</Text>
            <View style={styles.dotsContainer}>
              <Text style={styles.dots}>...</Text>
            </View>
          </View>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {/* Matched Items */}
            {results.matched.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>
                  Found {results.matched.length} items
                </Text>
                {results.matched.map((item) => {
                  const isSelected = selectedItems.includes(item.id)
                  const qty = getItemQuantity(item.id)
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.productCard, isSelected && styles.productCardSelected]}
                      onPress={() => toggleItem(item.id)}
                    >
                      <View style={styles.productImage}>
                        <Text style={{ fontSize: 32 }}>🛒</Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.product.name}</Text>
                        <Text style={styles.productUnit}>{item.product.unit}</Text>
                        <Text style={styles.productPrice}>
                          ₹{item.product.store_price + 1}
                        </Text>
                      </View>
                      <View style={styles.productRight}>
                        {isSelected ? (
                          <>
                            <View style={styles.stepper}>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={(e) => {
                                  e.stopPropagation()
                                  updateItemQuantity(item.id, -1)
                                }}
                              >
                                <Text style={styles.stepperText}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.stepperQty}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={(e) => {
                                  e.stopPropagation()
                                  updateItemQuantity(item.id, 1)
                                }}
                              >
                                <Text style={styles.stepperText}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.checkmark}>✓</Text>
                          </>
                        ) : (
                          <View style={styles.unchecked} />
                        )}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Not Found */}
            {results.notFound && results.notFound.length > 0 && (
              <View style={styles.notFoundSection}>
                <Text style={styles.notFoundTitle}>Not found</Text>
                {results.notFound.map((item, index) => (
                  <Text key={index} style={styles.notFoundItem}>• {item}</Text>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setResults(null)
                  setSelectedItems([])
                }}
              >
                <Text style={styles.editButtonText}>✏️ Edit My List</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceed}
              >
                <Text style={styles.proceedButtonText}>
                  ✅ Proceed to Checkout →
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.cameraButton} onPress={handleGallery}>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type anything... milk, eggs, bread"
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  header:             { flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between', padding: 16, paddingTop: 56 },
  backArrow:          { fontSize: 24, color: '#0D0D0D' },
  headerTitle:        { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  centerContent:      { alignItems: 'center', justifyContent: 'center',
                        paddingTop: 80, paddingHorizontal: 24 },
  sparkleIcon:        { fontSize: 56, marginBottom: 16 },
  instruction:        { fontSize: 16, color: '#6B7280', textAlign: 'center',
                        marginBottom: 24, lineHeight: 24 },
  chipsContainer:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip:               { backgroundColor: '#F8F9FA', borderRadius: 999, paddingHorizontal: 16,
                        paddingVertical: 8 },
  chipText:           { fontSize: 13, color: '#6B7280' },
  loadingContainer:   { alignItems: 'center', paddingTop: 100 },
  loadingText:        { fontSize: 16, color: '#0D0D0D', marginTop: 16, fontWeight: '600' },
  dotsContainer:      { marginTop: 8 },
  dots:               { fontSize: 20, color: '#FF6B00', fontWeight: '700' },
  resultsSection:     { padding: 16 },
  sectionTitle:       { fontSize: 17, fontWeight: '700', color: '#0D0D0D', marginBottom: 12 },
  productCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
                        borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 2,
                        borderColor: 'transparent' },
  productCardSelected: { borderColor: '#16A34A', backgroundColor: '#DCFCE7' },
  productImage:       { width: 56, height: 56, backgroundColor: '#FFFFFF', borderRadius: 8,
                        alignItems: 'center', justifyContent: 'center' },
  productInfo:        { flex: 1, marginLeft: 12 },
  productName:        { fontSize: 14, fontWeight: '700', color: '#0D0D0D' },
  productUnit:        { fontSize: 12, color: '#6B7280', marginTop: 2 },
  productPrice:       { fontSize: 14, fontWeight: '700', color: '#0D0D0D', marginTop: 4 },
  productRight:       { alignItems: 'center', gap: 8 },
  stepper:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B00',
                        borderRadius: 6, overflow: 'hidden' },
  stepperBtn:         { paddingHorizontal: 8, paddingVertical: 4 },
  stepperText:        { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stepperQty:         { color: '#FFFFFF', fontSize: 13, fontWeight: '700', paddingHorizontal: 6 },
  checkmark:          { fontSize: 20, color: '#16A34A' },
  unchecked:          { width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                        borderColor: '#E9ECEF' },
  notFoundSection:    { padding: 16, paddingTop: 0 },
  notFoundTitle:      { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  notFoundItem:       { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  actionButtons:      { padding: 16, gap: 12 },
  editButton:         { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14,
                        alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF' },
  editButtonText:     { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  proceedButton:      { backgroundColor: '#FF6B00', borderRadius: 14, paddingVertical: 14,
                        alignItems: 'center' },
  proceedButtonText:  { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  inputBar:           { position: 'absolute', bottom: 0, left: 0, right: 0,
                        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
                        padding: 16, paddingBottom: 32, borderTopWidth: 1,
                        borderTopColor: '#E9ECEF', gap: 8 },
  cameraButton:       { width: 40, height: 40, backgroundColor: '#F8F9FA', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center' },
  cameraIcon:         { fontSize: 20 },
  input:              { flex: 1, fontSize: 14, color: '#0D0D0D', maxHeight: 80 },
  sendButton:         { width: 40, height: 40, backgroundColor: '#FF6B00', borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#E9ECEF' },
  sendIcon:           { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
})
