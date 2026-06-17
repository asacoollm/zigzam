import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EPISODES } from '../data/episodes'
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
        {EPISODES.map((ep) => (
          <button
            key={ep.id}
            className="serie-card"
            style={{ '--accent': ep.accent || 'var(--violet)' }}
            onClick={() => navigate(`/serie/${ep.id}`)}
          >
            <Thumb episode={ep} avatar={user.avatar} />
            <div className="serie-card__body">
              <span className="serie-card__num">Épisode {ep.number}</span>
              <span className="serie-card__name">{ep.title}</span>
              {ep.synopsis && <span className="serie-card__synopsis">{ep.synopsis}</span>}
              <span className="serie-card__meta">
                <span className="serie-card__dur">⏱️ {ep.duration}</span>
                <span className="serie-card__play">▶ Regarder</span>
              </span>
            </div>
          </button>
        ))}
      </main>
    </div>
  )
}
