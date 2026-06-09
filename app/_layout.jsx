import { Stack } from 'expo-router'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { router } from 'expo-router'

export default function RootLayout() {
  const { isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)"  />
      <Stack.Screen name="(tabs)"  />
      <Stack.Screen name="product/[id]"            options={{ presentation: 'modal' }} />
      <Stack.Screen name="checkout"                />
      <Stack.Screen name="order-success"           />
      <Stack.Screen name="tracking/[orderId]"      />
      <Stack.Screen name="ai-cart"                 />
    </Stack>
  )
}