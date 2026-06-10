import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState(null)

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse products from nearby stores, add items to cart, and proceed to checkout. You can pay via Cash on Delivery or Online Payment.'
    },
    {
      question: 'What are the delivery charges?',
      answer: 'Delivery charges are calculated based on the distance between the store and your delivery location. Typically ranges from ₹20-₹50.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Most orders are delivered within 30-60 minutes. You can track your order in real-time from the Orders tab.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'Yes, you can cancel orders before they are confirmed by the store. Once confirmed, cancellation may not be possible. Contact support for assistance.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept Cash on Delivery (COD) and Online Payments via UPI, Cards, and Wallets.'
    },
    {
      question: 'How do I use the AI Smart Add feature?',
      answer: 'Go to Cart → Smart Add (✨ icon). Type your shopping list or take a photo, and our AI will find matching products for you.'
    },
    {
      question: 'What if a product is out of stock?',
      answer: 'Out of stock items cannot be ordered. Try checking other nearby stores or wait for the store to restock.'
    },
    {
      question: 'How do I apply a coupon code?',
      answer: 'Enter your coupon code at checkout before placing the order. Valid coupons will be applied automatically.'
    }
  ]

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>💡</Text>
          <Text style={styles.bannerTitle}>How can we help you?</Text>
          <Text style={styles.bannerText}>
            Find answers to common questions below
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqIcon}>
                  {expandedIndex === index ? '−' : '+'}
                </Text>
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is here to assist you
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/support')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F8F9FA' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        padding: 16, paddingTop: 56, backgroundColor: '#FFFFFF',
                        borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backArrow:          { fontSize: 24, color: '#0D0D0D' },
  headerTitle:        { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  banner:             { alignItems: 'center', padding: 32, backgroundColor: '#FFFFFF' },
  bannerIcon:         { fontSize: 48, marginBottom: 12 },
  bannerTitle:        { fontSize: 20, fontWeight: '700', color: '#0D0D0D', marginBottom: 8 },
  bannerText:         { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  section:            { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle:       { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 12,
                        letterSpacing: 0.5 },
  faqCard:            { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  faqHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  faqQuestion:        { flex: 1, fontSize: 15, fontWeight: '600', color: '#0D0D0D', lineHeight: 22 },
  faqIcon:            { fontSize: 20, color: '#FF6B00', fontWeight: '700', marginLeft: 12 },
  faqAnswer:          { fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 20 },
  contactSection:     { alignItems: 'center', padding: 24, margin: 16, backgroundColor: '#FFF7ED',
                        borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5' },
  contactTitle:       { fontSize: 16, fontWeight: '700', color: '#0D0D0D', marginBottom: 4 },
  contactText:        { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  contactButton:      { backgroundColor: '#FF6B00', borderRadius: 12, paddingHorizontal: 24,
                        paddingVertical: 12 },
  contactButtonText:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
})
