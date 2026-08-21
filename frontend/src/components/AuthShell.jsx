import { Link } from 'react-router-dom'
import BiteRushLogo from './BiteRushLogo'

export default function AuthShell({ title, subtitle, tab, children, error }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-[linear-gradient(180deg,#ffe8d6,#faf9f7)] lg:flex lg:items-end lg:p-12">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">BiteRush</h2>
          <p className="mt-3 max-w-md text-on-surface-variant">
            Create an account to order food or run your restaurant.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <BiteRushLogo size={48} />
          <div className="mt-8 grid grid-cols-2 rounded-xl bg-surface-container p-1 text-center text-sm font-semibold">
            <Link
              to="/login"
              className={`rounded-lg py-2 ${
                tab === 'login' ? 'bg-white text-primary shadow' : ''
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`rounded-lg py-2 ${
                tab === 'register' ? 'bg-white text-primary shadow' : ''
              }`}
            >
              Sign Up
            </Link>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-on-surface-variant">{subtitle}</p>
          {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
          {children}
        </div>
      </div>
    </div>
  )
}
