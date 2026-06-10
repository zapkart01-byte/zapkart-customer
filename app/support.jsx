import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import useAuthStore from '../store/authStore'

export default function SupportScreen() {
  const { user } = useAuthStore()
  
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please provide both subject and message')
      return
    }

    setLoading(true)
    
    // Simulate submission
    setTimeout(() => {
      setLoading(false)
      Alert.alert(
        'Request Submitted',
        'Our support team will get back to you within 24 hours via phone or email.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      )
    }, 1500)
  }

  const handleCall = () => {
    Linking.openURL('tel:+919876543210')
  }

  const handleEmail = () => {
    Linking.openURL('mailto:support@zapkart.com')
  }

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hi, I need help with my ZapKart order')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK CONTACT</Text>
          
          <View style={styles.quickContactGrid}>
            <TouchableOpacity style={styles.quickContactCard} onPress={handleCall}>
              <Text style={styles.quickContactIcon}>📞</Text>
              <Text style={styles.quickContactLabel}>Call Us</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactCard} onPress={handleEmail}>
              <Text style={styles.quickContactIcon}>✉️</Text>
              <Text style={styles.quickContactLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactCard} onPress={handleWhatsApp}>
              <Text style={styles.quickContactIcon}>💬</Text>
              <Text style={styles.quickContactLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBMIT A REQUEST</Text>
          
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Your Phone</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>{user?.phone || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="What do you need help with?"
                placeholderTextColor="#9CA3AF"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🕐</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Support Hours</Text>
            <Text style={styles.infoText}>
              Monday - Sunday: 8:00 AM - 10:00 PM IST
            </Text>
            <Text style={styles.infoSubtext}>
              We typically respond within 2-4 hours during business hours
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#F8F9FA' },
  header:                 { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            padding: 16, paddingTop: 56, backgroundColor: '#FFFFFF',
                            borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backArrow:              { fontSize: 24, color: '#0D0D0D' },
  headerTitle:            { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  section:                { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle:           { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 12,
                            letterSpacing: 0.5 },
  quickContactGrid:       { flexDirection: 'row', gap: 8 },
  quickContactCard:       { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
                            alignItems: 'center' },
  quickContactIcon:       { fontSize: 32, marginBottom: 8 },
  quickContactLabel:      { fontSize: 12, fontWeight: '600', color: '#0D0D0D' },
  card:                   { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  field:                  { marginBottom: 16 },
  label:                  { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  input:                  { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12,
                            fontSize: 14, color: '#0D0D0D', borderWidth: 1, borderColor: '#E9ECEF' },
  textArea:               { minHeight: 120 },
  disabledInput:          { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12,
                            borderWidth: 1, borderColor: '#E9ECEF' },
  disabledText:           { fontSize: 14, color: '#6B7280' },
  submitButton:           { backgroundColor: '#FF6B00', borderRadius: 12, padding: 14,
                            alignItems: 'center', marginTop: 8 },
  submitButtonDisabled:   { backgroundColor: '#E9ECEF' },
  submitButtonText:       { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  infoCard:               { flexDirection: 'row', margin: 16, padding: 16, backgroundColor: '#FFFFFF',
                            borderRadius: 12 },
  infoIcon:               { fontSize: 32, marginRight: 12 },
  infoContent:            { flex: 1 },
  infoTitle:              { fontSize: 15, fontWeight: '700', color: '#0D0D0D', marginBottom: 4 },
  infoText:               { fontSize: 13, color: '#0D0D0D', marginBottom: 4 },
  infoSubtext:            { fontSize: 12, color: '#6B7280', lineHeight: 16 },
})
