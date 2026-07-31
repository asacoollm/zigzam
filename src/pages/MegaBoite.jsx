import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyMegaBoites, openMegaBoite } from '../lib/modules'
import { getItem, normalizeAvatar } from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import MegaBoxArt from '../components/MegaBoxArt'
import ZigzamLogo from '../components/ZigzamLogo'
import './MegaBoite.css'

// Habillage de chaque niveau de rareté (mêmes couleurs que les boîtes mystères classiques).
const NIVEAUX = {
  normal:     { label: 'Normal',          color: '#3dd68c', epic: false },
  rare:       { label: 'Rare',            color: '#00bfff', epic: false },
  super_rare: { label: 'Super Rare',      color: '#a855f7', epic: false },
  incroyable: { label: 'Incroyable',      color: '#ff8c42', epic: true },
  impossible: { label: 'IMPOSSIBLE !!!',  color: '#ef4444', epic: true },
}
const niveauInfo = (n) => NIVEAUX[n] || NIVEAUX.normal

// Fanfare Web Audio, plus longue/riche pour les méga boîtes.
function playFanfare(epic) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const notes = epic
      ? [523, 659, 784, 1047, 1319, 1568]
      : [523, 659, 784, 1047]
    const step = 0.13
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + i * step
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.24, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + step * 2.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + step * 2.4)
    })
    window.setTimeout(() => ctx.close().catch(() => {}), (notes.length * step + 1) * 1000)
  } catch {
    /* silence : l'audio est un bonus */
  }
}

// Petit carillon pour l'évolution (montée chromatique courte, façon "level up").
function playEvoChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const notes = [660, 880, 1175]
    const step = 0.1
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      const t0 = ctx.currentTime + i * step
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + step * 3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + step * 3.2)
    })
    window.setTimeout(() => ctx.close().catch(() => {}), (notes.length * step + 1.5) * 1000)
  } catch {
    /* silence : l'audio est un bonus */
  }
}

export default function MegaBoite() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [boites, setBoites] = useState(null) // null = chargement
  const [phase, setPhase] = useState('idle')  // 'idle' | 'opening' | 'revealed'
  const [result, setResult] = useState(null)
  const [step, setStep] = useState(0)          // 1=niveau, 2=🍩, 3=💎, 4=skin/doublon
  const [busy, setBusy] = useState(false)

  // Évolution de boîte (avant ouverture) : intro rejouée une fois par boîte.
  const [evoPhase, setEvoPhase] = useState(null) // null | 'shake' | 'flash'
  const [evoMessage, setEvoMessage] = useState(null)
  const [displayNiveau, setDisplayNiveau] = useState(null)
  const evoShownRef = useRef(new Set())

  const timers = useRef([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const load = useCallback(() => {
    getMyMegaBoites(user.id).then((b) => setBoites(Array.isArray(b) ? b : []))
  }, [user.id])

  useEffect(() => {
    load()
    return clearTimers
  }, [load, clearTimers])

  const current = boites && boites.length > 0 ? boites[0] : null

  // Déclenche l'animation d'évolution (une fois par boîte) avant de proposer l'ouverture.
  useEffect(() => {
    if (!current) return
    if (evoShownRef.current.has(current.id)) {
      setDisplayNiveau(current.niveau)
      setEvoPhase(null)
      return
    }
    if (current.evolved && current.niveau_achete && current.niveau_achete !== current.niveau) {
      setDisplayNiveau(current.niveau_achete)
      setEvoPhase('shake')
      const t1 = setTimeout(() => {
        setEvoPhase('flash')
        playEvoChime()
      }, 1300)
      const t2 = setTimeout(() => {
        setEvoPhase(null)
        setDisplayNiveau(current.niveau)
        setEvoMessage(
          `✨ Ta boîte a évolué ! ${niveauInfo(current.niveau_achete).label} → ${niveauInfo(current.niveau).label} !`,
        )
        evoShownRef.current.add(current.id)
        const t3 = setTimeout(() => setEvoMessage(null), 4200)
        timers.current.push(t3)
      }, 1700)
      timers.current.push(t1, t2)
    } else {
      setDisplayNiveau(current.niveau)
      setEvoPhase(null)
      evoShownRef.current.add(current.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  // `displayNiveau` n'est posé qu'après le 1er effet (une fois `current`
  // connu) : tant qu'il est encore null, on retombe sur le niveau réel de
  // la boîte pour ne jamais rendre `info` null pendant que `current` existe
  // (sinon crash de rendu → page blanche, `info.label` etc. sur null).
  const info = niveauInfo(displayNiveau ?? current?.niveau)

  const handleOpen = async () => {
    if (!current || busy || evoPhase) return
    setBusy(true)
    setPhase('opening')
    const res = await openMegaBoite(user.id, current.id)
    if (res.error) {
      setBusy(false)
      setPhase('idle')
      load()
      return
    }
    const rInfo = niveauInfo(res.niveau)
    const patch = {}
    if (res.soldes) { patch.donuts = res.soldes.donuts; patch.gemmes = res.soldes.gemmes; patch.burgers = res.soldes.burgers }
    if (res.avatar) patch.avatar = res.avatar
    if (Object.keys(patch).length) updateUser(patch)

    const tOpen = setTimeout(() => {
      setResult(res)
      setPhase('revealed')
      playFanfare(rInfo.epic)
      setStep(1)
      timers.current.push(setTimeout(() => setStep(2), 700))   // donuts
      timers.current.push(setTimeout(() => setStep(3), 1400))  // gemmes
      timers.current.push(setTimeout(() => setStep(4), 2100))  // skin / doublon
      setBusy(false)
    }, 1500)
    timers.current.push(tOpen)
  }

  const handleContinue = () => {
    clearTimers()
    setResult(null)
    setStep(0)
    setPhase('idle')
    setEvoMessage(null)
    setBoites((prev) => (prev ? prev.slice(1) : prev))
    load()
  }

  if (boites === null) {
    return (
      <div className="megab">
        <Backdrop />
        <p className="megab__loading">Chargement…</p>
      </div>
    )
  }

  if (!current && phase !== 'revealed') {
    return (
      <div className="megab">
        <Backdrop />
        <div className="megab__brand"><ZigzamLogo size="sm" /></div>
        <div className="megab__empty">
          <div className="megab__empty-emoji">📭</div>
          <p>Tu n'as aucune méga boîte à ouvrir pour l'instant !</p>
          <button className="megab__btn" onClick={() => navigate('/shop')}>⬅️ Retour au Shop</button>
        </div>
      </div>
    )
  }

  const skinItem = result?.skin ? getItem(result.skin.category, result.skin.item) : null

  return (
    <div className={`megab ${info?.epic && phase !== 'revealed' ? 'megab--epic' : ''}`}>
      <Backdrop />
      <button className="megab__close" onClick={() => navigate('/shop')} aria-label="Quitter">✕</button>

      {phase !== 'revealed' && current && (
        <div className="megab__stage" style={{ '--rarity': info?.color }}>
          {boites.length > 1 && (
            <p className="megab__count">📦 Tu as {boites.length} méga boîtes à ouvrir !</p>
          )}

          {evoMessage && <p className="megab__evo-banner">{evoMessage}</p>}

          {evoPhase ? (
            <>
              <p className="megab__hint">Quelque chose se passe…</p>
              <div className={`mgbox mgbox--evo mgbox--evo-${evoPhase}`}>
                <div className="mgbox__glow" />
                <MegaBoxArt niveau={displayNiveau} className="mgbox__art" />
                {evoPhase === 'flash' && <div className="mgbox__flash" aria-hidden="true" />}
                <div className="mgbox__burst" aria-hidden="true">
                  <span>⚡</span><span>✨</span><span>💥</span><span>✨</span><span>⚡</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="megab__hint">Une méga boîte {info.label} t'attend…</p>
              <div className={`mgbox ${phase === 'opening' ? 'mgbox--opening' : 'mgbox--idle'}`}>
                <div className="mgbox__glow" />
                <MegaBoxArt niveau={displayNiveau} className="mgbox__art" />
                {phase === 'opening' && (
                  <div className="mgbox__burst" aria-hidden="true">
                    <span>⚡</span><span>✨</span><span>💥</span><span>✨</span><span>⚡</span>
                  </div>
                )}
              </div>

              {phase === 'idle' && (
                <button className="megab__open" onClick={handleOpen} disabled={busy}>
                  Ouvrir 📦
                </button>
              )}
              {phase === 'opening' && <p className="megab__opening-text">Ouverture…</p>}
            </>
          )}
        </div>
      )}

      {phase === 'revealed' && result && (
        <div
          className={`megab__reveal ${niveauInfo(result.niveau).epic ? 'megab__reveal--epic' : ''}`}
          style={{ '--rarity': niveauInfo(result.niveau).color }}
        >
          <div className="mrev__confetti" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className={`mrev__bit mrev__bit--${i % 6}`} />
            ))}
          </div>

          {step >= 1 && (
            <div className="mrev__rarity">✨ Méga boîte {niveauInfo(result.niveau).label} ✨</div>
          )}

          <div className="mrev__loot">
            {step >= 2 && result.donuts > 0 && (
              <div className="mrev__item mrev__item--pop">
                <span className="mrev__icon">🍩</span>
                <span className="mrev__val">+{result.donuts}</span>
              </div>
            )}
            {step >= 3 && result.gemmes > 0 && (
              <div className="mrev__item mrev__item--pop">
                <span className="mrev__icon">💎</span>
                <span className="mrev__val">+{result.gemmes}</span>
              </div>
            )}
          </div>

          {step >= 4 && !result.skin && result.doublon > 0 && (
            <div className="mrev__doublon mrev__item--pop">
              Tu avais déjà cet accessoire ! Tu reçois {result.doublon} 💎 à la place.
            </div>
          )}

          {step >= 4 && result.skin && (
            <div className="mrev__skin mrev__item--pop">
              <span className="mrev__skin-tag">🎁 Nouveau skin équipé !</span>
              <FallGuy
                className="mrev__skin-guy"
                avatar={normalizeAvatar(result.avatar)}
                anim="pose"
                expression="moque"
                role={user.role}
              />
              <span className="mrev__skin-label">{skinItem?.label ?? result.skin.item}</span>
            </div>
          )}

          {step >= 4 && (
            <button className="megab__btn megab__continue" onClick={handleContinue}>
              {boites.length > 1 ? 'Boîte suivante 📦' : 'Génial ! Continuer ✨'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
