import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const empty = {
  name: '',
  branch: '',
  cuisine: '',
  eta: '',
  heroImage: '',
  deliveryFee: '',
  minOrder: '',
}

export default function RestaurantSetup({ onCreated }) {
  const { refresh } = useAuth()
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const restaurant = await api.createRestaurant({
        name: form.name.trim(),
        branch: form.branch.trim(),
        cuisine: form.cuisine.trim(),
        eta: form.eta.trim(),
        heroImage: form.heroImage.trim(),
        deliveryFee: Number(form.deliveryFee || 0),
        minOrder: Number(form.minOrder || 0),
      })
      await refresh()
      setForm(empty)
      onCreated?.(restaurant)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <h3 className="text-lg font-bold">Create your restaurant</h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Nothing is preloaded. Add the restaurant you actually operate.
      </p>
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      <div className="mt-4 grid gap-3">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Restaurant name"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <input
          required
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          placeholder="Branch"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <input
          value={form.cuisine}
          onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
          placeholder="Cuisine"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <input
          value={form.eta}
          onChange={(e) => setForm({ ...form, eta: e.target.value })}
          placeholder="Delivery time, e.g. 25-35 min"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <input
          value={form.heroImage}
          onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
          placeholder="Hero image URL (optional)"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min="0"
            value={form.deliveryFee}
            onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
            placeholder="Delivery fee"
            className="rounded-xl border border-outline-variant/40 px-4 py-3"
          />
          <input
            type="number"
            min="0"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            placeholder="Minimum order"
            className="rounded-xl border border-outline-variant/40 px-4 py-3"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save restaurant'}
      </button>
    </form>
  )
}
