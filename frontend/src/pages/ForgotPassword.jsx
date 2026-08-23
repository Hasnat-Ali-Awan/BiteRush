import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword({ email: email.trim() })
      setSuccess(true)
      setCountdown(60)
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      hideTabs
      title="Forgot Password"
      subtitle={
        success
          ? `We sent a reset code & link to ${email}`
          : "Enter your registered email address and we'll send you instructions to reset your password."
      }
      error={error}
    >
      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Check your inbox!</p>
            <p className="mt-1">
              If an account with <strong>{email}</strong> exists, you'll receive a password reset link and a 6-digit code.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)
            }
            className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Enter 6-Digit Code & Reset Password
          </button>

          <div className="flex items-center justify-between pt-2 text-sm">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={countdown > 0 || loading}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {loading
                ? 'Sending…'
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : 'Resend email'}
            </button>

            <Link to="/login" className="text-on-surface-variant hover:text-primary">
              Back to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Email address
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Sending reset link…' : 'Send Reset Link'}
          </button>

          <p className="mt-4 text-center text-sm text-on-surface-variant">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
