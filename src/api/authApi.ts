import http from './http'
import type { LoginRequest, LoginResponse, RefreshResponse } from '@/types/auth'

export const authApi = {
  login(payload: LoginRequest) {
    return http.post<LoginResponse>('/auth/login', payload)
  },

  refresh(refreshToken: string) {
    // Skip the auth interceptor — no Bearer token needed here
    return http.post<RefreshResponse>(
      '/api/auth/refresh',
      { refreshToken },
      { headers: { Authorization: '' } }
    )
  },

  forgotPassword(email: string) {
    return http.post('/auth/forgot-password', { email })
  },
  activate(token: string, password: string, passwordConfirm: string) {
    return http.post('/auth/activate', { token, password, password_confirm: passwordConfirm })
  },

  resetPassword(token: string, password: string, passwordConfirm: string) {
    return http.post('/auth/reset-password', { token, password, password_confirm: passwordConfirm })
  },
  // activate(token: string, password: string, password_confirm: string) {
  //   return http.post('/auth/activate', { token, password, password_confirm })
  // },

  // resetPassword(token: string, password: string, password_confirm: string) {
  //   return http.post('/auth/reset-password', { token, password, password_confirm })
  // },
}
