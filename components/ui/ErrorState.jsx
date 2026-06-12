import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { AlertCircle } from 'lucide-react-native'

export default function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <AlertCircle color="#EF4444" size={48} />
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>{message || "We couldn't load the information. Please check your internet connection and try again."}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D0D0D', // Text Primary
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280', // Text Secondary
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 52, // Button height: 52px
    backgroundColor: '#FF6B00', // Primary
    borderRadius: 12, // Card radius: 12px
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
})
