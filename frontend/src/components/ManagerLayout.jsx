import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function ManagerLayout({ restaurant }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar restaurant={restaurant} />
      <TopBar />
      <main className="ml-64 min-h-screen pt-16">
        <Outlet />
      </main>
    </div>
  )
}
