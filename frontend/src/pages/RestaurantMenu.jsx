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
  const { addItem, cart, count, subtotal } = useCart()
  const [restaurant, setRestaurant] = useState(null)
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
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
      }
    }
    load()
  }, [id])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      const key = item.categoryName || 'Menu'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return Array.from(map.entries())
  }, [items])

  const visible = categoryId
    ? items.filter((item) => item.categoryId === categoryId)
    : items

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      {error ? <p className="mb-4 text-error">{error}</p> : null}

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="h-56 bg-surface-container">
          {restaurant?.heroImage ? (
            <img src={restaurant.heroImage} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-extrabold">{restaurant?.name || 'Restaurant'}</h1>
          <p className="mt-2 text-on-surface-variant">
            {[
              restaurant?.avgRating ? `★ ${restaurant.avgRating}` : null,
              restaurant?.cuisine,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-xs uppercase text-on-surface-variant">Delivery</p>
              <p className="font-semibold">{restaurant?.eta || '—'}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-xs uppercase text-on-surface-variant">Delivery Fee</p>
              <p className="font-semibold">{money(restaurant?.deliveryFee)}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-xs uppercase text-on-surface-variant">Min. Order</p>
              <p className="font-semibold">{money(restaurant?.minOrder)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryId('')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            !categoryId ? 'bg-primary text-white' : 'bg-white'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category._id || category.id}
            type="button"
            onClick={() => setCategoryId(category._id || category.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              categoryId === (category._id || category.id)
                ? 'bg-primary text-white'
                : 'bg-white'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {(categoryId ? [['Menu', visible]] : grouped).map(([name, rows]) => (
            <section key={name}>
              <h2 className="mb-3 text-xl font-bold">{name}</h2>
              <div className="space-y-3">
                {rows.map((dish) => (
                  <article
                    key={dish.id}
                    className={`flex gap-4 rounded-xl bg-white p-4 shadow-sm ${
                      dish.isAvailable ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                      {dish.images?.[0] ? (
                        <img src={dish.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{dish.name}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                            {dish.description}
                          </p>
                        </div>
                        <p className="font-bold text-primary">{money(dish.basePrice)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!dish.isAvailable}
                        onClick={() => addItem(restaurant, dish)}
                        className="mt-3 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:bg-surface-variant"
                      >
                        {dish.isAvailable ? 'Add' : 'Sold out'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h3 className="font-bold">Your Order</h3>
          {cart.items.length === 0 ? (
            <p className="mt-3 text-sm text-on-surface-variant">No items yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {cart.items.map((item) => (
                <li key={item.lineId} className="flex justify-between gap-2">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-semibold">
                    {money(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </p>
          <button
            type="button"
            disabled={count === 0}
            onClick={() => navigate('/cart')}
            className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-40"
          >
            View cart ({count} items)
          </button>
          <Link to="/" className="mt-3 block text-center text-sm text-on-surface-variant">
            Back to restaurants
          </Link>
        </aside>
      </div>
    </div>
  )
}
