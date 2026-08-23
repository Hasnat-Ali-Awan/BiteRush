import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''
  const emailFromUrl = searchParams.get('email') || ''

  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!tokenFromUrl && (!email.trim() || !code.trim())) {
      setError('Please provide your email and the 6-digit reset code.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({
        token: tokenFromUrl || undefined,
        email: email.trim() || undefined,
        code: code.trim() || undefined,
        newPassword,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your code or link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      hideTabs
      title="Reset Password"
      subtitle={
        success
          ? 'Your password has been changed.'
          : 'Choose a strong new password for your BiteRush account.'
      }
      error={error}
    >
      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Password reset successfully!</p>
            <p className="mt-1">
              You can now sign in with your new password. Redirecting to login…
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full rounded-xl bg-primary py-3 text-center font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!tokenFromUrl && (
            <>
              {!emailFromUrl && (
                <label className="block text-sm font-semibold">
                  Email address
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
              )}

              <label className="block text-sm font-semibold">
                6-digit reset code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary/40"
                  type="text"
                  inputMode="numeric"
                  placeholder="······"
                  maxLength={6}
                  required
                />
              </label>
            </>
          )}

          <label className="block text-sm font-semibold">
            New password
            <div className="relative mt-2">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/40"
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((val) => !val)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </label>

          <label className="block text-sm font-semibold">
            Confirm new password
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Updating password…' : 'Set New Password'}
          </button>

          <p className="mt-4 text-center text-sm text-on-surface-variant">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
