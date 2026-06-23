import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  login, getStoredUser, rememberPseudo, getRememberedPseudo, forgetDevice,
} from '../lib/auth'
import { getParental, validateInviteCode, signupWithCode } from '../lib/modules'
import { isOutsideAllowedHours, PAUSE_MESSAGE_HORAIRE } from '../lib/parental'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Login.css'

export default function Login() {
  const { signIn, pauseMessage, clearPause } = useAuth()
  const navigate = useNavigate()

  const rememberedPseudo = getRememberedPseudo()

  const [mode, setMode] = useState('login') // 'login' | 'invite' | 'signup'
  const [pseudo, setPseudo] = useState(rememberedPseudo || '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(!!rememberedPseudo)
  const [remembered, setRemembered] = useState(rememberedPseudo) // pseudo mémorisé sur cet appareil

  const passwordRef = useRef(null)
  const lastAvatar = getStoredUser()?.avatar ?? null

  // Reconnexion rapide : on garde le pseudo et on place le curseur sur le mot de passe.
  const quickReconnect = () => {
    if (remembered) setPseudo(remembered)
    passwordRef.current?.focus()
  }

  // Oublier cet appareil : efface le pseudo mémorisé et masque la reconnexion rapide.
  const handleForget = () => {
    forgetDevice()
    setRemembered(null)
    setRemember(false)
    setPseudo('')
  }

  const reset = (m) => {
    setMode(m)
    setError('')
    setInfo('')
    setPassword('')
    clearPause()
  }

  // --- Connexion ---
  // Connexion « normale » : elle doit TOUJOURS fonctionner avec le pseudo + mot de
  // passe saisis, quel que soit l'état du localStorage (vide, pseudo mémorisé
  // différent, données d'un autre utilisateur…). On ne lit jamais le localStorage
  // ici : on s'appuie uniquement sur les champs du formulaire.
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const pseudoSaisi = pseudo.trim()
    if (!pseudoSaisi || !password) {
      setError('Remplis ton pseudo et ton mot de passe 😊')
      return
    }
    setLoading(true)
    try {
      const result = await login(pseudoSaisi, password)
      if (result.error) {
        setError(result.error)
        return
      }
      // Contrôle parental : blocage horaire éventuel (ne doit jamais bloquer si KO).
      let parental = null
      try {
        parental = await getParental(result.user.id)
      } catch (err) {
        console.error('[login] contrôle parental indisponible :', err)
      }
      if (isOutsideAllowedHours(parental)) {
        setError(PAUSE_MESSAGE_HORAIRE)
        return
      }
      // « Se souvenir de moi » : on mémorise seulement le pseudo saisi (jamais le
      // mot de passe). Sinon on efface toute trace mémorisée sur cet appareil — y
      // compris un éventuel pseudo d'un autre utilisateur.
      if (remember) rememberPseudo(pseudoSaisi)
      else forgetDevice()
      signIn({ ...result.user, parental })
      navigate(result.user.premiere_connexion ? '/onboarding' : '/dashboard', {
        replace: true,
      })
    } catch (err) {
      // Garde-fou : aucune exception inattendue ne doit laisser le bouton bloqué.
      console.error('[login] erreur inattendue :', err)
      setError('Oups, une erreur est survenue. Réessaie !')
    } finally {
      setLoading(false)
    }
  }

  // --- Étape code d'invitation ---
  const handleCheckCode = async (e) => {
    e.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Entre ton code d’invitation 🎟️')
      return
    }
    setLoading(true)
    const valid = await validateInviteCode(code)
    setLoading(false)
    if (!valid) {
      setError("Ce code d'invitation n'est pas valide 😕")
      return
    }
    reset('signup')
    setCode(code) // conservé pour la création
  }

  // --- Création de compte ---
  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (!pseudo.trim() || !password) {
      setError('Choisis un pseudo et un mot de passe 😊')
      return
    }
    setLoading(true)
    const res = await signupWithCode(code, pseudo, password)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setMode('login')
    setPassword('')
    setInfo('Compte créé ! 🎉 Connecte-toi maintenant.')
  }

  return (
    <div className="login">
      <Backdrop />

      <div className="login__card">
        <FallGuy className="login__mascot" color="#7c3aff" avatar={lastAvatar} />
        <ZigzamLogo size="lg" className="login__logo" />

        {pauseMessage && <p className="login__pause">{pauseMessage}</p>}
        {info && <p className="login__info">{info}</p>}

        {/* ---------- CONNEXION ---------- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            {remembered ? (
              <div className="login__quick">
                <p className="login__quick-hi">👋 Re-bonjour <strong>{remembered}</strong> !</p>
                <button type="button" className="login__quick-btn" onClick={quickReconnect}>
                  👋 Reconnexion rapide
                </button>
              </div>
            ) : (
              <p className="login__subtitle">Connecte-toi pour jouer !</p>
            )}
            <label className="field">
              <span className="field__label">👤 Ton pseudo</span>
              <input
                className="field__input" type="text" value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex : lucas" autoComplete="username" autoFocus={!remembered}
              />
            </label>
            <label className="field">
              <span className="field__label">🔒 Ton mot de passe</span>
              <div className="field__password">
                <input
                  ref={passwordRef}
                  className="field__input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••" autoComplete="current-password"
                />
                <button type="button" className="field__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Cacher' : 'Afficher'}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <label className="login__remember">
              <input
                type="checkbox" checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Se souvenir de moi 💾</span>
            </label>
            {error && <p className="login__error">{error}</p>}
            <button className="login__button" type="submit" disabled={loading}>
              {loading ? 'On y va…' : "C'est parti ! 🚀"}
            </button>
            {remembered && (
              <button type="button" className="login__link login__forget" onClick={handleForget}>
                🗑️ Oublier cet appareil
              </button>
            )}
            <button type="button" className="login__link" onClick={() => reset('invite')}>
              Pas encore de compte ? Créer mon compte 🎉
            </button>
          </form>
        )}

        {/* ---------- CODE D'INVITATION ---------- */}
        {mode === 'invite' && (
          <form onSubmit={handleCheckCode}>
            <p className="login__subtitle">Entre ton code d'invitation 🎟️</p>
            <label className="field">
              <span className="field__label">🎟️ Code d'invitation</span>
              <input
                className="field__input" type="text" value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex : ABC123" autoFocus
              />
            </label>
            {error && <p className="login__error">{error}</p>}
            <button className="login__button" type="submit" disabled={loading}>
              {loading ? 'Vérification…' : 'Valider le code ✨'}
            </button>
            <button type="button" className="login__link" onClick={() => reset('login')}>
              ⬅️ Retour à la connexion
            </button>
          </form>
        )}

        {/* ---------- CRÉATION DE COMPTE ---------- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <p className="login__subtitle">Crée ton compte Zigzam ! 🦓</p>
            <label className="field">
              <span className="field__label">👤 Choisis ton pseudo</span>
              <input
                className="field__input" type="text" value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex : lucas" autoComplete="username" autoFocus
              />
            </label>
            <label className="field">
              <span className="field__label">🔒 Choisis un mot de passe</span>
              <input
                className="field__input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••" autoComplete="new-password"
              />
            </label>
            {error && <p className="login__error">{error}</p>}
            <button className="login__button" type="submit" disabled={loading}>
              {loading ? 'Création…' : 'Créer mon compte 🎉'}
            </button>
            <button type="button" className="login__link" onClick={() => reset('login')}>
              ⬅️ Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
