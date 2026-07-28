export const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'burgers', label: 'BURGERS' },
  { id: 'loaded_fries', label: 'LOADED FRIES' },
  { id: 'drinks', label: 'DRINKS' },
  { id: 'deals', label: 'DEALS' },
  { id: 'chicken', label: 'CHICKEN' },
  { id: 'sides', label: 'SIDES' },
]

export const TABLES = Array.from({ length: 15 }, (_, i) => `Table ${i + 1}`)

export const ORDER_TYPES = [
  { id: 'dine_in', label: 'DINE-IN' },
  { id: 'takeaway', label: 'TAKEAWAY' },
  { id: 'delivery', label: 'DELIVERY' },
]

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', color: 'bg-[#22C55E]' },
  { id: 'jazzcash', label: 'JazzCash', color: 'bg-[#A855F7]' },
  { id: 'easypaisa', label: 'EasyPaisa', color: 'bg-[#A855F7]' },
]

export const ORDER_STATUS = {
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

export const MANAGER_PIN = '1234'
