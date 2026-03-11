export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export interface ApiError {
  code: number
  message: string
}
