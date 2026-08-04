import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import ProductForm from './ProductForm'
import StaffManager from './StaffManager'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Pencil, Trash2, ImageOff, UtensilsCrossed, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPanel() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [tab, setTab] = useState('products')
  const { isOwner } = useAuth()

  useEffect(() => {
    let isMounted = true
    let channel

    async function init() {
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (isMounted && !error) {
        setProducts(data || [])
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('products-admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          const { data } = await supabase.from('products').select('*').order('name')
          if (isMounted) setProducts(data || [])
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) toast.error('Failed to delete')
    else toast.success('Product deleted')
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            tab === 'products' ? 'bg-[#22C55E] text-[#052E16]' : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
          }`}
        >
          <UtensilsCrossed size={16} /> Menu Products
        </button>
        {isOwner && (
        <button
          onClick={() => setTab('staff')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            tab === 'staff' ? 'bg-[#22C55E] text-[#052E16]' : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
          }`}
        >
          <ShieldCheck size={16} /> Staff & Access
        </button>
        )}
      </div>

      {tab === 'staff' ? (
        <StaffManager />
      ) : (
      <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-slate-400 text-sm">{products.length} products</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true) }}
          className="bg-[#22C55E] text-[#052E16] font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#16A34A] transition cursor-pointer"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="grid gap-3">
        {products.map((product) => (
          <div key={product.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#334155] flex-shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageOff size={18} className="text-slate-500" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{product.name}</h3>
                {!product.isAvailable && <span className="text-xs text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded">Unavailable</span>}
              </div>
              <div className="text-sm text-slate-400">
                Rs. {product.price?.toLocaleString()} &middot; {product.category}
                {(product.modifiers?.length || 0) > 0 && <span> &middot; {product.modifiers.length} modifier(s)</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditProduct(product); setShowForm(true) }} className="p-2 text-slate-400 hover:text-[#22C55E] hover:bg-[#22C55E]/10 rounded-lg transition cursor-pointer">
                <Pencil size={18} />
              </button>
              <button onClick={() => handleDelete(product)} className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition cursor-pointer">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && !loading && (
          <p className="text-center text-slate-500 py-10">No products yet. Add your first product!</p>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
          onSaved={() => {}}
        />
      )}
      </>
      )}
    </div>
  )
}
