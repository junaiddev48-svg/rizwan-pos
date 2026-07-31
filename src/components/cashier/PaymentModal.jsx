import { useState, useEffect } from 'react'
import { X, Banknote, Smartphone, WifiOff } from 'lucide-react'
import { useOrder } from '../../contexts/OrderContext'
import { useShift } from '../../contexts/ShiftContext'
import supabase from '../../lib/supabase'
import useTokenCounter from '../../hooks/useTokenCounter'
import { printCustomerReceipt, printKitchenKOT } from '../../lib/printing'
import { addToOrderQueue } from '../../lib/offline'
import useNetworkStatus from '../../hooks/useNetworkStatus'
import toast from 'react-hot-toast'

const wallets = [
  { id: 'jazzcash', label: 'JazzCash', icon: Smartphone },
  { id: 'easypaisa', label: 'EasyPaisa', icon: Smartphone },
]

export default function PaymentModal({ onClose, onOrderQueued }) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)
  const [cashGiven, setCashGiven] = useState('')
  const { cart, subtotal, orderType, tableNumber, customerPhone, customerAddress, clearCart } = useOrder()
  const { activeShift } = useShift()
  const { token, nextToken } = useTokenCounter()
  const isOnline = useNetworkStatus()

  const change = Math.max(0, parseFloat(cashGiven || 0) - subtotal)

  async function handleSettle() {
    if (!activeShift) {
      toast.error('No active shift! Open a shift first.')
      return
    }

    if (paymentMethod === 'cash' && parseFloat(cashGiven || 0) < subtotal) {
      toast.error('Insufficient cash given')
      return
    }

    setProcessing(true)
    try {
      const tokenNum = await nextToken()

      const orderData = {
        orderId: `RZW-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(tokenNum).padStart(3,'0')}`,
        tokenNumber: tokenNum,
        shiftId: activeShift.id,
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber : '',
        customerPhone: orderType === 'delivery' ? customerPhone : '',
        customerAddress: orderType === 'delivery' ? customerAddress : '',
        items: cart,
        subtotal,
        grandTotal: subtotal,
        paymentMethod,
        status: 'preparing',
        cancellationReason: '',
        createdAt: new Date().toISOString(),
      }

      if (isOnline) {
        const { data, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single()

        if (error) {
          addToOrderQueue(orderData)
          printCustomerReceipt(orderData)
          printKitchenKOT(orderData)
          toast.success(`Order #${tokenNum} saved locally — will sync when online!`, { duration: 4000 })
          onOrderQueued?.()
        } else {
          printCustomerReceipt(data)
          printKitchenKOT(data)
          toast.success(`Order #${tokenNum} placed!`)
        }
      } else {
        addToOrderQueue(orderData)
        printCustomerReceipt(orderData)
        printKitchenKOT(orderData)
        toast.success(`Order #${tokenNum} saved offline — will sync when online!`, { duration: 4000 })
        onOrderQueued?.()
      }

      clearCart()
      onClose()
    } catch (err) {
      toast.error('Failed to place order')
    }
    setProcessing(false)
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault()
        if (!processing) handleSettle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [processing, isOnline, cart, subtotal, orderType, tableNumber, customerPhone, customerAddress, activeShift, onClose, onOrderQueued])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md border border-[#334155]">
        <div className="flex items-center justify-between p-4 border-b border-[#334155]">
          <h3 className="text-lg font-bold">Settle Payment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={22} /></button>
        </div>

        <div className="p-4">
          {!isOnline && (
            <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-3 py-2 mb-3 text-xs text-[#EF4444]">
              <WifiOff size={14} />
              <span>Offline — order will be saved and synced when internet is back</span>
            </div>
          )}
          <div className="text-center mb-4">
            <div className="text-slate-400 text-sm">Total Due</div>
            <div className="text-3xl font-bold text-[#F59E0B]">Rs. {subtotal.toLocaleString()}</div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-lg transition ${
                paymentMethod === 'cash'
                  ? 'bg-[#22C55E] text-[#052E16]'
                  : 'bg-[#334155] text-slate-400 hover:bg-[#475569]'
              }`}
            >
              <Banknote size={22} />
              CASH
            </button>
            {wallets.map((w) => {
              const Icon = w.icon
              return (
                <button
                  key={w.id}
                  onClick={() => setPaymentMethod(w.id)}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-lg transition ${
                    paymentMethod === w.id
                      ? 'bg-[#A855F7] text-white'
                      : 'bg-[#334155] text-slate-400 hover:bg-[#475569]'
                  }`}
                >
                  <Icon size={22} />
                  {w.label}
                </button>
              )
            })}
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Cash Given</label>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-[#334155] text-slate-100 rounded-xl px-4 py-3 text-lg font-bold border border-[#475569]"
                  autoFocus
                />
              </div>
              {parseFloat(cashGiven || 0) >= subtotal && (
                <div className="flex justify-between text-sm bg-[#334155] rounded-xl px-4 py-3">
                  <span className="text-slate-400">Change Due</span>
                  <span className="font-bold text-[#22C55E]">Rs. {change.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod !== 'cash' && (
            <p className="text-center text-slate-400 text-sm py-3">
              Confirm payment via {paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-[#334155]">
          <button
            onClick={handleSettle}
            disabled={processing}
            className={`w-full py-4 rounded-xl font-bold text-lg transition cursor-pointer ${
              paymentMethod === 'cash' ? 'btn-cash text-center' : 'btn-wallet text-center'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processing ? 'PROCESSING...' : `CONFIRM ${paymentMethod === 'cash' ? 'CASH' : paymentMethod.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
