import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import useAuthStore from '../../store/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function NameScreen() {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const { user, token, updateName } = useAuthStore()

  const handleContinue = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      // Save name to local store
      updateName(name.trim())

      // Save name to backend users table via service role
      if (user?.id && token) {
        try {
          await fetch(`${API_URL}/auth/mobile/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: name.trim() })
          })
        } catch (fetchErr) {
          console.warn('Failed to save name to backend:', fetchErr.message)
        }
      }

      // Also save name to AsyncStorage user_data
      try {
        const userData = await AsyncStorage.getItem('user_data')
        if (userData) {
          const parsed = JSON.parse(userData)
          parsed.name = name.trim()
          await AsyncStorage.setItem('user_data', JSON.stringify(parsed))
        }
      } catch (storeErr) {
        console.warn('Failed to update AsyncStorage user_data:', storeErr.message)
      }

      router.replace('/(tabs)')
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.heading}>What should we call you?</Text>
        <Text style={styles.subtitle}>Help us personalize your experience</Text>

        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#C4C4C4"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        <TouchableOpacity
          style={[styles.button, (!name.trim() || saving) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!name.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skip}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  content:        { flex: 1, padding: 24, paddingTop: 100, alignItems: 'center' },
  emoji:          { fontSize: 64, marginBottom: 16 },
  heading:        { fontSize: 28, fontWeight: '800', color: '#0D0D0D', textAlign: 'center' },
  subtitle:       { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  input:          { width: '100%', height: 54, borderWidth: 2, borderColor: '#E9ECEF',
                    borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#0D0D0D',
                    marginTop: 32 },
  button:         { width: '100%', backgroundColor: '#FF6B00', borderRadius: 14, height: 52,
                    alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#F8F9FA' },
  buttonText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skip:           { textAlign: 'center', marginTop: 16, color: '#9CA3AF', fontSize: 13 },
})
