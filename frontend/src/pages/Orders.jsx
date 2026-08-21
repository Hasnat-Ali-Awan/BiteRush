import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function Orders({ restaurantId, onRestaurant }) {
  const { branchId } = useOutletContext() || {}
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      let rid = restaurantId
      if (!rid) {
        const dashboard = await api.getDashboard(
          branchId ? { branchId } : undefined,
        )
        if (dashboard.restaurant) onRestaurant?.(dashboard.restaurant)
        rid = branchId || dashboard.restaurant?.id
      }
      if (!rid && !branchId) {
        const list = await api.getOrders({ status: status || undefined })
        setOrders(list)
        setError('')
        return
      }
      const list = await api.getOrders({
        branchId: branchId || undefined,
        status: status || undefined,
      })
      setOrders(list)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [restaurantId, branchId, status, onRestaurant])

  useEffect(() => {
    load()
  }, [load])

  async function update(id, nextStatus) {
    setBusyId(id)
    try {
      await api.updateOrderStatus(id, nextStatus)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="custom-scrollbar h-[calc(100vh-4rem)] overflow-y-auto p-6">
      <h2 className="text-2xl font-bold">Orders</h2>
      <p className="mt-1 text-on-surface-variant">
        Accept incoming tickets, then send them to the kitchen.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {['', 'pending', 'accepted', 'preparing', 'ready', 'delivered', 'rejected'].map(
          (value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                status === value ? 'bg-primary text-white' : 'bg-white'
              }`}
            >
              {value || 'All'}
            </button>
          ),
        )}
      </div>
      {error ? <p className="mt-4 text-error">{error}</p> : null}
      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-sm text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/40">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-4 font-semibold text-primary">{order.orderNumber}</td>
                <td className="px-4 py-4">{order.customerName}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                </td>
                <td className="px-4 py-4 font-bold">{money(order.total)}</td>
                <td className="px-4 py-4 capitalize">{order.status.replaceAll('_', ' ')}</td>
                <td className="px-4 py-4 text-right">
                  {order.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => update(order.id, 'accepted')}
                        className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => update(order.id, 'rejected')}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-on-surface-variant">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
