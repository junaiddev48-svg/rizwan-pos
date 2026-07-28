import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'
import ImageUploader from './ImageUploader'
import { X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultProduct = {
  name: '',
  price: '',
  category: 'burgers',
  isAvailable: true,
  imageUrl: '',
  modifiers: [],
}

export default function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(defaultProduct)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        price: product.price?.toString() || '',
        category: product.category || 'burgers',
        isAvailable: product.isAvailable ?? true,
        imageUrl: product.imageUrl || '',
        modifiers: product.modifiers || [],
      })
    }
  }, [product])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addModifier() {
    setForm((prev) => ({
      ...prev,
      modifiers: [...prev.modifiers, { modifierId: `mod_${Date.now()}`, name: '', additionalPrice: 0 }],
    }))
  }

  function updateModifier(idx, field, value) {
    setForm((prev) => {
      const mods = [...prev.modifiers]
      mods[idx] = { ...mods[idx], [field]: field === 'additionalPrice' ? parseFloat(value) || 0 : value }
      return { ...prev, modifiers: mods }
    })
  }

  function removeModifier(idx) {
    setForm((prev) => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== idx),
    }))
  }

  function handleImageUpload(url) {
    setForm((prev) => ({ ...prev, imageUrl: url }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Product name is required'); return }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error('Valid price is required'); return }

    const data = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      category: form.category,
      isAvailable: form.isAvailable,
      imageUrl: form.imageUrl,
      modifiers: form.modifiers.filter((m) => m.name.trim()),
      updatedAt: new Date().toISOString(),
    }

    try {
      if (product?.id) {
        const { error } = await supabase.from('products').update(data).eq('id', product.id)
        if (error) throw error
        toast.success('Product updated')
      } else {
        const { error } = await supabase.from('products').insert([data])
        if (error) throw error
        toast.success('Product added')
      }
      onSaved?.()
      onClose()
    } catch {
      toast.error('Failed to save product')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#334155]">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h3 className="text-lg font-bold">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-400 mb-1 block">Name</label>
            <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Product name" className="w-full bg-[#334155] text-slate-100 rounded-xl px-4 py-3 text-sm border border-[#475569] placeholder-slate-500" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-400 mb-1 block">Price (Rs.)</label>
              <input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="0" className="w-full bg-[#334155] text-slate-100 rounded-xl px-4 py-3 text-sm border border-[#475569] placeholder-slate-500" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full bg-[#334155] text-slate-100 rounded-xl px-4 py-3 text-sm border border-[#475569]">
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <ImageUploader onUpload={handleImageUpload} currentUrl={form.imageUrl} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-400">Modifiers / Add-ons</label>
              <button type="button" onClick={addModifier} className="text-xs text-[#22C55E] flex items-center gap-1 hover:underline cursor-pointer">
                <Plus size={14} /> Add Modifier
              </button>
            </div>
            <div className="space-y-2">
              {form.modifiers.map((mod, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input value={mod.name} onChange={(e) => updateModifier(idx, 'name', e.target.value)} placeholder="e.g. Extra Cheese" className="flex-1 bg-[#334155] text-slate-100 rounded-lg px-3 py-2 text-sm border border-[#475569] placeholder-slate-500" />
                  <input type="number" value={mod.additionalPrice} onChange={(e) => updateModifier(idx, 'additionalPrice', e.target.value)} placeholder="Price" className="w-24 bg-[#334155] text-slate-100 rounded-lg px-3 py-2 text-sm border border-[#475569] placeholder-slate-500" />
                  <button type="button" onClick={() => removeModifier(idx)} className="text-[#EF4444] hover:bg-[#EF4444]/10 p-1 rounded cursor-pointer"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAvailable" checked={form.isAvailable} onChange={(e) => updateField('isAvailable', e.target.checked)} className="w-4 h-4 accent-[#22C55E]" />
            <label htmlFor="isAvailable" className="text-sm">Available for ordering</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 cursor-pointer">Cancel</button>
            <button type="submit" className="bg-[#22C55E] text-[#052E16] font-bold flex-1 py-3 rounded-xl hover:bg-[#16A34A] transition cursor-pointer">
              {product ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
