import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function Cart() {
  const { cart, updateQty, removeItem, count, subtotal } = useCart()
  const navigate = useNavigate()
  const deliveryFee = Number(cart.restaurant?.deliveryFee || 0)
  const gst = Math.round(subtotal * 0.13)
  const total = subtotal + deliveryFee + gst

  if (count === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-on-surface-variant">
          Add dishes from a restaurant to get started.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-white"
        >
          Browse restaurants
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <p className="mt-1 text-on-surface-variant">{cart.restaurant?.name}</p>
        <ul className="mt-6 divide-y divide-surface-variant/40">
          {cart.items.map((item) => (
            <li key={item.lineId} className="flex items-center gap-4 py-4">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-surface-container">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-surface-container px-2"
                    onClick={() => updateQty(item.lineId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    className="rounded-lg bg-surface-container px-2"
                    onClick={() => updateQty(item.lineId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="font-bold">{money(item.price * item.quantity)}</p>
              <button
                type="button"
                onClick={() => removeItem(item.lineId)}
                className="text-error"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </li>
          ))}
        </ul>
        <Link
          to={`/restaurants/${cart.restaurant.id}`}
          className="mt-4 inline-flex items-center gap-2 font-semibold text-primary"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add more items
        </Link>
      </section>

      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-bold">Order Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>GST (13%)</dt>
            <dd>{money(gst)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery Fee</dt>
            <dd>{money(deliveryFee)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white"
        >
          Proceed to Checkout
        </button>
      </aside>
    </div>
  )
}
