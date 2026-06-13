import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PAUSE_MESSAGE_DUREE } from '../lib/parental'
import './ParentalGuard.css'

// Surveille la durée max quotidienne fixée par le contrôle parental :
// alerte 5 min avant la fin, puis déconnexion douce. (Compteur basé sur la
// session courante depuis la connexion.)
export default function ParentalGuard() {
  const { user, signOut } = useAuth()
  const [warn, setWarn] = useState(false)
  const duree = user?.parental?.actif ? user.parental.duree_max_minutes : null

  useEffect(() => {
    setWarn(false)
    if (!duree) return
    const total = duree * 60000
    const warnAt = Math.max(total - 5 * 60000, 4000)
    const t1 = setTimeout(() => setWarn(true), warnAt)
    const t2 = setTimeout(() => signOut(PAUSE_MESSAGE_DUREE), total)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, duree])

  if (!warn) return null
  return <div className="parental-warn">⏳ Plus que 5 minutes avant la pause !</div>
}
