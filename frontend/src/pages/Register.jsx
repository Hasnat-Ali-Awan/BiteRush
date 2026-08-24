import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import { homePathForRole } from '../api'

const ROLES = [
  { id: 'customer', label: 'Customer' },
  { id: 'main_manager', label: 'Main manager' },
  { id: 'rider', label: 'Rider' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'customer',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })
      if (res?.requiresVerification || !res?.token) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`, {
          replace: true,
        })
      } else {
        navigate(homePathForRole(res.user?.role || form.role), { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthShell
      tab="register"
      title="Create account"
      subtitle="Register as a customer, main manager, or delivery rider."
      error={error}
    >
      <div className="mt-6">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-container p-1">
          {ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => update('role', item.id)}
              className={`rounded-lg py-2 text-xs font-semibold sm:text-sm transition ${
                form.role === item.id ? 'bg-white text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Branch managers receive an email invite from the main manager.
        </p>

        {/* GOOGLE SIGN UP BUTTON */}
        <div className="mt-5">
          <GoogleSignInButton
            mode="register"
            role={form.role}
            onError={setError}
          />
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-outline-variant/30" />
          <span className="absolute bg-surface px-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Or sign up with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        <label className="mt-4 block text-sm font-semibold">
          Full name
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
            autoComplete="name"
            required
            minLength={2}
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Email address
          <input
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Password
          <input
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Confirm password
          <input
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md disabled:opacity-50"
        >
          {saving ? 'Creating account…' : 'Sign Up'}
        </button>
        <p className="mt-4 text-center text-sm text-on-surface-variant">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
