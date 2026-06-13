import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState, useRef, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { verifyOTP, saveUser } from '../../services/authService'
import useAuthStore from '../../store/authStore'

export default function OTPScreen() {
  const { phone }       = useLocalSearchParams()
  const { setUser }     = useAuthStore()
  const [otp, setOtp]   = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer]     = useState(30)
  const inputs              = useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t > 0 ? t - 1 : 0)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleChange = (text, index) => {
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)
    if (text && index < 5) inputs.current[index + 1]?.focus()
    if (!text && index > 0) inputs.current[index - 1]?.focus()
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) return

    setLoading(true)
    const { success, error, user, token, isNew } = await verifyOTP(phone, otpString)
    setLoading(false)

    if (success) {
      setUser(user, token)
      await saveUser(user)
      if (isNew) {
        router.replace('/(auth)/name')
      } else {
        router.replace('/(tabs)')
      }
    } else {
      Alert.alert('Invalid OTP', error || 'Please check the code and try again')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.heading}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Sent to {phone}{' '}
          <Text style={styles.change} onPress={() => router.back()}>Change</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => inputs.current[i] = ref}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={t => handleChange(t.slice(-1), i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {timer > 0 ? (
          <Text style={styles.timer}>Resend OTP in {timer}s</Text>
        ) : (
          <TouchableOpacity>
            <Text style={styles.resend}>Resend OTP</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, (otp.join('').length !== 6 || loading) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={otp.join('').length !== 6 || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  back:           { padding: 20, paddingTop: 60 },
  backText:       { fontSize: 16, color: '#6B7280' },
  content:        { flex: 1, padding: 24 },
  heading:        { fontSize: 28, fontWeight: '800', color: '#0D0D0D' },
  subtitle:       { fontSize: 14, color: '#6B7280', marginTop: 8 },
  change:         { color: '#FF6B00', fontWeight: '600' },
  otpRow:         { flexDirection: 'row', gap: 8, marginTop: 32 },
  otpBox:         { flex: 1, height: 54, borderWidth: 2, borderColor: '#E9ECEF',
                    borderRadius: 10, textAlign: 'center', fontSize: 18,
                    fontWeight: '700', color: '#0D0D0D', backgroundColor: '#FFFFFF' },
  otpBoxFilled:   { borderColor: '#FF6B00', backgroundColor: '#FFF0E6' },
  timer:          { textAlign: 'center', marginTop: 20, color: '#9CA3AF', fontSize: 13 },
  resend:         { textAlign: 'center', marginTop: 20, color: '#FF6B00',
                    fontSize: 13, fontWeight: '600' },
  button:         { backgroundColor: '#FF6B00', borderRadius: 14, height: 52,
                    alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#F8F9FA' },
  buttonText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
})