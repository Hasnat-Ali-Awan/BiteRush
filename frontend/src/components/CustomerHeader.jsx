import { Link, NavLink, useNavigate } from 'react-router-dom'
import BiteRushLogo from './BiteRushLogo'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function CustomerHeader() {
  const { user, isManager, isRider, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-surface-variant/40 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link to="/">
          <BiteRushLogo size={36} compact />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-on-surface-variant md:flex">
          <NavLink to="/" className="hover:text-primary">
            Restaurants
          </NavLink>
          {isManager ? (
            <NavLink to="/manager" className="hover:text-primary">
              Manager
            </NavLink>
          ) : null}
          {isRider ? (
            <NavLink to="/rider" className="hover:text-primary">
              Rider
            </NavLink>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative rounded-xl p-2 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-container"
            >
              {user.name} · Sign out
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-container"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
