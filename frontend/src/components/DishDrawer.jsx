import { useEffect, useState } from 'react'

const emptyForm = {
  name: '',
  description: '',
  categoryId: '',
  basePrice: 0,
  discountPercent: 0,
  isAvailable: true,
  imageUrl: '',
  variants: [{ name: 'Regular', priceDelta: 0 }],
  extras: [],
}

export default function DishDrawer({
  open,
  mode,
  dish,
  categories,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && dish) {
      setForm({
        name: dish.name || '',
        description: dish.description || '',
        categoryId: dish.categoryId || '',
        basePrice: dish.basePrice || 0,
        discountPercent: dish.discountPercent || 0,
        isAvailable: dish.isAvailable ?? true,
        imageUrl: dish.images?.[0] || '',
        variants:
          dish.variants?.length > 0
            ? dish.variants.map((v) => ({
                name: v.name,
                priceDelta: v.priceDelta ?? 0,
              }))
            : [{ name: 'Regular', priceDelta: 0 }],
        extras:
          dish.extras?.map((e) => ({ name: e.name, price: e.price ?? 0 })) ||
          [],
      })
    } else {
      setForm({
        ...emptyForm,
        categoryId: categories[0]?._id || categories[0]?.id || '',
      })
    }
  }, [open, mode, dish, categories])

  if (!open) return null

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateList(key, index, field, value) {
    setForm((prev) => {
      const next = [...prev[key]]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, [key]: next }
    })
  }

  function addRow(key, row) {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], row] }))
  }

  function removeRow(key, index) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      basePrice: Number(form.basePrice) || 0,
      discountPercent: Number(form.discountPercent) || 0,
      isAvailable: form.isAvailable,
      images: form.imageUrl ? [form.imageUrl] : [],
      variants: form.variants
        .filter((v) => v.name.trim())
        .map((v) => ({
          name: v.name.trim(),
          priceDelta: Number(v.priceDelta) || 0,
        })),
      extras: form.extras
        .filter((x) => x.name.trim())
        .map((x) => ({
          name: x.name.trim(),
          price: Number(x.price) || 0,
        })),
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[420px] flex-col border-l border-surface-variant/30 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between border-b border-surface-variant/30 p-6">
        <h3 className="text-lg font-semibold">
          {mode === 'edit' ? 'Edit Dish' : 'Add Dish'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-on-surface-variant">
              Dish Photo URL
            </label>
            <div className="mb-2 aspect-[16/10] overflow-hidden rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                  Paste an image URL below
                </div>
              )}
            </div>
            <input
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.imageUrl}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Dish Name
            </label>
            <input
              required
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
                Category
              </label>
              <select
                required
                className="w-full rounded-xl border border-outline-variant bg-white px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
              >
                {categories.map((category) => (
                  <option
                    key={category._id || category.id}
                    value={category._id || category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
                Base Price
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm text-on-surface-variant">
                  Rs.
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-outline-variant py-2.5 pr-4 pl-12 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={form.basePrice}
                  onChange={(e) => updateField('basePrice', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Discount %
            </label>
            <input
              type="number"
              min="0"
              max="90"
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.discountPercent}
              onChange={(e) => updateField('discountPercent', e.target.value)}
            />
          </div>

          <div className="h-px bg-surface-variant/30" />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold">Size Variants</label>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                onClick={() =>
                  addRow('variants', { name: '', priceDelta: 0 })
                }
              >
                <span className="material-symbols-outlined text-xs">
                  add_circle
                </span>
                Add Size
              </button>
            </div>
            <div className="space-y-3">
              {form.variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none"
                    placeholder="Label"
                    value={variant.name}
                    onChange={(e) =>
                      updateList('variants', index, 'name', e.target.value)
                    }
                  />
                  <div className="relative w-32 shrink-0">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-on-surface-variant">
                      +Rs.
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-outline-variant py-2 pr-3 pl-10 text-sm outline-none"
                      value={variant.priceDelta}
                      onChange={(e) =>
                        updateList(
                          'variants',
                          index,
                          'priceDelta',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="text-on-surface-variant/50 hover:text-error"
                    onClick={() => removeRow('variants', index)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold">Add-ons / Extras</label>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                onClick={() => addRow('extras', { name: '', price: 0 })}
              >
                <span className="material-symbols-outlined text-xs">
                  add_circle
                </span>
                Add Extra
              </button>
            </div>
            <div className="space-y-3">
              {form.extras.map((extra, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none"
                    placeholder="Label"
                    value={extra.name}
                    onChange={(e) =>
                      updateList('extras', index, 'name', e.target.value)
                    }
                  />
                  <div className="relative w-32 shrink-0">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-on-surface-variant">
                      Rs.
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-outline-variant py-2 pr-3 pl-8 text-sm outline-none"
                      value={extra.price}
                      onChange={(e) =>
                        updateList('extras', index, 'price', e.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="text-on-surface-variant/50 hover:text-error"
                    onClick={() => removeRow('extras', index)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold">Currently Available</p>
              <p className="text-xs text-on-surface-variant">
                Visible to customers in the app
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateField('isAvailable', !form.isAvailable)}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                form.isAvailable ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.isAvailable ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-4 border-t border-surface-variant/30 bg-white p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
