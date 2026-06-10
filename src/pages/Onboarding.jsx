import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { completeOnboarding } from '../lib/auth'
import './Onboarding.css'

export default function Onboarding() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const digitRefs = useRef([])

  // --- Étape 1 : nouveau mot de passe ---
  const goToStep2 = (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 4) {
      setError('Ton mot de passe doit faire au moins 4 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas pareils 🤔')
      return
    }
    setStep(2)
  }

  // --- Étape 2 : numéro à 4 chiffres ---
  const handleDigit = (index, value) => {
    const v = value.replace(/\D/g, '').slice(-1) // garde 1 seul chiffre
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < 3) digitRefs.current[index + 1]?.focus()
  }

  const handleDigitKey = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const numero = digits.join('')
    if (numero.length !== 4) {
      setError('Choisis bien tes 4 chiffres 🔢')
      return
    }

    setLoading(true)
    const result = await completeOnboarding(user.id, password, numero)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    updateUser({ premiere_connexion: false, numero })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="onb">
      <div className="onb__card">
        <div className="onb__logo">🦓</div>
        <h1 className="onb__title">Bienvenue {user.pseudo} !</h1>
        <p className="onb__subtitle">
          {step === 1
            ? 'Choisis un nouveau mot de passe secret 🤫'
            : 'Choisis ton numéro à 4 chiffres 📞'}
        </p>

        <div className="onb__steps" aria-hidden="true">
          <span className={`dot ${step >= 1 ? 'dot--on' : ''}`} />
          <span className={`dot ${step >= 2 ? 'dot--on' : ''}`} />
        </div>

        {step === 1 ? (
          <form className="onb__form" onSubmit={goToStep2}>
            <label className="field">
              <span className="field__label">🔒 Nouveau mot de passe</span>
              <input
                className="field__input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
                autoFocus
              />
            </label>

            <label className="field">
              <span className="field__label">✅ Encore une fois</span>
              <input
                className="field__input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
              />
            </label>

            {error && <p className="onb__error">{error}</p>}

            <button className="onb__button" type="submit">
              Continuer ➡️
            </button>
          </form>
        ) : (
          <form className="onb__form" onSubmit={handleSubmit}>
            <p className="onb__hint">
              C'est comme un numéro de téléphone dans Zigzam : tes copains
              pourront t'ajouter avec ! 📒
            </p>

            <div className="onb__digits">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (digitRefs.current[i] = el)}
                  className="onb__digit"
                  type="text"
                  inputMode="numeric"
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKey(i, e)}
                  autoFocus={i === 0}
                  aria-label={`Chiffre ${i + 1}`}
                />
              ))}
            </div>

            {error && <p className="onb__error">{error}</p>}

            <div className="onb__actions">
              <button
                className="onb__button onb__button--ghost"
                type="button"
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
              >
                ⬅️ Retour
              </button>
              <button
                className="onb__button"
                type="submit"
                disabled={loading}
              >
                {loading ? 'On y va…' : "C'est parti ! 🎉"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
