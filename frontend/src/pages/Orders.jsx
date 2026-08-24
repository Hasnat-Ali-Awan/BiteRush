import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api'
import OrderChatModal from '../components/OrderChatModal'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

function statusBadge(status) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'accepted':
    case 'preparing':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'ready':
    case 'assigned':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'picked_up':
    case 'on_the_way':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-surface-container text-on-surface-variant'
  }
}

export default function Orders({ restaurantId, onRestaurant }) {
  const { branchId } = useOutletContext() || {}
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [chatOrderId, setChatOrderId] = useState(null)
  const [chatOrderNumber, setChatOrderNumber] = useState('')

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
      const list = await api.getOrders({
        branchId: branchId || undefined,
        restaurantId: rid || undefined,
        status: status || undefined,
      })
      setOrders(list || [])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [restaurantId, branchId, status, onRestaurant])

  useEffect(() => {
    load()
    const timer = setInterval(() => {
      if (!document.hidden) {
        load()
      }
    }, 5000)

    function handleVisibilityChange() {
      if (!document.hidden) {
        load()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [load])

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase().trim()
    return orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q),
    )
  }, [orders, search])

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Accept, dispatch, and track orders across your restaurant kitchen.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer…"
            className="w-64 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { id: '', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'accepted', label: 'Accepted' },
          { id: 'preparing', label: 'Cooking' },
          { id: 'ready', label: 'Ready' },
          { id: 'on_the_way', label: 'On Way' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id || 'all'}
            type="button"
            onClick={() => setStatus(tab.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              status === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 rounded-xl bg-error/10 p-3 text-sm text-error">{error}</p> : null}

      {/* ORDERS TABLE */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-4 py-3.5">Order</th>
              <th className="px-4 py-3.5">Customer & Address</th>
              <th className="px-4 py-3.5">Items</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                  <p className="text-3xl">📋</p>
                  <p className="mt-2 font-semibold">No orders in this category</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-surface-container-lowest">
                  <td className="px-4 py-4">
                    <p className="font-bold text-primary">{order.orderNumber}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-on-surface">{order.customerName}</p>
                    <p className="line-clamp-1 text-xs text-on-surface-variant">
                      📍 {order.deliveryAddress || 'Address on file'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs text-on-surface-variant">
                    <p className="font-medium text-on-surface">
                      {order.items?.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="mt-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                  <td className="px-4 py-4 font-bold text-on-surface">{money(order.total)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(
                        order.status,
                      )}`}
                    >
                      {order.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setChatOrderId(order.id)
                          setChatOrderNumber(order.orderNumber)
                        }}
                        className="rounded-lg bg-[#005c4b] px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#008f6f] active:scale-95 transition flex items-center gap-1"
                        title="Open Order WhatsApp Group Chat"
                      >
                        <span>💬</span>
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                      {order.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={() => update(order.id, 'accepted')}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={() => update(order.id, 'rejected')}
                            className="rounded-lg border border-error/30 bg-error/5 px-2.5 py-1.5 text-xs font-bold text-error hover:bg-error hover:text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : order.status === 'accepted' ? (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => update(order.id, 'preparing')}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                        >
                          🍳 Cook
                        </button>
                      ) : order.status === 'preparing' ? (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => update(order.id, 'ready')}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                        >
                          ✓ Ready
                        </button>
                      ) : order.status === 'ready' || order.status === 'assigned' ? (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => update(order.id, 'on_the_way')}
                          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                        >
                          🛵 Dispatch
                        </button>
                      ) : order.status === 'on_the_way' || order.status === 'picked_up' ? (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => update(order.id, 'delivered')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                        >
                          ✓ Delivered
                        </button>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  Order {selectedOrder.orderNumber}
                </h3>
                <span
                  className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusBadge(
                    selectedOrder.status,
                  )}`}
                >
                  {selectedOrder.status.replaceAll('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Customer
                </p>
                <p className="font-semibold text-on-surface">{selectedOrder.customerName}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Delivery Address
                </p>
                <p className="text-on-surface">{selectedOrder.deliveryAddress || 'Not specified'}</p>
                {selectedOrder.deliveryLocation ? (
                  <p className="text-xs text-emerald-600">
                    ● Coordinates: {selectedOrder.deliveryLocation.lat?.toFixed(4)},{' '}
                    {selectedOrder.deliveryLocation.lng?.toFixed(4)}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Items Ordered
                </p>
                <ul className="mt-1 divide-y divide-outline-variant/20 rounded-xl bg-surface-container-lowest p-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <li key={idx} className="flex justify-between py-1.5 text-xs">
                      <span>
                        <strong>{item.quantity}×</strong> {item.name}
                      </span>
                      <span className="font-semibold">{money(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between border-t border-outline-variant/20 pt-2 font-bold">
                <span>Total Amount:</span>
                <span className="text-primary text-base">{money(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setChatOrderId(selectedOrder.id)
                  setChatOrderNumber(selectedOrder.orderNumber)
                }}
                className="flex items-center gap-2 rounded-xl bg-[#005c4b] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#008f6f] active:scale-95 transition"
              >
                <span>💬</span>
                <span>Open Group Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MANAGER ORDER GROUP CHAT MODAL */}
      {chatOrderId ? (
        <OrderChatModal
          orderId={chatOrderId}
          orderNumber={chatOrderNumber}
          onClose={() => setChatOrderId(null)}
        />
      ) : null}
    </div>
  )
}
