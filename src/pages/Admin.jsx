import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  adminListUsers,
  adminCreateUser,
  adminSetBalance,
  adminDeleteUser,
  getAdminActus,
  moderateActu,
  setUserRole,
  createInviteCode,
  listInviteCodes,
  toggleInviteCode,
  adminListBugReports,
  adminUpdateBugReport,
  getSerieVisibility,
  adminSetSeriePublie,
} from '../lib/modules'
import { EPISODES, isPublished } from '../data/episodes'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Admin.css'

// --------------- Modération des actus (3 onglets) ---------------
const ONGLETS_ACTUS = [
  { id: 'en_attente', label: 'En attente ⏳' },
  { id: 'publie',     label: 'Publiées ✅'   },
  { id: 'refuse',     label: 'Refusées ❌'   },
]

function ActuCard({ actu, onglet, adminId, onAction }) {
  const [loading, setLoading] = useState(null) // statut en cours

  async function handle(statut) {
    setLoading(statut)
    await moderateActu(adminId, actu.id, statut)
    setLoading(null)
    onAction(actu.id)
  }

  return (
    <article className="actu-card">
      <div className="actu-card__author">
        <FallGuy avatar={actu.auteur?.avatar ?? null} className="actu-card__avatar" role={actu.auteur?.role} />
        <span className="actu-card__pseudo">{actu.auteur?.pseudo ?? '—'}</span>
        {actu.date && (
          <span className="actu-card__date">
            {new Date(actu.date).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
      <div className="actu-card__body">
        <p className="actu-card__titre">{actu.titre}</p>
        <p className="actu-card__contenu">{actu.contenu}</p>
        {actu.image && (
          <img className="actu-card__img" src={actu.image} alt="illustration" />
        )}
      </div>

      {/* Boutons selon l'onglet */}
      {onglet === 'en_attente' && (
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
      )}

      {onglet === 'publie' && (
        <div className="actu-card__actions">
          <button
            className="admin-btn admin-btn--danger admin-btn--sm"
            onClick={() => handle('refuse')}
            disabled={loading !== null}
          >
            {loading === 'refuse' ? 'Refus…' : '❌ Refuser'}
          </button>
        </div>
      )}

      {onglet === 'refuse' && (
        <div className="actu-card__actions">
          <button
            className="admin-btn admin-btn--vert"
            onClick={() => handle('publie')}
            disabled={loading !== null}
          >
            {loading === 'publie' ? 'Publication…' : '↩️ Changer d\'avis → Accepter'}
          </button>
        </div>
      )}
    </article>
  )
}

function SectionActus({ adminId }) {
  const [ongletActif, setOngletActif] = useState('en_attente')
  const [actus, setActus] = useState([])
  const [loading, setLoading] = useState(true)

  function loadActus(statut) {
    setLoading(true)
    getAdminActus(adminId, statut).then((data) => {
      setActus(data ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadActus(ongletActif)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId, ongletActif])

  function handleChangeOnglet(id) {
    if (id === ongletActif) return
    setActus([])
    setOngletActif(id)
  }

  function removeActu(id) {
    setActus((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">📰 Modération des actus</h2>

      {/* Onglets */}
      <div className="actus-tabs">
        {ONGLETS_ACTUS.map((o) => (
          <button
            key={o.id}
            className={`actus-tab${ongletActif === o.id ? ' actus-tab--actif' : ''}`}
            onClick={() => handleChangeOnglet(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && actus.length === 0 && (
        <p className="admin-empty">
          {ongletActif === 'en_attente'
            ? 'Aucune actu en attente 🎉'
            : ongletActif === 'publie'
            ? 'Aucune actu publiée.'
            : 'Aucune actu refusée.'}
        </p>
      )}
      {!loading && actus.length > 0 && (
        <div className="actus-list">
          {actus.map((a) => (
            <ActuCard
              key={a.id}
              actu={a}
              onglet={ongletActif}
              adminId={adminId}
              onAction={removeActu}
            />
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
function UserRow({ u, adminId, onDelete, onRoleChange }) {
  const [donuts, setDonuts] = useState(String(u.donuts ?? 0))
  const [gemmes, setGemmes] = useState(String(u.gemmes ?? 0))
  const [savMsg, setSavMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleMsg, setRoleMsg] = useState(null)

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

  async function handleRoleChange() {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    setRoleLoading(true)
    setRoleMsg(null)
    const res = await setUserRole(adminId, u.id, newRole)
    setRoleLoading(false)
    if (res?.status === 'ok') {
      onRoleChange(u.id, newRole)
    } else if (res?.status === 'forbidden') {
      setRoleMsg({ type: 'err', text: 'Permission refusée.' })
      setTimeout(() => setRoleMsg(null), 3000)
    } else if (res?.status === 'cannot_modify_superadmin') {
      setRoleMsg({ type: 'err', text: 'Impossible de modifier un superadmin.' })
      setTimeout(() => setRoleMsg(null), 3000)
    } else {
      setRoleMsg({ type: 'err', text: res?.error ?? 'Erreur inconnue.' })
      setTimeout(() => setRoleMsg(null), 3000)
    }
  }

  return (
    <div className="user-row">
      <div className="user-row__info">
        <FallGuy avatar={u.avatar ?? null} className="user-row__avatar" role={u.role} />
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

      {/* Bouton de gestion du rôle — uniquement si pas superadmin */}
      {u.role !== 'superadmin' && (
        <div className="user-row__role-actions">
          <button
            className={`admin-btn admin-btn--sm ${u.role === 'admin' ? 'admin-btn--role-revoke' : 'admin-btn--role-promote'}`}
            onClick={handleRoleChange}
            disabled={roleLoading}
          >
            {roleLoading
              ? '…'
              : u.role === 'admin'
              ? '🔽 Révoquer admin'
              : '🛡️ Nommer admin'}
          </button>
          {roleMsg && (
            <span className={`admin-inline-msg admin-inline-msg--${roleMsg.type}`}>{roleMsg.text}</span>
          )}
        </div>
      )}

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

  function updateUserRole(id, newRole) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    )
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
            <UserRow
              key={u.id}
              u={u}
              adminId={adminId}
              onDelete={removeUser}
              onRoleChange={updateUserRole}
            />
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

// --------------- Bug Reports 🚨 ---------------
const BUG_STATUTS = [
  { id: 'nouveau', label: '🆕 Nouveau' },
  { id: 'en_cours', label: '🔧 En cours' },
  { id: 'resolu', label: '✅ Résolu' },
]

function BugReportCard({ report, adminId, onUpdate }) {
  const [note, setNote] = useState(report.note_admin ?? '')
  const [savingNote, setSavingNote] = useState(false)
  const [noteMsg, setNoteMsg] = useState(false)
  const [statutLoading, setStatutLoading] = useState(null)

  async function changeStatut(statut) {
    setStatutLoading(statut)
    const res = await adminUpdateBugReport(adminId, report.id, statut, note)
    setStatutLoading(null)
    if (!res.error) onUpdate(report.id, { statut })
  }

  async function saveNote() {
    setSavingNote(true)
    const res = await adminUpdateBugReport(adminId, report.id, report.statut, note)
    setSavingNote(false)
    if (!res.error) {
      onUpdate(report.id, { note_admin: note })
      setNoteMsg(true)
      setTimeout(() => setNoteMsg(false), 2000)
    }
  }

  return (
    <article className={`bug-card bug-card--${report.statut}`}>
      <div className="bug-card__head">
        <div className="bug-card__author">
          <FallGuy avatar={report.auteur?.avatar ?? null} className="bug-card__avatar" role={report.auteur?.role} />
          <div className="bug-card__meta">
            <span className="bug-card__pseudo">{report.auteur?.pseudo ?? 'Anonyme'}</span>
            <span className="bug-card__date">{new Date(report.date).toLocaleString('fr-FR')}</span>
          </div>
        </div>
        <span className={`bug-card__status bug-card__status--${report.statut}`}>
          {BUG_STATUTS.find((s) => s.id === report.statut)?.label ?? report.statut}
        </span>
      </div>

      <p className="bug-card__message">{report.message}</p>

      <div className="bug-card__statuts">
        {BUG_STATUTS.map((s) => (
          <button
            key={s.id}
            className={`admin-btn admin-btn--sm ${report.statut === s.id ? 'admin-btn--primary' : ''}`}
            onClick={() => changeStatut(s.id)}
            disabled={statutLoading !== null || report.statut === s.id}
          >
            {statutLoading === s.id ? '…' : s.label}
          </button>
        ))}
      </div>

      <div className="bug-card__note">
        <textarea
          className="admin-input bug-card__note-input"
          placeholder="Note interne (visible par les admins)…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={saveNote} disabled={savingNote}>
          {savingNote ? '…' : noteMsg ? '✅' : '💾 Note'}
        </button>
      </div>
    </article>
  )
}

function SectionBugReports({ adminId }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    adminListBugReports(adminId).then((data) => {
      if (!on) return
      setReports(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    return () => { on = false }
  }, [adminId])

  function patchReport(id, patch) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const nouveaux = reports.filter((r) => r.statut === 'nouveau').length

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">
        🚨 Bug Reports {nouveaux > 0 && <span className="bug-count">{nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</span>}
      </h2>
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && reports.length === 0 && (
        <p className="admin-empty">Aucun signalement pour l'instant 🎉</p>
      )}
      {!loading && reports.length > 0 && (
        <div className="bug-list">
          {reports.map((r) => (
            <BugReportCard key={r.id} report={r} adminId={adminId} onUpdate={patchReport} />
          ))}
        </div>
      )}
    </section>
  )
}

// --------------- Série Zigzam 🎬 ---------------
function SectionSerie({ adminId }) {
  const [overrides, setOverrides] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let on = true
    getSerieVisibility().then((o) => {
      if (!on) return
      setOverrides(o)
      setLoading(false)
    })
    return () => { on = false }
  }, [])

  async function toggle(ep, publie) {
    setBusyId(ep.id)
    setMsg(null)
    const res = await adminSetSeriePublie(adminId, ep.id, publie)
    setBusyId(null)
    if (res.error) {
      setMsg({ type: 'err', text: res.error })
      return
    }
    setOverrides((prev) => ({ ...prev, [ep.id]: publie }))
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">🎬 Série Zigzam</h2>
      {msg && <p className={`admin-msg admin-msg--${msg.type}`}>{msg.text}</p>}
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && (
        <div className="serie-admin-list">
          {EPISODES.map((ep) => {
            const pub = isPublished(ep, overrides)
            return (
              <div key={ep.id} className="serie-admin-row">
                <div className="serie-admin-row__info">
                  <span className="serie-admin-row__num">Ép. {ep.number}</span>
                  <span className="serie-admin-row__name">{ep.title}</span>
                  <span className={`serie-admin-row__status serie-admin-row__status--${pub ? 'pub' : 'draft'}`}>
                    {pub ? '✅ Publié' : '🔒 Brouillon'}
                  </span>
                </div>
                <button
                  className={`admin-btn admin-btn--sm ${pub ? 'admin-btn--danger' : 'admin-btn--vert'}`}
                  onClick={() => toggle(ep, !pub)}
                  disabled={busyId === ep.id}
                >
                  {busyId === ep.id ? '…' : pub ? 'Dépublier' : 'Publier'}
                </button>
              </div>
            )
          })}
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

      <SectionBugReports adminId={user.id} />

      {isSuperAdmin && (
        <>
          <SectionCreerCompte adminId={user.id} onUserCreated={handleUserCreated} />
          <SectionUtilisateurs adminId={user.id} refreshTrigger={refreshUsers} />
          <SectionCodes adminId={user.id} />
          <SectionSerie adminId={user.id} />
        </>
      )}
    </div>
  )
}
