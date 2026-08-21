import { Outlet } from 'react-router-dom'
import CustomerHeader from './CustomerHeader'

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <CustomerHeader />
      <Outlet />
      <footer className="border-t border-surface-variant/40 bg-white px-4 py-8 text-sm text-on-surface-variant">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <p>© 2026 BiteRush. All rights reserved.</p>
          <p>Fastest food delivery in Pakistan.</p>
        </div>
      </footer>
    </div>
  )
}
