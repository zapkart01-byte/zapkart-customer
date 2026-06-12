import { Tabs } from 'expo-router'
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react-native'
import useCartStore from '../../store/cartStore'

export default function TabsLayout() {
  const items = useCartStore(state => state.items)
  const cartCount = items ? items.reduce((sum, item) => sum + item.quantity, 0) : 0

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF', // design system Border
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        tabBarActiveTintColor: '#FF6B00', // design system Primary
        tabBarInactiveTintColor: '#6B7280', // design system Text Secondary
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size || 22} />
          )
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size || 22} />
          )
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart color={color} size={size || 22} />
          ),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FF6B00',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
            lineHeight: 14,
            height: 16,
            minWidth: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Package color={color} size={size || 22} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size || 22} />
          )
        }}
      />
    </Tabs>
  )
}
