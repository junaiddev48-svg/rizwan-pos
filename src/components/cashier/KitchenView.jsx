import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { useShift } from '../../contexts/ShiftContext'
import { getCachedOrders, getOrderQueue } from '../../lib/offline'
import { useCancellations, dismissCancellation } from '../../lib/cancellations'
import { CheckCircle, ChefHat, Clock, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function KitchenView({ onClose }) {
  const [orders, setOrders] = useState([])
  const [queued, setQueued] = useState([])
  const [loading, setLoading] = useState(true)
  const cancelled = useCancellations()
  const { activeShift } = useShift()

  useEffect(() => {
    function refreshQueued() {
      setQueued(getOrderQueue().filter((o) => o.shiftId === activeShift?.id))
    }
    refreshQueued()
    window.addEventListener('order-queued', refreshQueued)
    window.addEventListener('online', refreshQueued)
    return () => {
      window.removeEventListener('order-queued', refreshQueued)
      window.removeEventListener('online', refreshQueued)
    }
  }, [activeShift])

  useEffect(() => {
    if (!activeShift) { setLoading(false); return }
    let isMounted = true
    let channel

    const cached = getCachedOrders()
    if (cached && cached.length > 0) {
      setOrders(cached.filter((o) => o.shiftId === activeShift.id && ['preparing', 'ready'].includes(o.status)))
      setLoading(false)
    }

    async function init() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shiftId', activeShift.id)
        .in('status', ['preparing', 'ready'])
        .order('createdAt', { ascending: true })
      if (isMounted && !error) {
        setOrders(data || [])
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('orders-kitchen')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shiftId=eq.${activeShift.id}` },
        (payload) => {
          if (!isMounted) return
          const changed = payload.eventType === 'DELETE' ? payload.old : payload.new
          setOrders((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((o) => o.id !== changed.id)
            }
            if (!['preparing', 'ready'].includes(changed.status)) {
              return prev.filter((o) => o.id !== changed.id)
            }
            const without = prev.filter((o) => o.id !== changed.id)
            return [...without, changed].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          })
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [activeShift])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function markReady(order) {
    if (order._isQueued) return
    const { error } = await supabase.from('orders').update({ status: 'ready' }).eq('id', order.id)
    if (error) toast.error('Failed to update')
    else toast.success(`Order #${order.tokenNumber} ready!`)
  }

  if (loading && orders.length === 0 && queued.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full" />
      </div>
    )
  }

  const allOrders = [
    ...queued.map((q) => ({ ...q, id: q.orderId, _isQueued: true })),
    ...orders.filter((o) => !queued.some((q) => q.orderId === o.orderId)),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const preparing = allOrders.filter((o) => o.status === 'preparing')
  const ready = allOrders.filter((o) => o.status === 'ready')

  return (
    <div data-modal className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-[#334155]">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h3 className="text-lg font-bold flex items-center gap-2"><ChefHat size={20} className="text-[#F59E0B]" /> Kitchen View</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm cursor-pointer">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cancelled.length > 0 && (
            <div className="bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-xl p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#EF4444] flex items-center gap-2 text-lg">
                  <AlertTriangle size={20} /> STOP PREPARING ({cancelled.length})
                </h4>
                <span className="text-[10px] text-[#EF4444]/80 font-semibold">DO NOT SERVE THESE ORDERS</span>
              </div>
              <div className="space-y-3">
                {cancelled.map((order) => (
                  <div key={order.id} className="bg-[#1E293B] border border-[#EF4444]/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-2xl font-black text-[#EF4444]">#{order.tokenNumber}</span>
                        <span className="text-xs text-slate-500 ml-2">{order.orderType.toUpperCase()}{order.tableNumber ? ` - ${order.tableNumber}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded font-bold">{order.cancellationReason || 'CANCELLED'}</span>
                        <button onClick={() => dismissCancellation(order.id)} className="p-1 text-slate-400 hover:text-white hover:bg-[#EF4444]/20 rounded transition cursor-pointer" title="Dismiss">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {order.items.map((item, i) => (
                        <div key={i} className="line-through text-[#F87171]">
                          {item.quantity}x {item.name}
                          {(item.selectedModifiers || []).map((m, mi) => (
                            <span key={mi} className="text-xs text-[#F87171]/70 pl-2">+ {m.name}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allOrders.length === 0 && cancelled.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No active orders</p>
          ) : (
            <>
              {preparing.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#F59E0B] flex items-center gap-1 mb-3">
                    <Clock size={14} /> PREPARING ({preparing.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {preparing.map((order) => (
                      <div key={order.id} className="bg-[#1E293B] border border-[#F59E0B]/30 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-2xl font-black text-[#F59E0B]">#{order.tokenNumber}</span>
                              <span className="text-xs text-slate-500 ml-2">{order.orderType.toUpperCase()}{order.tableNumber ? ` - ${order.tableNumber}` : ''}</span>
                            </div>
                            {order._isQueued ? (
                              <span className="text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded">PENDING SYNC</span>
                            ) : (
                              <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            {order.items.map((item, i) => (
                              <div key={i}>
                                <div className="font-medium">{item.quantity}x {item.name}</div>
                                {(item.selectedModifiers || []).map((m, mi) => (
                                  <div key={mi} className="text-xs text-slate-400 pl-3">+ {m.name}</div>
                                ))}
                                {item.itemNotes && <div className="text-xs text-[#F59E0B] italic pl-3">* {item.itemNotes}</div>}
                              </div>
                            ))}
                          </div>
                          {!order._isQueued && (
                            <button onClick={() => markReady(order)} className="w-full mt-3 bg-[#22C55E] text-[#052E16] font-bold py-3 rounded-xl text-sm hover:bg-[#16A34A] transition flex items-center justify-center gap-2 cursor-pointer">
                              <CheckCircle size={16} /> Mark Ready
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {ready.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#22C55E] flex items-center gap-1 mb-3">
                    <CheckCircle size={14} /> READY TO SERVE ({ready.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ready.map((order) => (
                      <div key={order.id} className="bg-[#1E293B] border border-[#22C55E]/30 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-2xl font-black text-[#22C55E]">#{order.tokenNumber}</span>
                            <span className="text-xs text-slate-500 ml-2">{order.orderType.toUpperCase()}{order.tableNumber ? ` - ${order.tableNumber}` : ''}</span>
                          </div>
                          <button
                            onClick={async () => {
                              await supabase.from('orders').update({ status: 'served' }).eq('id', order.id)
                              toast.success(`Order #${order.tokenNumber} served`)
                            }}
                            className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#2563EB] transition cursor-pointer"
                          >
                            Mark Served
                          </button>
                        </div>
                        <div className="mt-2 text-sm text-slate-400">
                          {order.items.map((item, i) => (
                            <span key={i}>{item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
