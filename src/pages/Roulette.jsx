import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { spinRoulette } from '../lib/cartes'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import ZigzamCard from '../components/ZigzamCard'
import './Roulette.css'

const COUT = 5
const SPIN_MS = 1600

export default function Roulette() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('idle') // 'idle' | 'spinning' | 'result'
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState('')

  const flash = (msg) => {
    setToast(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setToast(''), 2600)
  }

  const isSuperAdmin = user.role === 'superadmin'

  const spin = async () => {
    if (phase === 'spinning' || isSuperAdmin) return
    if (user.donuts < COUT) {
      flash(`Il te faut ${COUT} 🍩 pour jouer !`)
      return
    }
    setPhase('spinning')
    const res = await spinRoulette(user.id)
    if (res.error) {
      flash(res.error)
      setPhase('idle')
      return
    }
    // Le tirage est déjà connu (anti-triche côté serveur) — on laisse
    // juste l'animation tourner un peu avant de le révéler.
    window.setTimeout(() => {
      updateUser({ donuts: res.donuts })
      setResult(res)
      setPhase('result')
    }, SPIN_MS)
  }

  const rejouer = () => {
    setResult(null)
    setPhase('idle')
  }

  return (
    <div className="roul">
      <Backdrop />
      <header className="roul__top">
        <button className="roul__back" onClick={() => navigate('/dashboard')}>⬅️ Retour</button>
        <ZigzamLogo size="sm" />
        <span className="roul__gems">🍩 {user.donuts}</span>
      </header>

      <h1 className="roul__title stroke-title">🎰 Roulette Zigzam</h1>
      <p className="roul__hint">
        {COUT} 🍩 le tour — tente ta chance sur les 57 cartes Zigzam Collectore !
      </p>

      <div className="roul__stage">
        {phase !== 'result' && (
          <div className={`roul__wheel ${phase === 'spinning' ? 'roul__wheel--spin' : ''}`}>
            <span className="roul__wheel-emoji">🃏</span>
          </div>
        )}
        {phase === 'result' && result && (
          <div className="roul__result">
            <ZigzamCard card={result.carte} className="roul__result-card" />
            {result.carte.rarete === 'impossible' && (
              <p className="roul__banner roul__banner--impossible">
                🌈 INCROYABLE ! Tu as gagné la carte IMPOSSIBLE !
              </p>
            )}
            {result.deja_possedee && (
              <p className="roul__banner">
                Tu avais déjà cette carte — voici {result.compensation} 🍩 de compensation !
              </p>
            )}
            {!result.deja_possedee && result.carte.rarete !== 'impossible' && (
              <p className="roul__banner roul__banner--new">✨ Nouvelle carte dans ta collection !</p>
            )}
          </div>
        )}
      </div>

      {isSuperAdmin ? (
        <p className="roul__superadmin">👑 Asacool ne peut pas gagner de cartes.</p>
      ) : phase === 'result' ? (
        <button className="roul__btn" onClick={rejouer}>Rejouer 🔁</button>
      ) : (
        <button className="roul__btn" disabled={phase === 'spinning'} onClick={spin}>
          {phase === 'spinning' ? 'Ça tourne…' : `Tourner (${COUT} 🍩)`}
        </button>
      )}

      <Link className="roul__collection-link" to="/collection">📚 Voir ma collection</Link>

      {toast && <div className="roul__toast">{toast}</div>}
    </div>
  )
}
