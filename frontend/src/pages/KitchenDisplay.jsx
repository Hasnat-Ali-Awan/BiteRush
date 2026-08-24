import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

import OrderChatModal from '../components/OrderChatModal'

function ticketNo(order) {
  return order.orderNumber?.replace('BR-', '#') || order.orderNumber
}

function elapsed(createdAt) {
  if (!createdAt) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000))
  const mm = String(Math.floor(mins / 60)).padStart(2, '0')
  const ss = String(mins % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function Column({ title, count, colorClass, accent, orders, actionLabel, nextStatus, onAction, onOpenChat, busyId }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-white/10">
      <div className={`flex items-center justify-between px-5 py-4 ${colorClass}`}>
        <h3 className="text-lg font-bold tracking-widest text-white uppercase">{title}</h3>
        <span className="rounded-full bg-white/20 px-3 py-1 font-bold text-white">{count}</span>
      </div>
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {orders.length === 0 ? (
          <p className="pt-10 text-center text-white/40">No tickets</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="kds-card flex min-h-[280px] flex-col overflow-hidden rounded-xl"
              style={{ borderLeftColor: accent }}
            >
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-5xl font-black text-white">{ticketNo(order)}</span>
                    <button
                      type="button"
                      onClick={() => onOpenChat(order.id, order.orderNumber)}
                      className="rounded-lg bg-[#005c4b] p-2 text-xs font-bold text-white shadow-md hover:bg-[#008f6f] active:scale-95 transition"
                      title="Open Order Group Chat"
                    >
                      💬
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-white px-2 py-1 text-xs font-black uppercase text-black">
                      Delivery
                    </span>
                    <p className="mt-2 text-xl font-bold text-white">{elapsed(order.createdAt)}</p>
                  </div>
                </div>
                <p className="text-white/60">{order.customerName}</p>
                <hr className="border-white/10" />
                <ul className="space-y-2 text-xl font-bold text-white">
                  {order.items.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      {item.quantity}x {item.name}
                    </li>
                  ))}
                </ul>
              </div>
              {actionLabel ? (
                <button
                  type="button"
                  disabled={busyId === order.id}
                  onClick={() => onAction(order.id, nextStatus)}
                  className={`w-full py-4 text-xl font-black tracking-widest text-white uppercase ${colorClass}`}
                >
                  {actionLabel}
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [chatOrderId, setChatOrderId] = useState(null)
  const [chatOrderNumber, setChatOrderNumber] = useState('')

  const load = useCallback(async () => {
    try {
      const dashboard = await api.getDashboard()
      setRestaurant(dashboard.restaurant)
      if (!dashboard.restaurant) {
        setOrders([])
        return
      }
      const list = await api.getOrders({ restaurantId: dashboard.restaurant.id })
      setOrders(list)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 4000)
    return () => clearInterval(timer)
  }, [load])

  const pending = useMemo(
    () => orders.filter((order) => order.status === 'accepted'),
    [orders],
  )
  const preparing = useMemo(
    () => orders.filter((order) => order.status === 'preparing'),
    [orders],
  )
  const ready = useMemo(
    () => orders.filter((order) => order.status === 'ready'),
    [orders],
  )

  async function handleAction(id, status) {
    setBusyId(id)
    try {
      await api.updateOrderStatus(id, status)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  function handleOpenChat(orderId, orderNum) {
    setChatOrderId(orderId)
    setChatOrderNumber(orderNum)
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-sm text-primary">BiteRush Admin</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {restaurant?.name || 'Kitchen Display'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error ? <span className="text-sm text-error">{error}</span> : null}
          <Link to="/manager" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
            Dashboard
          </Link>
        </div>
      </header>
      <section className="flex min-h-0 flex-1">
        <Column
          title="Pending"
          count={pending.length}
          colorClass="bg-primary"
          accent="#e85d04"
          orders={pending}
          actionLabel="Start Cooking"
          nextStatus="preparing"
          onAction={handleAction}
          onOpenChat={handleOpenChat}
          busyId={busyId}
        />
        <Column
          title="Preparing"
          count={preparing.length}
          colorClass="bg-status-preparing"
          accent="#1976d2"
          orders={preparing}
          actionLabel="Mark Ready"
          nextStatus="ready"
          onAction={handleAction}
          onOpenChat={handleOpenChat}
          busyId={busyId}
        />
        <Column
          title="Ready"
          count={ready.length}
          colorClass="bg-success"
          accent="#2e7d32"
          orders={ready}
          actionLabel="Done"
          nextStatus="assigned"
          onAction={handleAction}
          onOpenChat={handleOpenChat}
          busyId={busyId}
        />
      </section>
      <footer className="flex h-12 items-center gap-6 bg-[#2a2a2a] px-6 text-xs tracking-widest text-white/60 uppercase">
        <span className="font-bold text-primary">Kitchen live</span>
        <span className="ml-auto">BiteRush ops</span>
      </footer>

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
