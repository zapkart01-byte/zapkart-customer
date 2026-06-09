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
    const token = await getToken()
    const response = await fetch(`${API_URL}/ai/parse-cart`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, content })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'AI unavailable')
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}