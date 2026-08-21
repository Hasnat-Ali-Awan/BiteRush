import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../context/AuthContext'

export default function ManagerLayout({ restaurant, setRestaurant }) {
  const { user } = useAuth()
  const [branchId, setBranchId] = useState(null)
  const branches = user?.branches || []

  const handleBranchChange = useCallback(
    (nextBranchId) => {
      setBranchId(nextBranchId)
      if (!nextBranchId) return
      const branch = branches.find((item) => item.id === nextBranchId)
      if (branch) {
        setRestaurant?.({
          id: branch.id,
          name: branch.name,
          branch: branch.branch,
        })
      }
    },
    [branches, setRestaurant],
  )

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar
        restaurant={restaurant}
        branchId={branchId}
        branches={branches}
        onBranchChange={handleBranchChange}
      />
      <TopBar />
      <main className="ml-64 min-h-screen pt-16">
        <Outlet context={{ branchId }} />
      </main>
    </div>
  )
}
