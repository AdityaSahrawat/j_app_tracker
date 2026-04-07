import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'j_app_tracker_token'

type Listener = () => void

const listeners = new Set<Listener>()

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  emitChange()
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  emitChange()
}

export function subscribeToken(listener: Listener): () => void {
  listeners.add(listener)

  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribeToken, getToken, getToken)
}
