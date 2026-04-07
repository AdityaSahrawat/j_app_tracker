import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastContext, type ToastContextValue } from './toast'

type ToastKind = 'error' | 'info'

type Toast = {
  id: number
  kind: ToastKind
  message: string
}

function clampMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return 'Something went wrong'
  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++
      const toast: Toast = { id, kind, message: clampMessage(message) }

      setToasts((prev) => [...prev, toast])

      const ttlMs = kind === 'error' ? 6500 : 4000
      window.setTimeout(() => remove(id), ttlMs)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      error: (message: string) => push('error', message),
      info: (message: string) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-32px))] gap-2 text-left"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="rounded-lg border border-[var(--border)] bg-[var(--code-bg)] px-3 py-2 text-sm text-[var(--text-h)] shadow-[var(--shadow)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--text)]">{t.kind === 'error' ? 'Error' : 'Info'}</p>
                <p className="mt-0.5 break-words">{t.message}</p>
              </div>
              <button
                className="button"
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
