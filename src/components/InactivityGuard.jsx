import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './InactivityGuard.css'

// Déconnexion automatique après 10 min d'inactivité.
// - Avertissement à 9 min (1 min avant la déconnexion).
// - Le compteur repart à zéro à chaque interaction (clic, scroll, toucher, clavier).
const TOTAL_MS = 10 * 60 * 1000
const WARN_MS = 9 * 60 * 1000
export const INACTIVITY_MESSAGE =
  'Tu as été déconnecté après 10 minutes d\'inactivité. À bientôt ! 👋'

const ACTIVITY_EVENTS = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart']

export default function InactivityGuard() {
  const { user, signOut } = useAuth()
  const [warn, setWarn] = useState(false)
  const warnTimer = useRef(null)
  const outTimer = useRef(null)
  const warnShown = useRef(false)

  useEffect(() => {
    if (!user) return

    const arm = () => {
      clearTimeout(warnTimer.current)
      clearTimeout(outTimer.current)
      warnTimer.current = setTimeout(() => {
        warnShown.current = true
        setWarn(true)
      }, WARN_MS)
      outTimer.current = setTimeout(() => signOut(INACTIVITY_MESSAGE), TOTAL_MS)
    }

    const onActivity = () => {
      if (warnShown.current) {
        warnShown.current = false
        setWarn(false)
      }
      arm()
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    arm()

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      clearTimeout(warnTimer.current)
      clearTimeout(outTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!warn) return null

  const dismiss = () => {
    warnShown.current = false
    setWarn(false)
  }

  return (
    <div className="inactivity">
      <div className="inactivity__card" role="alertdialog" aria-live="assertive">
        <span className="inactivity__emoji">👀</span>
        <p className="inactivity__text">
          Tu es toujours là&nbsp;? Tu vas être déconnecté dans{' '}
          <strong>1&nbsp;minute</strong> si tu ne fais rien&nbsp;!
        </p>
        <button className="inactivity__btn" onClick={dismiss}>
          Je suis là&nbsp;! 🙋
        </button>
      </div>
    </div>
  )
}
