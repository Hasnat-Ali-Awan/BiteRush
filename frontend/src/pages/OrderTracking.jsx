import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import TrackingMap from '../components/TrackingMap'

const STEPS = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'assigned',
  'picked_up',
  'on_the_way',
  'delivered',
]

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let timer
    async function load() {
      try {
        const next = await api.getOrder(id)
        setOrder(next)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
    timer = setInterval(load, 4000)
    return () => clearInterval(timer)
  }, [id])

  const index = STEPS.indexOf(order?.status)
  const restaurantPoint = order?.restaurant?.location
  const customerPoint = order?.deliveryLocation
  const riderPoint = order?.riderCurrentLocation

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <TrackingMap
            restaurant={restaurantPoint}
            customer={customerPoint}
            rider={riderPoint}
            status={order?.status}
          />
          <div className="mt-4 grid gap-2 text-sm text-on-surface-variant sm:grid-cols-3">
            <p className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <span className="font-semibold text-on-surface">Restaurant:</span>{' '}
              {order?.restaurant?.branch || 'Pending'}
            </p>
            <p className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <span className="font-semibold text-on-surface">Customer:</span>{' '}
              {order?.deliveryAddress || 'Address pending'}
            </p>
            <p className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <span className="font-semibold text-on-surface">Rider:</span>{' '}
              {riderPoint ? 'Live on map' : 'Waiting for assignment'}
            </p>
          </div>
        </div>

        <div className="text-center lg:text-left">
          <span className="material-symbols-outlined text-5xl text-success">
            check_circle
          </span>
          <h1 className="mt-4 text-3xl font-bold">Order placed</h1>
          {error ? <p className="mt-2 text-error">{error}</p> : null}
          <p className="mt-2 text-on-surface-variant">
            {order?.orderNumber} · {order?.status}
          </p>
          <ol className="mt-8 space-y-3 text-left">
            {STEPS.map((step, stepIndex) => (
              <li
                key={step}
                className={`rounded-xl px-4 py-3 ${
                  stepIndex <= index
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'bg-white'
                }`}
              >
                {step.replaceAll('_', ' ')}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-xl border px-4 py-2 font-semibold"
            >
              Back home
            </Link>
            <Link
              to="/manager"
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white"
            >
              Open kitchen/manager
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
