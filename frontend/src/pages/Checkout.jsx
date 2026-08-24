import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import GoogleMapPicker from '../components/GoogleMapPicker'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function Checkout() {
  const { cart, clear, subtotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const minOrder = Number(cart.restaurant?.minOrder || 0)
  const deliveryFee = Number(cart.restaurant?.deliveryFee || 0)
  const gst = Math.round(subtotal * 0.13)
  const total = subtotal + deliveryFee + gst
  const isBelowMinOrder = minOrder > 0 && subtotal < minOrder

  async function placeOrder(event) {
    event.preventDefault()
    if (!cart.restaurant || cart.items.length === 0) {
      navigate('/cart')
      return
    }

    if (name.trim().length < 2) {
      setError('Please provide your name (at least 2 characters).')
      return
    }

    // Pakistani / standard phone format validation
    const cleanedPhone = phone.replace(/[\s-]/g, '')
    const phoneRegex = /^(\+92|0)?3[0-9]{9}$|^[0-9]{10,14}$/
    if (!phoneRegex.test(cleanedPhone)) {
      setError('Please provide a valid mobile number (e.g. 03001234567).')
      return
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('Please provide a complete delivery address (street, building, or area).')
      return
    }

    const hasValidLocation =
      location &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lng) &&
      (Math.abs(location.lat) > 1e-6 || Math.abs(location.lng) > 1e-6)

    if (!hasValidLocation) {
      setError('Please place your exact delivery pin on the Google Map above.')
      return
    }

    if (isBelowMinOrder) {
      setError(`Minimum order amount for ${cart.restaurant.name} is ${money(minOrder)}. Please add ${money(minOrder - subtotal)} more to your cart.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      const order = await api.createOrder({
        restaurantId: cart.restaurant.id,
        customerName: name.trim(),
        deliveryAddress: address.trim(),
        deliveryLocation: location,
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })
      clear()
      navigate(`/orders/${order.id}`, { state: { phone, note, address, total } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!cart.restaurant || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-16 text-center">
        <div className="text-5xl">🛒</div>
        <h2 className="mt-4 text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-on-surface-variant">
          Add some delicious items from a restaurant before checking out.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-md shadow-primary/20 hover:opacity-95"
        >
          Browse restaurants
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={placeOrder}
      className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]"
    >
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <span className="text-sm font-medium text-on-surface-variant">
            Ordering from <strong>{cart.restaurant.name} ({cart.restaurant.branch})</strong>
          </span>
        </div>

        {error ? (
          <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        ) : null}

        {isBelowMinOrder ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-variant">
            <p className="font-bold">⚠️ Minimum order amount is {money(minOrder)}</p>
            <p className="mt-1 text-xs">
              Your subtotal is {money(subtotal)}. Add {money(minOrder - subtotal)} more to proceed with checkout.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-bold">1. Delivery Location & Pin</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            Search your address or pin your exact location on Google Maps for precise delivery.
          </p>
          <div className="mt-4">
            <GoogleMapPicker
              label="Pin your exact location"
              required
              address={address}
              onAddressChange={setAddress}
              value={location}
              onChange={setLocation}
              height={300}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-bold">2. Contact Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Full Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Mobile Phone *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-bold">3. Payment & Instructions</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
            <span className="text-2xl">💵</span>
            <div>
              <p className="font-bold text-primary">Cash on Delivery (COD)</p>
              <p className="text-xs text-on-surface-variant">
                Pay the rider in cash when your food arrives at your door.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Delivery instructions / Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ring the doorbell on 2nd floor, leave at reception, extra napkins"
              className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* ASIDE ORDER SUMMARY */}
      <aside className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-bold">Order Summary</h2>
        <ul className="divide-y divide-outline-variant/20 text-sm">
          {cart.items.map((item) => (
            <li key={item.lineId} className="flex justify-between py-2.5">
              <div>
                <span className="font-semibold">{item.quantity}×</span> {item.name}
              </div>
              <span className="font-semibold">{money(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-outline-variant/20 pt-3 text-xs text-on-surface-variant">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-on-surface">{money(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-semibold text-on-surface">{money(deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (13%)</span>
            <span className="font-semibold text-on-surface">{money(gst)}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between border-t border-outline-variant/20 pt-3 text-base font-bold">
          <span>Total Amount</span>
          <span className="text-xl font-black text-primary">{money(total)}</span>
        </div>

        <button
          type="submit"
          disabled={saving || cart.items.length === 0 || isBelowMinOrder}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Placing Order…</span>
            </>
          ) : isBelowMinOrder ? (
            <span>Min. Order Not Met</span>
          ) : (
            <span>Place Order ({money(total)})</span>
          )}
        </button>

        <p className="text-center text-[11px] text-on-surface-variant">
          By placing your order, you agree to BiteRush terms of service.
        </p>
      </aside>
    </form>
  )
}
