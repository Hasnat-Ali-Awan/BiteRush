import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import StatCard from '../components/StatCard'
import { PopularDishesChart, RevenueChart } from '../components/Charts'
import IncomingOrdersTable from '../components/IncomingOrdersTable'

function formatMoney(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function ManagerDashboard({ onRestaurant }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    let lastError = null
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const dashboard = await api.getDashboard()
        setData(dashboard)
        onRestaurant?.(dashboard.restaurant)
        if (dashboard.toast?.message) {
          setToast(dashboard.toast.message)
        }
        setLoading(false)
        return
      } catch (err) {
        lastError = err
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt))
        }
      }
    }

    setError(lastError?.message || 'Failed to load dashboard')
    setData(null)
    setLoading(false)
  }, [onRestaurant])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleSeed() {
    setLoading(true)
    try {
      await api.seed()
      await load()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleAction(orderId, status) {
    setBusyId(orderId)
    try {
      await api.updateOrderStatus(orderId, status)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <div className="custom-scrollbar h-[calc(100vh-4rem)] overflow-y-auto p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="mt-1 text-on-surface-variant">
              Live restaurant ops for{' '}
              {data?.restaurant?.name || 'your branch'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSeed}
            className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-container"
          >
            Load demo data
          </button>
        </div>

        {loading && !data ? (
          <p className="text-on-surface-variant">Loading dashboard…</p>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-error/30 bg-error/5 p-4 text-error">
            <p className="font-semibold">{error}</p>
            <p className="mt-1 text-sm">
              Make sure MongoDB Docker is up, backend is running, then click
              “Load demo data” or call{' '}
              <code className="rounded bg-white px-1">POST /api/v1/seed</code>{' '}
              in Postman.
            </p>
          </div>
        ) : null}

        {data ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Today's Orders"
                value={data.stats.todaysOrders}
                change={data.stats.todaysOrdersChange}
                icon="receipt_long"
              />
              <StatCard
                label="Revenue"
                value={formatMoney(data.stats.revenue)}
                change={data.stats.revenueChange}
                icon="payments"
              />
              <StatCard
                label="Pending Reservations"
                value={data.stats.pendingReservations}
                change="Needs confirmation"
                icon="calendar_month"
              />
              <StatCard
                label="Avg Rating"
                value={data.stats.avgRating}
                change="Customer reviews"
                icon="star"
                suffix="★"
              />
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-2">
              <RevenueChart data={data.revenueByDay} />
              <PopularDishesChart data={data.popularDishes} />
            </div>

            <IncomingOrdersTable
              orders={data.incomingOrders}
              onAction={handleAction}
              busyId={busyId}
            />
          </>
        ) : null}
      </div>

      {toast ? (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-xl bg-on-surface px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </>
  )
}
