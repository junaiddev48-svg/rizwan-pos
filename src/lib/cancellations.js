import { useState, useEffect } from 'react'

const TTL = 10 * 60 * 1000
let cancellations = []
let listeners = []

export function addCancellation(order) {
  const now = Date.now()
  cancellations = [
    { ...order, _expiresAt: now + TTL },
    ...cancellations.filter((c) => c._expiresAt > now),
  ].slice(0, 20)
  listeners.forEach((fn) => fn(cancellations))
}

export function dismissCancellation(id) {
  cancellations = cancellations.filter((c) => c.id !== id)
  listeners.forEach((fn) => fn(cancellations))
}

export function dismissAllCancellations() {
  cancellations = []
  listeners.forEach((fn) => fn(cancellations))
}

export function useCancellations() {
  const [list, setList] = useState(cancellations)

  useEffect(() => {
    listeners.push(setList)
    setList(cancellations)
    return () => {
      listeners = listeners.filter((fn) => fn !== setList)
    }
  }, [])

  return list
}
