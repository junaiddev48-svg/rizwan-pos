import { createContext, useContext, useState } from 'react'

const OrderContext = createContext()

export function OrderProvider({ children }) {
  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('dine_in')
  const [tableNumber, setTableNumber] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  function addToCart(product, modifiers = [], itemNotes = '') {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers) &&
          item.itemNotes === itemNotes
      )
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          basePrice: product.price,
          selectedModifiers: modifiers,
          itemNotes,
        },
      ]
    })
  }

  function updateQuantity(productId, delta, modifiers = [], itemNotes = '') {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers) &&
          item.itemNotes === itemNotes
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeFromCart(productId, modifiers = [], itemNotes = '') {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers) &&
            item.itemNotes === itemNotes
          )
      )
    )
  }

  function clearCart() {
    setCart([])
    setOrderType('dine_in')
    setTableNumber('')
    setCustomerPhone('')
    setCustomerAddress('')
  }

  const subtotal = cart.reduce((sum, item) => {
    const modTotal = (item.selectedModifiers || []).reduce((s, m) => s + m.additionalPrice, 0)
    return sum + (item.basePrice + modTotal) * item.quantity
  }, 0)

  return (
    <OrderContext.Provider
      value={{
        cart,
        orderType,
        setOrderType,
        tableNumber,
        setTableNumber,
        customerPhone,
        setCustomerPhone,
        customerAddress,
        setCustomerAddress,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export const useOrder = () => useContext(OrderContext)
