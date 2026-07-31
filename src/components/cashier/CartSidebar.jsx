import { ShoppingCart, History, ChefHat, PanelLeftClose, X } from 'lucide-react'
import { useOrder } from '../../contexts/OrderContext'
import { useCancellations } from '../../lib/cancellations'
import OrderTypeSelector from './OrderTypeSelector'
import CartItem from './CartItem'

export default function CartSidebar({ onCheckout, onRecentOrders, onOpenKitchen, onCollapse, onClose }) {
  const {
    cart,
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    customerPhone,
    setCustomerPhone,
    customerAddress,
    setCustomerAddress,
    updateQuantity,
    removeFromCart,
    subtotal,
  } = useOrder()
  const cancellations = useCancellations()

  function handleUpdateQty(item, delta) {
    updateQuantity(item.productId, delta, item.selectedModifiers, item.itemNotes)
  }

  function handleRemove(item) {
    removeFromCart(item.productId, item.selectedModifiers, item.itemNotes)
  }

  return (
    <div className="h-full flex flex-col bg-[#1E293B] lg:border-l lg:border-[#334155] rounded-t-2xl lg:rounded-none">
      <div className="p-3 border-b border-[#334155] flex items-center justify-between no-print">
        <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
          <ShoppingCart size={16} className="text-[#F59E0B]" />
          CURRENT ORDER
        </h3>
        <div className="flex items-center gap-1">
          {onRecentOrders && (
            <button onClick={onRecentOrders} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#334155] transition cursor-pointer" title="Recent Orders">
              <History size={16} />
            </button>
          )}
          {onOpenKitchen && (
            <button onClick={onOpenKitchen} className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#334155] transition cursor-pointer" title="Kitchen View">
              <ChefHat size={16} />
              {cancellations.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cancellations.length}
                </span>
              )}
            </button>
          )}
          {onCollapse && (
            <button onClick={onCollapse} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#334155] transition cursor-pointer hidden lg:block" title="Collapse panel">
              <PanelLeftClose size={16} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#334155] transition cursor-pointer lg:hidden" title="Close cart">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-[#334155]">
        <OrderTypeSelector
          orderType={orderType}
          setOrderType={setOrderType}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerAddress={customerAddress}
          setCustomerAddress={setCustomerAddress}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <ShoppingCart size={40} />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs">Tap items to add</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <CartItem
              key={`${item.productId}-${idx}`}
              item={item}
              onUpdateQty={handleUpdateQty}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-[#334155] space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">SUBTOTAL</span>
          <span className="font-bold text-lg text-white">Rs. {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">GRAND TOTAL</span>
          <span className="font-bold text-xl text-[#F59E0B]">Rs. {subtotal.toLocaleString()}</span>
        </div>

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || (!tableNumber && orderType === 'dine_in')}
          className="w-full btn-cash disabled:opacity-40 disabled:cursor-not-allowed text-center cursor-pointer"
        >
          SETTLE PAYMENT
        </button>
      </div>
    </div>
  )
}
