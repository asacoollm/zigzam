import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getActus,
  createActu,
  viewActu,
  getComments,
  addComment,
} from '../lib/modules'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Actualites.css'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Formulaire de création d'actu ───────────────────────────────────────────
function FormulaireActu({ user, onSuccess, onCancel }) {
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const { updateUser } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titre.trim() || !contenu.trim()) {
      setErreur('Le titre et le contenu sont obligatoires.')
      return
    }
    setLoading(true)
    setErreur('')
    setSucces('')
    const result = await createActu(user.id, titre.trim(), contenu.trim(), image.trim())
    setLoading(false)
    if (result.error) {
      setErreur(result.error)
      return
    }
    if (result.ok) {
      updateUser({ donuts: result.donuts })
      setSucces('Ton actu sera visible après validation par le maître 👍')
      setTimeout(() => {
        onSuccess()
      }, 2200)
    }
  }

  return (
    <div className="news__form-wrap">
      <div className="news__form-card">
        <h2 className="news__form-title">✍️ Écrire une actu</h2>
        <p className="news__form-info">
          Les 2 premières actus sont gratuites, ensuite 10 🍩 donuts par actu.
        </p>
        {succes && <p className="news__msg news__msg--ok">{succes}</p>}
        {erreur && <p className="news__msg news__msg--err">{erreur}</p>}
        {!succes && (
          <form onSubmit={handleSubmit} className="news__form">
            <label className="news__label">Titre</label>
            <input
              className="news__input"
              type="text"
              placeholder="Un super titre pour ton actu !"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={120}
            />
            <label className="news__label">Contenu</label>
            <textarea
              className="news__textarea"
              placeholder="Raconte ce que tu veux partager avec tout le monde 🎉"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              rows={5}
            />
            <label className="news__label">Image (URL, optionnel)</label>
            <input
              className="news__input"
              type="url"
              placeholder="https://exemple.com/image.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            <div className="news__form-actions">
              <button
                type="button"
                className="news__btn news__btn--ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="news__btn"
                disabled={loading}
              >
                {loading ? 'Envoi…' : 'Publier 🚀'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Section commentaires ─────────────────────────────────────────────────────
function SectionCommentaires({ actu, user }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [nouveau, setNouveau] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const viewedRef = useRef(false)

  useEffect(() => {
    let on = true
    setLoading(true)
    getComments(actu.id).then((c) => {
      if (on) {
        setComments(c || [])
        setLoading(false)
      }
    })
    if (!viewedRef.current) {
      viewedRef.current = true
      viewActu(actu.id, user.id)
    }
    return () => { on = false }
  }, [actu.id, user.id])

  async function handleAddComment(e) {
    e.preventDefault()
    if (!nouveau.trim()) return
    setEnvoi(true)
    setErreur('')
    const result = await addComment(actu.id, user.id, nouveau.trim())
    setEnvoi(false)
    if (result.error) {
      setErreur(result.error)
      return
    }
    if (result.comment) {
      setComments((prev) => [...prev, result.comment])
      setNouveau('')
    }
  }

  return (
    <div className="news__comments">
      <h3 className="news__comments-title">💬 Commentaires</h3>
      {loading && <p className="news__loading">Chargement des commentaires…</p>}
      {!loading && comments.length === 0 && (
        <p className="news__empty-comments">Sois le premier à commenter ! 🌟</p>
      )}
      {!loading && comments.map((c) => (
        <div key={c.id} className="news__comment">
          <FallGuy avatar={c.auteur.avatar} className="news__comment-av" />
          <div className="news__comment-body">
            <span className="news__comment-pseudo">{c.auteur.pseudo}</span>
            <span className="news__comment-date">{formatDate(c.date)}</span>
            <p className="news__comment-text">{c.contenu}</p>
          </div>
        </div>
      ))}
      <form onSubmit={handleAddComment} className="news__comment-form">
        {erreur && <p className="news__msg news__msg--err">{erreur}</p>}
        <div className="news__comment-row">
          <input
            className="news__input"
            type="text"
            placeholder="Écris un commentaire sympa 😊"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            maxLength={400}
          />
          <button type="submit" className="news__btn news__btn--sm" disabled={envoi || !nouveau.trim()}>
            {envoi ? '…' : '➤'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Carte actu ───────────────────────────────────────────────────────────────
function CarteActu({ actu, user, onOpen, isOpen }) {
  return (
    <article className={`news__card${isOpen ? ' news__card--open' : ''}`}>
      <div className="news__card-header">
        <FallGuy avatar={actu.auteur.avatar} className="news__av" />
        <div className="news__card-meta">
          <span className="news__pseudo">{actu.auteur.pseudo}</span>
          <span className="news__date">{formatDate(actu.date)}</span>
        </div>
      </div>
      <h2 className="news__card-title">{actu.titre}</h2>
      <p className="news__card-contenu">{actu.contenu}</p>
      {actu.image && (
        <img
          src={actu.image}
          alt={actu.titre}
          className="news__card-img"
          loading="lazy"
        />
      )}
      <div className="news__card-footer">
        <span className="news__counter">👁️ {actu.vues ?? 0}</span>
        <span className="news__counter">💬 {actu.commentaires ?? 0}</span>
        <button
          className="news__btn news__btn--ghost news__btn--sm"
          onClick={() => onOpen(actu)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Fermer ▲' : 'Lire & commenter ▼'}
        </button>
      </div>
      {isOpen && (
        <SectionCommentaires actu={actu} user={user} />
      )}
    </article>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Actualites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [actus, setActus] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [openActuId, setOpenActuId] = useState(null)

  const chargerActus = useCallback(async () => {
    setLoading(true)
    setErreur('')
    const data = await getActus()
    if (!data) {
      setErreur('Impossible de charger les actus. Réessaie !')
    } else {
      setActus(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    chargerActus()
  }, [chargerActus])

  function handleOpen(actu) {
    setOpenActuId((prev) => (prev === actu.id ? null : actu.id))
  }

  function handleFormSuccess() {
    setShowForm(false)
    chargerActus()
  }

  return (
    <div className="news">
      <Backdrop />

      {/* Barre du haut */}
      <header className="news__topbar">
        <button
          className="news__back"
          onClick={() => navigate('/dashboard')}
          aria-label="Retour au tableau de bord"
        >
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
      </header>

      {/* Titre de la section */}
      <div className="news__hero">
        <h1 className="news__titre-page">📰 Les Actualités</h1>
        <p className="news__sous-titre">Lis et partage les news de la communauté Zigzam !</p>
        {!showForm && (
          <button className="news__btn news__btn--write" onClick={() => setShowForm(true)}>
            ✍️ Écrire une actu
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <FormulaireActu
          user={user}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* États de chargement / erreur / vide */}
      {loading && (
        <div className="news__state">
          <p className="news__loading">Chargement des actus… 🌀</p>
        </div>
      )}
      {!loading && erreur && (
        <div className="news__state">
          <p className="news__msg news__msg--err">{erreur}</p>
          <button className="news__btn" onClick={chargerActus}>Réessayer</button>
        </div>
      )}
      {!loading && !erreur && actus.length === 0 && (
        <div className="news__state">
          <p className="news__empty">Aucune actu pour le moment, sois le premier ! 🌟</p>
        </div>
      )}

      {/* Fil d'actus */}
      {!loading && !erreur && actus.length > 0 && (
        <div className="news__feed">
          {actus.map((actu) => (
            <CarteActu
              key={actu.id}
              actu={actu}
              user={user}
              onOpen={handleOpen}
              isOpen={openActuId === actu.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
