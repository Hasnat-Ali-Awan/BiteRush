import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icon'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`
}

export default function Home() {
  const { addItem } = useCart()
  const { isManager } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [dishes, setDishes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedToast, setAddedToast] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const list = await api.getRestaurants()
        setRestaurants(list)
        if (list[0]) {
          const menu = await api.getMenu({
            restaurantId: list[0].id,
            available: 'true',
          })
          setDishes(menu.slice(0, 8))
        } else {
          setDishes([])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cuisines = useMemo(() => {
    const set = new Set()
    restaurants.forEach((r) => {
      if (r.cuisine) set.add(r.cuisine)
    })
    return Array.from(set)
  }, [restaurants])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.branch && r.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCuisine = !selectedCuisine || r.cuisine === selectedCuisine
      return matchSearch && matchCuisine
    })
  }, [restaurants, searchQuery, selectedCuisine])

  function handleAddDish(dish) {
    if (restaurants[0]) {
      addItem(restaurants[0], dish)
      setAddedToast(`Added "${dish.name}" to cart!`)
      setTimeout(() => setAddedToast(''), 2500)
    }
  }

  return (
    <div>
      {addedToast ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-on-surface px-5 py-3 font-semibold text-surface shadow-xl animate-fade-in">
          <span>✓</span>
          <span>{addedToast}</span>
        </div>
      ) : null}

      <section className="bg-[linear-gradient(180deg,#ffe8d6,transparent)]">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              🚀 Fast & Fresh Delivery
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              Craving something delicious?
            </h1>
            <p className="mt-3 text-base text-on-surface-variant">
              Order hot meals from local branches on BiteRush, or log in as a manager to scale your brand.
            </p>

            {/* Quick Search */}
            <div className="mt-6 flex max-w-lg items-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/5">
              <span className="pl-3 text-xl text-on-surface-variant">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurant, branch, or cuisine…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 text-xs text-on-surface-variant hover:text-on-surface"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#restaurants"
                className="rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-primary/20 transition hover:opacity-95"
              >
                Browse Restaurants
              </a>
              {isManager ? (
                <Link
                  to="/manager"
                  className="rounded-xl border border-outline-variant/60 bg-white px-5 py-3 font-semibold shadow-sm transition hover:bg-surface-container"
                >
                  Open manager dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="rounded-xl border border-outline-variant/60 bg-white px-5 py-3 font-semibold shadow-sm transition hover:bg-surface-container"
                >
                  Register as manager
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="restaurants" className="mx-auto max-w-[1200px] px-4 py-10">
        {error ? (
          <div className="mb-6 rounded-xl border border-error/30 bg-error/5 p-4 text-error">
            {error}
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Restaurants & Branches</h2>
            <p className="text-on-surface-variant">Choose your local branch to start ordering</p>
          </div>

          {/* Cuisine Filter Pills */}
          {cuisines.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCuisine('')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  !selectedCuisine
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                All
              </button>
              {cuisines.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCuisine(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selectedCuisine === c
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl skeleton-shimmer shadow-xs" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center text-on-surface-variant shadow-sm">
            <p className="text-4xl">🍽️</p>
            <p className="mt-2 font-bold">
              {searchQuery || selectedCuisine
                ? 'No restaurants match your filter'
                : 'No restaurants listed yet'}
            </p>
            <p className="mt-1 text-sm">
              {searchQuery || selectedCuisine
                ? 'Try searching with a different term or clear filters.'
                : 'A manager can set up a brand and add branches from the dashboard.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="relative h-44 bg-surface-container overflow-hidden">
                    {restaurant.heroImage ? (
                      <img
                        src={restaurant.heroImage}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center bg-primary/5 text-primary">
                        <span className="text-4xl">🍲</span>
                        <span className="mt-1 text-xs font-semibold">{restaurant.cuisine || 'BiteRush'}</span>
                      </div>
                    )}
                    {restaurant.eta ? (
                      <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        ⏱️ {restaurant.eta}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          {restaurant.name}
                          {restaurant.branch ? (
                            <span className="text-sm font-semibold text-primary"> — {restaurant.branch}</span>
                          ) : null}
                        </h3>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          📍 {restaurant.address || restaurant.branch || 'Local branch'}
                        </p>
                      </div>
                      {restaurant.avgRating ? (
                        <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                          ★ {restaurant.avgRating}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-outline-variant/20 pt-2 text-xs text-on-surface-variant">
                      <span>{restaurant.cuisine || 'Multi-cuisine'}</span>
                      <span>Delivery: {money(restaurant.deliveryFee || 0)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {dishes.length > 0 ? (
          <>
            <h2 className="mt-14 text-2xl font-bold">Popular near you</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                >
                  <div className="h-40 bg-surface-container overflow-hidden">
                    {dish.images?.[0] ? (
                      <img
                        src={dish.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-primary/40">
                        🍛
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{dish.name}</p>
                      <p className="mt-1 font-bold text-primary">{money(dish.basePrice)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddDish(dish)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20 transition hover:scale-105 active:scale-95"
                      title="Add to cart"
                    >
                      <Icon name="add" className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}
