import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEpisode } from '../data/episodes'
import { playBloop } from '../lib/bloop'
import FallGuy from '../components/FallGuy'
import './EpisodePlayer.css'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

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
  const episode = getEpisode(episodeId)

  const [sceneIndex, setSceneIndex] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [ended, setEnded] = useState(false)
  const [fading, setFading] = useState(false)
  const timersRef = useRef([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const scenes = episode?.scenes ?? []
  const scene = scenes[sceneIndex]

  // Apparition automatique des bulles, une par une, avec un « bloop » mignon.
  useEffect(() => {
    if (ended || !scene) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealed(0)
    clearTimers()
    scene.bubbles.forEach((_, i) => {
      const id = setTimeout(() => {
        setRevealed((r) => Math.max(r, i + 1))
        playBloop()
      }, 500 + i * 1400)
      timersRef.current.push(id)
    })
    return clearTimers
  }, [sceneIndex, ended, scene, clearTimers])

  const advance = useCallback(() => {
    if (fading || !scene) return
    // 1) S'il reste des bulles à révéler dans la scène → tout afficher d'un coup.
    if (revealed < scene.bubbles.length) {
      clearTimers()
      setRevealed(scene.bubbles.length)
      playBloop()
      return
    }
    // 2) Sinon, on enchaîne la scène suivante (fondu) ou l'écran de fin.
    if (sceneIndex < scenes.length - 1) {
      setFading(true)
      const id = setTimeout(() => {
        setSceneIndex((i) => i + 1)
        setFading(false)
      }, 340)
      timersRef.current.push(id)
    } else {
      setEnded(true)
    }
  }, [fading, scene, revealed, sceneIndex, scenes.length, clearTimers])

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
    setRevealed(0)
    setSceneIndex(0)
  }

  if (!episode) {
    return (
      <div className="ep ep--missing">
        <p>Épisode introuvable 😕</p>
        <button className="ep-btn" onClick={() => navigate('/serie')}>Retour aux épisodes</button>
      </div>
    )
  }

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
                const avatar = ch.hero ? user.avatar : ch.avatar
                const role = ch.hero ? user.role : null
                return (
                  <div
                    key={ch.id}
                    className={`ep-char ${ch.flip ? 'ep-char--flip' : ''} ${ch.burnt ? 'ep-char--burnt' : ''}`}
                    style={{ left: `${ch.x}%`, '--scale': ch.scale || 1 }}
                  >
                    <FallGuy
                      avatar={avatar}
                      anim={ch.anim}
                      role={role}
                      eyesClosed={ch.eyesClosed}
                    />
                  </div>
                )
              })}
            </div>

            {/* Bulles de dialogue (apparition une par une) */}
            <div className="ep__bubbles">
              {scene.bubbles.slice(0, revealed).map((b, i) => {
                const speaker = scene.cast.find((c) => c.id === b.from)
                const x = clamp(speaker?.x ?? 50, 20, 80)
                return (
                  <div
                    key={i}
                    className="ep-bubble"
                    style={{ left: `${x}%`, '--tail': `${x < 50 ? 30 : 70}%` }}
                  >
                    {b.text}
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
