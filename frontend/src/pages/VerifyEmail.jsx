import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { homePathForRole } from '../api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''
  const emailFromUrl = searchParams.get('email') || ''

  const { verifyEmail, resendVerification } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // If token is present in URL, auto verify once
  const autoVerified = useRef(false)
  useEffect(() => {
    if (tokenFromUrl && !autoVerified.current) {
      autoVerified.current = true
      handleAutoVerify(tokenFromUrl)
    }
  }, [tokenFromUrl])

  async function handleAutoVerify(token) {
    setLoading(true)
    setError('')
    try {
      const user = await verifyEmail({ token, email: emailFromUrl })
      setSuccess('Email verified successfully! Redirecting...')
      setTimeout(() => {
        navigate(homePathForRole(user.role), { replace: true })
      }, 1200)
    } catch (err) {
      setError(err.message || 'Invalid or expired verification link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!code.trim() && !tokenFromUrl) {
      setError('Please enter the 6-digit verification code.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const user = await verifyEmail({
        email: email.trim(),
        code: code.trim(),
        token: tokenFromUrl || undefined,
      })
      setSuccess('Email verified successfully! Redirecting...')
      setTimeout(() => {
        navigate(homePathForRole(user.role), { replace: true })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      setError('Please enter your email address to resend the code.')
      return
    }
    if (countdown > 0 || resending) return

    setResending(true)
    setError('')
    try {
      const res = await resendVerification({ email: email.trim() })
      setSuccess(res.message || 'A new verification code has been sent!')
      setCountdown(60)
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      hideTabs
      title="Verify your email"
      subtitle={
        email
          ? `We sent a 6-digit verification code to ${email}`
          : 'Please enter the 6-digit verification code sent to your email.'
      }
      error={error}
    >
      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          6-digit verification code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary/40"
            type="text"
            inputMode="numeric"
            placeholder="······"
            maxLength={6}
            autoFocus
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify Email'}
        </button>

        <div className="flex items-center justify-between pt-2 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resending
              ? 'Sending code…'
              : countdown > 0
                ? `Resend code in ${countdown}s`
                : 'Resend code'}
          </button>

          <Link to="/login" className="text-on-surface-variant hover:text-primary">
            Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
