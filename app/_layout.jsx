import { Stack } from 'expo-router'
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { supabase } from '../services/supabase'

// Only configure notification handler on native
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

export default function RootLayout() {
  const { isLoggedIn, user } = useAuthStore()

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [])

  useEffect(() => {
    if (Platform.OS === 'web') return

    // Register push notification token on login/load
    if (isLoggedIn() && user?.id) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          savePushTokenToDatabase(user.id, token)
        }
      })
    }

    // Listener for foreground notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification)
    })

    // Listener for notification responses (taps in foreground/background)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response)
      const data = response.notification.request.content.data
      
      // Navigate to correct screen based on notification payload
      if (data && data.orderId) {
        router.push(`/tracking/${data.orderId}`)
      } else if (data && data.screen) {
        router.push(data.screen)
      }
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }, [user?.id])

  const savePushTokenToDatabase = async (userId, token) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ expo_push_token: token })
        .eq('id', userId)

      if (error) throw error
      console.log('Push token saved to Supabase successfully')
    } catch (err) {
      console.error('Failed to save push token to Supabase:', err.message)
    }
  }

  async function registerForPushNotificationsAsync() {
    let token
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return null
    }
    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || 'zapkart-app'
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
      console.log('Expo Push Token:', token)
    } catch (e) {
      console.warn('Error fetching expo push token:', e.message)
    }

    return token
  }

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