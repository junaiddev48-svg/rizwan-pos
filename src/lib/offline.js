const CACHE_PREFIX = 'rizwan_'
const CACHE_VERSION = 2

function cacheKey(key) {
  return `${CACHE_PREFIX}${key}_v${CACHE_VERSION}`
}

export function getCache(key) {
  try {
    const raw = localStorage.getItem(cacheKey(key))
    if (!raw) return null
    const { data, expiry } = JSON.parse(raw)
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(cacheKey(key))
      return null
    }
    return data
  } catch { return null }
}

export function setCache(key, data, ttlMinutes = 60) {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify({
      data,
      expiry: Date.now() + ttlMinutes * 60 * 1000,
    }))
  } catch { /* storage full */ }
}

export function removeCache(key) {
  localStorage.removeItem(cacheKey(key))
}

export function cacheProducts(products) {
  setCache('products', products, 1440)
}

export function getCachedProducts() {
  return getCache('products')
}

export function cacheOrders(orders) {
  setCache('orders', orders, 1440)
}

export function getCachedOrders() {
  return getCache('orders')
}

export function cacheStaff(staff) {
  setCache('staff', staff, 1440)
}

export function getCachedStaff() {
  return getCache('staff')
}

const QUEUE_KEY = `${CACHE_PREFIX}order_queue_v${CACHE_VERSION}`

export function getOrderQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function addToOrderQueue(order) {
  const queue = getOrderQueue()
  queue.push({ ...order, _queuedAt: new Date().toISOString() })
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch { /* storage full */ }
}

export function removeFromOrderQueue(index) {
  const queue = getOrderQueue()
  queue.splice(index, 1)
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch { /* storage full */ }
}

export function incrementQueueAttempt(index) {
  const queue = getOrderQueue()
  if (queue[index]) {
    queue[index]._attempts = (queue[index]._attempts || 0) + 1
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch { /* storage full */ }
  }
}

export function clearOrderQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export function getQueuedOrdersCount() {
  return getOrderQueue().length
}

export function clearExpiredOrders() {
  const queue = getOrderQueue()
  const now = Date.now()
  const fresh = queue.filter((o) => now - new Date(o._queuedAt).getTime() < 86400000)
  if (fresh.length !== queue.length) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(fresh)) } catch {}
  }
}
