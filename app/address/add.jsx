import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions,
  ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, MapPin, Check } from 'lucide-react-native'
import * as Location from 'expo-location'
// Conditional import for MapLibre - only on native
let MapLibreGL = null
if (Platform.OS !== 'web') {
  try {
    MapLibreGL = require('@maplibre/maplibre-react-native').default
    MapLibreGL.setAccessToken(null)
  } catch (e) {
    console.warn('MapLibre not available:', e.message)
  }
}
import { saveAddress } from '../../services/addressService'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY
const MAP_STYLE_URL = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`

const LABELS = ['Home', 'Work', 'Other']

export default function AddAddressScreen() {
  const [houseNumber, setHouseNumber] = useState('')
  const [streetArea, setStreetArea] = useState('')
  const [landmark, setLandmark] = useState('')
  const [label, setLabel] = useState('Home')
  const [coordinates, setCoordinates] = useState([77.5946, 12.9716]) // Bangalore as default
  
  const [saving, setSaving] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const mapRef = useRef(null)

  const getCurrentLocation = async () => {
    setLoadingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to fetch your current coordinates.')
        setLoadingLocation(false)
        return
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const { latitude, longitude } = location.coords
      setCoordinates([longitude, latitude])
      
      // Update street/locality field using reverse geocoding
      try {
        const result = await Location.reverseGeocodeAsync({ latitude, longitude })
        if (result && result.length > 0) {
          const loc = result[0]
          const streetStr = [loc.name, loc.street, loc.district, loc.city]
            .filter(Boolean)
            .join(', ')
          setStreetArea(streetStr)
        }
      } catch (geoErr) {
        console.warn('Reverse geocode error:', geoErr)
      }
    } catch (err) {
      console.error('Fetch location error:', err)
      Alert.alert('Error', 'Failed to get your current location.')
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleSave = async () => {
    if (!houseNumber.trim() || !streetArea.trim()) {
      Alert.alert('Error', 'Please enter House Number and Locality/Street Area')
      return
    }

    setSaving(true)
    const fullAddressString = `${houseNumber.trim()}, ${streetArea.trim()}`
    
    const addressData = {
      label,
      fullAddress: fullAddressString,
      landmark: landmark.trim(),
      lat: coordinates[1],
      lng: coordinates[0]
    }

    const res = await saveAddress(addressData)
    setSaving(false)

    if (res.success) {
      Alert.alert('Success', 'Address saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } else {
      Alert.alert('Error', res.error || 'Failed to save address')
    }
  }

  const onRegionDidChange = async (feature) => {
    if (feature && feature.geometry && feature.geometry.coordinates) {
      setCoordinates(feature.geometry.coordinates)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft color="#0D0D0D" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Delivery Address</Text>
      </View>
 
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          {MapLibreGL !== null && Platform.OS !== 'web' ? (
            <MapLibreGL.MapView
              ref={mapRef}
              style={styles.map}
              styleURL={MAP_STYLE_URL}
              logoEnabled={false}
              attributionEnabled={false}
              onRegionDidChange={onRegionDidChange}
            >
              <MapLibreGL.Camera
                defaultSettings={{
                  centerCoordinate: [77.5946, 12.9716],
                  zoomLevel: 14
                }}
                centerCoordinate={coordinates}
              />
            </MapLibreGL.MapView>
          ) : (
            <View style={styles.map}>
              <iframe
                src={`https://api.maptiler.com/maps/streets-v2/?key=${MAPTILER_KEY}#14/${coordinates[1]}/${coordinates[0]}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Delivery Address Map"
              />
            </View>
          )}
          {/* Static Centered Pin Marker */}
          <View style={styles.staticPinContainer} pointerEvents="none">
            <View style={styles.pinWrapper}>
              <View style={styles.pinPulse} />
              <MapPin color="#FF6B00" size={36} fill="#FFF0E6" />
            </View>
          </View>
          <Text style={styles.mapTip}>Drag the map to position the pin exactly</Text>
          
          {/* Floating Use Current Location Button */}
          <TouchableOpacity 
            style={styles.locationFloatingBtn} 
            onPress={getCurrentLocation}
            disabled={loadingLocation}
            activeOpacity={0.9}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <MapPin color="#FF6B00" size={16} fill="#FFF0E6" />
            )}
            <Text style={styles.locationFloatingBtnText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Input Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>House No. / Flat / Building Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flat 302, Green Glen Apartments"
              placeholderTextColor="#6B7280"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street / Locality / Sector *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 80 Feet Rd, Koramangala"
              placeholderTextColor="#6B7280"
              value={streetArea}
              onChangeText={setStreetArea}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Sony Signal"
              placeholderTextColor="#6B7280"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Save Address As</Text>
            <View style={styles.labelGrid}>
              {LABELS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.labelChip,
                    label === item ? styles.activeLabelChip : null
                  ]}
                  onPress={() => setLabel(item)}
                  activeOpacity={0.8}
                >
                  <Text 
                    style={[
                      styles.labelChipText,
                      label === item ? styles.activeLabelChipText : null
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Coordinate Display for Debugging */}
          <Text style={styles.coordsText}>
            Pin Coordinates: {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}
          </Text>

          {/* Save Action Button */}
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave} 
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 96,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
    marginLeft: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 260,
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  map: {
    flex: 1,
  },
  staticPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -36, // Adjust offset to point tip of pin exactly to center
  },
  pinPulse: {
    position: 'absolute',
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    bottom: -2,
  },
  mapTip: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.75)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  locationFloatingBtn: {
    position: 'absolute',
    right: 12,
    bottom: 44,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  locationFloatingBtnText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '750',
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0D0D0D',
    backgroundColor: '#F8F9FA',
  },
  labelGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  labelChip: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  activeLabelChip: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF0E6',
  },
  labelChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeLabelChipText: {
    color: '#FF6B00',
  },
  coordsText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  saveBtn: {
    height: 52,
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
