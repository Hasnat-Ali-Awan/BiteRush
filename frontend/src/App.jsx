import { useCallback, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ManagerLayout from './components/ManagerLayout'
import ManagerDashboard from './pages/ManagerDashboard'
import MenuManagement from './pages/MenuManagement'

export default function App() {
  const [restaurant, setRestaurant] = useState(null)

  const handleRestaurant = useCallback((next) => {
    setRestaurant(next)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ManagerLayout restaurant={restaurant} />}>
          <Route
            path="/"
            element={<ManagerDashboard onRestaurant={handleRestaurant} />}
          />
          <Route
            path="/menu"
            element={
              <MenuManagement
                restaurantId={restaurant?.id}
                onRestaurant={handleRestaurant}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
