import { createContext, useContext, useState } from 'react'
import { getStoredUser, storeUser, clearStoredUser } from '../lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const signIn = (u) => {
    storeUser(u)
    setUser(u)
  }

  const signOut = () => {
    clearStoredUser()
    setUser(null)
  }

  // Met à jour l'utilisateur courant (ex : après l'onboarding)
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      storeUser(next)
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
