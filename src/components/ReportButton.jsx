import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createBugReport } from '../lib/modules'
import FallGuy from './FallGuy'
import './ReportButton.css'

// Bouton flottant de signalement (présent sur toutes les pages connectées).
// Ouvre une modale « chat » avec un avatar Zigzam officiel (admin).
export default function ReportButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const openModal = () => {
    setMessage('')
    setSent(false)
    setError('')
    setOpen(true)
  }

  // Ferme la modale avec la touche Échap.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!user) return null

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    if (!message.trim()) {
      setError('Écris un petit message pour décrire le problème 🙂')
      return
    }
    setSending(true)
    const res = await createBugReport(user.id, message.trim())
    setSending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setSent(true)
  }

  return (
    <>
      <button
        className="report-fab"
        onClick={openModal}
        aria-label="Signaler un problème"
        title="Signaler un problème"
      >
        <span className="report-fab__icon">🚨</span>
        <span className="report-fab__label">Signaler un problème</span>
      </button>

      {open && (
        <div className="report-modal" onMouseDown={() => setOpen(false)}>
          <div
            className="report-modal__panel"
            role="dialog"
            aria-label="Signaler un problème"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="report-modal__head">
              <div className="report-modal__zig">
                <FallGuy className="report-modal__avatar" color="violet" role="admin" />
                <div className="report-modal__zig-meta">
                  <span className="report-modal__zig-name">Zigzam <span className="report-modal__badge">admin</span></span>
                  <span className="report-modal__zig-sub">Support officiel 🛠️</span>
                </div>
              </div>
              <button className="report-modal__close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
            </header>

            {!sent ? (
              <form className="report-modal__body" onSubmit={handleSend}>
                <div className="report-bubble">
                  Salut&nbsp;! Tu as un problème&nbsp;? Décris-le moi et je le transmettrai à
                  {' '}<strong>Asacool</strong> 🛠️
                </div>
                <textarea
                  className="report-modal__textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explique ce qui ne va pas…"
                  rows={4}
                  autoFocus
                />
                {error && <p className="report-modal__error">{error}</p>}
                <button className="report-modal__send" type="submit" disabled={sending}>
                  {sending ? 'Envoi…' : 'Envoyer 🚀'}
                </button>
              </form>
            ) : (
              <div className="report-modal__body report-modal__body--done">
                <div className="report-bubble">
                  Merci&nbsp;! <strong>Asacool</strong> a été prévenu. Il s'en occupera dès que possible 💪
                </div>
                <button className="report-modal__send" onClick={() => setOpen(false)}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
