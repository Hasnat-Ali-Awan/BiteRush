import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
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
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getRestaurants()
        setRestaurants(list)
        if (list[0]) {
          const menu = await api.getMenu({
            restaurantId: list[0].id,
            available: 'true',
          })
          setDishes(menu.slice(0, 4))
        } else {
          setDishes([])
        }
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  return (
    <div>
      <section className="bg-[linear-gradient(180deg,#ffe8d6,transparent)]">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Craving something great?
          </h1>
          <p className="mt-3 text-on-surface-variant">
            Order from restaurants on BiteRush, or open the manager workspace to
            add yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#restaurants"
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-white"
            >
              Order Delivery
            </a>
            {isManager ? (
              <Link
                to="/manager"
                className="rounded-xl border border-outline-variant px-5 py-3 font-semibold"
              >
                Open manager dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="rounded-xl border border-outline-variant px-5 py-3 font-semibold"
              >
                Register as main manager
              </Link>
            )}
          </div>
        </div>
      </section>

      <section id="restaurants" className="mx-auto max-w-[1200px] px-4 py-10">
        {error ? (
          <div className="mb-6 rounded-xl border border-error/30 bg-error/5 p-4 text-error">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Restaurants</h2>
            <p className="text-on-surface-variant">Places currently listed</p>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-on-surface-variant">
            No restaurants yet. A manager can add one from the dashboard.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}`}
                className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              >
                <div className="h-40 bg-surface-container">
                  {restaurant.heroImage ? (
                    <img
                      src={restaurant.heroImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{restaurant.name}</h3>
                    {restaurant.avgRating ? (
                      <span className="text-sm font-semibold">
                        ★ {restaurant.avgRating}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {[restaurant.cuisine, restaurant.eta].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <h2 className="mt-12 text-2xl font-bold">Popular near you</h2>
        {dishes.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white p-6 text-on-surface-variant">
            No dishes listed yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              >
                <div className="h-36 bg-surface-container">
                  {dish.images?.[0] ? (
                    <img src={dish.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{dish.name}</p>
                    <p className="mt-1 font-bold text-primary">{money(dish.basePrice)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(restaurants[0], dish)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
