import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

function getToday() {
  return new Date().toISOString().split('T')[0]
}

const OFFLINE_BASE = 9000

function getDeviceOffset() {
  try {
    let id = localStorage.getItem('rizwan_device_id')
    if (!id) {
      id = String(Math.floor(Math.random() * 900) + 100)
      localStorage.setItem('rizwan_device_id', id)
    }
    return parseInt(id, 10) || 100
  } catch {
    return 100 + Math.floor(Math.random() * 900)
  }
}

export default function useTokenCounter() {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initToken()
  }, [])

  async function initToken() {
    const today = getToday()
    const local = localStorage.getItem('rizwan_token')

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('token_counter')
        .select('counter')
        .eq('date', today)
        .maybeSingle()

      if (!error && data) {
        setToken(data.counter)
        localStorage.setItem('rizwan_token', JSON.stringify({ date: today, counter: data.counter }))
      } else {
        if (local) {
          const parsed = JSON.parse(local)
          if (parsed.date === today) setToken(parsed.counter)
          else { await upsertToken(today, 1); setToken(1) }
        } else {
          await upsertToken(today, 1)
          setToken(1)
        }
      }
    } else {
      const base = OFFLINE_BASE + getDeviceOffset()
      if (local) {
        const parsed = JSON.parse(local)
        setToken(parsed.date === today ? parsed.counter : base)
      } else {
        localStorage.setItem('rizwan_token', JSON.stringify({ date: today, counter: base }))
        setToken(base)
      }
    }
    setLoading(false)
  }

  async function upsertToken(date, counter) {
    const { data } = await supabase.from('token_counter').select('id').eq('date', date).maybeSingle()
    if (data) {
      await supabase.from('token_counter').update({ counter }).eq('date', date)
    } else {
      await supabase.from('token_counter').insert([{ date, counter }])
    }
    localStorage.setItem('rizwan_token', JSON.stringify({ date, counter }))
  }

  async function nextToken() {
    const today = getToday()
    const offlineBase = OFFLINE_BASE + getDeviceOffset()
    let newToken = offlineBase

    const local = localStorage.getItem('rizwan_token')
    if (local) {
      const parsed = JSON.parse(local)
      newToken = parsed.date === today ? parsed.counter + 1 : offlineBase
    }

    localStorage.setItem('rizwan_token', JSON.stringify({ date: today, counter: newToken }))

    if (navigator.onLine) {
      try {
        const { data } = await supabase.from('token_counter').select('counter').eq('date', today).maybeSingle()
        if (data) {
          newToken = data.counter + 1
          await supabase.from('token_counter').update({ counter: newToken }).eq('date', today)
        } else {
          await supabase.from('token_counter').insert([{ date: today, counter: newToken }])
        }
        localStorage.setItem('rizwan_token', JSON.stringify({ date: today, counter: newToken }))
      } catch { /* keep local token */ }
    }

    setToken(newToken)
    return newToken
  }

  return { token, nextToken, loading }
}
