import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import useAuthStore from '../../store/authStore'
import { supabase } from '../../.claude/services/supabase'

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore()
  
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: name.trim(),
          email: email.trim() || null
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update local auth store
      setUser(data)
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name[0].toUpperCase() : user?.phone?.slice(-2) || 'U'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.disabledInput}>
              <Text style={styles.disabledText}>{user?.phone || 'N/A'}</Text>
            </View>
            <Text style={styles.hint}>Phone number cannot be changed</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F8F9FA' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        padding: 16, paddingTop: 56, backgroundColor: '#FFFFFF',
                        borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backArrow:          { fontSize: 24, color: '#0D0D0D' },
  headerTitle:        { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  content:            { flex: 1, padding: 16 },
  avatarContainer:    { alignItems: 'center', marginVertical: 24 },
  avatar:             { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6B00',
                        alignItems: 'center', justifyContent: 'center' },
  avatarText:         { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  form:               { marginTop: 16 },
  field:              { marginBottom: 20 },
  label:              { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8,
                        textTransform: 'uppercase', letterSpacing: 0.5 },
  input:              { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
                        fontSize: 15, color: '#0D0D0D', borderWidth: 1, borderColor: '#E9ECEF' },
  disabledInput:      { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16,
                        borderWidth: 1, borderColor: '#E9ECEF' },
  disabledText:       { fontSize: 15, color: '#9CA3AF' },
  hint:               { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  saveButton:         { backgroundColor: '#FF6B00', borderRadius: 12, padding: 16,
                        alignItems: 'center', marginTop: 24 },
  saveButtonDisabled: { backgroundColor: '#E9ECEF' },
  saveButtonText:     { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
})
