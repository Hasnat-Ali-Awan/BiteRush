const BASE = '/api/v1'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    const message =
      json?.error?.message || json?.message || `Request failed (${res.status})`
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }
  return json.data ?? json
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
  getDashboard: (restaurantId) =>
    request(`/dashboard/restaurant${toQuery({ restaurantId })}`),
  seed: () => request('/seed', { method: 'POST' }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getCategories: () => request('/categories'),
  getMenu: (params) => request(`/menu${toQuery(params)}`),
  createMenuItem: (payload) =>
    request('/menu', {
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
