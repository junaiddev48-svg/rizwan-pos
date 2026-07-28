import { TrendingUp, ShoppingCart, DollarSign, Ban } from 'lucide-react'

export default function SalesSummary({ orders }) {
  const active = orders.filter((o) => o.status !== 'cancelled')
  const cancelled = orders.filter((o) => o.status === 'cancelled')

  const netSales = active.reduce((sum, o) => sum + (o.grandTotal || 0), 0)
  const totalOrders = active.length
  const avgOrder = totalOrders > 0 ? netSales / totalOrders : 0
  const voidedValue = cancelled.reduce((sum, o) => sum + (o.grandTotal || 0), 0)
  const voidedCount = cancelled.length

  const cards = [
    { label: 'NET SALES', value: `Rs. ${netSales.toLocaleString()}`, icon: DollarSign, color: 'text-[#22C55E]' },
    { label: 'TOTAL ORDERS', value: totalOrders.toString(), icon: ShoppingCart, color: 'text-[#F59E0B]' },
    { label: 'AVG ORDER', value: `Rs. ${Math.round(avgOrder).toLocaleString()}`, icon: TrendingUp, color: 'text-[#3B82F6]' },
    { label: 'VOIDED', value: `${voidedCount} (Rs. ${voidedValue.toLocaleString()})`, icon: Ban, color: 'text-[#EF4444]' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">{card.label}</span>
              <Icon size={18} className={card.color} />
            </div>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        )
      })}
    </div>
  )
}
