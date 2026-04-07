import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthToken, setToken } from '../auth/token'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/toast'

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function getFromPath(state: unknown): string {
  if (typeof state !== 'object' || state === null) return '/'
  if (!('from' in state)) return '/'

  const from = (state as { from?: unknown }).from
  return typeof from === 'string' && from.startsWith('/') ? from : '/'
}

export default function LoginPage() {
  const token = useAuthToken()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const fromPath = useMemo(() => getFromPath(location.state), [location.state])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (token) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await login(normalizedEmail, password)
      setToken(res.token)
      navigate(fromPath, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page">
      <section className="card" aria-label="Login">
        <h1 className="title">Login</h1>

        <form onSubmit={onSubmit} className="form" noValidate>
          <label className="field">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="field">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              required
            />
          </label>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="button" type="submit" disabled={isSubmitting}>
            <span className="inline-flex items-center gap-2">
              {isSubmitting ? <Spinner size={14} /> : null}
              {isSubmitting ? 'Logging in…' : 'Login'}
            </span>
          </button>
        </form>

        <p className="muted">
          No account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  )
}
