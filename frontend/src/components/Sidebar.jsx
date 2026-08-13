import { NavLink } from 'react-router-dom'
import BiteRushLogo from './BiteRushLogo'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/' },
  { id: 'orders', label: 'Orders', icon: 'receipt_long', to: '#' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar_month', to: '#' },
  { id: 'menu', label: 'Menu', icon: 'restaurant_menu', to: '/menu' },
  { id: 'kitchen', label: 'Kitchen', icon: 'skillet', to: '#' },
  { id: 'chats', label: 'Chats', icon: 'chat', to: '#' },
  { id: 'reviews', label: 'Reviews', icon: 'rate_review', to: '#' },
  { id: 'settings', label: 'Settings', icon: 'settings', to: '#' },
]

export default function Sidebar({ restaurant }) {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col bg-surface-container-low px-4 py-6 shadow-sm">
      <div className="mb-5 px-3">
        <NavLink to="/" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <BiteRushLogo size={42} />
        </NavLink>
        <div className="mt-4 rounded-xl bg-white/70 px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="truncate text-sm font-bold text-on-surface">
            {restaurant?.name || 'Your restaurant'}
          </p>
          <p className="truncate text-xs text-on-surface-variant">
            {restaurant?.branch || 'Manager workspace'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          if (item.to === '#') {
            return (
              <span
                key={item.id}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant/50"
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            )
          }

          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-semibold text-primary'
                  : 'group flex items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-container-high'
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-outline-variant/30 p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Create New Order
        </button>
      </div>
    </aside>
  )
}
