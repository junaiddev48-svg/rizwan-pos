import { useState, useEffect, useRef, useCallback } from 'react'
import supabase from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'
import { getCachedProducts, cacheProducts } from '../../lib/offline'
import ProductTile from './ProductTile'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function ProductGrid({ onSelectProduct }) {
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const tileRefs = useRef({})
  const gridRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    let channel

    const cached = getCachedProducts()
    if (cached && cached.length > 0) {
      setProducts(cached)
      setLoading(false)
    }

    async function init() {
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (isMounted) {
        if (!error && data) {
          setProducts(data)
          cacheProducts(data)
        }
        setLoading(false)
      }
    }

    init()

    channel = supabase
      .channel('products')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (!isMounted) return
          setProducts((prev) => {
            let next
            if (payload.eventType === 'INSERT') {
              next = [...prev.filter((p) => p.id !== payload.new.id), payload.new]
            } else if (payload.eventType === 'DELETE') {
              next = prev.filter((p) => p.id !== payload.old.id)
            } else {
              next = prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            }
            cacheProducts(next)
            return next
          })
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

  const resetFocus = useCallback(() => {
    setFocusedIndex(-1)
    gridRef.current?.querySelector('button')?.focus()
  }, [])

  useEffect(() => {
    resetFocus()
  }, [activeCategory, resetFocus])

  function moveFocus(delta, cols) {
    const count = filtered.length
    if (count === 0) return
    let next = focusedIndex < 0 ? 0 : focusedIndex
    if (delta === 1 || delta === -1) {
      next = Math.min(count - 1, Math.max(0, next + delta))
    } else if (delta === cols || delta === -cols) {
      const target = next + delta
      if (target >= 0 && target < count) next = target
    }
    setFocusedIndex(next)
    const el = tileRefs.current[filtered[next]?.id]
    el?.focus()
    el?.scrollIntoView({ block: 'nearest' })
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target || document.activeElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return
      if (target && target.closest && (target.closest('[data-modal]') || target.closest('[data-cart]'))) return
      if (document.activeElement && document.activeElement.closest && (document.activeElement.closest('[data-modal]') || document.activeElement.closest('[data-cart]'))) return

      if (e.key >= '1' && e.key <= '9') {
        const cat = CATEGORIES[parseInt(e.key) - 1]
        if (cat) {
          e.preventDefault()
          setActiveCategory(cat.id)
        }
        return
      }

      const cols = window.innerWidth >= 768 ? 4 : window.innerWidth >= 640 ? 3 : 2
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); moveFocus(1, cols); break
        case 'ArrowLeft': e.preventDefault(); moveFocus(-1, cols); break
        case 'ArrowDown': e.preventDefault(); moveFocus(cols, cols); break
        case 'ArrowUp': e.preventDefault(); moveFocus(-cols, cols); break
        case 'Enter':
          if (focusedIndex >= 0 && filtered[focusedIndex]) {
            e.preventDefault()
            onSelectProduct(filtered[focusedIndex])
          }
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filtered, focusedIndex, onSelectProduct])

  if (loading && products.length === 0) return <LoadingSpinner text="Loading menu..." />

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 overflow-x-auto pb-3 px-4 pt-4 no-print" role="tablist">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-[#22C55E] text-[#052E16]'
                : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'
            }`}
          >
            {i + 1}. {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 lg:pb-4" ref={gridRef}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((product) => (
            <div key={product.id} ref={(el) => { tileRefs.current[product.id] = el }}>
              <ProductTile
                product={product}
                onSelect={onSelectProduct}
                isFocused={product.id === filtered[focusedIndex]?.id}
                setFocused={() => setFocusedIndex(filtered.findIndex((p) => p.id === product.id))}
              />
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 mt-10">No products in this category</p>
        )}
      </div>
    </div>
  )
}
