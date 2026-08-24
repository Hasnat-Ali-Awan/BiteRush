import { Suspense, lazy, useCallback, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import CustomerLayout from './components/CustomerLayout'
import ManagerLayout from './components/ManagerLayout'
import RequireAuth from './components/RequireAuth'

// Lazy-loaded routes for ultra-fast initial page load on slow networks
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const RestaurantMenu = lazy(() => import('./pages/RestaurantMenu'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderTracking = lazy(() => import('./pages/OrderTracking'))
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'))
const MenuManagement = lazy(() => import('./pages/MenuManagement'))
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'))
const Reservations = lazy(() => import('./pages/Reservations'))
const Orders = lazy(() => import('./pages/Orders'))
const Branches = lazy(() => import('./pages/Branches'))
const RiderDashboard = lazy(() => import('./pages/RiderDashboard'))

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        Loading BiteRush…
      </p>
    </div>
  )
}

export default function App() {
  const [restaurant, setRestaurant] = useState(null)

  const handleRestaurant = useCallback((next) => {
    setRestaurant(next)
  }, [])

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
