import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { changePassword, changePseudo } from '../lib/modules'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Parametres.css'

export default function Parametres() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  // --- Pseudo ---
  const [newPseudo, setNewPseudo] = useState('')
  const [pseudoMsg, setPseudoMsg] = useState(null) // { type: 'ok'|'err', text }
  const [pseudoLoading, setPseudoLoading] = useState(false)

  // --- Mot de passe ---
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState(null)
  const [pwdLoading, setPwdLoading] = useState(false)

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
        <FallGuy avatar={user.avatar} className="settings__av" anim="idle" />
        <p className="settings__pseudo">{user.pseudo}</p>
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

      {/* Section : Contrôle parental — désactivée */}
      <div className="settings__card settings__card--disabled">
        <div className="settings__disabled-overlay">
          <span className="settings__lock">🔒</span>
          <span className="settings__soon">Bientôt disponible</span>
        </div>
        <h2 className="settings__section-title">Contrôle parental</h2>
        <p className="settings__note">
          Gère les accès et les restrictions pour les comptes enfants.
        </p>
      </div>
    </div>
  )
}
