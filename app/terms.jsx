import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet
} from 'react-native'
import { router } from 'expo-router'

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: January 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using ZapKart, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Service Description</Text>
          <Text style={styles.paragraph}>
            ZapKart is a quick commerce platform connecting customers with local stores for fast delivery of groceries and essentials. We facilitate orders but do not sell products directly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            • You must provide accurate and complete information during registration{'\n'}
            • You are responsible for maintaining the confidentiality of your account{'\n'}
            • You must notify us immediately of any unauthorized use of your account{'\n'}
            • One account per user; multiple accounts may be suspended
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Orders & Payments</Text>
          <Text style={styles.paragraph}>
            • All orders are subject to product availability{'\n'}
            • Prices are set by partner stores and may vary{'\n'}
            • Payment must be made via accepted methods (COD, Online){'\n'}
            • Delivery fees are calculated based on distance{'\n'}
            • We reserve the right to cancel orders in case of suspected fraud
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Delivery</Text>
          <Text style={styles.paragraph}>
            • Estimated delivery times are approximate and not guaranteed{'\n'}
            • Delivery is subject to rider availability and weather conditions{'\n'}
            • You must be available at the delivery address{'\n'}
            • Undelivered orders due to incorrect address may incur additional charges
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cancellations & Refunds</Text>
          <Text style={styles.paragraph}>
            • Orders can be cancelled before store confirmation{'\n'}
            • Refunds for prepaid orders will be processed within 5-7 business days{'\n'}
            • COD orders cancelled after dispatch may be subject to cancellation fees{'\n'}
            • Damaged or incorrect items must be reported within 24 hours
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Prohibited Activities</Text>
          <Text style={styles.paragraph}>
            You agree not to:{'\n'}
            • Use the service for illegal purposes{'\n'}
            • Harass or abuse delivery riders or support staff{'\n'}
            • Attempt to manipulate pricing or promotions{'\n'}
            • Create fake orders or engage in fraudulent activity{'\n'}
            • Reverse engineer or compromise the platform
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, trademarks, and logos on ZapKart are our property or our licensors' property. You may not use, copy, or distribute any content without permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            ZapKart is not liable for:{'\n'}
            • Product quality issues (responsibility of partner stores){'\n'}
            • Delays caused by unforeseen circumstances{'\n'}
            • Loss or damage during delivery{'\n'}
            • Any indirect or consequential damages
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Privacy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. We collect and use your personal information as described in our Privacy Policy. By using ZapKart, you consent to our data practices.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Modifications</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in [Your City].
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact</Text>
          <Text style={styles.paragraph}>
            For questions about these terms, contact us at:{'\n'}
            Email: legal@zapkart.com{'\n'}
            Phone: +91 98765 43210
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using ZapKart, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FA' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, paddingTop: 56, backgroundColor: '#FFFFFF',
                    borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
  backArrow:      { fontSize: 24, color: '#0D0D0D' },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#0D0D0D' },
  content:        { padding: 16 },
  updateDate:     { fontSize: 12, color: '#9CA3AF', marginBottom: 24, textAlign: 'center',
                    fontStyle: 'italic' },
  section:        { marginBottom: 24 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#0D0D0D', marginBottom: 8 },
  paragraph:      { fontSize: 14, color: '#374151', lineHeight: 22 },
  footer:         { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, marginTop: 8,
                    borderWidth: 1, borderColor: '#FFEDD5' },
  footerText:     { fontSize: 13, color: '#9A3412', lineHeight: 20, textAlign: 'center' },
})
