// Format currency with rupee symbol
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

// Format relative time
export function formatTimeAgo(dateString) {
  const now  = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return date.toLocaleDateString('en-IN')
}

// Format date
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// Format phone number for display
export function formatPhone(phone) {
  const cleaned = phone.replace('+91', '').replace(/\D/g, '')
  return `+91 ${cleaned.slice(0,5)} ${cleaned.slice(5)}`
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Status display labels
export const STATUS_LABELS = {
  placed:            'Order Placed',
  confirmed:         'Store Confirmed',
  packed:            'Being Packed',
  picked:            'Rider Picked Up',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
}

// Status colours
export const STATUS_COLORS = {
  placed:            { bg: '#DBEAFE', text: '#1D4ED8' },
  confirmed:         { bg: '#F5F3FF', text: '#7C3AED' },
  packed:            { bg: '#FEF3C7', text: '#D97706' },
  picked:            { bg: '#FFF0E6', text: '#FF6B00' },
  out_for_delivery:  { bg: '#FFF0E6', text: '#FF6B00' },
  delivered:         { bg: '#DCFCE7', text: '#16A34A' },
  cancelled:         { bg: '#FEE2E2', text: '#EF4444' },
}