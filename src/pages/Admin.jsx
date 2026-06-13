import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  adminListUsers,
  adminCreateUser,
  adminSetBalance,
  adminDeleteUser,
  getPendingActus,
  moderateActu,
  createInviteCode,
  listInviteCodes,
  toggleInviteCode,
} from '../lib/modules'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Admin.css'

// --------------- Modération des actus ---------------
function ActuCard({ actu, adminId, onAction }) {
  const [loading, setLoading] = useState(null) // 'publie'|'refuse'

  async function handle(statut) {
    setLoading(statut)
    await moderateActu(adminId, actu.id, statut)
    setLoading(null)
    onAction(actu.id)
  }

  return (
    <article className="actu-card">
      <div className="actu-card__author">
        <FallGuy avatar={actu.auteur?.avatar ?? null} className="actu-card__avatar" />
        <span className="actu-card__pseudo">{actu.auteur?.pseudo ?? '—'}</span>
      </div>
      <div className="actu-card__body">
        <p className="actu-card__titre">{actu.titre}</p>
        <p className="actu-card__contenu">{actu.contenu}</p>
        {actu.image && (
          <img className="actu-card__img" src={actu.image} alt="illustration" />
        )}
      </div>
      <div className="actu-card__actions">
        <button
          className="admin-btn admin-btn--vert"
          onClick={() => handle('publie')}
          disabled={loading !== null}
        >
          {loading === 'publie' ? 'Publication…' : '✅ Valider'}
        </button>
        <button
          className="admin-btn admin-btn--danger"
          onClick={() => handle('refuse')}
          disabled={loading !== null}
        >
          {loading === 'refuse' ? 'Refus…' : '❌ Refuser'}
        </button>
      </div>
    </article>
  )
}

function SectionActus({ adminId }) {
  const [actus, setActus] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    getPendingActus(adminId).then((data) => {
      if (on) { setActus(data ?? []); setLoading(false) }
    })
    return () => { on = false }
  }, [adminId])

  function removeActu(id) {
    setActus((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">📰 Modération des actus</h2>
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && actus.length === 0 && (
        <p className="admin-empty">Aucune actu en attente 🎉</p>
      )}
      {!loading && actus.length > 0 && (
        <div className="actus-list">
          {actus.map((a) => (
            <ActuCard key={a.id} actu={a} adminId={adminId} onAction={removeActu} />
          ))}
        </div>
      )}
    </section>
  )
}

// --------------- Créer un compte ---------------
function SectionCreerCompte({ adminId, onUserCreated }) {
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text }
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!pseudo.trim() || !password.trim()) return
    setLoading(true)
    setMsg(null)
    const res = await adminCreateUser(adminId, pseudo.trim(), password)
    setLoading(false)
    if (res.error) {
      setMsg({ type: 'err', text: res.error })
    } else {
      setMsg({ type: 'ok', text: `Compte « ${pseudo.trim()} » créé avec succès !` })
      setPseudo('')
      setPassword('')
      onUserCreated()
    }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">➕ Créer un compte</h2>
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <input
            className="admin-input"
            type="text"
            placeholder="Pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            autoComplete="off"
          />
          <input
            className="admin-input"
            type="text"
            placeholder="Mot de passe temporaire"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
          />
          <button className="admin-btn admin-btn--primary" type="submit" disabled={loading}>
            {loading ? 'Création…' : '✅ Créer'}
          </button>
        </div>
        {msg && (
          <p className={`admin-msg admin-msg--${msg.type}`}>{msg.text}</p>
        )}
      </form>
    </section>
  )
}

// --------------- Utilisateurs ---------------
function UserRow({ u, adminId, onDelete }) {
  const [donuts, setDonuts] = useState(String(u.donuts ?? 0))
  const [gemmes, setGemmes] = useState(String(u.gemmes ?? 0))
  const [savMsg, setSavMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSavMsg(null)
    const res = await adminSetBalance(adminId, u.id, Number(donuts), Number(gemmes))
    setSaving(false)
    if (res?.error) {
      setSavMsg({ type: 'err', text: 'Erreur lors de la sauvegarde.' })
    } else {
      setSavMsg({ type: 'ok', text: 'Enregistré !' })
      setTimeout(() => setSavMsg(null), 2000)
    }
  }

  async function handleDelete() {
    const ok = window.confirm(`Supprimer le compte « ${u.pseudo} » ? Cette action est irréversible.`)
    if (!ok) return
    setDeleting(true)
    const res = await adminDeleteUser(adminId, u.id)
    setDeleting(false)
    if (res?.status === 'cannot_delete_self') {
      alert('Vous ne pouvez pas supprimer votre propre compte.')
      return
    }
    if (res?.error) {
      alert('Erreur lors de la suppression.')
      return
    }
    onDelete(u.id)
  }

  return (
    <div className="user-row">
      <div className="user-row__info">
        <FallGuy avatar={u.avatar ?? null} className="user-row__avatar" />
        <div className="user-row__meta">
          <span className="user-row__pseudo">{u.pseudo}</span>
          <span className="user-row__num">#{u.numero}</span>
          {u.role === 'admin' && <span className="user-row__badge user-row__badge--admin">🛡️ admin</span>}
          {u.role === 'superadmin' && <span className="user-row__badge user-row__badge--superadmin">⭐ superadmin</span>}
        </div>
      </div>
      <div className="user-row__balance">
        <label className="user-row__label">
          🍩
          <input
            className="admin-input admin-input--sm"
            type="number"
            min="0"
            value={donuts}
            onChange={(e) => setDonuts(e.target.value)}
          />
        </label>
        <label className="user-row__label">
          💎
          <input
            className="admin-input admin-input--sm"
            type="number"
            min="0"
            value={gemmes}
            onChange={(e) => setGemmes(e.target.value)}
          />
        </label>
        <button
          className="admin-btn admin-btn--primary admin-btn--sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '…' : '💾 Enregistrer'}
        </button>
        {savMsg && (
          <span className={`admin-inline-msg admin-inline-msg--${savMsg.type}`}>{savMsg.text}</span>
        )}
      </div>
      <button
        className="admin-btn admin-btn--danger admin-btn--sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? '…' : '🗑️ Supprimer'}
      </button>
    </div>
  )
}

function SectionUtilisateurs({ adminId, refreshTrigger }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let on = true
    setLoading(true)
    setError(null)
    adminListUsers(adminId).then((data) => {
      if (!on) return
      if (!data || data.error) {
        setError('Impossible de charger les utilisateurs.')
      } else {
        setUsers(data)
      }
      setLoading(false)
    })
    return () => { on = false }
  }, [adminId, refreshTrigger])

  function removeUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">👥 Utilisateurs ({loading ? '…' : users.length})</h2>
      {loading && <p className="admin-loading">Chargement…</p>}
      {error && <p className="admin-msg admin-msg--err">{error}</p>}
      {!loading && !error && users.length === 0 && (
        <p className="admin-empty">Aucun utilisateur trouvé.</p>
      )}
      {!loading && !error && users.length > 0 && (
        <div className="users-list">
          {users.map((u) => (
            <UserRow key={u.id} u={u} adminId={adminId} onDelete={removeUser} />
          ))}
        </div>
      )}
    </section>
  )
}

// --------------- Codes d'invitation ---------------
function SectionCodes({ adminId }) {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [newCode, setNewCode] = useState(null) // code généré affiché
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState(null) // { type: 'ok'|'err', text }
  const [togglingId, setTogglingId] = useState(null)

  function loadCodes() {
    setLoading(true)
    setError(null)
    listInviteCodes(adminId).then((data) => {
      if (!data || data.error) {
        setError('Impossible de charger les codes.')
      } else {
        setCodes(data)
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    loadCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId])

  async function handleGenerate() {
    setGenerating(true)
    setGenMsg(null)
    setNewCode(null)
    const res = await createInviteCode(adminId, codeInput.trim())
    setGenerating(false)
    if (res.error) {
      setGenMsg({ type: 'err', text: res.error })
    } else {
      setNewCode(res.code)
      setCodeInput('')
      setGenMsg({ type: 'ok', text: 'Code créé !' })
      loadCodes()
    }
  }

  async function handleToggle(id, actif) {
    setTogglingId(id)
    await toggleInviteCode(adminId, id, !actif)
    setTogglingId(null)
    loadCodes()
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">🎟️ Codes d'invitation</h2>

      <div className="codes-generate">
        <input
          className="admin-input"
          type="text"
          placeholder="Code personnalisé (optionnel)"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          autoComplete="off"
        />
        <button
          className="admin-btn admin-btn--primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Génération…' : '🎲 Générer un code'}
        </button>
      </div>

      {genMsg && (
        <p className={`admin-msg admin-msg--${genMsg.type}`}>{genMsg.text}</p>
      )}
      {newCode && (
        <div className="codes-new">
          Nouveau code : <span className="codes-new__value">{newCode}</span>
        </div>
      )}

      {loading && <p className="admin-loading">Chargement…</p>}
      {error && <p className="admin-msg admin-msg--err">{error}</p>}
      {!loading && !error && codes.length === 0 && (
        <p className="admin-empty">Aucun code d'invitation pour l'instant.</p>
      )}
      {!loading && !error && codes.length > 0 && (
        <div className="codes-table-wrap">
          <table className="codes-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Utilisations</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className={c.actif ? '' : 'codes-table__row--inactive'}>
                  <td>
                    <span className="codes-table__code">{c.code}</span>
                  </td>
                  <td className="codes-table__uses">{c.nb_utilisations}</td>
                  <td>
                    <span className={`codes-table__status codes-table__status--${c.actif ? 'actif' : 'inactif'}`}>
                      {c.actif ? '✅ Actif' : '⛔ Inactif'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-btn admin-btn--sm ${c.actif ? 'admin-btn--danger' : 'admin-btn--vert'}`}
                      onClick={() => handleToggle(c.id, c.actif)}
                      disabled={togglingId === c.id}
                    >
                      {togglingId === c.id ? '…' : c.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// --------------- Page principale ---------------
export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [refreshUsers, setRefreshUsers] = useState(0)

  const isSuperAdmin = user?.role === 'superadmin'

  function handleUserCreated() {
    setRefreshUsers((n) => n + 1)
  }

  return (
    <div className="admin">
      <Backdrop />

      <header className="admin-topbar">
        <button className="admin-back" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
        <h1 className="admin-title">Panel Admin 🛡️</h1>
        <span className={`admin-role-badge admin-role-badge--${user?.role}`}>
          {user?.role}
        </span>
      </header>

      <SectionActus adminId={user.id} />

      {isSuperAdmin && (
        <>
          <SectionCreerCompte adminId={user.id} onUserCreated={handleUserCreated} />
          <SectionUtilisateurs adminId={user.id} refreshTrigger={refreshUsers} />
          <SectionCodes adminId={user.id} />
        </>
      )}
    </div>
  )
}
