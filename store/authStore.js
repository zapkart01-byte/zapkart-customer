// Authentication state
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      // Set user after login
      setUser: (user, token) => set({ user, token }),

      // Clear on logout
      clearUser: () => {
        set({ user: null, token: null })
        useAuthStore.persist.clearStorage()
      },

      // Check if logged in
      isLoggedIn: () => !!get().token,

      // Update user name after registration
      updateName: (name) => set(state => ({
        user: { ...state.user, name }
      })),
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export default useAuthStore