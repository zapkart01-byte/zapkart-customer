import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { router } from 'expo-router'

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Text style={styles.emoji}>🛵</Text>
        <Text style={styles.tagline}>Groceries in 30 minutes</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Your neighbourhood,{'\n'}delivered ⚡</Text>
        <Text style={styles.subtitle}>
          Order from local stores and get fresh groceries at your door
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/phone')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/phone')}>
          <Text style={styles.signIn}>
            Already have an account?{' '}
            <Text style={styles.signInLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFFFFF' },
  illustration: { flex: 0.45, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0E6' },
  emoji:        { fontSize: 80 },
  tagline:      { fontSize: 14, color: '#FF6B00', fontWeight: '600', marginTop: 8 },
  content:      { flex: 0.55, padding: 24 },
  heading:      { fontSize: 28, fontWeight: '800', color: '#0D0D0D', lineHeight: 36 },
  subtitle:     { fontSize: 15, color: '#6B7280', marginTop: 12, lineHeight: 22 },
  button:       { backgroundColor: '#FF6B00', borderRadius: 14, height: 52,
                  alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  buttonText:   { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  signIn:       { textAlign: 'center', marginTop: 16, color: '#6B7280', fontSize: 13 },
  signInLink:   { color: '#FF6B00', fontWeight: '600' },
})