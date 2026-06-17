import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EPISODES, isPublished } from '../data/episodes'
import { getSerieVisibility, createSerieProposition } from '../lib/modules'
import FallGuy from '../components/FallGuy'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import '../components/ReportButton.css'
import './Serie.css'

// Section « Propose un épisode ! » : un bouton qui ouvre une modale chat
// (même style que le signalement de bug) où l'élève décrit son idée.
function ProposeEpisode({ user }) {
  const [open, setOpen] = useState(false)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const openModal = () => {
    setTitre('')
    setDescription('')
    setSent(false)
    setError('')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    if (!titre.trim() || !description.trim()) {
      setError('Donne un titre et décris ton idée 🙂')
      return
    }
    setSending(true)
    const res = await createSerieProposition(user.id, titre.trim(), description.trim())
    setSending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setSent(true)
  }

  return (
    <section className="serie-propose">
      <h2 className="serie-propose__title">💡 Propose un épisode !</h2>
      <p className="serie-propose__sub">
        Tu as une idée géniale pour la série&nbsp;? Raconte-la, Asacool la lira 🎬
      </p>
      <button className="serie-propose__btn" onClick={openModal}>
        ✏️ Proposer une idée
      </button>

      {open && (
        <div className="report-modal" onMouseDown={() => setOpen(false)}>
          <div
            className="report-modal__panel"
            role="dialog"
            aria-label="Proposer un épisode"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="report-modal__head">
              <div className="report-modal__zig">
                <FallGuy className="report-modal__avatar" color="bleu" anim="idle" role="admin" />
                <div className="report-modal__zig-meta">
                  <span className="report-modal__zig-name">Zigzam <span className="report-modal__badge">animateur</span></span>
                  <span className="report-modal__zig-sub">Série Zigzam 🎬</span>
                </div>
              </div>
              <button className="report-modal__close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
            </header>

            {!sent ? (
              <form className="report-modal__body" onSubmit={handleSend}>
                <div className="report-bubble">
                  Tu as une idée d'épisode&nbsp;? Raconte-moi&nbsp;! 🎬
                </div>
                <input
                  className="report-modal__input"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Titre de ton idée"
                  maxLength={120}
                  autoFocus
                />
                <textarea
                  className="report-modal__textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décris ton histoire en quelques lignes…"
                  rows={4}
                />
                {error && <p className="report-modal__error">{error}</p>}
                <button className="report-modal__send" type="submit" disabled={sending}>
                  {sending ? 'Envoi…' : 'Envoyer mon idée 🚀'}
                </button>
              </form>
            ) : (
              <div className="report-modal__body report-modal__body--done">
                <div className="report-bubble">
                  Merci&nbsp;! <strong>Asacool</strong> va lire ton idée 🎬
                </div>
                <button className="report-modal__send" onClick={() => setOpen(false)}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

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

      <ProposeEpisode user={user} />
    </div>
  )
}
