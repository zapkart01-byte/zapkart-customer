import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function EmptyState({ icon, title, description, actionText, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon || '📦'}</Text>
      <Text style={styles.title}>{title || 'No items found'}</Text>
      <Text style={styles.description}>{description || 'Check back later or explore other categories.'}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionText}</Text>
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
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D0D0D', // Text Primary
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280', // Text Secondary
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    height: 44,
    backgroundColor: '#FFF0E6', // Primary Soft
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  buttonText: {
    color: '#FF6B00', // Primary
    fontSize: 14,
    fontWeight: '700',
  },
})
