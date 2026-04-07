import { apiRequest } from './client'

export type AuthUser = {
  id: string
  email: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    json: { email, password },
  })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    json: { email, password },
  })
}
