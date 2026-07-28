import axios from 'axios'

// Prefer a dedicated env var, fallback to your shared backend base
export const PG_ADMIN_BASE = import.meta.env.VITE_PG_ADMIN_BASE ??
  'https://eqxstaging.stashfin.com/admin/v1/admin'

export const pgAdmin = axios.create({ baseURL: PG_ADMIN_BASE })

// Cookie-based JWT from your tech doc
const getTokenFromCookie = () => {
  const m = document.cookie.match(/(?:^|; )auth_token=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : ''
}

pgAdmin.interceptors.request.use((cfg) => {
  const token = getTokenFromCookie()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  cfg.headers['Accept'] = 'application/json'
  return cfg
})
