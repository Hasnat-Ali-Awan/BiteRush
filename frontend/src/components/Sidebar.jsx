import { Link, NavLink } from 'react-router-dom'
import BiteRushLogo from './BiteRushLogo'
import Icon from './Icon'
import { useAuth } from '../context/AuthContext'

const BASE_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/manager' },
  { id: 'orders', label: 'Orders', icon: 'receipt_long', to: '/manager/orders' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar_month', to: '/manager/reservations' },
  { id: 'menu', label: 'Menu', icon: 'restaurant_menu', to: '/manager/menu' },
  { id: 'kitchen', label: 'Kitchen', icon: 'skillet', to: '/manager/kitchen' },
]

export default function Sidebar({ restaurant, branchId, branches, onBranchChange }) {
  const { isMainManager } = useAuth()
  const nav = isMainManager
    ? [
        ...BASE_NAV,
        { id: 'branches', label: 'Branches', icon: 'store', to: '/manager/branches' },
      ]
    : BASE_NAV

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col bg-surface-container-low px-4 py-6 shadow-sm">
      <div className="mb-5 px-3">
        <NavLink to="/manager" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <BiteRushLogo size={42} />
        </NavLink>
        <div className="mt-4 rounded-xl bg-white/70 px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="truncate text-sm font-bold text-on-surface">
            {restaurant?.name || 'Your restaurant'}
          </p>
          <p className="truncate text-xs text-on-surface-variant">
            {restaurant?.branch || (isMainManager ? 'All branches' : 'Manager workspace')}
          </p>
        </div>
        {isMainManager && branches?.length > 0 ? (
          <select
            value={branchId || ''}
            onChange={(e) => onBranchChange?.(e.target.value || null)}
            className="mt-3 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm"
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === '/manager'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-semibold text-primary'
                : 'group flex items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-colors hover:bg-surface-container-high'
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-outline-variant/30 p-4">
        <Link
          to={restaurant?.id ? `/restaurants/${restaurant.id}` : '/'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <Icon name="storefront" className="h-5 w-5 text-white" />
          <span>View storefront</span>
        </Link>
      </div>
    </aside>
  )
}
