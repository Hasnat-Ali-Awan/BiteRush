import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const deliveryFee = Number(cart.restaurant?.deliveryFee || 0)
  const gst = Math.round(subtotal * 0.13)
  const total = subtotal + deliveryFee + gst

  async function placeOrder(event) {
    event.preventDefault()
    if (!cart.restaurant || cart.items.length === 0) {
      navigate('/cart')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (!location) {
        throw new Error('Choose your delivery pin on the map')
      }
      const order = await api.createOrder({
        restaurantId: cart.restaurant.id,
        customerName: name,
        deliveryAddress: address,
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

  return (
    <form
      onSubmit={placeOrder}
      className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 lg:grid-cols-[1fr_360px]"
    >
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        {error ? <p className="text-error">{error}</p> : null}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Deliver to</h2>
          <div className="mt-4">
            <GoogleMapPicker
              label="Customer location"
              address={address}
              onAddressChange={setAddress}
              value={location}
              onChange={setLocation}
              height={320}
            />
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Contact Information</h2>
          <label className="mt-4 block text-sm font-semibold">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/40 px-4 py-3"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Mobile Number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/40 px-4 py-3"
              required
            />
          </label>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Payment Method</h2>
          <p className="mt-3 rounded-xl border border-primary bg-primary/5 p-4 font-semibold">
            Cash on Delivery
          </p>
          <label className="mt-4 block text-sm font-semibold">
            Delivery Note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/40 px-4 py-3"
              rows={3}
            />
          </label>
        </div>
      </section>

      <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-bold">Order Summary</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.lineId} className="flex justify-between">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{money(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between font-bold">
          <span>Total</span>
          <span>{money(total)}</span>
        </p>
        <button
          type="submit"
          disabled={saving || cart.items.length === 0}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Placing order…' : 'Place Order'}
        </button>
      </aside>
    </form>
  )
}
