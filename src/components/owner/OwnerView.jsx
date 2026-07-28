import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { useShift } from '../../contexts/ShiftContext'
import { ArrowLeft, TrendingUp, ShoppingBag, XCircle, Clock } from 'lucide-react'

export default function OwnerView({ onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { activeShift } = useShift()

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
      .channel('orders-owner')
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

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled')
  const totalSales = activeOrders.reduce((s, o) => s + (o.grandTotal || 0), 0)
  const voidedValue = cancelledOrders.reduce((s, o) => s + (o.grandTotal || 0), 0)

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition group cursor-pointer"
        >
          <ArrowLeft size={22} className="group-hover:-translate-x-1 transition" />
          <span className="font-semibold">Back to POS Terminal</span>
        </button>

        {!activeShift ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Shift</h2>
            <p className="text-slate-400 mb-6">Open a shift from the POS terminal to see live data</p>
            <button onClick={onBack} className="bg-[#22C55E] text-[#052E16] font-bold px-8 py-4 rounded-xl text-lg cursor-pointer">
              Go to POS
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-[#22C55E] border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="text-slate-400 text-sm mb-1">TODAY'S TOTAL SALES</div>
              <div className="text-5xl sm:text-6xl font-black text-[#22C55E] tracking-tight">
                Rs. {totalSales.toLocaleString()}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-slate-500 text-sm">
                <Clock size={14} />
                Live &middot; Auto-refreshing
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] rounded-2xl p-4 sm:p-6 text-center">
                <div className="text-[#F59E0B] mb-1">
                  <ShoppingBag size={24} className="mx-auto" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white">{activeOrders.length}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">ORDERS</div>
              </div>

              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] rounded-2xl p-4 sm:p-6 text-center">
                <div className="text-[#EF4444] mb-1">
                  <XCircle size={24} className="mx-auto" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white">{cancelledOrders.length}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">CANCELLED</div>
              </div>

              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#334155] rounded-2xl p-4 sm:p-6 text-center">
                <div className="text-[#A855F7] mb-1">
                  <TrendingUp size={24} className="mx-auto" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  Rs. {Math.round(activeOrders.length > 0 ? totalSales / activeOrders.length : 0).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">AVG ORDER</div>
              </div>
            </div>

            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-[#334155] flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  LATEST ORDERS
                </h3>
                <span className="text-xs text-slate-500">{orders.length} total</span>
              </div>

              <div className="divide-y divide-[#334155] max-h-[420px] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="px-4 sm:px-6 py-3 hover:bg-[#334155]/30 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-lg sm:text-xl font-black ${
                            order.status === 'cancelled' ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                          }`}>
                            #{order.tokenNumber}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-sm font-medium truncate ${
                              order.status === 'cancelled' ? 'line-through text-slate-500' : 'text-white'
                            }`}>
                              {order.items.map((item, i) => (
                                <span key={i}>{item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>&middot;</span>
                              <span>{order.orderType.toUpperCase()}{order.tableNumber ? ` - ${order.tableNumber}` : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className={`text-base sm:text-lg font-bold ${
                            order.status === 'cancelled' ? 'text-[#EF4444] line-through' : 'text-white'
                          }`}>
                            Rs. {order.grandTotal?.toLocaleString()}
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                            order.status === 'cancelled' ? 'bg-[#EF4444]/20 text-[#EF4444]'
                            : order.status === 'preparing' ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                            : order.status === 'ready' ? 'bg-[#22C55E]/20 text-[#22C55E]'
                            : 'bg-[#3B82F6]/20 text-[#3B82F6]'
                          }`}>
                            {order.cancellationReason ? order.cancellationReason.slice(0, 20) + (order.cancellationReason.length > 20 ? '...' : '') : order.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cancelledOrders.length > 0 && (
              <div className="mt-4 text-xs text-center text-slate-500">
                <span className="text-[#EF4444]">{cancelledOrders.length} cancelled</span> &middot; Voided value: Rs. {voidedValue.toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
