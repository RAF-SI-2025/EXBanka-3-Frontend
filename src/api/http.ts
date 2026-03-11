import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every outgoing request
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

// Handle 401 — attempt token refresh once, then retry original request
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const auth = useAuthStore()

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(http(original))
            },
            reject,
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const newToken = await auth.refresh()
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        auth.logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 403 — user lacks permission, fail silently
    // Users should not be aware of operations they don't have access to
    if (error.response?.status === 403) {
      return Promise.reject({ silent: true, status: 403 })
    }

    return Promise.reject(error)
  }
)

export default http
