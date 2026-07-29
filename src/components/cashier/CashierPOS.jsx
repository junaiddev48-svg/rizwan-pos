import { useState } from 'react'
import { WifiOff, RefreshCw, ChefHat } from 'lucide-react'
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

export default function CashierPOS() {
  const [showModifier, setShowModifier] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showRecent, setShowRecent] = useState(false)
  const [showKitchen, setShowKitchen] = useState(false)
  const { addToCart } = useOrder()
  const { activeShift, loading: shiftLoading } = useShift()
  const isOnline = useNetworkStatus()
  const { queuedCount, syncing, flushQueue } = useOfflineSync()
  const cartLength = useOrder().cart.length
  const cartSubtotal = useOrder().subtotal

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

        <div className="w-[380px] min-w-[320px] hidden lg:block flex flex-col">
          <div className="flex gap-1 px-3 pt-2 no-print">
            <button
              onClick={() => setShowRecent(true)}
              className="flex-1 text-xs bg-[#334155] text-slate-300 py-2 rounded-lg font-semibold hover:bg-[#475569] transition cursor-pointer"
            >
              Orders
            </button>
            <button
              onClick={() => setShowKitchen(true)}
              className="flex-1 text-xs bg-[#334155] text-slate-300 py-2 rounded-lg font-semibold hover:bg-[#475569] transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <ChefHat size={12} /> Kitchen
            </button>
          </div>
          <CartSidebar
            onCheckout={() => setShowPayment(true)}
            onRecentOrders={() => setShowRecent(true)}
          />
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
          <button
            onClick={() => setShowPayment(true)}
            disabled={cartLength === 0}
            className="w-full bg-[#22C55E] text-[#052E16] font-bold py-4 text-lg disabled:opacity-40 cursor-pointer"
          >
            VIEW CART & CHECKOUT (Rs. {cartSubtotal.toLocaleString()})
          </button>
        </div>
      </div>

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
