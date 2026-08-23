import { useCallback, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import CustomerLayout from './components/CustomerLayout'
import ManagerLayout from './components/ManagerLayout'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import RestaurantMenu from './pages/RestaurantMenu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import ManagerDashboard from './pages/ManagerDashboard'
import MenuManagement from './pages/MenuManagement'
import KitchenDisplay from './pages/KitchenDisplay'
import Reservations from './pages/Reservations'
import Orders from './pages/Orders'
import Branches from './pages/Branches'
import RiderDashboard from './pages/RiderDashboard'

export default function App() {
  const [restaurant, setRestaurant] = useState(null)

  const handleRestaurant = useCallback((next) => {
    setRestaurant(next)
  }, [])

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/restaurants/:id" element={<RestaurantMenu />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <RequireAuth role="customer">
                    <Checkout />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RequireAuth role="customer">
                    <OrderTracking />
                  </RequireAuth>
                }
              />
            </Route>
            <Route
              path="/rider"
              element={
                <RequireAuth role="rider">
                  <RiderDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/manager/kitchen"
              element={
                <RequireAuth roles={['main_manager', 'branch_manager']}>
                  <KitchenDisplay />
                </RequireAuth>
              }
            />
            <Route
              element={
                <RequireAuth roles={['main_manager', 'branch_manager']}>
                  <ManagerLayout restaurant={restaurant} setRestaurant={setRestaurant} />
                </RequireAuth>
              }
            >
              <Route
                path="/manager"
                element={<ManagerDashboard onRestaurant={handleRestaurant} />}
              />
              <Route path="/manager/branches" element={<Branches />} />
              <Route
                path="/manager/menu"
                element={
                  <MenuManagement
                    restaurantId={restaurant?.id}
                    onRestaurant={handleRestaurant}
                  />
                }
              />
              <Route
                path="/manager/orders"
                element={
                  <Orders restaurantId={restaurant?.id} onRestaurant={handleRestaurant} />
                }
              />
              <Route
                path="/manager/reservations"
                element={
                  <Reservations
                    restaurantId={restaurant?.id}
                    onRestaurant={handleRestaurant}
                  />
                }
              />
            </Route>
            <Route path="/menu" element={<Navigate to="/manager/menu" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
