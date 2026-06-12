import AsyncStorage from '@react-native-async-storage/async-storage'

const ADDRESSES_KEY = 'zapkart_saved_addresses'

// Get all saved addresses
export async function getAddresses() {
  try {
    const data = await AsyncStorage.getItem(ADDRESSES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('getAddresses error:', error)
    return []
  }
}

// Add or update an address
export async function saveAddress(address) {
  try {
    const addresses = await getAddresses()
    let updated
    if (address.id) {
      updated = addresses.map(a => a.id === address.id ? { ...a, ...address } : a)
    } else {
      const newAddress = {
        ...address,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      }
      updated = [...addresses, newAddress]
    }
    await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(updated))
    return { success: true, addresses: updated }
  } catch (error) {
    console.error('saveAddress error:', error)
    return { success: false, error: error.message }
  }
}

// Delete an address by ID
export async function deleteAddress(addressId) {
  try {
    const addresses = await getAddresses()
    const updated = addresses.filter(a => a.id !== addressId)
    await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(updated))
    return { success: true, addresses: updated }
  } catch (error) {
    console.error('deleteAddress error:', error)
    return { success: false, error: error.message }
  }
}
