import { clearToken, getToken } from '../auth/token'

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback
  const err = data.error
  return typeof err === 'string' && err.trim() ? err : fallback
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  json?: unknown
}

const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'

export const API_BASE_URL: string =
  typeof import.meta.env.VITE_API_URL === 'string' &&
  import.meta.env.VITE_API_URL.trim()
    ? import.meta.env.VITE_API_URL.trim()
    : DEFAULT_API_BASE_URL

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const token = getToken()

  const headers = new Headers(options.headers)
  headers.set('accept', 'application/json')

  let body: BodyInit | undefined = undefined

  if (options.json !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(options.json)
  }

  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  })

  const data = await parseJsonResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
    }

    const message = getErrorMessage(data, response.status >= 500 ? 'Server error' : 'Request failed')
    throw new ApiError(message, response.status, data)
  }

  return data as T
}
