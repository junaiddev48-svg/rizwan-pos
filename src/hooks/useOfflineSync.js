import { useState, useEffect, useCallback } from 'react'
import supabase from '../lib/supabase'
import {
  getOrderQueue,
  removeFromOrderQueue,
  addToOrderQueue,
  incrementQueueAttempt,
  getQueuedOrdersCount,
  clearExpiredOrders,
} from '../lib/offline'
import toast from 'react-hot-toast'

export default function useOfflineSync() {
  const [queuedCount, setQueuedCount] = useState(getQueuedOrdersCount())
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    clearExpiredOrders()
    setQueuedCount(getQueuedOrdersCount())

    function onOnline() {
      setQueuedCount(getQueuedOrdersCount())
      if (getQueuedOrdersCount() > 0) flushQueue()
    }

    function onOffline() {
      setQueuedCount(getQueuedOrdersCount())
    }

    function onOrderQueued() {
      setQueuedCount(getQueuedOrdersCount())
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('order-queued', onOrderQueued)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('order-queued', onOrderQueued)
    }
  }, [])

  function updateCount() {
    setQueuedCount(getQueuedOrdersCount())
  }

  const flushQueue = useCallback(async () => {
    const queue = getOrderQueue()
    if (queue.length === 0) return

    setSyncing(true)
    let synced = 0

    for (let i = queue.length - 1; i >= 0; i--) {
      const order = queue[i]
      const { _queuedAt, _attempts = 0, ...orderData } = order

      const { error } = await supabase.from('orders').insert([orderData])
      if (!error) {
        removeFromOrderQueue(i)
        synced++
      } else if (_attempts + 1 >= 5) {
        removeFromOrderQueue(i)
        toast.error('Skipped an old offline order that kept failing to sync')
      } else {
        incrementQueueAttempt(i)
      }
    }

    if (synced > 0) {
      toast.success(`${synced} offline order${synced > 1 ? 's' : ''} synced`)
    }
    setQueuedCount(getQueuedOrdersCount())
    setSyncing(false)
    window.dispatchEvent(new Event('order-queued'))
  }, [])

  function queueOrder(order) {
    addToOrderQueue(order)
    setQueuedCount(getQueuedOrdersCount())
  }

  return { queuedCount, syncing, flushQueue, queueOrder, updateCount }
}
