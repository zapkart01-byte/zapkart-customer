// Cart state with single-store enforcement
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useCartStore = create(
  persist(
    (set, get) => ({
      items:     [],
      storeId:   null,
      storeName: '',

      // Add item — enforces single store rule
      addItem: (product, quantity = 1) => {
        const { items, storeId } = get()
        const productStoreId = product.store_id || product.stores?.id
        const productStoreName = product.store_name || product.stores?.store_name || 'Store'
        
        // Extract category commission rate
        const categoryCommissionRate = product.category_commission_rate 
          || product.categories?.commission_rate 
          || 0.18

        // Different store — must clear cart first
        if (storeId && storeId !== productStoreId) {
          return { needsConfirmation: true, newProduct: product }
        }

        const existing = items.find(i => i.id === product.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          })
        } else {
          set({
            items:     [...items, { ...product, quantity, category_commission_rate: categoryCommissionRate }],
            storeId:   productStoreId,
            storeName: productStoreName,
          })
        }
        return { needsConfirmation: false }
      },

      // Force add — clears existing cart from different store
      forceAddItem: (product, quantity = 1) => {
        const productStoreId = product.store_id || product.stores?.id
        const productStoreName = product.store_name || product.stores?.store_name || 'Store'
        const categoryCommissionRate = product.category_commission_rate 
          || product.categories?.commission_rate 
          || 0.18
        set({
          items:     [{ ...product, quantity, category_commission_rate: categoryCommissionRate }],
          storeId:   productStoreId,
          storeName: productStoreName,
        })
      },

      // Update quantity
      updateQuantity: (productId, quantity) => {
        const { items } = get()
        if (quantity <= 0) {
          const newItems = items.filter(i => i.id !== productId)
          set({
            items:   newItems,
            storeId: newItems.length === 0 ? null : get().storeId,
          })
        } else {
          set({
            items: items.map(i =>
              i.id === productId ? { ...i, quantity } : i
            )
          })
        }
      },

      // Remove item
      removeItem: (productId) => {
        const newItems = get().items.filter(i => i.id !== productId)
        set({
          items:   newItems,
          storeId: newItems.length === 0 ? null : get().storeId,
        })
      },

      // Clear entire cart
      clearCart: () => set({ items: [], storeId: null, storeName: '' }),

      // Get total item count
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      // Get subtotal (using store_price not customer_price)
      subtotal: () => get().items.reduce(
        (sum, i) => sum + (i.store_price * i.quantity), 0
      ),

      // Get cart items for pricing calculator
      cartItemsForPricing: () => get().items.map(i => ({
        productId:              i.id,
        store_price:            i.store_price,
        platform_mrp:           i.platform_mrp,
        quantity:               i.quantity,
        category_commission_rate: i.category_commission_rate 
                                 || i.categories?.commission_rate 
                                 || 0.18,
      })),
    }),
    {
      name:    'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export default useCartStore