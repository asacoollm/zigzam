import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './InactivityGuard.css'

// Retour automatique à l'écran d'accueil après 10 min d'inactivité (l'utilisateur
// reste connecté, comme s'il venait de rallumer l'appli).
// - Avertissement à 9 min (1 min avant le retour à l'accueil).
// - Le compteur repart à zéro à chaque interaction (clic, scroll, toucher, clavier).
const TOTAL_MS = 10 * 60 * 1000
const WARN_MS = 9 * 60 * 1000

const ACTIVITY_EVENTS = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart']

export default function InactivityGuard() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
      outTimer.current = setTimeout(() => {
        warnShown.current = false
        setWarn(false)
        navigate('/accueil', { replace: true })
      }, TOTAL_MS)
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
          Tu es toujours là&nbsp;? Tu vas être renvoyé à l'accueil dans{' '}
          <strong>1&nbsp;minute</strong> si tu ne fais rien&nbsp;!
        </p>
        <button className="inactivity__btn" onClick={dismiss}>
          Je suis là&nbsp;! 🙋
        </button>
      </div>
    </div>
  )
}
