import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import GoogleSignInButton from '../components/GoogleSignInButton'
import Icon from '../components/Icon'
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

  const [isUnverified, setIsUnverified] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setIsUnverified(false)
    try {
      const user = await login({ email: email.trim(), password })
      const from = location.state?.from
      if (from) navigate(from, { replace: true })
      else navigate(homePathForRole(user.role), { replace: true })
    } catch (err) {
      const msg = err.message || 'Login failed'
      setError(msg)
      if (msg.toLowerCase().includes('verify')) {
        setIsUnverified(true)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthShell
      tab="login"
      title="Login"
      subtitle="Sign in to your BiteRush account."
      error={!isUnverified ? error : null}
    >
      {isUnverified && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{error}</p>
          <div className="mt-3 flex items-center gap-3">
            <Link
              to={`/verify-email?email=${encodeURIComponent(email.trim())}`}
              className="inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Verify Email Now
            </Link>
          </div>
        </div>
      )}

      {/* GOOGLE SIGN IN BUTTON */}
      <div className="mt-6">
        <GoogleSignInButton mode="login" onError={setError} />
      </div>

      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-outline-variant/30" />
        <span className="absolute bg-surface px-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Or continue with email
        </span>
      </div>

      <form onSubmit={handleSubmit}>
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
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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
              className="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant flex items-center justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon
                name={showPassword ? 'visibility_off' : 'visibility'}
                className="h-5 w-5 text-on-surface-variant hover:text-on-surface"
              />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
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
