import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api'

const FILTERS = [
  { id: '', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'rejected', label: 'Cancelled' },
]

function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Reservations({ restaurantId, onRestaurant }) {
  const { branchId } = useOutletContext() || {}
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [guest, setGuest] = useState({
    customerName: '',
    phone: '',
    partySize: 2,
    reservedAt: '',
    tableLabel: '',
  })

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
      const list = await api.getReservations({
        branchId: branchId || undefined,
        status: status || undefined,
      })
      setRows(list)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [restaurantId, branchId, status, onRestaurant])

  useEffect(() => {
    load()
  }, [load])

  async function createReservation(event) {
    event.preventDefault()
    try {
      let rid = restaurantId
      if (!rid) {
        const dashboard = await api.getDashboard(
          branchId ? { branchId } : undefined,
        )
        rid = branchId || dashboard.restaurant?.id
      }
      if (!rid) {
        setError('No branch selected')
        return
      }
      await api.createReservation(
        {
          restaurantId: rid,
          customerName: guest.customerName,
          phone: guest.phone,
          partySize: Number(guest.partySize),
          reservedAt: guest.reservedAt,
          tableLabel: guest.tableLabel,
        },
        branchId ? { branchId } : undefined,
      )
      setGuest({
        customerName: '',
        phone: '',
        partySize: 2,
        reservedAt: '',
        tableLabel: '',
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function update(id, nextStatus) {
    setBusyId(id)
    try {
      await api.updateReservationStatus(id, { status: nextStatus })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="custom-scrollbar h-[calc(100vh-4rem)] overflow-y-auto p-6">
      <h2 className="text-2xl font-bold">Reservations Management</h2>
      <p className="mt-1 text-on-surface-variant">Confirm incoming table bookings.</p>

      <form
        onSubmit={createReservation}
        className="mt-6 grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-5"
      >
        <input
          required
          value={guest.customerName}
          onChange={(e) => setGuest({ ...guest, customerName: e.target.value })}
          placeholder="Guest name"
          className="rounded-xl border border-outline-variant/40 px-3 py-2"
        />
        <input
          value={guest.phone}
          onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
          placeholder="Phone"
          className="rounded-xl border border-outline-variant/40 px-3 py-2"
        />
        <input
          required
          type="number"
          min="1"
          value={guest.partySize}
          onChange={(e) => setGuest({ ...guest, partySize: e.target.value })}
          placeholder="Party size"
          className="rounded-xl border border-outline-variant/40 px-3 py-2"
        />
        <input
          required
          type="datetime-local"
          value={guest.reservedAt}
          onChange={(e) => setGuest({ ...guest, reservedAt: e.target.value })}
          className="rounded-xl border border-outline-variant/40 px-3 py-2"
        />
        <button type="submit" className="rounded-xl bg-primary font-semibold text-white">
          Add reservation
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id || 'all'}
            type="button"
            onClick={() => setStatus(filter.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status === filter.id ? 'bg-primary text-white' : 'bg-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-error">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-sm text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Date / Time</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant/40">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                  No reservations yet
                </td>
              </tr>
            ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {initials(row.customerName)}
                    </span>
                    <div>
                      <p className="font-semibold">{row.customerName}</p>
                      <p className="text-xs text-on-surface-variant">{row.phone || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{row.partySize} guests</td>
                <td className="px-4 py-4">
                  {new Date(row.reservedAt).toLocaleString('en-PK', {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-4">{row.tableLabel || 'Unassigned'}</td>
                <td className="px-4 py-4 capitalize">{row.status}</td>
                <td className="px-4 py-4">
                  {row.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => update(row.id, 'confirmed')}
                        className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => update(row.id, 'rejected')}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
