import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import supabase from '../lib/supabase'
import { getCachedStaff, cacheStaff } from '../lib/offline'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [activeStaff, setActiveStaff] = useState([])

  const refreshStaffCache = useCallback(async () => {
    const { data, error } = await supabase.from('staff').select('*').eq('isActive', true)
    if (!error && Array.isArray(data)) {
      cacheStaff(data)
      setActiveStaff(data)
    }
  }, [])

  useEffect(() => {
    const cached = getCachedStaff()
    if (Array.isArray(cached)) setActiveStaff(cached)
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

  async function findStaffByName(nameStr, pinStr) {
    const nameTarget = String(nameStr || '').trim().toLowerCase()
    const pinTarget = String(pinStr || '').trim()

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

    const active = staff.filter((s) => s.isActive)

    if (active.length === 0) {
      if (nameTarget === 'owner' && pinTarget === '1234') {
        return { ok: true, user: { id: 'local-owner', name: 'Owner', role: 'owner' }, fallback: true }
      }
      return { ok: false, error: 'No staff accounts yet. Tap Owner and enter 1234.' }
    }

    const match = active.find((s) => s.name.trim().toLowerCase() === nameTarget)
    if (!match) return { ok: false, error: 'No account with this name.' }
    if (match.pin !== pinTarget) return { ok: false, error: 'Wrong PIN for this person.' }

    return { ok: true, user: { id: match.id, name: match.name, role: match.role } }
  }

  async function login(name, pin) {
    setAuthLoading(true)
    try {
      const result = await findStaffByName(name, pin)
      if (result.ok) setUser(result.user)
      return result
    } catch {
      return { ok: false, error: 'Login failed' }
    } finally {
      setAuthLoading(false)
    }
  }

  async function checkPin(pin) {
    const pinTarget = String(pin || '').trim()
    let staff = getCachedStaff()
    if (!Array.isArray(staff)) staff = []
    const { data } = await supabase.from('staff').select('*').eq('isActive', true)
    if (Array.isArray(data)) {
      staff = data
      cacheStaff(data)
    }
    const match = staff.find((s) => s.pin === pinTarget && s.isActive)
    if (match) return { ok: true, user: { id: match.id, name: match.name, role: match.role } }
    if (staff.filter((s) => s.isActive).length === 0 && pinTarget === '1234') {
      return { ok: true, user: { id: 'local-owner', name: 'Owner', role: 'owner' }, fallback: true }
    }
    return { ok: false }
  }

  function logout() {
    setUser(null)
    try { localStorage.removeItem('rizwan_session') } catch {}
  }

  const isOwner = user?.role === 'owner'
  const isAdmin = user?.role === 'admin'
  const isCashier = user?.role === 'cashier'
  const isManager = isOwner || isAdmin

  return (
    <AuthContext.Provider value={{ user, isOwner, isAdmin, isCashier, isManager, activeStaff, authLoading, login, checkPin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
