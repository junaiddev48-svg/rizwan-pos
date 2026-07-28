import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'
import ProductTile from './ProductTile'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function ProductGrid({ onSelectProduct }) {
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let channel

    async function init() {
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (isMounted) {
        if (!error) setProducts(data || [])
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('products')
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

  const filtered = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory)

  if (loading) return <LoadingSpinner text="Loading menu..." />

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 overflow-x-auto pb-3 px-4 pt-4 no-print">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
              activeCategory === cat.id
                ? 'bg-[#22C55E] text-[#052E16]'
                : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((product) => (
            <ProductTile key={product.id} product={product} onSelect={onSelectProduct} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 mt-10">No products in this category</p>
        )}
      </div>
    </div>
  )
}
