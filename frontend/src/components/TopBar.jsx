import { useNavigate } from 'react-router-dom'
import BiteRushLogo from './BiteRushLogo'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || 'Manager'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-surface-variant/50 bg-surface px-4">
      <div className="flex w-full max-w-3xl items-center gap-4">
        <div className="hidden md:block">
          <BiteRushLogo size={28} compact showWordmark={false} />
        </div>
        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant h-5 w-5"
          />
          <input
            className="w-full rounded-xl border-none bg-surface-container-low py-2 pl-10 text-base outline-none ring-primary/50 focus:ring-2"
            placeholder="Search orders, dishes..."
            type="search"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {initial}
          </div>
          <span className="hidden text-sm font-semibold lg:block">{displayName}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-container"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
