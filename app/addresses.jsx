import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { router } from 'expo-router'

export default function AddressesScreen() {
  // Placeholder for future address management
  const savedAddresses = []

  const handleAddAddress = () => {
    Alert.alert('Coming Soon', 'Address management will be available in the next update')
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity onPress={handleAddAddress}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {savedAddresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No Saved Addresses</Text>
            <Text style={styles.emptyText}>
              You can save your delivery addresses for faster checkout
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddAddress}>
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savedAddresses.map((address, index) => (
            <View key={index} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressType}>{address.type}</Text>
                <TouchableOpacity>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>{address.fullAddress}</Text>
              <Text style={styles.addressPhone}>{address.phone}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FA' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, paddingTop: 56, backgroundColor: '#FFFFFF',
                    borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backArrow:      { fontSize: 24, color: '#0D0D0D' },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  addButton:      { fontSize: 28, color: '#FF6B00', fontWeight: '300' },
  content:        { flexGrow: 1 },
  emptyState:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
                    marginTop: 80 },
  emptyIcon:      { fontSize: 64, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#0D0D0D', marginBottom: 8 },
  emptyText:      { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24,
                    lineHeight: 20 },
  emptyButton:    { backgroundColor: '#FF6B00', borderRadius: 12, paddingHorizontal: 24,
                    paddingVertical: 12 },
  emptyButtonText:{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  addressCard:    { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, margin: 16,
                    marginBottom: 8 },
  addressHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  addressType:    { fontSize: 13, fontWeight: '700', color: '#FF6B00', textTransform: 'uppercase' },
  editText:       { fontSize: 13, fontWeight: '600', color: '#0D0D0D' },
  addressText:    { fontSize: 14, color: '#0D0D0D', lineHeight: 20, marginBottom: 4 },
  addressPhone:   { fontSize: 13, color: '#6B7280' },
})
