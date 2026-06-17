import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EPISODES, isPublished } from '../data/episodes'
import { getSerieVisibility } from '../lib/modules'
import FallGuy from '../components/FallGuy'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import './Serie.css'

// Mini-décor de la vignette selon le type (rappelle l'ambiance de l'épisode).
function Thumb({ episode, avatar }) {
  return (
    <div className={`serie-thumb serie-thumb--${episode.thumbnailDecor || 'neutral'}`}>
      <FallGuy className="serie-thumb__guy" avatar={avatar} anim="idle" />
    </div>
  )
}

export default function Serie() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSuperadmin = user.role === 'superadmin'
  const [overrides, setOverrides] = useState({})

  useEffect(() => {
    let on = true
    getSerieVisibility().then((o) => on && setOverrides(o))
    return () => { on = false }
  }, [])

  // Utilisateurs normaux : seulement les épisodes publiés.
  // Superadmin : tout, avec un badge « Brouillon » sur les non publiés.
  const episodes = EPISODES.filter((ep) => isSuperadmin || isPublished(ep, overrides))

  return (
    <div className="serie">
      <Backdrop />

      <div className="serie__brand">
        <ZigzamLogo size="sm" />
      </div>

      <header className="serie__top">
        <button className="serie__back" onClick={() => navigate('/dashboard')}>⬅️ Retour</button>
        <h1 className="serie__title">🎬 Série Zigzam</h1>
        <span className="serie__spacer" />
      </header>

      <p className="serie__intro">
        Une BD animée où <strong>{user.pseudo}</strong> est la star ! Choisis un épisode 🍿
      </p>

      <main className="serie__list">
        {episodes.length === 0 && (
          <p className="serie__empty">Aucun épisode disponible pour l'instant. Reviens bientôt ! 🎬</p>
        )}
        {episodes.map((ep) => {
          const brouillon = !isPublished(ep, overrides)
          return (
            <button
              key={ep.id}
              className="serie-card"
              style={{ '--accent': ep.accent || 'var(--violet)' }}
              onClick={() => navigate(`/serie/${ep.id}`)}
            >
              <Thumb episode={ep} avatar={user.avatar} />
              <div className="serie-card__body">
                <span className="serie-card__num">
                  Épisode {ep.number}
                  {brouillon && <span className="serie-card__draft">🔒 Brouillon</span>}
                </span>
                <span className="serie-card__name">{ep.title}</span>
                {ep.synopsis && <span className="serie-card__synopsis">{ep.synopsis}</span>}
                <span className="serie-card__meta">
                  <span className="serie-card__dur">⏱️ {ep.duration}</span>
                  <span className="serie-card__play">▶ Regarder</span>
                </span>
              </div>
            </button>
          )
        })}
      </main>
    </div>
  )
}
