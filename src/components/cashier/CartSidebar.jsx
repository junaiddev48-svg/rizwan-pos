import { ShoppingCart, History } from 'lucide-react'
import { useOrder } from '../../contexts/OrderContext'
import OrderTypeSelector from './OrderTypeSelector'
import CartItem from './CartItem'

export default function CartSidebar({ onCheckout, onRecentOrders }) {
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

  function handleUpdateQty(item, delta) {
    updateQuantity(item.productId, delta, item.selectedModifiers, item.itemNotes)
  }

  function handleRemove(item) {
    removeFromCart(item.productId, item.selectedModifiers, item.itemNotes)
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#1E293B] border-l border-[#334155]">
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

        <div className="flex gap-2">
          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || (!tableNumber && orderType === 'dine_in')}
            className="flex-1 btn-cash disabled:opacity-40 disabled:cursor-not-allowed text-center cursor-pointer"
          >
            SETTLE PAYMENT
          </button>
          <button
            onClick={onRecentOrders}
            className="btn-secondary flex items-center justify-center gap-1 cursor-pointer"
            title="Recent Orders"
          >
            <History size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
