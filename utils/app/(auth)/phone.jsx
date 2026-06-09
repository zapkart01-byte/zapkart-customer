import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { sendOTP } from '../../services/authService'

export default function PhoneScreen() {
  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a 10-digit phone number')
      return
    }
    setLoading(true)
    const { success, error } = await sendOTP('+91' + phone)
    setLoading(false)
    if (success) {
      router.push({ pathname: '/(auth)/otp', params: { phone: '+91' + phone } })
    } else {
      Alert.alert('Error', error || 'Could not send OTP. Try again.')
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.heading}>What's your number?</Text>
        <Text style={styles.subtitle}>We'll send a one-time password to verify</Text>

        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixFlag}>🇮🇳</Text>
            <Text style={styles.prefixCode}>+91</Text>
          </View>
          <View style={styles.divider} />
          <TextInput
            style={styles.input}
            placeholder="98765 43210"
            placeholderTextColor="#C4C4C4"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (phone.length !== 10 || loading) && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={phone.length !== 10 || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FFFFFF' },
  back:            { padding: 20, paddingTop: 60 },
  backText:        { fontSize: 16, color: '#6B7280' },
  content:         { flex: 1, padding: 24 },
  heading:         { fontSize: 28, fontWeight: '800', color: '#0D0D0D' },
  subtitle:        { fontSize: 14, color: '#6B7280', marginTop: 8 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderWidth: 2,
                     borderColor: '#E9ECEF', borderRadius: 12, height: 56,
                     marginTop: 32, overflow: 'hidden' },
  prefix:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  prefixFlag:      { fontSize: 18 },
  prefixCode:      { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  divider:         { width: 1, height: '60%', backgroundColor: '#E9ECEF' },
  input:           { flex: 1, paddingHorizontal: 12, fontSize: 16, color: '#0D0D0D' },
  button:          { backgroundColor: '#FF6B00', borderRadius: 14, height: 52,
                     alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonDisabled:  { backgroundColor: '#F8F9FA' },
  buttonText:      { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  terms:           { textAlign: 'center', marginTop: 16, color: '#9CA3AF', fontSize: 11 },
  termsLink:       { color: '#FF6B00', textDecorationLine: 'underline' },
})