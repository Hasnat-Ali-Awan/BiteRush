import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api'

const AuthContext = createContext(null)

const MANAGER_ROLES = ['main_manager', 'branch_manager']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  async function applyAuth(payload) {
    setToken(payload.token)
    setUser(payload.user)
    return payload.user
  }

  async function refresh() {
    if (!getToken()) {
      setUser(null)
      return null
    }
    try {
      const payload = await api.me()
      return applyAuth(payload)
    } catch {
      setToken('')
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    refresh().finally(() => setReady(true))
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      isManager: MANAGER_ROLES.includes(user?.role),
      isMainManager: user?.role === 'main_manager',
      isBranchManager: user?.role === 'branch_manager',
      isRider: user?.role === 'rider',
      isCustomer: user?.role === 'customer',
      async register(input) {
        return api.register(input)
      },
      async login(input) {
        return applyAuth(await api.login(input))
      },
      async googleAuth(input) {
        return applyAuth(await api.googleAuth(input))
      },
      async verifyEmail(input) {
        return applyAuth(await api.verifyEmail(input))
      },
      async resendVerification(input) {
        return api.resendVerification(input)
      },
      async forgotPassword(input) {
        return api.forgotPassword(input)
      },
      async resetPassword(input) {
        return api.resetPassword(input)
      },
      async refresh() {
        return refresh()
      },
      logout() {
        setToken('')
        setUser(null)
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
