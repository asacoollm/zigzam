import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getActus, getMyActus, createActu, viewActu,
  getComments, addComment, deleteComment, uploadActuImage,
} from '../lib/modules'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Actualites.css'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

// Fusionne les actus publiées (tous auteurs) + mes actus non publiées (badge auteur).
function mergeActus(published, mine) {
  const map = new Map()
  published.forEach((a) => map.set(a.id, { ...a, statut: 'publie' }))
  mine.forEach((a) => {
    if (a.statut !== 'publie') map.set(a.id, a)
  })
  return [...map.values()].sort((x, y) => new Date(y.date) - new Date(x.date))
}

// ── Commentaires d'une actu ─────────────────────────────────
function Commentaires({ actuId, user }) {
  const [comments, setComments] = useState(null)
  const [texte, setTexte] = useState('')
  const [busy, setBusy] = useState(false)
  const isAdmin = user.role === 'admin' || user.role === 'superadmin'

  useEffect(() => {
    let on = true
    getComments(actuId).then((c) => on && setComments(c))
    return () => { on = false }
  }, [actuId])

  const envoyer = async (e) => {
    e.preventDefault()
    if (!texte.trim()) return
    setBusy(true)
    const res = await addComment(actuId, user.id, texte.trim())
    setBusy(false)
    if (res.comment) {
      setComments((prev) => [...(prev || []), res.comment])
      setTexte('')
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return
    const res = await deleteComment(user.id, id)
    if (!res.error) setComments((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="news__comments">
      {comments === null ? (
        <p className="news__muted">Chargement…</p>
      ) : comments.length === 0 ? (
        <p className="news__muted">Aucun commentaire. Sois le premier ! 💬</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="news__comment">
            <FallGuy className="news__comment-av" avatar={c.auteur.avatar} />
            <div className="news__comment-body">
              <span className="news__comment-pseudo">{c.auteur.pseudo}</span>
              <span className="news__comment-text">{c.contenu}</span>
            </div>
            {isAdmin && (
              <button className="news__cdel" onClick={() => supprimer(c.id)} aria-label="Supprimer">
                🗑️
              </button>
            )}
          </div>
        ))
      )}

      <form className="news__comment-form" onSubmit={envoyer}>
        <input
          className="news__comment-input"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écris un commentaire…"
          maxLength={300}
        />
        <button className="news__btn news__btn--mini" type="submit" disabled={busy || !texte.trim()}>
          Envoyer
        </button>
      </form>
    </div>
  )
}

// ── Carte d'une actu ────────────────────────────────────────
function CarteActu({ actu, user }) {
  const [open, setOpen] = useState(false)
  const viewed = useRef(false)

  useEffect(() => {
    if (!viewed.current && actu.statut === 'publie') {
      viewed.current = true
      viewActu(actu.id, user.id)
    }
  }, [actu.id, actu.statut, user.id])

  const enAttente = actu.statut === 'en_attente'
  const refuse = actu.statut === 'refuse'

  return (
    <article className="news__card">
      <header className="news__head">
        <FallGuy className="news__av" avatar={actu.auteur.avatar} anim="idle" />
        <div className="news__meta">
          <span className="news__pseudo">{actu.auteur.pseudo}</span>
          <span className="news__date">{formatDate(actu.date)}</span>
        </div>
        {enAttente && <span className="news__pill news__pill--wait">En attente de validation ⏳</span>}
        {refuse && <span className="news__pill news__pill--refuse">Refusée ❌</span>}
      </header>

      <h2 className="news__title">{actu.titre}</h2>
      {actu.contenu && <p className="news__text">{actu.contenu}</p>}
      {actu.image && <img className="news__img" src={actu.image} alt="" loading="lazy" />}

      <footer className="news__foot">
        <span className="news__count">👁️ {actu.vues ?? 0}</span>
        <button className="news__comment-btn" onClick={() => setOpen((v) => !v)}>
          💬 {open ? 'Masquer' : 'Commenter'} ({actu.commentaires ?? 0})
        </button>
      </footer>

      {open && <Commentaires actuId={actu.id} user={user} />}
    </article>
  )
}

// ── Page ────────────────────────────────────────────────────
export default function Actualites() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [actus, setActus] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const fileRef = useRef(null)

  const charger = async () => {
    const [pub, mine] = await Promise.all([getActus(), getMyActus(user.id)])
    setActus(mergeActus(pub, mine))
  }

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flash = (m) => {
    setToast(m)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setToast(''), 3000)
  }

  const choisirPhoto = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }
  const retirerPhoto = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const fermerForm = () => {
    retirerPhoto()
    setTitre('')
    setContenu('')
    setFormError('')
    setShowForm(false)
  }

  const publier = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!titre.trim() || !contenu.trim()) {
      setFormError('Donne un titre et un texte à ton actu 🙂')
      return
    }
    setBusy(true)

    let imageUrl = ''
    if (file) {
      const up = await uploadActuImage(user.id, file)
      if (up.error) {
        setBusy(false)
        setFormError(up.error)
        return
      }
      imageUrl = up.url
    }

    const res = await createActu(user.id, titre.trim(), contenu.trim(), imageUrl)
    setBusy(false)
    if (res.error) {
      setFormError(res.error)
      return
    }
    if (typeof res.donuts === 'number') updateUser({ donuts: res.donuts })
    fermerForm()
    flash('Ton actu sera visible après validation par le maître 👍')
    charger()
  }

  return (
    <div className="news">
      <Backdrop />

      <header className="news__top">
        <button className="news__back" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
        <span className="news__donuts">🍩 {user.donuts}</span>
      </header>

      {!showForm && (
        <button className="news__write" onClick={() => setShowForm(true)}>
          ✏️ Écrire une actu
        </button>
      )}

      {showForm && (
        <form className="news__form" onSubmit={publier}>
          <h2 className="news__form-title">Nouvelle actu ✨</h2>
          <p className="news__hint">Les 2 premières sont gratuites, ensuite 10 🍩 par actu.</p>
          <input
            className="news__input"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Titre de ton actu"
            maxLength={80}
            autoFocus
          />
          <textarea
            className="news__textarea"
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Raconte ce qui se passe…"
            rows={4}
            maxLength={1000}
          />

          {preview ? (
            <div className="news__preview">
              <img src={preview} alt="aperçu" />
              <button type="button" className="news__preview-del" onClick={retirerPhoto}>
                ✕ Retirer
              </button>
            </div>
          ) : (
            <button type="button" className="news__photo-btn" onClick={() => fileRef.current?.click()}>
              📷 Ajouter une photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={choisirPhoto} hidden />

          {formError && <p className="news__error">{formError}</p>}

          <div className="news__form-actions">
            <button type="button" className="news__btn news__btn--ghost" onClick={fermerForm} disabled={busy}>
              Annuler
            </button>
            <button type="submit" className="news__btn" disabled={busy}>
              {busy ? 'Publication…' : 'Publier 🚀'}
            </button>
          </div>
        </form>
      )}

      <main className="news__feed">
        {actus === null ? (
          <p className="news__muted news__muted--center">Chargement du fil…</p>
        ) : actus.length === 0 ? (
          <p className="news__muted news__muted--center">
            Aucune actu pour le moment — sois le premier à écrire ! ✍️
          </p>
        ) : (
          actus.map((a) => <CarteActu key={a.id} actu={a} user={user} />)
        )}
      </main>

      {toast && <div className="news__toast">{toast}</div>}
    </div>
  )
}
