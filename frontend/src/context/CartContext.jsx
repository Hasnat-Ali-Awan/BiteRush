import { createContext, useContext, useMemo, useState } from 'react'

const KEY = 'biterush-cart'
const CartContext = createContext(null)

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || { restaurant: null, items: [] }
  } catch {
    return { restaurant: null, items: [] }
  }
}

function persist(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart))
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readCart)

  const value = useMemo(() => {
    function setNext(next) {
      persist(next)
      setCart(next)
    }

    function addItem(restaurant, dish, variant = null, extras = [], quantity = 1) {
      const variantKey = variant?.name ? `v:${variant.name}` : 'v:def'
      const extrasKey = (extras || []).map((e) => e.name).sort().join(',')
      const lineId = `${dish.id}_${variantKey}_e:${extrasKey}`

      const base = Number(dish.basePrice || 0)
      const variantDelta = Number(variant?.priceDelta || 0)
      const extrasTotal = (extras || []).reduce(
        (sum, extra) => sum + Number(extra.price || 0),
        0,
      )
      const unitPrice = Math.max(0, base + variantDelta + extrasTotal)

      const displayName = variant?.name && variant.name.toLowerCase() !== 'regular'
        ? `${dish.name} (${variant.name})`
        : dish.name

      let items = cart.items
      if (cart.restaurant && cart.restaurant.id !== restaurant.id) {
        items = []
      }

      const existing = items.find((item) => item.lineId === lineId)
      const nextItems = existing
        ? items.map((item) =>
            item.lineId === lineId
              ? { ...item, quantity: item.quantity + (quantity || 1) }
              : item,
          )
        : [
            ...items,
            {
              lineId,
              menuItemId: dish.id,
              name: displayName,
              image: dish.images?.[0] || null,
              variant: variant || null,
              extras: extras || [],
              price: unitPrice,
              quantity: quantity || 1,
            },
          ]

      setNext({ restaurant, items: nextItems })
    }

    function updateQty(lineId, quantity) {
      const items =
        quantity <= 0
          ? cart.items.filter((item) => item.lineId !== lineId)
          : cart.items.map((item) =>
              item.lineId === lineId ? { ...item, quantity } : item,
            )
      setNext({ ...cart, items })
    }

    function removeItem(lineId) {
      setNext({
        ...cart,
        items: cart.items.filter((item) => item.lineId !== lineId),
      })
    }

    function clear() {
      setNext({ restaurant: null, items: [] })
    }

    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )

    return { cart, addItem, updateQty, removeItem, clear, count, subtotal }
  }, [cart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
