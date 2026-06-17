import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEpisode } from '../data/episodes'
import { playSpeech, VOICES } from '../lib/sounds'
import FallGuy from '../components/FallGuy'
import './EpisodePlayer.css'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

// Tableau vide partagé (référence stable pour les hooks).
const EMPTY = []

// Caractères silencieux (espaces & ponctuation) : pas de son de parole.
const SILENT = /[\s.,!?…:;'"()«»\-—]/

const START_MS = 320 // petit délai avant le premier caractère d'une bulle
const NEXT_MS = 750  // pause avant la bulle suivante de la même scène

// Ponctuation qui déclenche une vraie pause de parole (virgules, points…).
const PAUSE = /[.,!?…;:]/
// Nombre aléatoire dans [min, max] (frappe & rythme vocal irréguliers).
const rand = (min, max) => min + Math.random() * (max - min)

// Hauteur de voix d'un personnage selon qu'il est le héros ou sa couleur.
function voiceFor(speaker) {
  if (!speaker) return VOICES.default
  if (speaker.hero) return VOICES.hero
  const color = speaker.avatar?.color
  return VOICES[color] ?? VOICES.default
}

// Extrait d'une transition les champs d'état à appliquer.
function morphPatch(t) {
  const p = {}
  if ('expression' in t) p.expression = t.expression
  if ('eyesClosed' in t) p.eyesClosed = t.eyesClosed
  if ('anim' in t) p.anim = t.anim
  return p
}

// Décor de la scène (dessiné en CSS/SVG, derrière les bonhommes).
function Decor({ scene }) {
  const { decor, lavaAdvanced } = scene

  if (decor === 'lava' || decor === 'lava-defeat') {
    const defeat = decor === 'lava-defeat'
    const N = 5
    const cells = []
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const ring = Math.min(r, c, N - 1 - r, N - 1 - c)
        const lava = defeat || ring === 0 || (lavaAdvanced && ring <= 1)
        cells.push(
          <span key={`${r}-${c}`} className={`ep-lava__cell ${lava ? 'is-lava' : 'is-safe'}`} />,
        )
      }
    }
    return (
      <div className={`ep-decor ep-decor--lava ${defeat ? 'ep-decor--defeat' : ''}`}>
        <div className="ep-lava__grid">{cells}</div>
        {defeat && <div className="ep-lava__defeat-text">PERDU 💀</div>}
      </div>
    )
  }

  if (decor === 'avatar') {
    return (
      <div className="ep-decor ep-decor--avatar">
        <div className="ep-avatarui">
          <div className="ep-avatarui__bar">🎨 Avatar</div>
          <div className="ep-avatarui__swatches">
            {['#ff4d8d', '#7c3aff', '#00bfff', '#3dd68c', '#ff8c42', '#fbbf24'].map((c) => (
              <span key={c} className="ep-avatarui__swatch" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <div className="ep-decor ep-decor--neutral" />
}

export default function EpisodePlayer() {
  const { episodeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const episode = useMemo(() => getEpisode(episodeId), [episodeId])

  const [sceneIndex, setSceneIndex] = useState(0)
  const [cb, setCb] = useState(0)          // index de la bulle en cours de frappe
  const [typed, setTyped] = useState(0)    // nb de lettres déjà tapées dans `cb`
  const [instant, setInstant] = useState(false) // true = tout le texte affiché d'un coup
  const [ended, setEnded] = useState(false)
  const [fading, setFading] = useState(false)
  const [castState, setCastState] = useState({}) // état dynamique par perso (expression…)
  const [blink, setBlink] = useState(false)

  const timersRef = useRef([])
  const typeTimer = useRef(null)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    clearTimeout(typeTimer.current)
  }, [])

  // Applique une transition (changement d'expression/yeux/anim) à un perso.
  const applyMorph = useCallback((c) => {
    setCastState((s) => ({ ...s, [c.id]: { ...s[c.id], ...morphPatch(c.transitionTo) } }))
  }, [])

  const scenes = episode ? episode.scenes : EMPTY
  const scene = scenes[sceneIndex]

  const bubbles = scene ? scene.bubbles : EMPTY
  const lastIdx = bubbles.length - 1
  const curLen = bubbles[cb]?.text.length ?? 0
  const sceneComplete = instant || (cb >= lastIdx && typed >= curLen)

  // --- Mise en place d'une scène : reset des bulles + état des persos + clignements
  useEffect(() => {
    if (ended || !scene) return
    clearTimers()
    /* eslint-disable react-hooks/set-state-in-effect */
    setCb(0)
    setTyped(0)
    setInstant(false)
    const init = {}
    scene.cast.forEach((c) => {
      init[c.id] = { expression: c.expression, eyesClosed: c.eyesClosed, anim: c.anim }
    })
    setCastState(init)
    setBlink(false)
    /* eslint-enable react-hooks/set-state-in-effect */

    // Clignement lent pour les persos marqués `blink`.
    let blinkId
    if (scene.cast.some((c) => c.blink)) {
      blinkId = setInterval(() => {
        setBlink(true)
        const t = setTimeout(() => setBlink(false), 150)
        timersRef.current.push(t)
      }, 2600)
    }
    return () => { clearInterval(blinkId); clearTimers() }
  }, [sceneIndex, ended, scene, clearTimers])

  // --- Machine à écrire : tape la bulle `cb` lettre par lettre, avec son de parole
  useEffect(() => {
    if (ended || !scene || instant) return
    const sbubbles = scene.bubbles
    const b = sbubbles[cb]
    if (!b) return
    const speaker = scene.cast.find((c) => c.id === b.from)
    const freq = voiceFor(speaker)

    const text = b.text
    const len = text.length
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTyped(0)
    let i = 0
    let acc = 999       // ms écoulées depuis le dernier « mmh » (force le 1er son)
    let nextGap = rand(80, 180) // rythme irrégulier entre deux sons
    const tick = () => {
      i += 1
      setTyped(i)
      // Au tout premier caractère : transitions "quand il parle".
      if (i === 1) {
        scene.cast.forEach((c) => {
          if (c.transitionTo?.when === 'speak' && b.from === c.id) applyMorph(c)
        })
      }
      const ch = text[i - 1]
      const isPause = PAUSE.test(ch)

      // Délai avant la lettre suivante : frappe légèrement irrégulière,
      // + vraie pause silencieuse aux virgules / points.
      let delay = rand(38, 56)
      if (isPause) delay += rand(150, 250)

      if (ch && !SILENT.test(ch)) {
        // Son joué à un rythme irrégulier (≈ 80–180 ms entre deux notes),
        // avec la courbe d'intonation selon la position dans la phrase.
        acc += delay
        if (acc >= nextGap) {
          playSpeech(freq, (i - 1) / Math.max(1, len - 1))
          acc = 0
          nextGap = rand(80, 180)
        }
      } else if (isPause) {
        // À une ponctuation : on coupe la parole et on repart proprement après.
        acc = 0
        nextGap = rand(80, 180)
      }

      if (i < len) {
        typeTimer.current = setTimeout(tick, delay)
      } else {
        // Bulle terminée : transitions "après la bulle" puis bulle suivante.
        scene.cast.forEach((c) => {
          if (c.transitionTo?.when === 'after' && b.from === c.id) {
            const tid = setTimeout(() => applyMorph(c), c.transitionTo.delay || 0)
            timersRef.current.push(tid)
          }
        })
        if (cb < sbubbles.length - 1) {
          typeTimer.current = setTimeout(() => setCb((n) => n + 1), NEXT_MS)
        }
      }
    }
    typeTimer.current = setTimeout(tick, START_MS)
    return () => clearTimeout(typeTimer.current)
  }, [sceneIndex, cb, ended, scene, instant, applyMorph])

  const advance = useCallback(() => {
    if (fading || !scene) return
    // 1) Texte encore en cours → tout afficher d'un coup, couper le son.
    if (!sceneComplete) {
      clearTimers()
      setInstant(true)
      // Applique immédiatement toutes les transitions pour figer l'état final.
      scene.cast.forEach((c) => { if (c.transitionTo) applyMorph(c) })
      return
    }
    // 2) Scène terminée → scène suivante (fondu) ou écran de fin.
    if (sceneIndex < scenes.length - 1) {
      clearTimers()
      setFading(true)
      const id = setTimeout(() => {
        setSceneIndex((i) => i + 1)
        setCb(0)
        setTyped(0)
        setInstant(false)
        setFading(false)
      }, 340)
      timersRef.current.push(id)
    } else {
      setEnded(true)
    }
  }, [fading, scene, sceneComplete, sceneIndex, scenes.length, clearTimers, applyMorph])

  // Clavier : flèche droite / espace / entrée pour avancer.
  useEffect(() => {
    const onKey = (e) => {
      if (ended) return
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, ended])

  const replay = () => {
    clearTimers()
    setEnded(false)
    setFading(false)
    setSceneIndex(0)
    setCb(0)
    setTyped(0)
    setInstant(false)
  }

  if (!episode) {
    return (
      <div className="ep ep--missing">
        <p>Épisode introuvable 😕</p>
        <button className="ep-btn" onClick={() => navigate('/serie')}>Retour aux épisodes</button>
      </div>
    )
  }

  const visibleCount = instant ? bubbles.length : Math.min(cb + 1, bubbles.length)

  return (
    <div className="ep">
      <button className="ep__close" onClick={() => navigate('/serie')} aria-label="Quitter">✕</button>

      {!ended && (
        <>
          <div className={`ep__scene ${fading ? 'is-fading' : ''}`}>
            <Decor scene={scene} />

            {/* Effets décoratifs (flammes, etc.) */}
            {scene.effects?.includes('fire') && (
              <div className="ep-fire" aria-hidden="true">
                <span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span><span>🔥</span>
              </div>
            )}

            {/* Bonhommes */}
            <div className="ep__cast">
              {scene.cast.map((ch) => {
                const st = castState[ch.id] || {}
                const avatar = ch.hero ? user.avatar : ch.avatar
                const role = ch.hero ? user.role : null
                const eyesClosed = (st.eyesClosed ?? ch.eyesClosed) || (ch.blink && blink)
                return (
                  <div
                    key={ch.id}
                    className={`ep-char ${ch.flip ? 'ep-char--flip' : ''} ${ch.burnt ? 'ep-char--burnt' : ''}`}
                    style={{ left: `${ch.x}%`, '--scale': ch.scale || 1 }}
                  >
                    <FallGuy
                      avatar={avatar}
                      anim={st.anim ?? ch.anim}
                      role={role}
                      eyesClosed={eyesClosed}
                      expression={st.expression ?? ch.expression}
                    />
                  </div>
                )
              })}
            </div>

            {/* Bulles de dialogue (machine à écrire) */}
            <div className="ep__bubbles">
              {bubbles.slice(0, visibleCount).map((b, i) => {
                const speaker = scene.cast.find((c) => c.id === b.from)
                const x = clamp(speaker?.x ?? 50, 20, 80)
                const full = instant || i < cb
                const text = full ? b.text : b.text.slice(0, typed)
                const typing = !full
                return (
                  <div
                    key={i}
                    className="ep-bubble"
                    style={{ left: `${x}%`, '--tail': `${x < 50 ? 30 : 70}%` }}
                  >
                    {text}
                    {typing && <span className="ep-caret" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Barre du bas : numéro de scène + flèche */}
          <div className="ep__bar">
            <span className="ep__count">{sceneIndex + 1} / {scenes.length}</span>
            <button className="ep__next" onClick={advance} aria-label="Scène suivante">→</button>
          </div>
        </>
      )}

      {ended && (
        <div className="ep__end">
          <div className="ep__end-title">FIN 🎉</div>
          <div className="ep__end-sub">{episode.title}</div>
          <div className="ep__end-actions">
            <button className="ep-btn ep-btn--primary" onClick={replay}>🔁 Revoir</button>
            <button className="ep-btn" onClick={() => navigate('/serie')}>📺 Retour aux épisodes</button>
          </div>
        </div>
      )}
    </div>
  )
}
