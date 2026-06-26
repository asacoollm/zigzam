import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { setDateNaissance } from '../lib/modules'
import BirthdatePicker from './BirthdatePicker'
import './BirthdayModal.css'

// Clé de session : une fois « Plus tard » cliqué, la modale ne réapparaît plus
// pendant cette session ; elle revient à la prochaine connexion (clé effacée
// au signIn dans AuthContext).
const DISMISS_KEY = 'zigzam:birthday-dismissed'

function dismissed() {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}

// Modale demandant la date de naissance aux utilisateurs déjà inscrits qui ne
// l'ont pas encore renseignée. Affichée une seule fois par connexion.
export default function BirthdayModal() {
  const { user, updateUser } = useAuth()
  const [hidden, setHidden] = useState(() => dismissed())
  const [naissance, setNaissance] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (hidden) return null

  const plusTard = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setHidden(true)
  }

  const enregistrer = async () => {
    if (!naissance) {
      setError('Choisis ta date de naissance 🙂')
      return
    }
    setBusy(true)
    setError('')
    const res = await setDateNaissance(user.id, naissance)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    updateUser({ date_naissance: res.date_naissance })
    setHidden(true)
  }

  return (
    <div className="bday-modal">
      <div className="bday-modal__panel" role="dialog" aria-modal="true">
        <span className="bday-modal__emoji">🎂</span>
        <h2 className="bday-modal__title">On a besoin de ta date de naissance !</h2>
        <p className="bday-modal__text">
          C'est pour pouvoir te souhaiter ton anniversaire 🥳 Tu peux la renseigner
          maintenant ou plus tard.
        </p>
        <BirthdatePicker value={naissance} onChange={setNaissance} autoFocus />
        {error && <p className="bday-modal__error">{error}</p>}
        <div className="bday-modal__actions">
          <button className="bday-modal__btn bday-modal__btn--ghost" onClick={plusTard} disabled={busy}>
            Plus tard
          </button>
          <button className="bday-modal__btn bday-modal__btn--main" onClick={enregistrer} disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
