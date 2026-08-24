import { useState } from 'react'
import OrderChatModal from './OrderChatModal'

function formatMoney(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function IncomingOrdersTable({ orders = [], onAction, busyId }) {
  const [chatOrderId, setChatOrderId] = useState(null)
  const [chatOrderNumber, setChatOrderNumber] = useState('')

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Incoming orders</h3>
        <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
          {orders.length} pending
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-variant text-xs tracking-wide text-on-surface-variant uppercase">
              <th className="pb-3 font-semibold">Order</th>
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold">Items</th>
              <th className="pb-3 font-semibold">Total</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                  No pending orders
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-surface-variant/60 last:border-none"
                >
                  <td className="py-4 font-semibold text-primary">
                    {order.orderNumber}
                  </td>
                  <td className="py-4">{order.customerName}</td>
                  <td className="py-4 text-on-surface-variant">
                    {order.items
                      .map((item) => `${item.quantity}× ${item.name}`)
                      .join(', ')}
                  </td>
                  <td className="py-4 font-bold">{formatMoney(order.total)}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setChatOrderId(order.id)
                          setChatOrderNumber(order.orderNumber)
                        }}
                        className="rounded-xl bg-[#005c4b] px-3 py-2 font-semibold text-white transition-transform active:scale-95 hover:bg-[#008f6f] flex items-center gap-1 text-xs"
                        title="Chat with Customer & Rider"
                      >
                        <span>💬</span>
                        <span>Chat</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => onAction(order.id, 'accepted')}
                        className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => onAction(order.id, 'rejected')}
                        className="rounded-xl border border-outline-variant px-4 py-2 font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
