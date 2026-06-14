import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  changePassword,
  changePseudo,
  getParental,
  setParental,
  verifyParentalCode,
  updateParental,
} from '../lib/modules'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Parametres.css'

const MODULES_LIST = [
  { key: 'discuter',   label: 'Discuter' },
  { key: 'actualites', label: 'Actualités' },
  { key: 'contacts',   label: 'Contacts' },
  { key: 'avatar',     label: 'Avatar' },
  { key: 'economie',   label: 'Donuts & Gemmes' },
]

function toHHMM(timeStr) {
  if (!timeStr) return ''
  // 'HH:MM:SS' → 'HH:MM'
  return timeStr.slice(0, 5)
}

export default function Parametres() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  // --- Pseudo ---
  const [newPseudo, setNewPseudo] = useState('')
  const [pseudoMsg, setPseudoMsg] = useState(null)
  const [pseudoLoading, setPseudoLoading] = useState(false)

  // --- Mot de passe ---
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  // --- Contrôle parental ---
  const [parentalConfig, setParentalConfig] = useState(null)  // null = en chargement
  const [parentalLoading, setParentalLoading] = useState(true)
  const [parentalMsg, setParentalMsg] = useState(null)

  // Setup (non configuré)
  const [setupCode, setSetupCode]       = useState('')
  const [setupCodeConfirm, setSetupCodeConfirm] = useState('')
  const [setupVisible, setSetupVisible] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)

  // Déverrouillage (configuré)
  const [unlockCode, setUnlockCode]     = useState('')
  const [unlocked, setUnlocked]         = useState(false)
  const [unlockLoading, setUnlockLoading] = useState(false)

  // Formulaire de réglages (après déverrouillage)
  const [duree, setDuree]               = useState(null)   // int ou null
  const [heureDebut, setHeureDebut]     = useState('')
  const [heureFin, setHeureFin]         = useState('')
  const [modulesBloques, setModulesBloques] = useState([])
  const [actif, setActif]               = useState(true)
  const [saveLoading, setSaveLoading]   = useState(false)

  // Chargement initial
  useEffect(() => {
    async function loadParental() {
      setParentalLoading(true)
      const config = await getParental(user.id)
      setParentalConfig(config)
      if (config && config.configured) {
        setDuree(config.duree_max_minutes ?? null)
        setHeureDebut(toHHMM(config.heure_debut))
        setHeureFin(toHHMM(config.heure_fin))
        setModulesBloques(config.modules_bloques || [])
        setActif(config.actif ?? true)
      }
      setParentalLoading(false)
    }
    loadParental()
  }, [user.id])

  async function reloadParental() {
    const config = await getParental(user.id)
    setParentalConfig(config)
    if (config && config.configured) {
      setDuree(config.duree_max_minutes ?? null)
      setHeureDebut(toHHMM(config.heure_debut))
      setHeureFin(toHHMM(config.heure_fin))
      setModulesBloques(config.modules_bloques || [])
      setActif(config.actif ?? true)
    }
    return config
  }

  // --- Handlers pseudo / mot de passe ---

  async function handlePseudo(e) {
    e.preventDefault()
    const trimmed = newPseudo.trim()
    if (!trimmed) {
      setPseudoMsg({ type: 'err', text: 'Entre un pseudo.' })
      return
    }
    setPseudoLoading(true)
    setPseudoMsg(null)
    const res = await changePseudo(user.id, trimmed)
    if (res.error) {
      setPseudoMsg({ type: 'err', text: res.error })
    } else {
      updateUser({ pseudo: trimmed })
      setNewPseudo('')
      setPseudoMsg({ type: 'ok', text: 'Pseudo mis à jour !' })
    }
    setPseudoLoading(false)
  }

  async function handlePassword(e) {
    e.preventDefault()
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'err', text: 'Remplis tous les champs.' })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'err', text: 'Les nouveaux mots de passe ne correspondent pas.' })
      return
    }
    if (newPwd.length < 4) {
      setPwdMsg({ type: 'err', text: 'Le nouveau mot de passe doit faire au moins 4 caractères.' })
      return
    }
    setPwdLoading(true)
    setPwdMsg(null)
    const res = await changePassword(user.id, oldPwd, newPwd)
    if (res.error) {
      setPwdMsg({ type: 'err', text: res.error })
    } else {
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdMsg({ type: 'ok', text: 'Mot de passe changé avec succès !' })
    }
    setPwdLoading(false)
  }

  // --- Handlers contrôle parental ---

  async function handleSetup(e) {
    e.preventDefault()
    setParentalMsg(null)
    if (setupCode.length !== 4 || setupCodeConfirm.length !== 4) {
      setParentalMsg({ type: 'err', text: 'Le code doit faire exactement 4 chiffres.' })
      return
    }
    if (setupCode !== setupCodeConfirm) {
      setParentalMsg({ type: 'err', text: 'Les deux codes ne correspondent pas.' })
      return
    }
    setSetupLoading(true)
    await setParental(user.id, setupCode)
    const newConfig = await reloadParental()
    updateUser({ parental: newConfig })
    setSetupCode('')
    setSetupCodeConfirm('')
    setSetupVisible(false)
    setParentalMsg({ type: 'ok', text: 'Contrôle parental configuré avec succès ! 🎉' })
    setSetupLoading(false)
  }

  async function handleUnlock(e) {
    e.preventDefault()
    setParentalMsg(null)
    setUnlockLoading(true)
    const ok = await verifyParentalCode(user.id, unlockCode)
    if (!ok) {
      setParentalMsg({ type: 'err', text: 'Code incorrect.' })
      setUnlockLoading(false)
      return
    }
    setUnlocked(true)
    setUnlockLoading(false)
  }

  function toggleModule(key) {
    setModulesBloques(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    setParentalMsg(null)
    setSaveLoading(true)
    const res = await updateParental(
      user.id,
      unlockCode,
      duree,
      heureDebut,
      heureFin,
      modulesBloques,
      actif
    )
    if (res.error) {
      setParentalMsg({ type: 'err', text: res.error })
    } else {
      const newConfig = await reloadParental()
      updateUser({ parental: newConfig })
      setParentalMsg({ type: 'ok', text: 'Paramètres parentaux enregistrés !' })
    }
    setSaveLoading(false)
  }

  // --- Rendu section contrôle parental ---

  function renderParental() {
    if (parentalLoading) {
      return <p className="settings__note">Chargement…</p>
    }

    if (!parentalConfig || !parentalConfig.configured) {
      // Non configuré
      return (
        <>
          <p className="settings__note">
            Tends ton téléphone à un parent 👋
          </p>
          {!setupVisible ? (
            <button
              className="settings__btn"
              type="button"
              onClick={() => {
                setSetupVisible(true)
                setParentalMsg(null)
              }}
            >
              Configurer avec un parent
            </button>
          ) : (
            <form className="settings__form" onSubmit={handleSetup}>
              <input
                className="settings__input settings__input--code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Code parent (4 chiffres)"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoComplete="off"
              />
              <input
                className="settings__input settings__input--code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Confirme le code"
                value={setupCodeConfirm}
                onChange={(e) => setSetupCodeConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoComplete="off"
              />
              <div className="settings__row">
                <button
                  className="settings__btn settings__btn--ghost"
                  type="button"
                  onClick={() => {
                    setSetupVisible(false)
                    setSetupCode('')
                    setSetupCodeConfirm('')
                    setParentalMsg(null)
                  }}
                >
                  Annuler
                </button>
                <button className="settings__btn" type="submit" disabled={setupLoading}>
                  {setupLoading ? 'En cours…' : 'Activer'}
                </button>
              </div>
            </form>
          )}
        </>
      )
    }

    // Configuré mais pas encore déverrouillé
    if (!unlocked) {
      return (
        <form className="settings__form" onSubmit={handleUnlock}>
          <p className="settings__note">
            Entre le code parent pour accéder aux réglages.
          </p>
          <input
            className="settings__input settings__input--code"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="Code parent (4 chiffres)"
            value={unlockCode}
            onChange={(e) => setUnlockCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoComplete="off"
          />
          <button className="settings__btn" type="submit" disabled={unlockLoading}>
            {unlockLoading ? 'Vérification…' : 'Déverrouiller'}
          </button>
        </form>
      )
    }

    // Configuré + déverrouillé : formulaire de réglages
    return (
      <form className="settings__form" onSubmit={handleSave}>

        {/* Toggle actif */}
        <label className="settings__toggle-row">
          <span className="settings__toggle-label">Contrôle parental activé</span>
          <div
            className={`settings__toggle ${actif ? 'settings__toggle--on' : ''}`}
            role="switch"
            aria-checked={actif}
            tabIndex={0}
            onClick={() => setActif(v => !v)}
            onKeyDown={(e) => e.key === ' ' && setActif(v => !v)}
          >
            <div className="settings__toggle-thumb" />
          </div>
        </label>

        {/* Durée max */}
        <div className="settings__field">
          <label className="settings__label">Durée max par jour (en minutes)</label>
          <input
            className="settings__input"
            type="number"
            min="1"
            max="1440"
            value={duree === null ? '' : duree}
            placeholder="Laisse vide pour illimité"
            onChange={(e) => {
              const val = e.target.value
              setDuree(val === '' ? null : Math.min(1440, Math.max(1, Number(val))))
            }}
          />
          <span className="settings__example">ex : 60 pour 1 heure, 90 pour 1h30</span>
        </div>

        {/* Tranche horaire */}
        <div className="settings__field">
          <label className="settings__label">Tranche horaire autorisée</label>
          <div className="settings__time-row">
            <input
              className="settings__input settings__input--time"
              type="time"
              value={heureDebut}
              onChange={(e) => setHeureDebut(e.target.value)}
            />
            <span className="settings__time-sep">→</span>
            <input
              className="settings__input settings__input--time"
              type="time"
              value={heureFin}
              onChange={(e) => setHeureFin(e.target.value)}
            />
          </div>
          <p className="settings__note">Laisser vide = pas de restriction horaire.</p>
        </div>

        {/* Modules bloqués */}
        <div className="settings__field">
          <label className="settings__label">Modules bloqués</label>
          <div className="settings__checkboxes">
            {MODULES_LIST.map(({ key, label }) => (
              <label key={key} className="settings__checkbox-row">
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={modulesBloques.includes(key)}
                  onChange={() => toggleModule(key)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="settings__btn" type="submit" disabled={saveLoading}>
          {saveLoading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    )
  }

  return (
    <div className="settings">
      <Backdrop />

      {/* Barre du haut */}
      <div className="settings__topbar">
        <button className="settings__back" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
      </div>

      {/* En-tête avatar + pseudo */}
      <div className="settings__card settings__header">
        <FallGuy avatar={user.avatar} className="settings__av" anim="idle" role={user.role} />
        <p className="settings__pseudo">{user.pseudo}</p>
      </div>

      {/* Section : Revoir le tutoriel */}
      <div className="settings__card">
        <h2 className="settings__section-title">Tutoriel de bienvenue</h2>
        <p className="settings__note">Tu veux revoir comment fonctionne Zigzam ?</p>
        <button
          className="settings__btn"
          onClick={() => navigate('/dashboard', { state: { revoirTuto: true } })}
        >
          Revoir le tutoriel 🎓
        </button>
      </div>

      {/* Section : Mon numéro */}
      <div className="settings__card">
        <h2 className="settings__section-title">Mon numéro</h2>
        <p className="settings__numero">{user.numero}</p>
        <p className="settings__note">
          Ton numéro ne change pas — c'est comme ton numéro de téléphone dans Zigzam.
        </p>
      </div>

      {/* Section : Changer mon pseudo */}
      <div className="settings__card">
        <h2 className="settings__section-title">Changer mon pseudo</h2>
        <form className="settings__form" onSubmit={handlePseudo}>
          <input
            className="settings__input"
            type="text"
            placeholder="Nouveau pseudo"
            value={newPseudo}
            onChange={(e) => setNewPseudo(e.target.value)}
            maxLength={30}
            autoComplete="off"
          />
          <button className="settings__btn" type="submit" disabled={pseudoLoading}>
            {pseudoLoading ? 'En cours…' : 'Valider'}
          </button>
        </form>
        {pseudoMsg && (
          <p className={`settings__msg settings__msg--${pseudoMsg.type}`}>
            {pseudoMsg.text}
          </p>
        )}
      </div>

      {/* Section : Changer mon mot de passe */}
      <div className="settings__card">
        <h2 className="settings__section-title">Changer mon mot de passe</h2>
        <form className="settings__form" onSubmit={handlePassword}>
          <input
            className="settings__input"
            type="password"
            placeholder="Mot de passe actuel"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            autoComplete="current-password"
          />
          <input
            className="settings__input"
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            autoComplete="new-password"
          />
          <input
            className="settings__input"
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
          />
          <button className="settings__btn" type="submit" disabled={pwdLoading}>
            {pwdLoading ? 'En cours…' : 'Changer le mot de passe'}
          </button>
        </form>
        {pwdMsg && (
          <p className={`settings__msg settings__msg--${pwdMsg.type}`}>
            {pwdMsg.text}
          </p>
        )}
      </div>

      {/* Section : Contrôle parental */}
      <div className="settings__card">
        <h2 className="settings__section-title">Contrôle parental 🛡️</h2>
        {renderParental()}
        {parentalMsg && (
          <p className={`settings__msg settings__msg--${parentalMsg.type}`}>
            {parentalMsg.text}
          </p>
        )}
      </div>
    </div>
  )
}
