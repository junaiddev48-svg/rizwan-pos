import { Plus, Minus, Trash2 } from 'lucide-react'

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const modTotal = (item.selectedModifiers || []).reduce((s, m) => s + m.additionalPrice, 0)
  const lineTotal = (item.basePrice + modTotal) * item.quantity

  return (
    <div className="bg-[#334155] rounded-lg p-2 text-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{item.quantity}x {item.name}</div>
          {(item.selectedModifiers || []).length > 0 && (
            <div className="text-xs text-slate-400 mt-0.5">
              {item.selectedModifiers.map((m, i) => (
                <span key={i}>+ {m.name}{i < item.selectedModifiers.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
          )}
          {item.itemNotes && (
            <div className="text-xs text-slate-500 italic mt-0.5">* {item.itemNotes}</div>
          )}
        </div>
        <div className="text-right ml-2 whitespace-nowrap">
          <div className="text-[#F59E0B] font-bold">Rs. {lineTotal.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1 bg-[#1E293B] rounded-lg">
          <button onClick={() => onUpdateQty(item, -1)} className="p-1.5 hover:text-[#22C55E] transition">
            <Minus size={14} />
          </button>
          <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
          <button onClick={() => onUpdateQty(item, 1)} className="p-1.5 hover:text-[#22C55E] transition">
            <Plus size={14} />
          </button>
        </div>
        <button onClick={() => onRemove(item)} className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition ml-auto">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
