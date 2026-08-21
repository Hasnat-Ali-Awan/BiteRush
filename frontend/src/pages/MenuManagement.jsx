import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api'
import DishDrawer from '../components/DishDrawer'

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('en-PK')
}

function categoryChipClass(name = '') {
  const key = name.toLowerCase()
  if (key === 'bbq') return 'bg-tertiary/10 text-tertiary'
  if (key === 'karahi') return 'bg-warning/10 text-warning'
  if (key === 'bread') return 'bg-surface-container-high text-on-surface-variant'
  return 'bg-primary/10 text-primary'
}

export default function MenuManagement({ restaurantId, onRestaurant }) {
  const { branchId } = useOutletContext() || {}
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [availability, setAvailability] = useState('')
  const [drawer, setDrawer] = useState({ open: false, mode: 'create', dish: null })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [hasRestaurant, setHasRestaurant] = useState(true)

  const load = useCallback(async () => {
    setError('')
    try {
      let rid = restaurantId
      if (!rid) {
        const dashboard = await api.getDashboard(
          branchId ? { branchId } : undefined,
        )
        if (dashboard.restaurant) onRestaurant?.(dashboard.restaurant)
        rid = branchId || dashboard.restaurant?.id
      }

      if (!rid) {
        setHasRestaurant(false)
        setCategories([])
        setItems([])
        return
      }

      setHasRestaurant(true)
      const [cats, menu] = await Promise.all([
        api.getCategories(),
        api.getMenu({
          restaurantId: rid,
          categoryId: categoryId || undefined,
          available: availability || undefined,
          search: search || undefined,
        }),
      ])

      setCategories(
        cats.map((c) => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id,
        })),
      )
      setItems(menu)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [restaurantId, categoryId, availability, search, onRestaurant])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      load()
    }, search ? 250 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const selectedId = drawer.dish?.id

  const filteredLabel = useMemo(() => {
    return `Showing ${items.length} item${items.length === 1 ? '' : 's'}`
  }, [items.length])

  async function handleToggle(item) {
    setBusyId(item.id)
    try {
      await api.toggleMenuAvailability(item.id, !item.isAvailable)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setBusyId(item.id)
    try {
      await api.deleteMenuItem(item.id)
      if (selectedId === item.id) setDrawer({ open: false, mode: 'create', dish: null })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  async function handleSave(payload) {
    setSaving(true)
    setError('')
    try {
      if (drawer.mode === 'edit' && drawer.dish) {
        await api.updateMenuItem(drawer.dish.id, payload)
      } else {
        const dashboard = await api.getDashboard(
          branchId ? { branchId } : undefined,
        )
        const rid = branchId || restaurantId || dashboard.restaurant?.id
        await api.createMenuItem(
          {
            ...payload,
            restaurantId: rid,
          },
          branchId ? { branchId } : undefined,
        )
      }
      setDrawer({ open: false, mode: 'create', dish: null })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCategory(event) {
    event.preventDefault()
    if (!newCategory.trim()) return
    try {
      await api.createCategory({ name: newCategory.trim() })
      setNewCategory('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)]">
      <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Menu Management</h2>
            <p className="mt-1 text-on-surface-variant">
              Update and monitor your menu items.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes..."
                className="rounded-xl border border-outline-variant/30 bg-surface-container py-2 pr-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
              Category:
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
              Stock:
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm outline-none"
              >
                <option value="">All Items</option>
                <option value="true">Available</option>
                <option value="false">Out of Stock</option>
              </select>
            </label>

            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category"
                className="rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="rounded-xl border px-3 py-2 text-sm font-semibold"
              >
                Add
              </button>
            </form>

            <button
              type="button"
              onClick={() =>
                setDrawer({ open: true, mode: 'create', dish: null })
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Add Dish
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-error/30 bg-error/5 p-4 text-error">
            {error}
          </div>
        ) : null}

        {!hasRestaurant ? (
          <p className="mb-4 rounded-xl bg-white p-4 text-on-surface-variant">
            Create a restaurant on the dashboard before adding dishes.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-surface-variant/30 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-surface-variant/50 bg-surface-container-low">
              <tr>
                <th className="px-4 py-4 text-sm font-semibold text-on-surface-variant">
                  Dish
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-on-surface-variant">
                  Category
                </th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-on-surface-variant">
                  Price (Rs.)
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-on-surface-variant">
                  Discount
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-on-surface-variant">
                  Status
                </th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                    Loading menu…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                    No dishes found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const active = selectedId === item.id && drawer.open
                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        item.isAvailable ? '' : 'opacity-60'
                      } ${
                        active
                          ? 'bg-primary/5'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-container ${
                              item.isAvailable ? '' : 'grayscale'
                            }`}
                          >
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`font-semibold ${
                                item.isAvailable ? '' : 'line-through'
                              }`}
                            >
                              {item.name}
                            </span>
                            {!item.isAvailable ? (
                              <span className="text-[10px] font-bold tracking-wide text-error uppercase">
                                Sold Out
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${categoryChipClass(
                            item.categoryName,
                          )}`}
                        >
                          {item.categoryName || '—'}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-bold ${
                          item.discountPercent > 0 ? 'text-primary' : ''
                        }`}
                      >
                        {formatMoney(item.basePrice)}
                      </td>
                      <td
                        className={`px-4 py-4 text-center ${
                          item.discountPercent > 0
                            ? 'font-bold text-success'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {item.discountPercent || 0}%
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleToggle(item)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.isAvailable ? 'bg-primary' : 'bg-surface-variant'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                              item.isAvailable ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-xl p-2 text-primary hover:bg-primary/10"
                            onClick={() =>
                              setDrawer({ open: true, mode: 'edit', dish: item })
                            }
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            className="rounded-xl p-2 text-error hover:bg-error/10"
                            onClick={() => handleDelete(item)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-surface-variant/30 bg-surface-container-low/50 px-4 py-4">
            <span className="text-xs text-on-surface-variant">{filteredLabel}</span>
          </div>
        </div>
      </div>

      <DishDrawer
        open={drawer.open}
        mode={drawer.mode}
        dish={drawer.dish}
        categories={categories}
        saving={saving}
        onClose={() => setDrawer({ open: false, mode: 'create', dish: null })}
        onSave={handleSave}
      />
    </div>
  )
}
