import { createContext, useContext, useState } from 'react'
import { getStoredUser, storeUser, clearStoredUser } from '../lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [pauseMessage, setPauseMessage] = useState('')

  const signIn = (u) => {
    setPauseMessage('')
    storeUser(u)
    setUser(u)
  }

  // signOut(message) : message non vide = déconnexion « pause » (contrôle parental)
  const signOut = (message = '') => {
    clearStoredUser()
    // L'annonce de saison se réaffiche à la prochaine connexion.
    try { sessionStorage.removeItem('zigzam:saison-annonce-vue') } catch { /* ignore */ }
    setUser(null)
    setPauseMessage(message)
  }

  const clearPause = () => setPauseMessage('')

  // Met à jour l'utilisateur courant (ex : après l'onboarding, gain de donuts, avatar…)
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      storeUser(next)
      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{ user, pauseMessage, signIn, signOut, updateUser, clearPause }}
    >
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
