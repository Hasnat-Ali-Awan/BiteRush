import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { homePathForRole } from '../api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const user = await login({ email, password })
      const from = location.state?.from
      if (from) navigate(from, { replace: true })
      else navigate(homePathForRole(user.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthShell
      tab="login"
      title="Login"
      subtitle="Sign in with the email and password you registered."
      error={error}
    >
      <form onSubmit={handleSubmit} className="mt-6">
        <label className="block text-sm font-semibold">
          Email address
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Password
          <div className="relative mt-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/40"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant"
            >
              <span className="material-symbols-outlined">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md disabled:opacity-50"
        >
          {saving ? 'Signing in…' : 'Login'}
        </button>
        <p className="mt-4 text-center text-sm text-on-surface-variant">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
