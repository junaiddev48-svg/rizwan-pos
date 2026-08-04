import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import supabase from '../lib/supabase'
import { getCachedStaff, cacheStaff } from '../lib/offline'

const AuthContext = createContext()

const SESSION_KEY = 'rizwan_session'
const SESSION_TTL = 12 * 60 * 60 * 1000

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session.user
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession())
  const [authLoading, setAuthLoading] = useState(false)

  const refreshStaffCache = useCallback(async () => {
    const { data, error } = await supabase.from('staff').select('*').eq('isActive', true)
    if (!error && data) cacheStaff(data)
  }, [])

  useEffect(() => {
    refreshStaffCache()
    const channel = supabase
      .channel('staff-auth')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => refreshStaffCache()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [refreshStaffCache])

  function saveSession(u) {
    setUser(u)
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      user: u,
      expiresAt: Date.now() + SESSION_TTL,
    }))
  }

  async function findStaff(pin) {
    const pinStr = String(pin).trim()

    let staff = getCachedStaff()
    if (!Array.isArray(staff)) staff = []

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('isActive', true)

    if (!error && Array.isArray(data)) {
      staff = data
      cacheStaff(data)
    }

    const match = staff.find((s) => s.pin === pinStr && s.isActive)
    if (match) {
      return { ok: true, user: { id: match.id, name: match.name, role: match.role } }
    }

    if (staff.length === 0) {
      if (pinStr === '1234') {
        return { ok: true, user: { id: 'local-owner', name: 'Owner', role: 'owner' }, fallback: true }
      }
      return { ok: false, error: 'No staff accounts found. Owner default PIN is 1234.' }
    }

    return { ok: false, error: 'Invalid PIN' }
  }

  async function login(pin) {
    setAuthLoading(true)
    try {
      const result = await findStaff(pin)
      if (result.ok) {
        saveSession(result.user)
        return result
      }
      return result
    } catch {
      return { ok: false, error: 'Login failed' }
    } finally {
      setAuthLoading(false)
    }
  }

  async function checkPin(pin) {
    return findStaff(pin)
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const isOwner = user?.role === 'owner'
  const isAdmin = user?.role === 'admin'
  const isCashier = user?.role === 'cashier'
  const isManager = isOwner || isAdmin

  return (
    <AuthContext.Provider value={{ user, isOwner, isAdmin, isCashier, isManager, authLoading, login, checkPin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
