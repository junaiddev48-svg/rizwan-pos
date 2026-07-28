import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { X, Printer, ShieldBan } from 'lucide-react'
import { useShift } from '../../contexts/ShiftContext'
import { useAuth } from '../../contexts/AuthContext'
import { printCustomerReceipt } from '../../lib/printing'
import PinInput from '../shared/PinInput'
import LoadingSpinner from '../shared/LoadingSpinner'
import toast from 'react-hot-toast'

export default function RecentOrders({ onClose }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [voidTarget, setVoidTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [showPin, setShowPin] = useState(false)
  const { activeShift } = useShift()
  const { verifyPin } = useAuth()

  useEffect(() => {
    if (!activeShift) { setLoading(false); return }
    let isMounted = true
    let channel

    async function init() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shiftId', activeShift.id)
        .order('createdAt', { ascending: false })
      if (isMounted) {
        if (!error) setOrders(data || [])
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('orders-recent')
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

  async function handleVoid() {
    if (!reason.trim()) {
      toast.error('Please enter a reason')
      return
    }
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancellationReason: reason.trim() })
      .eq('id', voidTarget.id)
    if (error) toast.error('Failed to void order')
    else {
      toast.success('Order voided')
      setVoidTarget(null)
      setReason('')
    }
  }

  function handleReprint(order) {
    printCustomerReceipt(order)
    toast.success('Reprint sent')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#334155]">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h3 className="text-lg font-bold">Recent Orders</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {orders.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No orders yet this shift</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className={`bg-[#1E293B] rounded-xl p-3 border ${
                  order.status === 'cancelled' ? 'border-[#EF4444]/30 opacity-60' : 'border-[#334155]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#F59E0B]">#{order.tokenNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      order.status === 'cancelled' ? 'bg-[#EF4444]/20 text-[#EF4444]'
                      : order.status === 'preparing' ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      : 'bg-[#22C55E]/20 text-[#22C55E]'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">{order.orderType.toUpperCase()}</span>
                    {order.tableNumber && <span className="text-xs text-slate-400">{order.tableNumber}</span>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">Rs. {order.grandTotal?.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-400">
                  {order.items.map((item, i) => (
                    <span key={i}>{item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>

                {order.cancellationReason && (
                  <div className="mt-1 text-xs text-[#EF4444] italic">Reason: {order.cancellationReason}</div>
                )}

                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleReprint(order)} className="btn-secondary text-xs flex items-center gap-1 py-1 px-2 cursor-pointer">
                    <Printer size={12} /> Reprint
                  </button>
                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => { setVoidTarget(order); setShowPin(true) }}
                      className="text-xs flex items-center gap-1 py-1 px-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg hover:bg-[#EF4444]/20 transition cursor-pointer"
                    >
                      <ShieldBan size={12} /> Void
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPin && (
        <PinInput
          title="Manager PIN to Void"
          onConfirm={(pin) => {
            if (verifyPin(pin)) {
              setShowPin(false)
              return true
            }
            return false
          }}
          onCancel={() => { setShowPin(false); setVoidTarget(null) }}
        />
      )}

      {voidTarget && !showPin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1E293B] rounded-2xl p-6 w-96 border border-[#334155]">
            <h3 className="text-lg font-bold mb-2">Void Order #{voidTarget.tokenNumber}</h3>
            <p className="text-sm text-slate-400 mb-4">Total: Rs. {voidTarget.grandTotal?.toLocaleString()}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for void..."
              rows={3}
              className="w-full bg-[#334155] text-slate-100 rounded-xl px-3 py-2 text-sm border border-[#475569] placeholder-slate-500 resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => { setVoidTarget(null); setReason('') }} className="btn-secondary flex-1 cursor-pointer">Cancel</button>
              <button onClick={handleVoid} className="btn-danger flex-1 cursor-pointer">Confirm Void</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
