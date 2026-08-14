import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
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
  adminListSeriePropositions,
  adminMarkSeriePropositionLu,
  adminRefuseSerieProposition,
  searchUsers,
  adminCreateBoiteAleatoire,
  adminCreateBoitePerso,
  adminListBoites,
  resetUserPassword,
  resetUserNumero,
  adminBirthdaysToday,
  adminListSaisons,
  adminUpdateSaison,
  adminSaisonStats,
} from '../lib/modules'
import { adminListBigCardWins } from '../lib/cartes'
import { EPISODES, isPublished } from '../data/episodes'
import { CATEGORIES, getItem } from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import ZigzamCard from '../components/ZigzamCard'
import FallGuy from '../components/FallGuy'
import './Admin.css'

// --------------- Modération des actus (3 onglets) ---------------
const ONGLETS_ACTUS = [
  { id: 'en_attente', label: 'En attente ⏳' },
  { id: 'publie',     label: 'Publiées ✅'   },
]

function ActuCard({ actu, onglet, adminId, onAction }) {
  const [loading, setLoading] = useState(null) // statut en cours

  async function handle(statut) {
    setLoading(statut)
    await moderateActu(adminId, actu.id, statut)
    setLoading(null)
    onAction(actu.id, statut)
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
  // Actus refusées : section rétractable séparée, fermée par défaut.
  const [refused, setRefused] = useState([])
  const [refusedOpen, setRefusedOpen] = useState(false)

  function loadActus(statut) {
    setLoading(true)
    getAdminActus(adminId, statut).then((data) => {
      setActus(data ?? [])
      setLoading(false)
    })
  }

  function loadRefused() {
    getAdminActus(adminId, 'refuse').then((data) => setRefused(data ?? []))
  }

  useEffect(() => {
    loadActus(ongletActif)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId, ongletActif])

  // Compte des refusées chargé au montage (pour afficher le total même fermé).
  useEffect(() => {
    loadRefused()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId])

  function handleChangeOnglet(id) {
    if (id === ongletActif) return
    setActus([])
    setOngletActif(id)
  }

  // Retrait d'une actu de l'onglet courant ; si elle vient d'être refusée,
  // on rafraîchit la liste des refusées.
  function removeActu(id, statut) {
    setActus((prev) => prev.filter((a) => a.id !== id))
    if (statut === 'refuse') loadRefused()
  }

  // Une actu refusée qui est ré-acceptée quitte la section refusées.
  function removeRefused(id) {
    setRefused((prev) => prev.filter((a) => a.id !== id))
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
            : 'Aucune actu publiée.'}
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

      {/* Section rétractable des actus refusées */}
      <div className="actus-refused">
        <button
          className="actus-refused__head"
          onClick={() => setRefusedOpen((v) => !v)}
          aria-expanded={refusedOpen}
        >
          <span>🗑️ Actualités refusées ({refused.length})</span>
          <span className="actus-refused__chevron">{refusedOpen ? '▾' : '▸'}</span>
        </button>
        {refusedOpen && (
          refused.length === 0 ? (
            <p className="admin-empty">Aucune actu refusée.</p>
          ) : (
            <div className="actus-list">
              {refused.map((a) => (
                <ActuCard
                  key={a.id}
                  actu={a}
                  onglet="refuse"
                  adminId={adminId}
                  onAction={removeRefused}
                />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  )
}

// --------------- Cartes Zigzam Collectore 🃏 (superadmin only) ---------------
function CarteWinRow({ win, onPrint }) {
  return (
    <article className="carte-win">
      <ZigzamCard card={win.carte} className="carte-win__card" />
      <div className="carte-win__info">
        <p className="carte-win__msg">
          🃏 <strong>{win.pseudo}</strong> a gagné la carte <strong>{win.carte.nom}</strong>{' '}
          ({win.carte.rarete === 'impossible' ? 'IMPOSSIBLE' : 'Incroyable'}) !
        </p>
        <p className="carte-win__date">{new Date(win.date).toLocaleString('fr-FR')}</p>
        <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => onPrint(win)}>
          📄 Générer le PDF
        </button>
      </div>
    </article>
  )
}

function SectionCartes({ adminId }) {
  const [wins, setWins] = useState([])
  const [loading, setLoading] = useState(true)
  const [printWin, setPrintWin] = useState(null)

  useEffect(() => {
    let on = true
    adminListBigCardWins(adminId).then((data) => {
      if (!on) return
      setWins(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    return () => { on = false }
  }, [adminId])

  useEffect(() => {
    if (!printWin) return
    const id = setTimeout(() => window.print(), 200)
    return () => clearTimeout(id)
  }, [printWin])

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">🃏 Cartes Incroyable / IMPOSSIBLE gagnées</h2>
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && wins.length === 0 && (
        <p className="admin-empty">Aucune carte Incroyable ou IMPOSSIBLE gagnée pour l'instant.</p>
      )}
      {!loading && wins.length > 0 && (
        <div className="carte-win-list">
          {wins.map((w) => (
            <CarteWinRow key={w.id} win={w} onPrint={setPrintWin} />
          ))}
        </div>
      )}

      {/* Carte imprimable au format A6 — seule visible via @media print (Admin.css) */}
      {printWin && (
        <div className="carte-print" onClick={() => setPrintWin(null)}>
          <div className="carte-print__page" onClick={(e) => e.stopPropagation()}>
            <ZigzamCard card={printWin.carte} className="carte-print__card" />
            <p className="carte-print__pseudo">{printWin.pseudo}</p>
          </div>
          <button className="admin-btn admin-btn--sm carte-print__close no-print" onClick={() => setPrintWin(null)}>
            Fermer
          </button>
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
  // Modale superadmin : réinitialiser le mot de passe / le numéro.
  const [modal, setModal] = useState(null) // null | 'pwd' | 'num'
  const [modalInput, setModalInput] = useState('')
  const [modalBusy, setModalBusy] = useState(false)
  const [modalMsg, setModalMsg] = useState(null) // { type, text }
  const [numero, setNumero] = useState(u.numero)

  function openModal(kind) {
    setModal(kind)
    setModalInput('')
    setModalMsg(null)
  }

  async function handleResetPwd() {
    if (!modalInput.trim()) {
      setModalMsg({ type: 'err', text: 'Entre un nouveau mot de passe.' })
      return
    }
    setModalBusy(true)
    const res = await resetUserPassword(adminId, u.id, modalInput.trim())
    setModalBusy(false)
    if (res.error) {
      setModalMsg({ type: 'err', text: res.error })
      return
    }
    setModalMsg({ type: 'ok', text: 'Mot de passe réinitialisé ! L\'utilisateur devra le changer à sa prochaine connexion.' })
  }

  async function handleResetNum() {
    setModalBusy(true)
    const res = await resetUserNumero(adminId, u.id, modalInput.trim())
    setModalBusy(false)
    if (res.error) {
      setModalMsg({ type: 'err', text: res.error })
      return
    }
    setNumero(modalInput.trim())
    setModalMsg({ type: 'ok', text: 'Numéro mis à jour !' })
  }

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
      {/* Ligne 1 : identité */}
      <div className="user-row__line user-row__line--info">
        <FallGuy avatar={u.avatar ?? null} className="user-row__avatar" role={u.role} />
        <span className="user-row__pseudo">{u.pseudo}</span>
        <span className="user-row__num">#{numero}</span>
        {u.role === 'admin' && <span className="user-row__badge user-row__badge--admin">🛡️ admin</span>}
        {u.role === 'superadmin' && <span className="user-row__badge user-row__badge--superadmin">⭐ superadmin</span>}
      </div>

      {/* Ligne 2 : soldes éditables + enregistrer + rôle */}
      <div className="user-row__line user-row__line--balance">
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
        {u.role !== 'superadmin' && (
          <button
            className={`admin-btn admin-btn--sm ${u.role === 'admin' ? 'admin-btn--role-revoke' : 'admin-btn--role-promote'}`}
            onClick={handleRoleChange}
            disabled={roleLoading}
          >
            {roleLoading ? '…' : u.role === 'admin' ? '🔽 Révoquer admin' : '🛡️ Nommer admin'}
          </button>
        )}
        {savMsg && (
          <span className={`admin-inline-msg admin-inline-msg--${savMsg.type}`}>{savMsg.text}</span>
        )}
        {roleMsg && (
          <span className={`admin-inline-msg admin-inline-msg--${roleMsg.type}`}>{roleMsg.text}</span>
        )}
      </div>

      {/* Ligne 3 : mot de passe + numéro + supprimer */}
      <div className="user-row__line user-row__line--actions">
        {u.role !== 'superadmin' && (
          <>
            <button className="admin-btn admin-btn--sm admin-btn--mdp" onClick={() => openModal('pwd')}>
              🔑 Changer le mdp
            </button>
            <button className="admin-btn admin-btn--sm admin-btn--num" onClick={() => openModal('num')}>
              📞 Changer le numéro
            </button>
          </>
        )}
        <button
          className="admin-btn admin-btn--danger admin-btn--sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '…' : '🗑️ Supprimer'}
        </button>
      </div>

      {modal && (
        <div className="user-modal" onMouseDown={() => !modalBusy && setModal(null)}>
          <div className="user-modal__panel" role="dialog" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="user-modal__title">
              {modal === 'pwd' ? '🔑 Nouveau mot de passe' : '📞 Nouveau numéro'} — {u.pseudo}
            </h3>
            {modalMsg?.type === 'ok' ? (
              <>
                <p className={`admin-msg admin-msg--ok`}>{modalMsg.text}</p>
                <div className="user-modal__actions">
                  <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => setModal(null)}>
                    Fermer
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  className="admin-input"
                  type={modal === 'pwd' ? 'text' : 'text'}
                  inputMode={modal === 'num' ? 'numeric' : undefined}
                  maxLength={modal === 'num' ? 4 : undefined}
                  placeholder={modal === 'pwd' ? 'Nouveau mot de passe temporaire' : 'Nouveau numéro à 4 chiffres'}
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  autoFocus
                />
                {modalMsg?.type === 'err' && (
                  <p className="admin-msg admin-msg--err">{modalMsg.text}</p>
                )}
                <div className="user-modal__actions">
                  <button
                    className="admin-btn admin-btn--sm admin-btn--ghost"
                    onClick={() => setModal(null)}
                    disabled={modalBusy}
                  >
                    Annuler
                  </button>
                  <button
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={modal === 'pwd' ? handleResetPwd : handleResetNum}
                    disabled={modalBusy}
                  >
                    {modalBusy ? '…' : 'Confirmer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

// --------------- Idées d'épisodes 💡 ---------------
const PROPO_STATUTS = {
  nouveau: '🆕 Nouveau',
  lu: '👀 Lu',
  refuse: '🙅 Refusé',
}

function PropositionCard({ propo, adminId, onUpdate }) {
  const [loading, setLoading] = useState(null) // 'lu' | 'refuse'

  async function markLu() {
    setLoading('lu')
    const res = await adminMarkSeriePropositionLu(adminId, propo.id)
    setLoading(null)
    if (!res.error) onUpdate(propo.id, { statut: 'lu' })
  }

  async function refuse() {
    setLoading('refuse')
    const res = await adminRefuseSerieProposition(adminId, propo.id)
    setLoading(null)
    if (!res.error) onUpdate(propo.id, { statut: 'refuse' })
  }

  return (
    <article className={`propo-card propo-card--${propo.statut}`}>
      <div className="propo-card__head">
        <div className="propo-card__author">
          <FallGuy avatar={propo.auteur?.avatar ?? null} className="propo-card__avatar" role={propo.auteur?.role} />
          <div className="propo-card__meta">
            <span className="propo-card__pseudo">{propo.auteur?.pseudo ?? 'Anonyme'}</span>
            <span className="propo-card__date">{new Date(propo.date).toLocaleString('fr-FR')}</span>
          </div>
        </div>
        <span className={`propo-card__status propo-card__status--${propo.statut}`}>
          {PROPO_STATUTS[propo.statut] ?? propo.statut}
        </span>
      </div>

      <p className="propo-card__titre">{propo.titre}</p>
      <p className="propo-card__desc">{propo.description}</p>

      <div className="propo-card__actions">
        <button
          className="admin-btn admin-btn--sm"
          onClick={markLu}
          disabled={loading !== null || propo.statut === 'lu'}
        >
          {loading === 'lu' ? '…' : 'Marquer comme lu'}
        </button>
        <button
          className="admin-btn admin-btn--sm admin-btn--danger"
          onClick={refuse}
          disabled={loading !== null || propo.statut === 'refuse'}
        >
          {loading === 'refuse' ? '…' : 'Refuser poliment'}
        </button>
      </div>
    </article>
  )
}

function SectionPropositions({ adminId }) {
  const [propos, setPropos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    adminListSeriePropositions(adminId).then((data) => {
      if (!on) return
      setPropos(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    return () => { on = false }
  }, [adminId])

  function patch(id, p) {
    setPropos((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)))
  }

  const nouveaux = propos.filter((p) => p.statut === 'nouveau').length

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">
        💡 Idées d'épisodes {nouveaux > 0 && <span className="bug-count">{nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</span>}
      </h2>
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && propos.length === 0 && (
        <p className="admin-empty">Aucune proposition pour l'instant 💭</p>
      )}
      {!loading && propos.length > 0 && (
        <div className="propo-list">
          {propos.map((p) => (
            <PropositionCard key={p.id} propo={p} adminId={adminId} onUpdate={patch} />
          ))}
        </div>
      )}
    </section>
  )
}

// --------------- Boîtes Mystères 🎁 ---------------
const NIVEAUX = [
  { id: 'normal', label: 'Normal', emoji: '🟢', desc: '5-7 🍩 + 1 💎' },
  { id: 'rare', label: 'Rare', emoji: '🔵', desc: '5-13 🍩 + 1-2 💎 · skin 1/5' },
  { id: 'super_rare', label: 'Super Rare', emoji: '🟣', desc: '10-20 🍩 + 3-5 💎 · skin 1/3' },
  { id: 'incroyable', label: 'Incroyable', emoji: '🟠', desc: '40-60 🍩 + 8-10 💎 · skin garanti' },
  { id: 'impossible', label: 'IMPOSSIBLE !!!', emoji: '🔴', desc: '80-100 🍩 + 20-30 💎 · skin rare garanti' },
]
const NIVEAU_LABEL = Object.fromEntries(NIVEAUX.map((n) => [n.id, `${n.emoji} ${n.label}`]))
// Catégories d'accessoires (hors « skin sur mesure »).
const ACC_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'special')

// Recherche d'un destinataire par pseudo ou numéro.
function RecipientPicker({ value, onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function doSearch(e) {
    e.preventDefault()
    if (query.trim().length < 1) return
    setSearching(true)
    const data = await searchUsers(query.trim())
    setSearching(false)
    setResults(Array.isArray(data) ? data : [])
  }

  if (value) {
    return (
      <div className="boite-recipient boite-recipient--picked">
        <FallGuy avatar={value.avatar ?? null} className="boite-recipient__avatar" role={value.role} />
        <span className="boite-recipient__pseudo">{value.pseudo}</span>
        <span className="boite-recipient__num">📞 {value.numero}</span>
        <button className="admin-btn admin-btn--sm" onClick={() => onPick(null)}>Changer</button>
      </div>
    )
  }

  return (
    <div className="boite-recipient">
      <form className="boite-search" onSubmit={doSearch}>
        <input
          className="admin-input"
          placeholder="Chercher un élève (pseudo ou numéro)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="admin-btn admin-btn--sm" type="submit" disabled={searching}>
          {searching ? '…' : '🔍'}
        </button>
      </form>
      {results.length > 0 && (
        <div className="boite-results">
          {results.map((u) => (
            <button key={u.id} className="boite-result" onClick={() => { onPick(u); setResults([]); setQuery('') }}>
              <FallGuy avatar={u.avatar ?? null} className="boite-result__avatar" role={u.role} />
              <span className="boite-result__pseudo">{u.pseudo}</span>
              <span className="boite-result__num">📞 {u.numero}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BoiteHistoryRow({ boite }) {
  const c = boite.contenu || {}
  const niveau = c.niveau || boite.type
  let resume
  if (boite.ouverte) {
    const skin = c.skin ? ` + 🎁 ${getItem(c.skin.category, c.skin.item)?.label ?? c.skin.item}` : ''
    resume = `${c.donuts ?? 0} 🍩 + ${c.gemmes ?? 0} 💎${skin}`
  } else if (c.mode === 'fixe') {
    const skin = c.skin ? ` + 🎁 ${getItem(c.skin.category, c.skin.item)?.label ?? c.skin.item}` : ''
    resume = `${c.donuts ?? 0} 🍩 + ${c.gemmes ?? 0} 💎${skin}`
  } else {
    resume = 'Aléatoire (tiré à l\'ouverture)'
  }
  return (
    <div className="boite-row">
      <div className="boite-row__dest">
        <FallGuy avatar={boite.destinataire?.avatar ?? null} className="boite-row__avatar" role={boite.destinataire?.role} />
        <span className="boite-row__pseudo">{boite.destinataire?.pseudo ?? '—'}</span>
      </div>
      <span className={`boite-row__niveau boite-row__niveau--${niveau}`}>
        {boite.type === 'personnalisee' ? '🎨 Personnalisée' : (NIVEAU_LABEL[niveau] ?? niveau)}
      </span>
      <span className="boite-row__contenu">{resume}</span>
      <span className={`boite-row__state boite-row__state--${boite.ouverte ? 'open' : 'closed'}`}>
        {boite.ouverte ? '✅ Ouverte' : '🎁 En attente'}
      </span>
    </div>
  )
}

function SectionBoites({ adminId }) {
  const [mode, setMode] = useState('aleatoire') // 'aleatoire' | 'perso'
  const [dest, setDest] = useState(null)
  const [niveau, setNiveau] = useState('normal')
  const [donuts, setDonuts] = useState(10)
  const [gemmes, setGemmes] = useState(2)
  const [skinCat, setSkinCat] = useState('')
  const [skinItem, setSkinItem] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    adminListBoites(adminId).then((d) => {
      if (!on) return
      setHistory(Array.isArray(d) ? d : [])
      setLoading(false)
    })
    return () => { on = false }
  }, [adminId])

  const catItems = ACC_CATEGORIES.find((c) => c.id === skinCat)?.items ?? []

  async function refreshHistory() {
    const d = await adminListBoites(adminId)
    setHistory(Array.isArray(d) ? d : [])
  }

  async function send() {
    if (!dest) {
      setMsg({ type: 'err', text: 'Choisis un destinataire.' })
      return
    }
    setBusy(true)
    setMsg(null)
    const res = mode === 'aleatoire'
      ? await adminCreateBoiteAleatoire(adminId, dest.id, niveau)
      : await adminCreateBoitePerso(adminId, dest.id, Number(donuts) || 0, Number(gemmes) || 0, skinCat, skinItem)
    setBusy(false)
    if (res.error) {
      setMsg({ type: 'err', text: res.error })
      return
    }
    setMsg({ type: 'ok', text: `🎁 Boîte envoyée à ${dest.pseudo} !` })
    setDest(null)
    await refreshHistory()
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">🎁 Boîtes Mystères</h2>

      <div className="boite-mode">
        <button
          className={`admin-btn admin-btn--sm ${mode === 'aleatoire' ? 'admin-btn--primary' : ''}`}
          onClick={() => setMode('aleatoire')}
        >
          🎲 Aléatoire
        </button>
        <button
          className={`admin-btn admin-btn--sm ${mode === 'perso' ? 'admin-btn--primary' : ''}`}
          onClick={() => setMode('perso')}
        >
          🎨 Personnalisée
        </button>
      </div>

      <label className="admin-label">Destinataire</label>
      <RecipientPicker value={dest} onPick={setDest} />

      {mode === 'aleatoire' ? (
        <>
          <label className="admin-label">Niveau de rareté</label>
          <div className="boite-niveaux">
            {NIVEAUX.map((n) => (
              <button
                key={n.id}
                className={`boite-niveau boite-niveau--${n.id} ${niveau === n.id ? 'boite-niveau--on' : ''}`}
                onClick={() => setNiveau(n.id)}
              >
                <span className="boite-niveau__top">{n.emoji} {n.label}</span>
                <span className="boite-niveau__desc">{n.desc}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="boite-perso-grid">
            <label className="admin-label">
              🍩 Donuts
              <input
                className="admin-input" type="number" min="0"
                value={donuts} onChange={(e) => setDonuts(e.target.value)}
              />
            </label>
            <label className="admin-label">
              💎 Gemmes
              <input
                className="admin-input" type="number" min="0"
                value={gemmes} onChange={(e) => setGemmes(e.target.value)}
              />
            </label>
          </div>
          <div className="boite-perso-grid">
            <label className="admin-label">
              🎁 Accessoire (optionnel)
              <select
                className="admin-input"
                value={skinCat}
                onChange={(e) => { setSkinCat(e.target.value); setSkinItem('') }}
              >
                <option value="">— Aucun —</option>
                {ACC_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </label>
            <label className="admin-label">
              Item
              <select
                className="admin-input"
                value={skinItem}
                onChange={(e) => setSkinItem(e.target.value)}
                disabled={!skinCat}
              >
                <option value="">— Choisir —</option>
                {catItems.map((it) => (
                  <option key={it.id} value={it.id}>{it.label}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      {msg && <p className={`admin-msg admin-msg--${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</p>}
      <button className="admin-btn admin-btn--primary boite-send" onClick={send} disabled={busy}>
        {busy ? 'Envoi…' : 'Envoyer 🎁'}
      </button>

      <h3 className="boite-history-title">Historique des boîtes envoyées</h3>
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && history.length === 0 && <p className="admin-empty">Aucune boîte envoyée pour l'instant 📦</p>}
      {!loading && history.length > 0 && (
        <div className="boite-history">
          {history.map((b) => <BoiteHistoryRow key={b.id} boite={b} />)}
        </div>
      )}
    </section>
  )
}

// --------------- Anniversaires du jour 🎂 ---------------
function SectionAnniversaires({ adminId }) {
  const [birthdays, setBirthdays] = useState([])

  useEffect(() => {
    let on = true
    adminBirthdaysToday(adminId).then((data) => {
      if (on) setBirthdays(Array.isArray(data) ? data : [])
    })
    return () => { on = false }
  }, [adminId])

  if (birthdays.length === 0) return null

  return (
    <div className="admin-birthdays">
      {birthdays.map((u) => (
        <div key={u.id} className="admin-birthday">
          <FallGuy avatar={u.avatar ?? null} className="admin-birthday__avatar" role={u.role} />
          <span className="admin-birthday__text">
            🎂 C'est l'anniversaire de <strong>{u.pseudo}</strong> aujourd'hui !
            Pense à lui envoyer une boîte mystère 🎁
          </span>
        </div>
      ))}
    </div>
  )
}

// --------------- Saisons 🦕 ---------------
// ISO -> valeur d'<input type="datetime-local"> (heure locale).
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Une saison : statut, dates, et statistiques d'achat des skins.
function SaisonAdminRow({ adminId, saison, onChanged }) {
  const [debut, setDebut] = useState(toLocalInput(saison.date_debut))
  const [fin, setFin] = useState(toLocalInput(saison.date_fin))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [stats, setStats] = useState(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [now] = useState(() => Date.now()) // instant figé (évite un appel impur au render)

  const active = saison.actif &&
    (!saison.date_debut || now >= Date.parse(saison.date_debut)) &&
    (!saison.date_fin || now <= Date.parse(saison.date_fin))

  const apply = async (patch) => {
    setBusy(true); setMsg(null)
    const res = await adminUpdateSaison(adminId, saison.slug, patch)
    setBusy(false)
    if (res.error) { setMsg({ type: 'err', text: 'Échec de la mise à jour.' }); return }
    setMsg({ type: 'ok', text: 'Saison mise à jour ✅' })
    onChanged?.(res.saison)
  }

  const saveDates = () => apply({
    debut: debut ? new Date(debut).toISOString() : '',
    fin: fin ? new Date(fin).toISOString() : '',
  })

  const loadStats = async () => {
    setStatsOpen((v) => !v)
    if (stats || statsLoading) return
    setStatsLoading(true)
    const s = await adminSaisonStats(adminId, saison.slug)
    setStatsLoading(false)
    setStats(s)
  }

  return (
    <div className="saison-row">
      <div className="saison-row__head">
        <span className="saison-row__name">{saison.nom}</span>
        <span className={`saison-badge ${active ? 'saison-badge--on' : 'saison-badge--off'}`}>
          {active ? '🟢 Active' : saison.actif ? '🟡 Programmée / terminée' : '⚪ Inactive'}
        </span>
      </div>

      <div className="saison-row__dates">
        <span>Début : <b>{fmtDate(saison.date_debut)}</b></span>
        <span>Fin : <b>{fmtDate(saison.date_fin)}</b></span>
      </div>

      <div className="saison-row__controls">
        <button
          className={`admin-btn ${saison.actif ? 'admin-btn--ghost' : 'admin-btn--primary'}`}
          onClick={() => apply({ actif: !saison.actif })}
          disabled={busy}
        >
          {saison.actif ? '⏸️ Désactiver la saison' : '▶️ Activer la saison'}
        </button>
        <button className="admin-btn admin-btn--ghost" onClick={loadStats} disabled={busy}>
          📊 {statsOpen ? 'Masquer' : 'Voir'} les stats skins
        </button>
      </div>

      <div className="saison-row__form">
        <label className="admin-label">
          📅 Date de début
          <input className="admin-input" type="datetime-local" value={debut}
            onChange={(e) => setDebut(e.target.value)} />
        </label>
        <label className="admin-label">
          🏁 Date de fin
          <input className="admin-input" type="datetime-local" value={fin}
            onChange={(e) => setFin(e.target.value)} />
        </label>
      </div>
      <div className="saison-row__form-actions">
        <button className="admin-btn admin-btn--ghost" onClick={() => { setDebut(''); setFin('') }} disabled={busy}>
          Effacer les dates
        </button>
        <button className="admin-btn admin-btn--primary" onClick={saveDates} disabled={busy}>
          {busy ? 'Enregistrement…' : '💾 Enregistrer les dates'}
        </button>
      </div>
      <p className="saison-row__hint">
        Sans date de fin, la saison reste active tant qu'elle est activée. Les skins
        achetés restent acquis à vie, même après la fin de la saison.
      </p>

      {msg && <p className={`admin-msg admin-msg--${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</p>}

      {statsOpen && (
        <div className="saison-stats">
          {statsLoading && <p className="admin-loading">Chargement des stats…</p>}
          {!statsLoading && stats && (
            <>
              <div className="saison-stats__totals">
                <span>🛒 <b>{stats.total}</b> skin{stats.total > 1 ? 's' : ''} acqui{stats.total > 1 ? 's' : 's'} au total</span>
                <span>👥 <b>{stats.joueurs}</b> joueur{stats.joueurs > 1 ? 's' : ''} avec ≥ 1 skin</span>
              </div>
              <div className="saison-stats__list">
                {(stats.skins ?? []).map((s) => (
                  <div key={`${s.category}:${s.item_id}`} className="saison-stats__item">
                    <span className="saison-stats__label">{s.label}</span>
                    <span className="saison-stats__cat">{s.category} • 💎 {s.prix}</span>
                    <span className="saison-stats__count">{s.achats}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {!statsLoading && !stats && <p className="admin-empty">Stats indisponibles.</p>}
        </div>
      )}
    </div>
  )
}

function SectionSaisons({ adminId }) {
  const { refresh } = useSaison()
  const [saisons, setSaisons] = useState([])
  const [loading, setLoading] = useState(true)

  // Le setState ne se fait que dans le callback async (jamais en synchrone
  // dans le corps de l'effet) → conforme à react-hooks/set-state-in-effect.
  const reload = () => {
    adminListSaisons(adminId).then((list) => {
      setSaisons(Array.isArray(list) ? list : [])
      setLoading(false)
    })
  }
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId])

  // Quand une saison change, on rafraîchit la liste + le contexte de saison
  // (pour que l'aperçu côté admin se mette à jour immédiatement).
  const handleChanged = (updated) => {
    if (updated) {
      setSaisons((prev) => prev.map((s) => (s.slug === updated.slug ? updated : s)))
      refresh(updated)
    } else {
      reload()
    }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-section-title">🦕 Saisons</h2>
      {loading && <p className="admin-loading">Chargement…</p>}
      {!loading && saisons.length === 0 && <p className="admin-empty">Aucune saison configurée.</p>}
      {!loading && saisons.map((s) => (
        <SaisonAdminRow key={s.slug} adminId={adminId} saison={s} onChanged={handleChanged} />
      ))}
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

      <SectionAnniversaires adminId={user.id} />

      <SectionActus adminId={user.id} />

      <SectionBugReports adminId={user.id} />

      {isSuperAdmin && (
        <>
          <SectionCartes adminId={user.id} />
          <SectionCreerCompte adminId={user.id} onUserCreated={handleUserCreated} />
          <SectionUtilisateurs adminId={user.id} refreshTrigger={refreshUsers} />
          <SectionCodes adminId={user.id} />
          <SectionSerie adminId={user.id} />
          <SectionPropositions adminId={user.id} />
          <SectionBoites adminId={user.id} />
          <SectionSaisons adminId={user.id} />
        </>
      )}
    </div>
  )
}
