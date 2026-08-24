const BASE = '/api/v1'
const TOKEN_KEY = 'biterush-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const clientCache = new Map()

export function invalidateClientCache(prefix = '') {
  if (!prefix) {
    clientCache.clear()
    return
  }
  for (const key of clientCache.keys()) {
    if (key.startsWith(prefix)) {
      clientCache.delete(key)
    }
  }
}

async function request(path, options = {}) {
  const isGet = !options.method || options.method === 'GET'
  const cacheKey = `${path}`

  // Instant 0ms response from RAM if cached within 15 seconds
  if (isGet && clientCache.has(cacheKey)) {
    const entry = clientCache.get(cacheKey)
    if (Date.now() - entry.timestamp < 15000) {
      return entry.data
    }
  }

  const token = getToken()
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.success === false) {
      const raw =
        json?.error?.message || json?.message || `Request failed (${res.status})`
      const message = Array.isArray(raw) ? raw.join(', ') : raw
      throw new Error(message)
    }

    const data = json.data ?? json

    if (isGet) {
      clientCache.set(cacheKey, { data, timestamp: Date.now() })
    } else {
      invalidateClientCache()
    }

    return data
  } catch (err) {
    // If on slow/offline network, fallback to cached data if available
    if (isGet && clientCache.has(cacheKey)) {
      return clientCache.get(cacheKey).data
    }
    throw err
  }
}

function toQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

export const api = {
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyEmail: (payload) =>
    request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resendVerification: (payload) =>
    request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request('/auth/me'),
  getDashboard: (params) => request(`/dashboard/restaurant${toQuery(params)}`),
  getRestaurants: () => request('/restaurants'),
  getRestaurant: (id) => request(`/restaurants/${id}`),
  getManagedRestaurants: () => request('/restaurants/managed'),
  createGroup: (payload) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyGroup: () => request('/groups/mine'),
  getMyBranches: () => request('/groups/mine/branches'),
  createBranch: (groupId, payload) =>
    request(`/groups/${groupId}/branches`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBranch: (groupId, branchId, payload) =>
    request(`/groups/${groupId}/branches/${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteBranch: (groupId, branchId) =>
    request(`/groups/${groupId}/branches/${branchId}`, {
      method: 'DELETE',
    }),
  inviteBranchManager: (branchId, payload) =>
    request(`/groups/branches/${branchId}/invite-manager`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  inviteRider: (branchId, payload) =>
    request(`/groups/branches/${branchId}/invite-rider`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrders: (params) => request(`/orders${toQuery(params)}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (payload) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  assignRider: (id, riderId) =>
    request(`/orders/${id}/assign-rider`, {
      method: 'PATCH',
      body: JSON.stringify({ riderId }),
    }),
  getRiderDeliveries: (params) => request(`/rider/deliveries${toQuery(params)}`),
  getRiderAvailable: () => request('/rider/available'),
  acceptRiderDelivery: (orderId) =>
    request(`/rider/deliveries/${orderId}/accept`, { method: 'POST' }),
  updateRiderDeliveryStatus: (orderId, status) =>
    request(`/rider/deliveries/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateRiderLocation: (orderId, location) =>
    request(`/rider/deliveries/${orderId}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ location }),
    }),
  getReservations: (params) => request(`/reservations${toQuery(params)}`),
  createReservation: (payload, params) =>
    request(`/reservations${toQuery(params)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateReservationStatus: (id, payload) =>
    request(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getCategories: () => request('/categories'),
  createCategory: (payload) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMenu: (params) => request(`/menu${toQuery(params)}`),
  createMenuItem: (payload, params) =>
    request(`/menu${toQuery(params)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMenuItem: (id, payload) =>
    request(`/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  toggleMenuAvailability: (id, isAvailable) =>
    request(`/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }),
  deleteMenuItem: (id) =>
    request(`/menu/${id}`, {
      method: 'DELETE',
    }),
}

export function homePathForRole(role) {
  if (role === 'main_manager' || role === 'branch_manager') return '/manager'
  if (role === 'rider') return '/rider'
  return '/'
}
