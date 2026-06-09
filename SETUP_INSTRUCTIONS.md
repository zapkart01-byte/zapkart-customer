# ZapKart Customer App - Setup Instructions

## New Screens Added

The following screens have been successfully created for the ZapKart customer app:

### 1. Order Success Screen (`app/order-success.jsx`)
- ✅ White background with centered content
- ✅ Orange circle (80px) with white checkmark (animated on mount)
- ✅ "Order Placed! 🎉" heading (28px Bold)
- ✅ Order ID display in grey
- ✅ Estimated delivery time in orange (24px Bold)
- ✅ Order summary: items count, total, payment method
- ✅ "Track My Order →" button (orange, full-width)
- ✅ "Continue Shopping" button (white outlined)
- ✅ SMS notification note at bottom
- ✅ Navigation to tracking screen on Track button press

### 2. Live Order Tracking Screen (`app/tracking/[orderId].jsx`)
- ✅ MapLibre map (52% height) with MapTiler tiles
- ✅ Three markers:
  - Store marker (orange bag emoji)
  - Customer marker (grey house emoji)
  - Rider marker (orange scooter with pulsing animation)
- ✅ Socket.io integration for real-time updates
- ✅ Join room: `socket.emit('join-order', { orderId })`
- ✅ Listen: `socket.on('location:update', updateRiderPin)`
- ✅ Proper cleanup: `socket.disconnect()` and `removeAllListeners` on unmount
- ✅ Bottom sheet (48%) with:
  - Status badge
  - Order ID
  - Rider card with initials avatar and call button
  - 5-step progress bar
  - "Arriving in ~12 minutes" display
- ✅ Fetch order on mount from `orderService.getOrderById`
- ✅ Subscribe to order changes via `orderService.subscribeToOrder`

### 3. AI Cart Screen (`app/ai-cart.jsx`)
- ✅ Header with back arrow + "Smart Add ✨"
- ✅ Center sparkle icon (56px orange)
- ✅ "Add items by typing or photo" instruction
- ✅ 3 example hint chips in grey pills
- ✅ Bottom input bar (fixed):
  - Camera icon (opens expo-image-picker)
  - Text input: "Type anything... milk, eggs, bread"
  - Send arrow (orange)
- ✅ On send: calls `aiCartService.parseTextList` or `parseImageList`
- ✅ Loading state: "Finding your items..." with dots animation
- ✅ Results display:
  - Matched product cards with image, name, price, quantity stepper, green checkmark
  - Not found section in grey
- ✅ Two bottom buttons:
  - "✏️ Edit My List" (outlined grey)
  - "✅ Proceed to Checkout →" (orange full-width)
- ✅ Proceed adds all items to cartStore then navigates to checkout

### 4. Order History Screen (`app/(tabs)/orders.jsx`)
- ✅ Filter tabs: All | Active | Delivered | Cancelled (orange underline on active)
- ✅ Order cards showing:
  - Status icon circle (colored)
  - Items count and total (Bold)
  - Status label + date
  - "Track →" button (orange) if active
  - "Reorder" button if delivered
- ✅ Reorder functionality:
  - Calls `orderService.getOrderById` to get items
  - Adds each to cart via `cartStore.addItem` with stock checking
- ✅ Fetch from `orderService.getMyOrders(user.id)`
- ✅ Skeleton loading state
- ✅ Empty state if no orders

### 5. Profile Screen (`app/(tabs)/profile.jsx`)
- ✅ Orange gradient header (200px):
  - Large initials avatar (72px) with white border
  - User name (Bold white)
  - Phone (white opacity 70%)
- ✅ 3 stats cards overlapping header (-20px margin-top):
  - Total Orders
  - Total Saved ₹
  - Joined date
- ✅ Menu sections:
  - ACCOUNT: Edit Profile, Saved Addresses, Notifications
  - SUPPORT: Help & FAQ, Contact Support, Terms
- ✅ Logout row (red text)
- ✅ Logout flow:
  - Calls `authService.logout`
  - Clears `authStore`
  - Navigates to welcome screen: `router.replace('/(auth)/welcome')`

## Missing Dependencies

✅ **DEPENDENCIES INSTALLED!**

The following packages have been successfully installed:

```bash
npm install zustand @react-native-async-storage/async-storage socket.io-client @maplibre/maplibre-react-native expo-linear-gradient --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag was required to bypass React version peer dependency conflicts.

## Environment Variables Required

Make sure your `.env` file contains:

\`\`\`env
EXPO_PUBLIC_API_URL=http://your-backend-url
EXPO_PUBLIC_MAPTILER_KEY=your-maptiler-api-key
\`\`\`

## Important Notes

1. **MapLibre Configuration**: The tracking screen uses MapLibre with `setAccessToken(null)` as specified, using MapTiler tiles via the API key.

2. **Service Files**: All service files are located in `.claude/services/`:
   - `orderService.js` - Order operations
   - `aiCartService.js` - AI cart parsing
   - `authService.js` - Authentication
   - `productService.js` - Products and categories
   - `supabase.js` - Supabase client

3. **State Management**: The app uses Zustand for state management:
   - `store/authStore.js` - User authentication state
   - `store/cartStore.js` - Shopping cart state

4. **Socket.io Integration**: The tracking screen properly:
   - Connects on mount
   - Joins order room
   - Listens for location updates
   - Cleans up on unmount (disconnect + removeAllListeners)

5. **Expo Image Picker**: The AI cart screen uses `expo-image-picker` for camera/gallery access with proper permissions handling.

## File Structure

\`\`\`
zapkart-customer/
├── app/
│   ├── (auth)/
│   │   ├── welcome.jsx
│   │   ├── phone.jsx
│   │   └── otp.jsx
│   ├── (tabs)/
│   │   ├── _layout.jsx
│   │   ├── index.jsx (home)
│   │   ├── cart.jsx
│   │   ├── orders.jsx ✨ NEW
│   │   └── profile.jsx ✨ NEW
│   ├── tracking/
│   │   └── [orderId].jsx ✨ NEW
│   ├── _layout.jsx
│   ├── ai-cart.jsx ✨ NEW
│   └── order-success.jsx ✨ NEW
├── .claude/
│   └── services/
│       ├── orderService.js
│       ├── aiCartService.js
│       ├── authService.js
│       ├── productService.js
│       └── supabase.js
├── store/
│   ├── authStore.js
│   └── cartStore.js
└── utils/
    ├── formatters.js
    └── pricingCalculator.js
\`\`\`

## Next Steps

1. Install the missing dependencies listed above
2. Set up environment variables
3. Get a MapTiler API key from https://www.maptiler.com/
4. Run `npm start` to start the development server
5. Test each new screen:
   - Place an order to see order-success screen
   - Track an order to see live tracking
   - Use AI cart to add items via text/photo
   - View order history in orders tab
   - Check profile screen and stats

## Testing Checklist

- [ ] Order success screen displays correctly after checkout
- [ ] Tracking screen shows map with all three markers
- [ ] Tracking screen receives real-time location updates via Socket.io
- [ ] AI cart parses text input correctly
- [ ] AI cart handles camera/gallery image selection
- [ ] Orders tab shows all orders with correct filters
- [ ] Reorder functionality adds items to cart
- [ ] Profile screen displays user info and stats
- [ ] Logout functionality works correctly

## Notes

All screens have been built following the exact specifications provided, with proper styling, animations, and functionality. The code follows React Native best practices and matches the existing codebase patterns.
