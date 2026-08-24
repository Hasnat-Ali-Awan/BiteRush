import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import TrackingMap from '../components/TrackingMap'

const STEPS = [
  { key: 'pending', label: 'Order Received', desc: 'Your order was sent to the restaurant' },
  { key: 'accepted', label: 'Confirmed', desc: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Cooking & Packing', desc: 'Kitchen is preparing your meal' },
  { key: 'ready', label: 'Ready for Pickup', desc: 'Packed and waiting for the rider' },
  { key: 'assigned', label: 'Rider Assigned', desc: 'A delivery partner has been assigned' },
  { key: 'picked_up', label: 'Picked Up', desc: 'Rider collected your package' },
  { key: 'on_the_way', label: 'Out for Delivery', desc: 'Rider is on the way to your address' },
  { key: 'delivered', label: 'Delivered', desc: 'Order delivered. Enjoy your meal!' },
]

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let timer
    async function load() {
      try {
        const next = await api.getOrder(id)
        setOrder(next)
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    timer = setInterval(load, 4000)
    return () => clearInterval(timer)
  }, [id])

  const isCancelled = order?.status === 'cancelled' || order?.status === 'rejected'
  const stepKeys = STEPS.map((s) => s.key)
  const activeStepIndex = isCancelled ? -1 : stepKeys.indexOf(order?.status)

  const restaurantPoint = order?.restaurant?.location
  const customerPoint = order?.deliveryLocation
  const riderPoint = order?.riderCurrentLocation

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-4xl animate-bounce">🛵</p>
        <p className="mt-3 text-lg font-bold text-on-surface">Locating your order…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {error ? (
        <div className="mb-6 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* MAP & STATUS CARDS */}
        <div className="space-y-4">
          <TrackingMap
            restaurant={restaurantPoint}
            customer={customerPoint}
            rider={riderPoint}
            status={order?.status}
          />

          <div className="grid gap-3 sm:grid-cols-3 text-xs text-on-surface-variant">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="font-bold text-on-surface flex items-center gap-1.5">
                <span>🏪</span> Restaurant
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {order?.restaurant?.name || 'Restaurant'}
              </p>
              <p className="mt-0.5">{order?.restaurant?.branch || 'Main Branch'}</p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="font-bold text-on-surface flex items-center gap-1.5">
                <span>📍</span> Delivery To
              </p>
              <p className="mt-1 font-semibold text-on-surface line-clamp-2">
                {order?.deliveryAddress || 'Address on file'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="font-bold text-on-surface flex items-center gap-1.5">
                <span>🛵</span> Rider Status
              </p>
              <p className="mt-1 font-semibold text-on-surface">
                {riderPoint
                  ? '📍 Live GPS Active'
                  : activeStepIndex >= 4
                    ? 'Assigned · Awaiting GPS'
                    : 'Awaiting dispatch'}
              </p>
            </div>
          </div>

          {/* ORDER ITEMS SUMMARY */}
          {order?.items?.length > 0 ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="text-sm font-bold text-on-surface">Order Items</h3>
              <ul className="mt-3 divide-y divide-outline-variant/20 text-sm">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span>
                      <strong className="text-primary">{item.quantity}×</strong> {item.name}
                    </span>
                    <span className="font-semibold">{money(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-outline-variant/20 pt-3 font-bold text-base">
                <span>Total Paid (COD)</span>
                <span className="text-lg text-primary">{money(order.total)}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* STATUS TIMELINE */}
        <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {isCancelled ? (
            <div className="rounded-xl border border-error/30 bg-error/10 p-5 text-center">
              <span className="text-4xl">❌</span>
              <h2 className="mt-2 text-xl font-bold text-error">
                Order {order?.status === 'rejected' ? 'Rejected' : 'Cancelled'}
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                This order could not be fulfilled. Please contact support or place a new order.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {order?.orderNumber || 'Order'}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {order?.createdAt
                    ? new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold text-on-surface">
                {STEPS[activeStepIndex]?.label || 'Processing Order'}
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                {STEPS[activeStepIndex]?.desc || 'We are preparing your delivery.'}
              </p>
            </div>
          )}

          {/* TIMELINE STEPS */}
          {!isCancelled ? (
            <ol className="relative space-y-4 border-l-2 border-outline-variant/40 pl-5 text-left">
              {STEPS.map((step, idx) => {
                const isPassed = idx < activeStepIndex
                const isCurrent = idx === activeStepIndex
                return (
                  <li key={step.key} className="relative">
                    <span
                      className={`absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                        isPassed
                          ? 'bg-primary text-white'
                          : isCurrent
                            ? 'bg-primary text-white ring-4 ring-primary/20'
                            : 'border-2 border-outline-variant bg-white text-on-surface-variant'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    <p
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-primary'
                          : isPassed
                            ? 'text-on-surface'
                            : 'text-on-surface-variant'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-on-surface-variant">{step.desc}</p>
                  </li>
                )
              })}
            </ol>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/"
              className="flex-1 rounded-xl border border-outline-variant/50 py-3 text-center text-xs font-bold text-on-surface hover:bg-surface-container"
            >
              ← Back to Home
            </Link>
            <Link
              to="/manager"
              className="flex-1 rounded-xl bg-primary py-3 text-center text-xs font-bold text-white shadow-md shadow-primary/20 hover:opacity-95"
            >
              Manager View
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
