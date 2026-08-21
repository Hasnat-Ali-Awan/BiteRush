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
    setSaving(true)
    setError('')
    try {
      const group = await api.createGroup({
        name: form.name.trim(),
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
      className="max-w-xl rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <h3 className="text-lg font-bold">Create your restaurant brand</h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Set up the main brand first, then add branches and invite branch managers.
      </p>
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      <div className="mt-4 grid gap-3">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Brand name, e.g. BiteRush Kitchen"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <input
          value={form.cuisine}
          onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
          placeholder="Cuisine"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <input
          value={form.heroImage}
          onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
          placeholder="Hero image URL (optional)"
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description"
          rows={3}
          className="rounded-xl border border-outline-variant/40 px-4 py-3"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save brand'}
      </button>
    </form>
  )
}
