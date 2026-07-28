import { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabase'
import toast from 'react-hot-toast'

const ShiftContext = createContext()

export function ShiftProvider({ children }) {
  const [activeShift, setActiveShift] = useState(null)
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let channel

    async function init() {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('openedAt', { ascending: false })
        .limit(20)
      if (isMounted) {
        if (!error) {
          setShifts(data || [])
          const active = (data || []).find((s) => s.status === 'active')
          setActiveShift(active || null)
        }
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('shifts')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        async () => {
          const { data } = await supabase
            .from('shifts')
            .select('*')
            .order('openedAt', { ascending: false })
            .limit(20)
          if (isMounted) {
            setShifts(data || [])
            const active = (data || []).find((s) => s.status === 'active')
            setActiveShift(active || null)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function openShift(cashierName) {
    if (activeShift) {
      toast.error('A shift is already active')
      return
    }
    const { error } = await supabase.from('shifts').insert([{
      openedAt: new Date().toISOString(),
      openedBy: cashierName || 'cashier',
      status: 'active',
      closedAt: null,
      financialSummary: {
        totalCashExpected: 0,
        totalMobileWalletsExpected: 0,
        totalVoidedOrders: 0,
        totalVoidedValue: 0,
        netRevenue: 0,
      },
    }])
    if (error) toast.error('Failed to open shift')
    else toast.success('Shift opened')
  }

  async function closeShift() {
    if (!activeShift) {
      toast.error('No active shift')
      return
    }
    const { error } = await supabase
      .from('shifts')
      .update({ status: 'closed', closedAt: new Date().toISOString() })
      .eq('id', activeShift.id)
    if (error) toast.error('Failed to close shift')
    else toast.success('Shift closed')
  }

  return (
    <ShiftContext.Provider value={{ activeShift, shifts, loading, openShift, closeShift }}>
      {children}
    </ShiftContext.Provider>
  )
}

export const useShift = () => useContext(ShiftContext)
