import { ImageOff } from 'lucide-react'

export default function ProductTile({ product, onSelect, isFocused, setFocused }) {
  return (
    <button
      onClick={() => onSelect(product)}
      onFocus={() => setFocused?.()}
      disabled={!product.isAvailable}
      className={`flex flex-col items-center justify-center rounded-xl p-3 transition-all active:scale-95 min-h-[120px] w-full ${
        product.isAvailable
          ? `bg-[#1E293B] border hover:bg-[#1E293B]/80 cursor-pointer ${
              isFocused ? 'border-[#22C55E] ring-2 ring-[#22C55E]/30' : 'border-[#334155] hover:border-[#22C55E]'
            }`
          : 'bg-[#1E293B]/50 border border-[#334155]/50 opacity-50 cursor-not-allowed'
      }`}
    >
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-14 h-14 object-cover rounded-lg mb-2" loading="lazy" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-[#334155] flex items-center justify-center mb-2">
          <ImageOff size={22} className="text-slate-500" />
        </div>
      )}
      <span className="text-sm font-semibold text-center leading-tight">{product.name}</span>
      <span className="text-[#F59E0B] text-sm font-bold mt-1">Rs. {product.price.toLocaleString()}</span>
    </button>
  )
}
