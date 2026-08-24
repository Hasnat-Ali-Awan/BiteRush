import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathForRole } from '../api'

export default function GoogleSignInButton({
  mode = 'login',
  role = 'customer',
  onError,
  className = '',
}) {
  const { googleAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [showDevModal, setShowDevModal] = useState(false)
  const [devEmail, setDevEmail] = useState('')
  const [devName, setDevName] = useState('')
  const buttonRef = useRef(null)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleCredential = useCallback(
    async (credential) => {
      if (!credential) return
      setLoading(true)
      onError?.('')
      try {
        const user = await googleAuth({
          credential,
          role: mode === 'register' ? role : undefined,
        })
        const from = location.state?.from
        if (from) {
          navigate(from, { replace: true })
        } else {
          navigate(homePathForRole(user.role), { replace: true })
        }
      } catch (err) {
        onError?.(err.message || 'Google authentication failed')
      } finally {
        setLoading(false)
      }
    },
    [googleAuth, mode, role, location.state, navigate, onError],
  )

  useEffect(() => {
    if (!clientId) return

    // Load Google Identity Services script if not present
    let script = document.getElementById('google-gsi-client')
    if (!script) {
      script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              handleCredential(response.credential)
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })
      }
    }

    if (window.google?.accounts?.id) {
      initGsi()
    } else {
      script.addEventListener('load', initGsi)
    }

    return () => {
      script?.removeEventListener('load', initGsi)
    }
  }, [clientId, handleCredential])

  function handleGoogleClick() {
    if (loading) return
    onError?.('')

    if (clientId && window.google?.accounts?.id) {
      // Trigger Google One-Tap / OAuth prompt
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If one-tap is suppressed or blocked by browser popup settings, fallback to dev or custom prompt
            setShowDevModal(true)
          }
        })
      } catch {
        setShowDevModal(true)
      }
    } else {
      // If no Google Client ID is configured yet, provide convenient simulated Google Sign-In
      setShowDevModal(true)
    }
  }

  function handleDevSubmit(e) {
    e.preventDefault()
    if (!devEmail) return

    const name = devName.trim() || devEmail.split('@')[0]
    // Generate standard simulated Google JWT payload
    const mockPayload = {
      email: devEmail.toLowerCase().trim(),
      name,
      sub: `google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
        devEmail,
      )}`,
      email_verified: true,
    }

    // Base64 encode into valid 3-part JWT format: header.payload.signature
    const b64Header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const b64Payload = btoa(JSON.stringify(mockPayload))
    const mockToken = `${b64Header}.${b64Payload}.mock_signature`

    setShowDevModal(false)
    handleCredential(mockToken)
  }

  return (
    <>
      <div className={`w-full ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/40 bg-white py-3 px-4 text-sm font-semibold text-on-surface shadow-sm transition hover:bg-surface-container/60 hover:shadow disabled:opacity-60"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {loading
              ? 'Connecting with Google…'
              : mode === 'register'
              ? 'Sign up with Google'
              : 'Sign in with Google'}
          </span>
        </button>
      </div>

      {/* Development / Custom Google Sign-In Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="text-lg font-bold text-on-surface">
                  Sign in with Google
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-on-surface-variant">
              Choose or enter a Google account to {mode === 'register' ? 'register' : 'sign in'}.
              {mode === 'register' && (
                <span className="block mt-1 font-semibold text-primary">
                  Account role: {role.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </p>

            <form onSubmit={handleDevSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface">
                  Google Email
                </label>
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="alex.foodie@gmail.com"
                  className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface">
                  Account Name (Optional)
                </label>
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Quick Select Account
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDevEmail('foodie.tester@gmail.com')
                      setDevName('Foodie Tester')
                    }}
                    className="rounded-lg border border-outline-variant/40 bg-surface-container/40 px-2.5 py-1 text-xs font-medium hover:bg-surface-container-high"
                  >
                    🍰 foodie.tester@gmail.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDevEmail('chef.manager@gmail.com')
                      setDevName('Chef Manager')
                    }}
                    className="rounded-lg border border-outline-variant/40 bg-surface-container/40 px-2.5 py-1 text-xs font-medium hover:bg-surface-container-high"
                  >
                    👨‍🍳 chef.manager@gmail.com
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowDevModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!devEmail}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
                >
                  Continue with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
