import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function ModifierModal({ product, onConfirm, onCancel }) {
  const [selectedMods, setSelectedMods] = useState([])
  const [notes, setNotes] = useState('')

  function toggleMod(modifier) {
    setSelectedMods((prev) =>
      prev.find((m) => m.modifierId === modifier.modifierId)
        ? prev.filter((m) => m.modifierId !== modifier.modifierId)
        : [...prev, modifier]
    )
  }

  function handleAdd() {
    onConfirm(product, selectedMods, notes)
  }

  const modTotal = selectedMods.reduce((s, m) => s + m.additionalPrice, 0)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md border border-[#334155] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <div>
            <h3 className="text-lg font-bold">{product.name}</h3>
            <p className="text-[#F59E0B] text-sm">Base: Rs. {product.price.toLocaleString()}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>

        {(product.modifiers || []).length > 0 && (
          <div className="p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">ADD-ONS / MODIFIERS</h4>
            <div className="space-y-2">
              {product.modifiers.map((mod) => {
                const isSelected = selectedMods.find((m) => m.modifierId === mod.modifierId)
                return (
                  <button
                    key={mod.modifierId}
                    onClick={() => toggleMod(mod)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                      isSelected
                        ? 'bg-[#22C55E]/10 border border-[#22C55E]'
                        : 'bg-[#334155] border border-transparent hover:bg-[#475569]'
                    }`}
                  >
                    <span className="font-medium">{mod.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#F59E0B]">+Rs. {mod.additionalPrice}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-[#22C55E] border-[#22C55E]' : 'border-slate-500'
                      }`}>
                        {isSelected && <Plus size={12} className="text-[#052E16]" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="px-4 pb-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">NOTES</h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. No Mayo, Extra Spicy..."
            rows={2}
            className="w-full bg-[#334155] text-slate-100 rounded-xl px-3 py-2 text-sm border border-[#475569] placeholder-slate-500 resize-none"
          />
        </div>

        <div className="p-4 border-t border-[#334155] flex items-center justify-between">
          <div>
            {modTotal > 0 && (
              <span className="text-sm text-slate-400">+ Add-ons: Rs. {modTotal}</span>
            )}
          </div>
          <button onClick={handleAdd} className="bg-[#22C55E] text-[#052E16] font-bold px-8 py-3 rounded-xl transition hover:bg-[#16A34A] active:scale-95 cursor-pointer">
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  )
}
