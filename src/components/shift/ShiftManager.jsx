import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { useShift } from '../../contexts/ShiftContext'
import { useAuth } from '../../contexts/AuthContext'
import ZReport from './ZReport'
import { Play, Square, FileText, Clock, User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShiftManager() {
  const [orders, setOrders] = useState([])
  const [cashierName, setCashierName] = useState('')
  const [showZReport, setShowZReport] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const { activeShift, shifts, loading, openShift, closeShift } = useShift()
  const { user, isOwner, isAdmin } = useAuth()

  useEffect(() => {
    if (!activeShift) return
    let isMounted = true
    let channel

    async function init() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shiftId', activeShift.id)
        .order('createdAt', { ascending: false })
      if (isMounted && !error) setOrders(data || [])
    }


    init()

    channel = supabase
      .channel('orders-shift')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shiftId=eq.${activeShift.id}` },
        async () => {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('shiftId', activeShift.id)
            .order('createdAt', { ascending: false })
          if (isMounted) setOrders(data || [])
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [activeShift])

  async function handleOpen() {
    if (!cashierName.trim()) {
      toast.error('Enter cashier name')
      return
    }
    await openShift(cashierName.trim())
    setCashierName('')
  }

  function handleClose() {
    if (!window.confirm('Close the active shift? Z-Report will be generated.')) return
    setShowZReport(true)
  }

  function handleZReportClose() {
    closeShift()
    setShowZReport(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Shift Manager</h1>

      {!activeShift ? (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Play size={20} className="text-[#22C55E]" /> Open New Shift</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Cashier Name</label>
              <input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder={isOwner || isAdmin ? 'Enter cashier name' : user?.name || 'Enter your name'}
                className="w-full bg-[#334155] text-slate-100 rounded-xl px-4 py-3 text-sm border border-[#475569] placeholder-slate-500"
              />
            </div>
            <button onClick={handleOpen} className="w-full bg-[#22C55E] text-[#052E16] font-bold py-3 rounded-xl hover:bg-[#16A34A] transition flex items-center justify-center gap-2 cursor-pointer">
              <Play size={18} /> Open Shift
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#22C55E] animate-pulse" />
                  Active Shift
                </h2>
                <p className="text-sm text-slate-400">
                  Opened by <strong className="text-white">{activeShift.openedBy}</strong> at {new Date(activeShift.openedAt).toLocaleTimeString()}
                </p>
              </div>
              {isOwner ? (
                <button onClick={handleClose} className="bg-[#EF4444] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#DC2626] transition flex items-center gap-2 cursor-pointer">
                  <Square size={16} /> Close Shift
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[#F59E0B] text-xs bg-[#F59E0B]/10 px-3 py-2 rounded-xl" title="Only the owner can close a shift">
                  <Lock size={14} /> Owner only can close
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#334155] rounded-xl p-3">
                <div className="text-xs text-slate-400">Orders Today</div>
                <div className="text-2xl font-bold text-[#F59E0B]">{orders.filter(o => o.status !== 'cancelled').length}</div>
              </div>
              <div className="bg-[#334155] rounded-xl p-3">
                <div className="text-xs text-slate-400">Revenue</div>
                <div className="text-2xl font-bold text-[#22C55E]">
                  Rs. {orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.grandTotal || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#334155] rounded-xl p-3">
                <div className="text-xs text-slate-400">Voided</div>
                <div className="text-2xl font-bold text-[#EF4444]">{orders.filter(o => o.status === 'cancelled').length}</div>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Clock size={16} /> Shift History</h3>
              <div className="space-y-2">
                {shifts.filter((s) => s.status === 'closed').map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-[#334155] rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <User size={14} className="text-slate-400" />
                      <span>{s.openedBy}</span>
                      <span className="text-slate-500">{new Date(s.openedAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => { setSelectedShift(s); setShowZReport(true) }}
                      className="text-[#22C55E] text-xs hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileText size={12} /> View Z-Report
                    </button>
                  </div>
                ))}
                {shifts.filter((s) => s.status === 'closed').length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No completed shifts yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {(showZReport && selectedShift) && (
        <ZReport orders={[]} shift={selectedShift} onClose={() => { setShowZReport(false); setSelectedShift(null) }} />
      )}

      {(showZReport && activeShift && !selectedShift) && (
        <ZReport orders={orders} shift={activeShift} onClose={handleZReportClose} />
      )}
    </div>
  )
}
