import { Link } from 'react-router-dom'
import BiteRushLogo from './BiteRushLogo'

export default function AuthShell({
  title,
  subtitle,
  tab,
  hideTabs = false,
  children,
  error,
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT SIDE: RESTAURANT SHOWCASE IMAGE WITH OVERLAYS */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 text-white">
        {/* Background Image */}
        <img
          src="/auth-banner.jpg"
          alt="BiteRush Gourmet Cuisine"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <span className="text-xl">🍔</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-white drop-shadow">
              BiteRush
            </span>
          </Link>
        </div>

        {/* Bottom Hero Showcase */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/20">
            <span>✨</span>
            <span>Fast Fresh Delivery & Management</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight text-white drop-shadow-md">
            Good food is good mood.
          </h2>

          <p className="max-w-md text-sm text-white/85 leading-relaxed drop-shadow">
            Explore hot & fresh dishes from top local branches, or scale your multi-branch restaurant empire with BiteRush.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              🚀 30 Min Delivery
            </span>
            <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              📍 Live GPS Tracking
            </span>
            <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              ⭐ 4.9+ Foodie Rating
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: AUTH FORM */}
      <div className="flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <BiteRushLogo size={36} />
            <span className="text-2xl font-extrabold tracking-tight">BiteRush</span>
          </div>

          {!hideTabs && (
            <div className="grid grid-cols-2 rounded-2xl bg-surface-container p-1 text-center text-sm font-bold shadow-inner">
              <Link
                to="/login"
                className={`rounded-xl py-2.5 transition ${
                  tab === 'login'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`rounded-xl py-2.5 transition ${
                  tab === 'register'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create Account
              </Link>
            </div>
          )}

          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-on-surface">{title}</h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">{subtitle}</p>

          {error ? (
            <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs font-semibold text-error animate-fade-in">
              {error}
            </div>
          ) : null}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
