import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import useAuthStore from '../../store/authStore'
import { logout as authLogout } from '../../services/authService'

export default function ProfileScreen() {
  const { user, clearUser } = useAuthStore()

  const getInitials = () => {
    if (!user?.name) return user?.phone?.slice(-2) || 'ME'
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const getJoinedDate = () => {
    if (!user?.created_at) return 'Recently'
    const date = new Date(user.created_at)
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authLogout()
            clearUser()
            router.replace('/(auth)/welcome')
          }
        }
      ]
    )
  }

  const menuSections = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: '👤', label: 'Edit Profile', route: '/profile/edit' },
        { icon: '📍', label: 'Saved Addresses', route: '/addresses' },
        { icon: '🔔', label: 'Notifications', route: '/notifications' }
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: '❓', label: 'Help & FAQ', route: '/help' },
        { icon: '💬', label: 'Contact Support', route: '/support' },
        { icon: '📄', label: 'Terms & Conditions', route: '/terms' }
      ]
    }
  ]

  const stats = [
    {
      label: 'Total Orders',
      value: user?.order_count || '0'
    },
    {
      label: 'Total Saved',
      value: `₹${user?.total_savings || '0'}`
    },
    {
      label: 'Joined',
      value: getJoinedDate()
    }
  ]

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Gradient */}
        <LinearGradient
          colors={['#FF6B00', '#FF8E3C']}
          style={styles.header}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '+91 XXXXXXXXXX'}</Text>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push(item.route)}
                  >
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuArrow}>→</Text>
                  </TouchableOpacity>
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F8F9FA' },
  header:           { height: 200, alignItems: 'center', justifyContent: 'center',
                      paddingTop: 40 },
  avatar:           { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF',
                      alignItems: 'center', justifyContent: 'center', borderWidth: 3,
                      borderColor: 'rgba(255, 255, 255, 0.3)' },
  avatarText:       { fontSize: 24, fontWeight: '700', color: '#FF6B00' },
  userName:         { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },
  userPhone:        { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 },
  statsContainer:   { flexDirection: 'row', marginHorizontal: 16, marginTop: -20, gap: 8 },
  statCard:         { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
                      alignItems: 'center', shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07,
                      shadowRadius: 8, elevation: 3 },
  statValue:        { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  statLabel:        { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  section:          { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle:     { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8,
                      letterSpacing: 0.5 },
  menuCard:         { backgroundColor: '#FFFFFF', borderRadius: 12,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  menuItem:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon:         { fontSize: 20, marginRight: 12 },
  menuLabel:        { flex: 1, fontSize: 15, color: '#0D0D0D', fontWeight: '500' },
  menuArrow:        { fontSize: 16, color: '#9CA3AF' },
  menuDivider:      { height: 1, backgroundColor: '#F8F9FA', marginHorizontal: 16 },
  logoutButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#FFFFFF', borderRadius: 12, margin: 16,
                      marginTop: 24, padding: 16 },
  logoutIcon:       { fontSize: 20, marginRight: 8 },
  logoutText:       { fontSize: 15, fontWeight: '700', color: '#EF4444' },
})
