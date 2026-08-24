import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../context/CartContext'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function RestaurantMenu() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, clear, cart, count, subtotal } = useCart()
  const [restaurant, setRestaurant] = useState(null)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Modal states
  const [customizingDish, setCustomizingDish] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedExtras, setSelectedExtras] = useState([])
  const [customQty, setCustomQty] = useState(1)

  const [conflictPrompt, setConflictPrompt] = useState(null) // { nextDish, nextVariant, nextExtras, nextQty }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [place, cats, menu] = await Promise.all([
          api.getRestaurant(id),
          api.getCategories(),
          api.getMenu({ restaurantId: id }),
        ])
        setRestaurant(place)
        setCategories(cats)
        setItems(menu)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = !categoryId || item.categoryId === categoryId
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      return matchCategory && matchSearch
    })
  }, [items, categoryId, searchQuery])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of filteredItems) {
      const key = item.categoryName || 'Menu'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return Array.from(map.entries())
  }, [filteredItems])

  function openDishOptions(dish) {
    if (!dish.isAvailable) return

    // If dish has options, open customization modal
    if (dish.variants?.length > 1 || dish.extras?.length > 0) {
      setCustomizingDish(dish)
      setSelectedVariant(dish.variants?.[0] || null)
      setSelectedExtras([])
      setCustomQty(1)
    } else {
      // Direct add
      attemptAddItem(dish, dish.variants?.[0] || null, [], 1)
    }
  }

  function attemptAddItem(dish, variant, extras, quantity) {
    if (cart.restaurant && cart.restaurant.id !== restaurant.id && cart.items.length > 0) {
      setConflictPrompt({
        nextDish: dish,
        nextVariant: variant,
        nextExtras: extras,
        nextQty: quantity,
      })
      return
    }

    executeAdd(dish, variant, extras, quantity)
  }

  function executeAdd(dish, variant, extras, quantity) {
    addItem(restaurant, dish, variant, extras, quantity)
    setCustomizingDish(null)
    setToast(`Added ${quantity}× "${dish.name}" to cart!`)
    setTimeout(() => setToast(''), 2500)
  }

  function handleConfirmBranchSwitch() {
    if (!conflictPrompt) return
    clear()
    executeAdd(
      conflictPrompt.nextDish,
      conflictPrompt.nextVariant,
      conflictPrompt.nextExtras,
      conflictPrompt.nextQty,
    )
    setConflictPrompt(null)
  }

  function toggleExtra(extra) {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.name === extra.name)
      if (exists) return prev.filter((e) => e.name !== extra.name)
      return [...prev, extra]
    })
  }

  const customTotalUnitPrice = useMemo(() => {
    if (!customizingDish) return 0
    const base = Number(customizingDish.basePrice || 0)
    const variantDelta = Number(selectedVariant?.priceDelta || 0)
    const extrasTotal = selectedExtras.reduce(
      (sum, e) => sum + Number(e.price || 0),
      0,
    )
    return base + variantDelta + extrasTotal
  }, [customizingDish, selectedVariant, selectedExtras])

  const minOrder = Number(restaurant?.minOrder || 0)
  const isMinOrderMet = minOrder === 0 || subtotal >= minOrder

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-on-surface px-5 py-3 font-semibold text-surface shadow-xl animate-fade-in">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : null}

      {/* RESTAURANT HEADER CARD */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="relative h-60 bg-surface-container overflow-hidden">
          {restaurant?.heroImage ? (
            <img
              src={restaurant.heroImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/5 text-primary text-6xl">
              🍲
            </div>
          )}
          {restaurant?.branch ? (
            <span className="absolute top-4 left-4 rounded-xl bg-black/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
              📍 {restaurant.branch} Branch
            </span>
          ) : null}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-on-surface">
                {restaurant?.name || 'Restaurant'}
                {restaurant?.branch ? ` — ${restaurant.branch}` : ''}
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                {[
                  restaurant?.avgRating ? `★ ${restaurant.avgRating}` : null,
                  restaurant?.cuisine,
                  restaurant?.address,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl bg-surface-container-low p-3.5 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Est. Delivery
              </p>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-on-surface">
                ⏱️ {restaurant?.eta || '25-35 min'}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3.5 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Delivery Fee
              </p>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-on-surface">
                {money(restaurant?.deliveryFee)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3.5 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Min. Order
              </p>
              <p className="mt-0.5 text-sm sm:text-base font-bold text-on-surface">
                {minOrder > 0 ? money(minOrder) : 'No minimum'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryId('')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              !categoryId
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((category) => {
            const catId = category._id || category.id
            const countForCat = items.filter((i) => i.categoryId === catId).length
            return (
              <button
                key={catId}
                type="button"
                onClick={() => setCategoryId(catId)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  categoryId === catId
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {category.name} ({countForCat})
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu…"
            className="w-full rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* MENU GRID & ASIDE CART */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center text-on-surface-variant shadow-sm">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-bold">No dishes found</p>
              <p className="mt-1 text-sm">
                {searchQuery || categoryId
                  ? 'Try clearing the search or category filter.'
                  : 'No items have been listed on this branch menu yet.'}
              </p>
            </div>
          ) : (
            grouped.map(([name, rows]) => (
              <section key={name}>
                <h2 className="mb-4 text-xl font-bold text-on-surface flex items-center gap-2">
                  <span>{name}</span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    ({rows.length})
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {rows.map((dish) => {
                    const hasOptions =
                      dish.variants?.length > 1 || dish.extras?.length > 0
                    return (
                      <article
                        key={dish.id}
                        onClick={() => openDishOptions(dish)}
                        className={`group flex cursor-pointer flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md ${
                          dish.isAvailable ? '' : 'cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                            {dish.images?.[0] ? (
                              <img
                                src={dish.images[0]}
                                alt=""
                                className="h-full w-full object-cover transition group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-2xl text-primary/40">
                                🍛
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                              {dish.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                              {dish.description || 'Freshly prepared.'}
                            </p>
                            <p className="mt-2 text-sm font-bold text-primary">
                              {money(dish.basePrice)}
                              {dish.discountPercent ? (
                                <span className="ml-2 rounded bg-error/10 px-1.5 py-0.5 text-[10px] font-bold text-error">
                                  {dish.discountPercent}% OFF
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-2">
                          <span className="text-xs text-on-surface-variant">
                            {hasOptions ? 'Customizable options' : 'Single size'}
                          </span>
                          <button
                            type="button"
                            disabled={!dish.isAvailable}
                            onClick={(e) => {
                              e.stopPropagation()
                              openDishOptions(dish)
                            }}
                            className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 disabled:bg-surface-variant"
                          >
                            {dish.isAvailable
                              ? hasOptions
                                ? 'Customize +'
                                : '+ Add'
                              : 'Sold out'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* ASIDE CART OVERVIEW */}
        <aside className="sticky top-20 h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h3 className="font-bold">Your Order</h3>
            {count > 0 ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {count} item{count === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>

          {cart.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-on-surface-variant">
              <p className="text-3xl">🛒</p>
              <p className="mt-2 font-semibold">Your cart is empty</p>
              <p className="mt-1 text-xs">Click any dish to add it to your bag.</p>
            </div>
          ) : (
            <>
              <ul className="max-h-60 divide-y divide-outline-variant/20 overflow-y-auto text-sm">
                {cart.items.map((item) => (
                  <li key={item.lineId} className="flex justify-between gap-2 py-2.5">
                    <div>
                      <span className="font-semibold text-primary">{item.quantity}×</span>{' '}
                      <span className="font-medium text-on-surface">{item.name}</span>
                      {item.extras?.length > 0 ? (
                        <p className="text-[11px] text-on-surface-variant">
                          + {item.extras.map((e) => e.name).join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-semibold">
                      {money(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-outline-variant/20 pt-3 space-y-1.5 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-on-surface">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="font-semibold text-on-surface">
                    {money(restaurant?.deliveryFee || 0)}
                  </span>
                </div>
              </div>

              {minOrder > 0 && !isMinOrderMet ? (
                <div className="rounded-xl border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning-variant">
                  <p className="font-bold">Min order: {money(minOrder)}</p>
                  <p className="mt-0.5">Add {money(minOrder - subtotal)} more to checkout.</p>
                </div>
              ) : null}

              <div className="flex items-baseline justify-between border-t border-outline-variant/20 pt-3">
                <span className="font-bold text-on-surface">Subtotal</span>
                <span className="text-lg font-black text-primary">{money(subtotal)}</span>
              </div>

              <button
                type="button"
                disabled={count === 0}
                onClick={() => navigate('/cart')}
                className="w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95 disabled:opacity-40"
              >
                View Cart ({count})
              </button>
            </>
          )}

          <Link
            to="/"
            className="block text-center text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            ← Change restaurant
          </Link>
        </aside>
      </div>

      {/* DISH CUSTOMIZATION MODAL */}
      {customizingDish ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-on-surface">
                  {customizingDish.name}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {customizingDish.description || 'Choose your options below.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingDish(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            {/* VARIANTS (SIZES) */}
            {customizingDish.variants?.length > 1 ? (
              <div className="mt-5 border-t border-outline-variant/20 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Select Size / Option
                </label>
                <div className="mt-2 space-y-2">
                  {customizingDish.variants.map((v) => {
                    const isChecked = selectedVariant?.name === v.name
                    return (
                      <label
                        key={v.name}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition ${
                          isChecked
                            ? 'border-primary bg-primary/5 font-semibold text-primary'
                            : 'border-outline-variant/40 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="dish-variant"
                            checked={isChecked}
                            onChange={() => setSelectedVariant(v)}
                            className="accent-primary"
                          />
                          <span>{v.name}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          {v.priceDelta > 0 ? `+${money(v.priceDelta)}` : 'Standard'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {/* EXTRAS */}
            {customizingDish.extras?.length > 0 ? (
              <div className="mt-5 border-t border-outline-variant/20 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Add-ons / Extras (Optional)
                </label>
                <div className="mt-2 space-y-2">
                  {customizingDish.extras.map((extra) => {
                    const isChecked = selectedExtras.some((e) => e.name === extra.name)
                    return (
                      <label
                        key={extra.name}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition ${
                          isChecked
                            ? 'border-primary bg-primary/5 font-semibold text-primary'
                            : 'border-outline-variant/40 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleExtra(extra)}
                            className="accent-primary"
                          />
                          <span>{extra.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          +{money(extra.price)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {/* QUANTITY STEPPER */}
            <div className="mt-6 flex items-center justify-between border-t border-outline-variant/20 pt-4">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={customQty <= 1}
                  onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/40 text-lg font-bold hover:bg-surface-container disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center font-bold">{customQty}</span>
                <button
                  type="button"
                  onClick={() => setCustomQty((q) => q + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/40 text-lg font-bold hover:bg-surface-container"
                >
                  +
                </button>
              </div>
            </div>

            {/* ADD ACTION BUTTON */}
            <button
              type="button"
              onClick={() =>
                attemptAddItem(
                  customizingDish,
                  selectedVariant,
                  selectedExtras,
                  customQty,
                )
              }
              className="mt-6 w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-95"
            >
              Add to Order · {money(customTotalUnitPrice * customQty)}
            </button>
          </div>
        </div>
      ) : null}

      {/* BRANCH SWITCH WARNING DIALOG */}
      {conflictPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
              🛒
            </div>
            <h3 className="mt-4 text-lg font-bold text-on-surface">
              Start new cart?
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Your cart currently contains items from{' '}
              <strong>{cart.restaurant?.name || 'another restaurant'}</strong>.
              Adding items from <strong>{restaurant?.name}</strong> will reset your previous cart.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConflictPrompt(null)}
                className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container"
              >
                Keep existing cart
              </button>
              <button
                type="button"
                onClick={handleConfirmBranchSwitch}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:opacity-95"
              >
                Start new cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
