import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/authApi'

const REFRESH_KEY = 'refreshToken'

export const useAuthStore = defineStore('auth', () => {
  // Access token lives ONLY in memory — wiped on tab/browser close
  const accessToken = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  function setTokens(access: string, refresh: string): void {
    accessToken.value = access
    // sessionStorage is automatically cleared when the browser is closed
    // This enforces re-login after browser close as per spec
    sessionStorage.setItem(REFRESH_KEY, refresh)
  }

  async function login(email: string, password: string): Promise<void> {
    const { data } = await authApi.login({ email, password })
    setTokens(data.accessToken, data.refreshToken)
  }

  async function refresh(): Promise<string> {
    const stored = sessionStorage.getItem(REFRESH_KEY)
    if (!stored) throw new Error('No refresh token in session')

    const { data } = await authApi.refresh(stored)
    accessToken.value = data.accessToken
    return data.accessToken
  }

  function logout(): void {
    accessToken.value = null
    sessionStorage.removeItem(REFRESH_KEY)
  }

  // Called on app boot — silently restores session if refresh token exists
  async function tryRestoreSession(): Promise<void> {
    const stored = sessionStorage.getItem(REFRESH_KEY)
    if (!stored) return

    try {
      await refresh()
    } catch {
      logout()
    }
  }

  return { accessToken, isAuthenticated, login, refresh, logout, tryRestoreSession }
})
