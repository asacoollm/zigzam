import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyBoites, openBoite } from '../lib/modules'
import { getItem, normalizeAvatar } from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './BoiteMystere.css'

// Habillage de chaque niveau de rareté.
const NIVEAUX = {
  normal:        { label: 'Normal',          color: '#3dd68c', epic: false },
  rare:          { label: 'Rare',            color: '#00bfff', epic: false },
  super_rare:    { label: 'Super Rare',      color: '#a855f7', epic: false },
  incroyable:    { label: 'Incroyable',      color: '#ff8c42', epic: true },
  impossible:    { label: 'IMPOSSIBLE !!!',  color: '#ef4444', epic: true },
  personnalisee: { label: 'Cadeau spécial',  color: '#7c3aff', epic: false },
}
const niveauInfo = (n) => NIVEAUX[n] || NIVEAUX.personnalisee

// Petite fanfare jouée en Web Audio pour les niveaux spectaculaires.
function playFanfare(epic) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    // Gamme ascendante triomphale (do-mi-sol-do), plus longue pour l'épique.
    const notes = epic ? [523, 659, 784, 1047, 1319] : [523, 659, 784]
    const step = 0.14
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + i * step
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + step * 2.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + step * 2.4)
    })
    // Ferme le contexte une fois la fanfare terminée.
    window.setTimeout(() => ctx.close().catch(() => {}), (notes.length * step + 1) * 1000)
  } catch {
    /* silence : l'audio est un bonus */
  }
}

export default function BoiteMystere() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [boites, setBoites] = useState(null) // null = chargement
  const [phase, setPhase] = useState('idle')  // 'idle' | 'opening' | 'revealed'
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(0)          // étapes de révélation (1=niveau, 2=🍩, 3=💎, 4=skin)
  const [busy, setBusy] = useState(false)
  const timers = useRef([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const load = useCallback(() => {
    getMyBoites(user.id).then((b) => setBoites(Array.isArray(b) ? b : []))
  }, [user.id])

  useEffect(() => {
    load()
    return clearTimers
  }, [load, clearTimers])

  const current = boites && boites.length > 0 ? boites[0] : null
  const info = current ? niveauInfo(current.niveau) : null

  const handleOpen = async () => {
    if (!current || busy) return
    setBusy(true)
    setPhase('opening')
    const res = await openBoite(user.id, current.id)
    if (res.error) {
      setBusy(false)
      setPhase('idle')
      load()
      return
    }
    const rInfo = niveauInfo(res.niveau)
    // Met à jour le solde + l'avatar (skin équipé) dans la session.
    const patch = {}
    if (res.soldes) { patch.donuts = res.soldes.donuts; patch.gemmes = res.soldes.gemmes }
    if (res.avatar) patch.avatar = res.avatar
    if (Object.keys(patch).length) updateUser(patch)

    // Animation d'ouverture, puis révélation progressive du contenu.
    const tOpen = setTimeout(() => {
      setResult(res)
      setPhase('revealed')
      playFanfare(rInfo.epic)
      setStep(1)
      timers.current.push(setTimeout(() => setStep(2), 700))   // donuts
      timers.current.push(setTimeout(() => setStep(3), 1400))  // gemmes
      timers.current.push(setTimeout(() => setStep(4), 2100))  // skin
      setBusy(false)
    }, 1300)
    timers.current.push(tOpen)
  }

  const handleContinue = () => {
    clearTimers()
    setResult(null)
    setStep(0)
    setPhase('idle')
    // Retire la boîte ouverte et recharge la liste.
    setBoites((prev) => (prev ? prev.slice(1) : prev))
    load()
  }

  // --- Rendus ---
  if (boites === null) {
    return (
      <div className="boitep">
        <Backdrop />
        <p className="boitep__loading">Chargement…</p>
      </div>
    )
  }

  if (!current && phase !== 'revealed') {
    return (
      <div className="boitep">
        <Backdrop />
        <div className="boitep__brand"><ZigzamLogo size="sm" /></div>
        <div className="boitep__empty">
          <div className="boitep__empty-emoji">📭</div>
          <p>Tu n'as aucune boîte mystère à ouvrir pour l'instant !</p>
          <button className="boitep__btn" onClick={() => navigate('/dashboard')}>⬅️ Retour au dashboard</button>
        </div>
      </div>
    )
  }

  const skinItem = result?.skin ? getItem(result.skin.category, result.skin.item) : null

  return (
    <div className={`boitep ${info?.epic && phase !== 'revealed' ? 'boitep--epic' : ''}`}>
      <Backdrop />
      <button className="boitep__close" onClick={() => navigate('/dashboard')} aria-label="Quitter">✕</button>

      {phase !== 'revealed' && current && (
        <div className="boitep__stage" style={{ '--rarity': info.color }}>
          {boites.length > 1 && (
            <p className="boitep__count">🎁 Tu as {boites.length} boîtes à ouvrir !</p>
          )}
          <p className="boitep__hint">Une boîte mystère t'attend…</p>

          <div className={`mbox ${phase === 'opening' ? 'mbox--opening' : 'mbox--idle'}`}>
            <div className="mbox__glow" />
            <div className="mbox__lid">🎀</div>
            <div className="mbox__body">🎁</div>
            {phase === 'opening' && (
              <div className="mbox__burst" aria-hidden="true">
                <span>⚡</span><span>✨</span><span>⚡</span><span>✨</span><span>⚡</span>
              </div>
            )}
          </div>

          {phase === 'idle' && (
            <button className="boitep__open" onClick={handleOpen} disabled={busy}>
              Ouvrir 🎁
            </button>
          )}
          {phase === 'opening' && <p className="boitep__opening-text">Ouverture…</p>}
        </div>
      )}

      {phase === 'revealed' && result && (
        <div
          className={`boitep__reveal ${niveauInfo(result.niveau).epic ? 'boitep__reveal--epic' : ''}`}
          style={{ '--rarity': niveauInfo(result.niveau).color }}
        >
          <div className="reveal__confetti" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className={`reveal__bit reveal__bit--${i % 6}`} />
            ))}
          </div>

          {step >= 1 && (
            <div className="reveal__rarity">✨ {niveauInfo(result.niveau).label} ✨</div>
          )}

          <div className="reveal__loot">
            {step >= 2 && result.donuts > 0 && (
              <div className="reveal__item reveal__item--pop">
                <span className="reveal__icon">🍩</span>
                <span className="reveal__val">+{result.donuts}</span>
              </div>
            )}
            {step >= 3 && result.gemmes > 0 && (
              <div className="reveal__item reveal__item--pop">
                <span className="reveal__icon">💎</span>
                <span className="reveal__val">+{result.gemmes}</span>
              </div>
            )}
          </div>

          {step >= 4 && result.skin && (
            <div className="reveal__skin reveal__item--pop">
              <span className="reveal__skin-tag">🎁 Nouveau skin équipé !</span>
              <FallGuy
                className="reveal__skin-guy"
                avatar={normalizeAvatar(result.avatar)}
                anim="pose"
                expression="moque"
                role={user.role}
              />
              <span className="reveal__skin-label">{skinItem?.label ?? result.skin.item}</span>
            </div>
          )}

          {step >= 4 && (
            <button className="boitep__btn boitep__continue" onClick={handleContinue}>
              {boites.length > 1 ? 'Boîte suivante 🎁' : 'Génial ! Continuer ✨'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
