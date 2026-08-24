import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useCart } from '../context/CartContext'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function Cart() {
  const { cart, updateQty, removeItem, clear, count, subtotal } = useCart()
  const navigate = useNavigate()
  const deliveryFee = Number(cart.restaurant?.deliveryFee || 0)
  const gst = Math.round(subtotal * 0.13)
  const total = subtotal + deliveryFee + gst
  const minOrder = Number(cart.restaurant?.minOrder || 0)
  const isBelowMin = minOrder > 0 && subtotal < minOrder

  if (count === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-3xl font-extrabold text-on-surface">Your cart is empty</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Explore top restaurant branches on BiteRush and add tasty dishes to get started.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95"
        >
          Explore Restaurants
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Your Shopping Cart</h1>
            <p className="text-xs text-on-surface-variant">
              Ordering from{' '}
              <strong className="text-on-surface">
                {cart.restaurant?.name}
                {cart.restaurant?.branch ? ` (${cart.restaurant.branch})` : ''}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your cart?')) clear()
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-error hover:bg-error/10"
          >
            Clear Cart
          </button>
        </div>

        {isBelowMin ? (
          <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-variant">
            <strong>⚠️ Minimum Order: {money(minOrder)}</strong>
            <p className="mt-0.5">
              Add {money(minOrder - subtotal)} more worth of items to fulfill the restaurant's minimum order requirement.
            </p>
          </div>
        ) : null}

        <ul className="mt-4 divide-y divide-outline-variant/20">
          {cart.items.map((item) => (
            <li key={item.lineId} className="flex items-center gap-4 py-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl text-primary/40">
                    🍛
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-on-surface">{item.name}</p>
                {item.extras?.length > 0 ? (
                  <p className="text-xs text-on-surface-variant">
                    + {item.extras.map((e) => e.name).join(', ')}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container font-bold text-on-surface hover:bg-outline-variant/40"
                    onClick={() => updateQty(item.lineId, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container font-bold text-on-surface hover:bg-outline-variant/40"
                    onClick={() => updateQty(item.lineId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="font-bold text-on-surface">
                {money(item.price * item.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.lineId)}
                className="p-1 text-on-surface-variant/60 hover:text-error flex items-center justify-center"
                title="Remove item"
              >
                <Icon name="delete" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-outline-variant/20 pt-4">
          <Link
            to={cart.restaurant?.id ? `/restaurants/${cart.restaurant.id}` : '/'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Icon name="add" className="h-5 w-5 text-primary" />
            Add more items from this restaurant
          </Link>
        </div>
      </section>

      <aside className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-bold">Order Summary</h2>
        <dl className="space-y-2.5 text-sm text-on-surface-variant">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-on-surface">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>GST (13%)</dt>
            <dd className="font-semibold text-on-surface">{money(gst)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery Fee</dt>
            <dd className="font-semibold text-on-surface">{money(deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-outline-variant/20 pt-3 text-base font-bold text-on-surface">
            <dt>Total Amount</dt>
            <dd className="text-xl font-black text-primary">{money(total)}</dd>
          </div>
        </dl>

        <button
          type="button"
          disabled={isBelowMin}
          onClick={() => navigate('/checkout')}
          className="mt-2 w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBelowMin ? 'Minimum Order Not Met' : 'Proceed to Checkout'}
        </button>

        <p className="text-center text-[11px] text-on-surface-variant">
          Deliveries are fulfilled directly by the restaurant.
        </p>
      </aside>
    </div>
  )
}
