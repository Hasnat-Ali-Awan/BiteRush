import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const empty = {
  name: '',
  cuisine: '',
  heroImage: '',
  description: '',
}

export default function BrandSetup({ onCreated }) {
  const { refresh } = useAuth()
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = form.name.trim()
    if (trimmedName.length < 2) {
      setError('Brand name must be at least 2 characters long.')
      return
    }

    if (form.heroImage.trim() && !/^https?:\/\/.+/i.test(form.heroImage.trim())) {
      setError('Hero image URL must start with http:// or https://')
      return
    }

    setSaving(true)
    setError('')
    try {
      const group = await api.createGroup({
        name: trimmedName,
        cuisine: form.cuisine.trim(),
        heroImage: form.heroImage.trim(),
        description: form.description.trim(),
      })
      await refresh()
      setForm(empty)
      onCreated?.(group)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
          🏪
        </span>
        <div>
          <h3 className="text-lg font-bold">Create your restaurant brand</h3>
          <p className="text-xs text-on-surface-variant">
            Set up the main brand profile before adding branches and inviting staff.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Brand Name *
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. BiteRush Kitchen, Royal Spice"
            className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Primary Cuisine
          </label>
          <input
            value={form.cuisine}
            onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
            placeholder="e.g. Pakistani, Fast Food, Italian, BBQ"
            className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Hero Cover Image URL (Optional)
          </label>
          <input
            type="url"
            value={form.heroImage}
            onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
            placeholder="https://images.unsplash.com/photo-..."
            className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Short Description (Optional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief story or tagline for your restaurant brand..."
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/40 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95 disabled:opacity-50"
      >
        {saving ? 'Saving brand…' : 'Save & Continue'}
      </button>
    </form>
  )
}
