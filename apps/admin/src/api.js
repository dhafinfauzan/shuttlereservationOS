const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api/v1'

async function request(path, { token, ...init } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const payload = await response.json()
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message || 'Permintaan ke Kelana API gagal')
  }
  return payload.data
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  dashboard: (token) => Promise.all([
    request('/dashboard/summary', { token }),
    request('/dashboard/revenue?days=7', { token }),
    request('/dashboard/occupancy', { token }),
    request('/dashboard/activity', { token }),
  ]),
  trips: (token) => request('/trips', { token }),
  bookings: (token) => request('/bookings?status=Semua', { token }),
  routes: (token) => request('/routes', { token }),
  points: (token) => request('/points', { token }),
  vehicles: (token) => request('/vehicles', { token }),
  drivers: (token) => request('/drivers', { token }),
  createTrip: (token, data) => request('/trips', { token, method: 'POST', body: JSON.stringify(data) }),
}
