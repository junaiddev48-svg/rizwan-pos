import { Clock, AlertTriangle } from 'lucide-react'

export default function LiveTransactionFeed({ orders }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl">
      <div className="p-4 border-b border-[#334155]">
        <h3 className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          LIVE TRANSACTION FEED
        </h3>
      </div>
      <div className="divide-y divide-[#334155] max-h-[500px] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No transactions yet</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={`p-4 ${order.status === 'cancelled' ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#F59E0B]">#{order.tokenNumber}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    order.status === 'cancelled' ? 'bg-[#EF4444]/20 text-[#EF4444] line-through'
                    : 'bg-[#22C55E]/20 text-[#22C55E]'
                  }`}>{order.status.toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">Rs. {order.grandTotal?.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">{order.orderType.toUpperCase()}{order.tableNumber ? ` - ${order.tableNumber}` : ''}</div>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {order.items.map((item, i) => (
                  <span key={i}>{item.quantity}x {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                ))}
              </div>
              {order.cancellationReason && (
                <div className="mt-1 text-xs text-[#EF4444] flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {order.cancellationReason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
