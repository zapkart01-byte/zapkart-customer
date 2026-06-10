import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'

export default function NotificationsScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [promotions, setPromotions] = useState(true)
  const [newProducts, setNewProducts] = useState(false)
  const [priceDrops, setPriceDrops] = useState(true)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PUSH NOTIFICATIONS</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📦</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Order Updates</Text>
                  <Text style={styles.settingDesc}>Get notified about order status</Text>
                </View>
              </View>
              <Switch
                value={orderUpdates}
                onValueChange={setOrderUpdates}
                trackColor={{ false: '#E9ECEF', true: '#FFD4B8' }}
                thumbColor={orderUpdates ? '#FF6B00' : '#F8F9FA'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🎉</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Promotions & Offers</Text>
                  <Text style={styles.settingDesc}>Get deals and discounts</Text>
                </View>
              </View>
              <Switch
                value={promotions}
                onValueChange={setPromotions}
                trackColor={{ false: '#E9ECEF', true: '#FFD4B8' }}
                thumbColor={promotions ? '#FF6B00' : '#F8F9FA'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>✨</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>New Products</Text>
                  <Text style={styles.settingDesc}>When stores add new items</Text>
                </View>
              </View>
              <Switch
                value={newProducts}
                onValueChange={setNewProducts}
                trackColor={{ false: '#E9ECEF', true: '#FFD4B8' }}
                thumbColor={newProducts ? '#FF6B00' : '#F8F9FA'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>💰</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Price Drops</Text>
                  <Text style={styles.settingDesc}>When items go on sale</Text>
                </View>
              </View>
              <Switch
                value={priceDrops}
                onValueChange={setPriceDrops}
                trackColor={{ false: '#E9ECEF', true: '#FFD4B8' }}
                thumbColor={priceDrops ? '#FF6B00' : '#F8F9FA'}
              />
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            You'll always receive important notifications about your orders, even if you disable these settings.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
  section:        { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle:   { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8,
                    letterSpacing: 0.5 },
  card:           { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
  settingRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 8 },
  settingLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon:    { fontSize: 24, marginRight: 12 },
  settingText:    { flex: 1 },
  settingTitle:   { fontSize: 15, fontWeight: '600', color: '#0D0D0D' },
  settingDesc:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider:        { height: 1, backgroundColor: '#F8F9FA', marginVertical: 8 },
  infoBox:        { flexDirection: 'row', margin: 16, padding: 12, backgroundColor: '#FFF7ED',
                    borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5' },
  infoIcon:       { fontSize: 20, marginRight: 8 },
  infoText:       { flex: 1, fontSize: 12, color: '#9A3412', lineHeight: 18 },
})
