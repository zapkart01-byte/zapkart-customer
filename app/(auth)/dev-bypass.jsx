import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import useAuthStore from '../../store/authStore'

export default function DevBypassScreen() {
  const { setUser } = useAuthStore()

  const handleSkipAuth = () => {
    // Mock user for development
    const mockUser = {
      id: 'dev-user-1',
      phone: '+919876543210',
      name: 'Test User',
      created_at: new Date().toISOString()
    }
    const mockToken = 'dev-token-123'
    
    setUser(mockUser, mockToken)
    router.replace('/(tabs)')
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🛠️</Text>
        <Text style={styles.heading}>Development Mode</Text>
        <Text style={styles.subtitle}>
          Skip authentication for testing
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSkipAuth}
        >
          <Text style={styles.buttonText}>Skip Auth & Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            ⚠️ This bypasses authentication.{'\n'}
            Use only for UI testing when backend is not running.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FFFFFF' },
  content:    { flex: 1, padding: 24, paddingTop: 100, alignItems: 'center' },
  emoji:      { fontSize: 64, marginBottom: 16 },
  heading:    { fontSize: 28, fontWeight: '800', color: '#0D0D0D', textAlign: 'center' },
  subtitle:   { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  button:     { width: '100%', backgroundColor: '#FF6B00', borderRadius: 14, height: 52,
                alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  back:       { textAlign: 'center', marginTop: 16, color: '#9CA3AF', fontSize: 13 },
  note:       { marginTop: 40, backgroundColor: '#FFF0E6', borderRadius: 12, padding: 16 },
  noteText:   { fontSize: 12, color: '#FF6B00', textAlign: 'center', lineHeight: 18 },
})
