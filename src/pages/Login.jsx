import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login } from '../lib/auth'
import './Login.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!pseudo.trim() || !password) {
      setError('Remplis ton pseudo et ton mot de passe 😊')
      return
    }

    setLoading(true)
    const result = await login(pseudo, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    signIn(result.user)
    navigate(result.user.premiere_connexion ? '/onboarding' : '/dashboard', {
      replace: true,
    })
  }

  return (
    <div className="login">
      <div className="login__blobs" aria-hidden="true">
        <span className="blob blob--1">🍩</span>
        <span className="blob blob--2">💎</span>
        <span className="blob blob--3">⭐</span>
        <span className="blob blob--4">🎮</span>
      </div>

      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">🦓</div>
        <h1 className="login__title">Zigzam</h1>
        <p className="login__subtitle">Connecte-toi pour jouer !</p>

        <label className="field">
          <span className="field__label">👤 Ton pseudo</span>
          <input
            className="field__input"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Ex : lucas"
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">🔒 Ton mot de passe</span>
          <div className="field__password">
            <input
              className="field__input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="field__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? 'Cacher le mot de passe'
                  : 'Afficher le mot de passe'
              }
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </label>

        {error && <p className="login__error">{error}</p>}

        <button className="login__button" type="submit" disabled={loading}>
          {loading ? 'On y va…' : "C'est parti ! 🚀"}
        </button>
      </form>
    </div>
  )
}
