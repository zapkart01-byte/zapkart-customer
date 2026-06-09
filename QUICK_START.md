# ZapKart Customer App - Quick Start Guide

## 🚀 Installation (Required)

✅ **DEPENDENCIES INSTALLED!**

All required dependencies have been successfully installed:

\`\`\`bash
npm install zustand @react-native-async-storage/async-storage socket.io-client @maplibre/maplibre-react-native expo-linear-gradient --legacy-peer-deps
\`\`\`

**Note**: The `--legacy-peer-deps` flag is required to bypass React version peer dependency conflicts.

## 📝 Environment Setup

Create a `.env` file in the root directory:

\`\`\`env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_MAPTILER_KEY=get-from-maptiler.com
\`\`\`

Get your free MapTiler API key: https://www.maptiler.com/

## 🎯 New Screens Overview

| Screen | Path | Purpose |
|--------|------|---------|
| Order Success | `app/order-success.jsx` | Confirmation after placing order |
| Live Tracking | `app/tracking/[orderId].jsx` | Real-time order tracking with map |
| AI Cart | `app/ai-cart.jsx` | Add items via text or photo |
| Orders History | `app/(tabs)/orders.jsx` | View all orders with filters |
| Profile | `app/(tabs)/profile.jsx` | User profile and settings |

## 🔗 Navigation Routes

\`\`\`javascript
// Navigate to order success
router.push('/order-success?orderId=123&itemCount=3&total=237&deliveryTime=28 minutes')

// Navigate to tracking
router.push('/tracking/ORDER_ID_HERE')

// Navigate to AI cart
router.push('/ai-cart')

// Navigate to orders tab
router.push('/(tabs)/orders')

// Navigate to profile tab
router.push('/(tabs)/profile')
\`\`\`

## 🎨 Key Features

### Order Success Screen
- Animated checkmark ✓
- Order details display
- Quick actions: Track or Continue Shopping

### Live Tracking Screen
- Real-time map with 3 markers (store, customer, rider)
- Socket.io live updates
- Rider info with call button
- 5-step progress indicator

### AI Cart Screen
- Type or photo input
- Smart item matching
- Quantity management
- One-tap checkout

### Orders History Screen
- Tab filters: All, Active, Delivered, Cancelled
- Track active orders
- Reorder past orders
- Empty state handling

### Profile Screen
- User stats dashboard
- Account management menu
- Support resources
- Logout with confirmation

## 🔌 Backend Integration Points

### Required API Endpoints
- `POST /orders` - Place new order
- `GET /orders?customer_id=X` - Get customer orders
- `GET /orders/:id` - Get single order details
- `POST /ai/parse-cart` - AI cart parsing
- `POST /offers/validate` - Validate coupon
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP

### Required Socket.io Events
- `join-order` - Join order room
- `location:update` - Rider location updates
- `order:status` - Order status changes

### Required Supabase Tables
- `orders` - Order records
- `stores` - Store information
- `riders` - Rider information
- `customers` - Customer data

## 📦 Services Used

All service files are in `.claude/services/`:

- **orderService.js** - Order operations
- **aiCartService.js** - AI cart parsing
- **authService.js** - Authentication
- **productService.js** - Products & categories
- **supabase.js** - Supabase client

## 🏪 State Stores

Located in `store/`:

- **authStore.js** - User authentication state
- **cartStore.js** - Shopping cart state

## ⚡ Quick Test Commands

\`\`\`bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
\`\`\`

## 🐛 Troubleshooting

### Map not showing?
- Check if EXPO_PUBLIC_MAPTILER_KEY is set
- Verify MapLibre package is installed
- Check network connectivity

### Socket.io not connecting?
- Verify EXPO_PUBLIC_API_URL is correct
- Check backend Socket.io server is running
- Check firewall settings

### Images not uploading?
- Grant camera/gallery permissions
- Check expo-image-picker is installed
- Verify AI endpoint is responding

### Orders not loading?
- Verify user is logged in (authStore.user exists)
- Check orderService.getMyOrders API
- Verify Supabase connection

## 📱 Testing Checklist

- [ ] Install all dependencies
- [ ] Set up environment variables
- [ ] Run `npm start`
- [ ] Test order success screen navigation
- [ ] Test live tracking with real order
- [ ] Test AI cart with text input
- [ ] Test AI cart with photo
- [ ] Test order filters in orders tab
- [ ] Test reorder functionality
- [ ] Test profile screen display
- [ ] Test logout flow

## 🎉 Ready to Go!

All screens are complete and follow the exact specifications. Just install dependencies and start coding!

For detailed implementation notes, see `SCREENS_COMPLETED.md`.
For setup instructions, see `SETUP_INSTRUCTIONS.md`.
