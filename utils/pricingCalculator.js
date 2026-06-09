// IDENTICAL to admin and backend versions — do not modify independently

export function calculateOrderPricing(cartItems, distanceKm, settings) {

  // Rider payout by distance
  let riderPayout
  if (distanceKm < 2)      riderPayout = settings.rider_payout_under_2km
  else if (distanceKm < 4) riderPayout = settings.rider_payout_2_to_4km
  else                     riderPayout = settings.rider_payout_above_4km

  // Commission per item using category rate
  const totalCommission = cartItems.reduce((sum, item) =>
    sum + (item.store_price * item.quantity * item.category_commission_rate), 0)

  // Markup revenue (INR 1 per item, capped at platform_mrp)
  const markupRevenue = cartItems.reduce((sum, item) => {
    const cp = Math.min(
      item.store_price + (settings.platform_markup_per_item || 1),
      item.platform_mrp
    )
    return sum + ((cp - item.store_price) * item.quantity)
  }, 0)

  // Cart value from customer perspective
  const cartValue = cartItems.reduce((sum, item) => {
    const cp = Math.min(
      item.store_price + (settings.platform_markup_per_item || 1),
      item.platform_mrp
    )
    return sum + (cp * item.quantity)
  }, 0)

  // Tiered minimum profit
  const minimumProfit = getMinimumProfit(cartValue, settings)

  // Dynamic delivery fee
  let deliveryFee = (riderPayout + minimumProfit) - totalCommission - markupRevenue
  if (cartValue >= settings.free_delivery_above) deliveryFee = 0
  deliveryFee = Math.max(deliveryFee, settings.min_delivery_fee)
  deliveryFee = Math.min(deliveryFee, settings.max_delivery_fee)
  deliveryFee = Math.round(deliveryFee)

  return {
    cartValue:         Math.round(cartValue),
    deliveryFee,
    riderPayout,
    totalCommission:   Math.round(totalCommission),
    zapkartNetProfit:  Math.round(totalCommission + markupRevenue + deliveryFee - riderPayout),
    isFreeDelivery:    cartValue >= settings.free_delivery_above,
    totalCustomerPays: Math.round(cartValue + deliveryFee),
    amountToFreeDelivery: Math.max(0, settings.free_delivery_above - cartValue),
  }
}

function getMinimumProfit(cartValue, settings) {
  if (cartValue <= 149) return settings.min_profit_tier1 || 12
  if (cartValue <= 249) return settings.min_profit_tier2 || 14
  if (cartValue <= 399) return settings.min_profit_tier3 || 15
  if (cartValue <= 499) return settings.min_profit_tier4 || 10
  return settings.min_profit_tier5 || 8
}