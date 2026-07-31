import { useState, useEffect, useRef } from 'react'
import { WifiOff, RefreshCw, ChefHat, History, ShoppingCart } from 'lucide-react'
import ProductGrid from './ProductGrid'
import CartSidebar from './CartSidebar'
import ModifierModal from './ModifierModal'
import PaymentModal from './PaymentModal'
import RecentOrders from './RecentOrders'
import KitchenView from './KitchenView'
import { useOrder } from '../../contexts/OrderContext'
import { useShift } from '../../contexts/ShiftContext'
import useNetworkStatus from '../../hooks/useNetworkStatus'
import useOfflineSync from '../../hooks/useOfflineSync'
import useCancellationWatcher from '../../hooks/useCancellationWatcher'
import { useCancellations } from '../../lib/cancellations'

const MIN_WIDTH = 300
const MAX_WIDTH = 520

export default function CashierPOS() {
  const [showModifier, setShowModifier] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showRecent, setShowRecent] = useState(false)
  const [showKitchen, setShowKitchen] = useState(false)
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('rizwan_sidebar_collapsed') === '1'
  )
  const [sidebarWidth, setSidebarWidth] = useState(
    () => parseInt(localStorage.getItem('rizwan_sidebar_width')) || 380
  )
  useCancellationWatcher()
  const cancellations = useCancellations()
  const { addToCart } = useOrder()
  const { activeShift, loading: shiftLoading } = useShift()
  const isOnline = useNetworkStatus()
  const { queuedCount, syncing, flushQueue } = useOfflineSync()
  const cartLength = useOrder().cart.length
  const cartSubtotal = useOrder().subtotal
  const dragRef = useRef(null)

  useEffect(() => {
    if (!showCartDrawer) return
    function onKey(e) {
      if (e.key === 'Escape') setShowCartDrawer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCartDrawer])

  function startResize(e) {
    if (sidebarCollapsed) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startWidth: sidebarWidth }
    window.addEventListener('pointermove', onResize)
    window.addEventListener('pointerup', stopResize)
  }

  function onResize(e) {
    if (!dragRef.current) return
    const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + (e.clientX - dragRef.current.startX)))
    setSidebarWidth(w)
    localStorage.setItem('rizwan_sidebar_width', String(w))
  }

  function stopResize() {
    dragRef.current = null
    window.removeEventListener('pointermove', onResize)
    window.removeEventListener('pointerup', stopResize)
  }

  function toggleCollapse() {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('rizwan_sidebar_collapsed', prev ? '0' : '1')
      return !prev
    })
  }

  function handleSelectProduct(product) {
    if (product.modifiers && product.modifiers.length > 0) {
      setShowModifier(product)
    } else {
      addToCart(product, [], '')
    }
  }

  function handleModifierConfirm(product, modifiers, notes) {
    addToCart(product, modifiers, notes)
    setShowModifier(null)
  }

  if (shiftLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full mx-auto mb-3" />
          <p>Loading shift data...</p>
        </div>
      </div>
    )
  }

  if (!activeShift) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-slate-400 max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Shift</h2>
          <p className="mb-4">You need to open a shift before taking orders.</p>
          <a href="/shift" className="inline-block bg-[#22C55E] text-[#052E16] font-bold px-6 py-3 rounded-xl hover:bg-[#16A34A] transition">
            Go to Shift Manager
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {!isOnline && (
        <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/30 px-4 py-2 flex items-center gap-2 text-xs text-[#EF4444] no-print">
          <WifiOff size={14} />
          <span>You are offline. Orders will be saved locally and synced automatically when internet returns.</span>
        </div>
      )}
      {queuedCount > 0 && (
        <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/30 px-4 py-2 flex items-center justify-between text-xs text-[#F59E0B] no-print">
          <span className="flex items-center gap-1">
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {queuedCount} order{queuedCount > 1 ? 's' : ''} pending sync
          </span>
          <button
            onClick={flushQueue}
            disabled={syncing || !isOnline}
            className="underline hover:no-underline disabled:opacity-40 cursor-pointer"
          >
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0">
          <ProductGrid onSelectProduct={handleSelectProduct} />
        </div>

        <div
          onPointerDown={startResize}
          className="hidden lg:block w-1.5 cursor-col-resize bg-[#334155]/40 hover:bg-[#22C55E]/60 active:bg-[#22C55E] transition-colors flex-shrink-0 no-print"
          title="Drag to resize"
        />

        {sidebarCollapsed ? (
          <div className="hidden lg:flex flex-col items-center gap-2 w-14 bg-[#1E293B] border-l border-[#334155] py-3 flex-shrink-0 no-print">
            <button onClick={toggleCollapse} className="relative p-2.5 rounded-xl bg-[#334155] text-slate-300 hover:bg-[#475569] transition cursor-pointer" title="Expand cart">
              <ShoppingCart size={18} />
              {cartLength > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-[#F59E0B] text-[#052E16] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartLength}
                </span>
              )}
            </button>
            <button onClick={() => setShowRecent(true)} className="relative p-2.5 rounded-xl bg-[#334155] text-slate-300 hover:bg-[#475569] transition cursor-pointer" title="Recent Orders">
              <History size={18} />
            </button>
            <button onClick={() => setShowKitchen(true)} className="relative p-2.5 rounded-xl bg-[#334155] text-slate-300 hover:bg-[#475569] transition cursor-pointer" title="Kitchen View">
              <ChefHat size={18} />
              {cancellations.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cancellations.length}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col h-full flex-shrink-0" style={{ width: `${sidebarWidth}px` }}>
            <CartSidebar
              onCheckout={() => setShowPayment(true)}
              onRecentOrders={() => setShowRecent(true)}
              onOpenKitchen={() => setShowKitchen(true)}
              onCollapse={toggleCollapse}
            />
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 no-print">
        <div className="flex items-stretch bg-[#1E293B] border-t border-[#334155]">
          <button
            onClick={() => setShowKitchen(true)}
            className="relative w-16 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-slate-300 hover:bg-[#334155] transition cursor-pointer"
          >
            <ChefHat size={20} />
            Kitchen
            {cancellations.length > 0 && (
              <span className="absolute top-1 right-2 min-w-4 h-4 px-0.5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {cancellations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowRecent(true)}
            className="w-16 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-slate-300 hover:bg-[#334155] transition cursor-pointer"
          >
            <History size={20} />
            Orders
          </button>
          <button
            onClick={() => setShowCartDrawer(true)}
            disabled={cartLength === 0}
            className="flex-1 bg-[#22C55E] text-[#052E16] font-bold py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            VIEW CART{cartLength > 0 ? ` (${cartLength})` : ''} — Rs. {cartSubtotal.toLocaleString()}
          </button>
        </div>
      </div>

      {showCartDrawer && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-50 flex items-end justify-center no-print">
          <div className="absolute inset-0" onClick={() => setShowCartDrawer(false)} />
          <div className="relative w-full max-w-lg bg-[#1E293B] rounded-t-2xl max-h-[92vh] flex flex-col slide-up">
            <div className="pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-[#475569]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <CartSidebar
                onCheckout={() => { setShowCartDrawer(false); setShowPayment(true) }}
                onRecentOrders={() => { setShowCartDrawer(false); setShowRecent(true) }}
                onOpenKitchen={() => { setShowCartDrawer(false); setShowKitchen(true) }}
                onClose={() => setShowCartDrawer(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showModifier && (
        <ModifierModal
          product={showModifier}
          onConfirm={handleModifierConfirm}
          onCancel={() => setShowModifier(null)}
        />
      )}

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onOrderQueued={() => window.dispatchEvent(new Event('order-queued'))}
        />
      )}
      {showRecent && <RecentOrders onClose={() => setShowRecent(false)} />}
      {showKitchen && <KitchenView onClose={() => setShowKitchen(false)} />}
    </div>
  )
}
