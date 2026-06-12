import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

export default function VariantSelector({ variants, currentProductId, onSelect }) {
  if (!variants || variants.length <= 1) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Variant</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {variants.map((v) => {
          const isActive = v.id === currentProductId
          return (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.pill,
                isActive ? styles.activePill : styles.inactivePill
              ]}
              onPress={() => onSelect(v.id)}
              activeOpacity={0.8}
            >
              <Text 
                style={[
                  styles.pillText,
                  isActive ? styles.activePillText : styles.inactivePillText
                ]}
              >
                {v.variant_label || v.unit || 'Standard'}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: '#FFF0E6', // Primary Soft
    borderColor: '#FF6B00', // Primary
  },
  inactivePill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9ECEF', // Border
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activePillText: {
    color: '#FF6B00', // Primary
  },
  inactivePillText: {
    color: '#6B7280', // Text Secondary
  },
})
