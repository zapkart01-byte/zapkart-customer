import { View, Text, StyleSheet } from 'react-native'

export default function CheckoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Checkout Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D0D0D'
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8
  }
})
