import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const NEXT_STATUS = {
  assigned: 'picked_up',
  picked_up: 'on_the_way',
  on_the_way: 'delivered',
}

function statusLabel(status) {
  return status.replaceAll('_', ' ')
}

export default function RiderDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [available, setAvailable] = useState([])
  const [active, setActive] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [sharingLocation, setSharingLocation] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextAvailable, deliveries] = await Promise.all([
        api.getRiderAvailable(),
        api.getRiderDeliveries(),
      ])
      setAvailable(nextAvailable)
      setActive(
        deliveries.filter((order) =>
          ['assigned', 'picked_up', 'on_the_way'].includes(order.status),
        ),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    const current = active[0]
    if (!current || !navigator.geolocation) {
      setSharingLocation(false)
      return undefined
    }

    setSharingLocation(true)
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        api
          .updateRiderLocation(current.id, {
            lat: coords.latitude,
            lng: coords.longitude,
          })
          .catch(() => {})
      },
      () => {
        setSharingLocation(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      setSharingLocation(false)
    }
  }, [active])

  async function accept(orderId) {
    setBusyId(orderId)
    try {
      await api.acceptRiderDelivery(orderId)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  async function advance(order) {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setBusyId(order.id)
    try {
      await api.updateRiderDeliveryStatus(order.id, next)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-surface pb-8">
      <header className="sticky top-0 z-10 bg-primary px-4 py-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/80">BiteRush Rider</p>
            <h1 className="text-xl font-bold">Hi, {user?.name?.split(' ')[0] || 'Rider'}</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold"
          >
            Sign out
          </button>
        </div>
        <p className="mt-2 text-sm text-white/85">
          {user?.restaurant?.branch || 'Delivery workspace'}
        </p>
        <p className="mt-2 text-xs text-white/75">
          {sharingLocation ? 'Live location sharing active' : 'Location sharing idle'}
        </p>
      </header>

      <main className="space-y-6 px-4 pt-6">
        {error ? <p className="rounded-xl bg-error/10 p-3 text-sm text-error">{error}</p> : null}
        {loading ? <p className="text-center text-on-surface-variant">Loading deliveries…</p> : null}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">New Delivery Requests</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {available.length}
            </span>
          </div>
          {available.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-on-surface-variant shadow-sm">
              No ready orders waiting for pickup right now.
            </p>
          ) : (
            <div className="space-y-3">
              {available.map((order) => (
                <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-primary">{order.orderNumber}</p>
                      <p className="text-sm font-semibold text-on-surface">{order.customerName}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        📍 {order.deliveryAddress || 'Address on file'}
                      </p>
                      {order.items?.length > 0 ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          📦 {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-base font-black text-on-surface">
                      Rs. {Number(order.total).toLocaleString('en-PK')}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => accept(order.id)}
                    className="mt-4 w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50"
                  >
                    Accept Delivery
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Active Deliveries</h2>
          {active.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-on-surface-variant shadow-sm">
              You have no active deliveries in progress.
            </p>
          ) : (
            <div className="space-y-4">
              {active.map((order) => {
                const navUrl =
                  order.deliveryLocation?.lat && order.deliveryLocation?.lng
                    ? `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        order.deliveryAddress || '',
                      )}`

                return (
                  <article
                    key={order.id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-primary">{order.orderNumber}</p>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold capitalize text-primary">
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-on-surface">{order.customerName}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          📍 {order.deliveryAddress || 'Delivery Address'}
                        </p>
                        {order.items?.length > 0 ? (
                          <p className="mt-1 text-xs text-on-surface-variant">
                            📦 {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                          </p>
                        ) : null}
                      </div>
                      <span className="material-symbols-outlined text-3xl text-primary">
                        two_wheeler
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
                      >
                        <span>🗺️</span>
                        <span>Google Maps</span>
                      </a>
                    </div>

                    {NEXT_STATUS[order.status] ? (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => advance(order)}
                        className="mt-3 w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50"
                      >
                        Mark {statusLabel(NEXT_STATUS[order.status])}
                      </button>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
