// AI shopping assistant — calls Groq via backend
import { getToken } from './authService'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Parse typed grocery list text
export async function parseTextList(text) {
  return await parseCart('text', text)
}

// Parse photo of shopping list
export async function parseImageList(base64Image) {
  return await parseCart('image', base64Image)
}

// Parse voice recording
export async function parseVoiceInput(audioBase64) {
  return await parseCart('voice', audioBase64)
}

// Core function — calls backend AI endpoint
async function parseCart(type, content) {
  try {
    console.log('🤖 AI parseCart called')
    console.log('📍 API_URL:', API_URL)
    console.log('📝 Type:', type)
    console.log('📝 Content:', content)
    
    const token = await getToken()
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN!')
    
    if (!token) {
      throw new Error('Authentication token missing. Please login again.')
    }
    
    if (!API_URL) {
      throw new Error('API URL not configured. Check .env file.')
    }
    
    console.log('🌐 Calling:', `${API_URL}/ai/parse-cart`)
    
    const response = await fetch(`${API_URL}/ai/parse-cart`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, content })
    })
    
    console.log('📨 Response status:', response.status)
    console.log('📨 Response OK:', response.ok)
    
    const data = await response.json()
    console.log('📨 Response data:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      const errorMsg = data.error || data.message || 'AI unavailable'
      console.error('❌ AI error:', errorMsg)
      throw new Error(errorMsg)
    }
    
    console.log('✅ AI parsed successfully!')
    return { data, error: null }
  } catch (error) {
    console.error('💥 parseCart error:', error)
    console.error('💥 Error message:', error.message)
    return { data: null, error: error.message }
  }
}