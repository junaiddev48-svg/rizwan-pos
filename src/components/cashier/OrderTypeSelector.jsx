import { ORDER_TYPES, TABLES } from '../../lib/constants'

export default function OrderTypeSelector({
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {ORDER_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setOrderType(type.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              orderType === type.id
                ? 'bg-[#22C55E] text-[#052E16]'
                : 'bg-[#334155] text-slate-400 hover:bg-[#475569]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {orderType === 'dine_in' && (
        <select
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="w-full bg-[#334155] text-slate-100 rounded-lg px-3 py-2 text-sm border border-[#475569]"
        >
          <option value="">Select Table</option>
          {TABLES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {orderType === 'delivery' && (
        <div className="space-y-2">
          <input
            type="tel"
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full bg-[#334155] text-slate-100 rounded-lg px-3 py-2 text-sm border border-[#475569] placeholder-slate-500"
          />
          <textarea
            placeholder="Delivery address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            rows={2}
            className="w-full bg-[#334155] text-slate-100 rounded-lg px-3 py-2 text-sm border border-[#475569] placeholder-slate-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}
