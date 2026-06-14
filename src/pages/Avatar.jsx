import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { saveAvatar, buyAccessory } from '../lib/auth'
import { buyCustomSkin } from '../lib/modules'
import { CATEGORIES, normalizeAvatar, isUnlocked, accKey } from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Avatar.css'

export default function Avatar() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [avatar, setAvatar] = useState(() => normalizeAvatar(user.avatar))
  const [tab, setTab] = useState(CATEGORIES[0].id)
  const [pending, setPending] = useState(null) // accessoire payant en attente de confirmation
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [skinForm, setSkinForm] = useState(false) // formulaire de demande de skin sur mesure
  const [skinDesc, setSkinDesc] = useState('')
  const [skinRef, setSkinRef] = useState('')

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === tab),
    [tab],
  )

  const flash = (msg) => {
    setToast(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setToast(''), 2200)
  }

  // Applique localement + persiste (changements gratuits : couleur, accessoire gratuit, retrait).
  const applyFree = async (patch) => {
    const next = { ...avatar, ...patch }
    setAvatar(next)
    updateUser({ avatar: next })
    const res = await saveAvatar(user.id, next)
    if (res.error) flash(res.error)
  }

  const pickItem = (item) => {
    // Retirer l'accessoire déjà équipé (sauf la couleur, toujours présente).
    if (avatar[tab] === item.id) {
      if (tab !== 'color') applyFree({ [tab]: null })
      return
    }
    // Gratuit ou déjà acheté → on équipe directement.
    if (isUnlocked(avatar, tab, item)) {
      applyFree({ [tab]: item.id })
      return
    }
    // Payant non possédé → popup d'aperçu (achat possible si assez de gemmes).
    setPending(item)
  }

  const confirmBuy = async () => {
    if (!pending) return

    // Cas spécial : skin sur mesure → on demande d'abord la description du skin de rêve.
    if (tab === 'special') {
      setPending(null)
      setSkinDesc('')
      setSkinRef('')
      setSkinForm(true)
      return
    }

    setBusy(true)
    const res = await buyAccessory(user.id, tab, pending.id, pending.price)
    setBusy(false)

    if (res.error) {
      flash(res.error)
      setPending(null)
      return
    }

    const nextAvatar = normalizeAvatar(res.avatar)
    setAvatar(nextAvatar)
    updateUser({ avatar: nextAvatar, gemmes: res.gemmes })
    setPending(null)
    flash(`${pending.label} débloqué ! 🎉`)
  }

  // Envoi de la demande de skin sur mesure (débit 20 💎 + message à Asacool avec la description).
  const submitSkinRequest = async (e) => {
    e.preventDefault()
    if (!skinDesc.trim()) {
      flash('Décris ton skin de rêve avant d’envoyer 🎨')
      return
    }
    setBusy(true)
    const res = await buyCustomSkin(user.id, skinDesc.trim(), skinRef.trim())
    setBusy(false)
    if (res.error) {
      flash(res.error)
      return
    }
    updateUser({ gemmes: res.gemmes })
    setSkinForm(false)
    flash('🎉 Ta demande est envoyée ! Asacool l’a reçue dans Discuter avec ta description.')
  }

  return (
    <div className="av">
      <Backdrop />

      <header className="av__top">
        <button className="av__back" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
        <span className="av__gems">💎 {user.gemmes}</span>
      </header>

      <main className="av__main">
        {/* Bonhomme en grand, mis à jour en temps réel */}
        <section className="av__stage">
          <FallGuy className="av__hero" avatar={avatar} anim="idle" />
          <p className="av__name">{user.pseudo}</p>
        </section>

        <section className="av__panel">
          {/* Onglets de catégories */}
          <div className="av__tabs" role="tablist">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={tab === c.id}
                className={`av__tab ${tab === c.id ? 'av__tab--on' : ''}`}
                onClick={() => setTab(c.id)}
              >
                <span className="av__tab-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Grille d'accessoires de la catégorie active */}
          <div className="av__grid">
            {activeCategory.items.map((item) => {
              const equipped = avatar[tab] === item.id
              const unlocked = isUnlocked(avatar, tab, item)
              const owned = (avatar.owned ?? []).includes(accKey(tab, item.id))
              const affordable = user.gemmes >= item.price
              const locked = !unlocked && !affordable

              return (
                <button
                  key={item.id}
                  className={`acc ${equipped ? 'acc--on' : ''} ${
                    locked ? 'acc--locked' : ''
                  }`}
                  onClick={() => pickItem(item)}
                >
                  <FallGuy
                    className="acc__preview"
                    avatar={{ color: '#c9cde0', [tab]: item.id }}
                  />
                  <span className="acc__label">{item.label}</span>
                  {item.price === 0 ? (
                    <span className="acc__tag acc__tag--free">Gratuit</span>
                  ) : owned ? (
                    <span className="acc__tag acc__tag--owned">✓ Acquis</span>
                  ) : (
                    <span className="acc__tag acc__tag--price">
                      💎 {item.price}
                    </span>
                  )}
                  {equipped && <span className="acc__check">✓</span>}
                </button>
              )
            })}
          </div>
        </section>
      </main>

      {/* Popup d'aperçu d'un accessoire verrouillé */}
      {pending && (
        <div className="modal" onClick={() => !busy && setPending(null)}>
          <div className="modal__card" onClick={(e) => e.stopPropagation()}>
            <FallGuy
              className="modal__preview"
              avatar={{ ...avatar, [tab]: pending.id }}
              anim="idle"
            />
            <h3 className="modal__title">{pending.label}</h3>
            {pending.desc && <p className="modal__desc">{pending.desc}</p>}
            <p className="modal__cost">
              Prix : <strong>💎 {pending.price}</strong>
            </p>
            {user.gemmes >= pending.price && (
              <p className="modal__after">
                Il te restera 💎 {user.gemmes - pending.price} gemmes.
              </p>
            )}
            <div className="modal__actions">
              <button
                className="modal__btn modal__btn--ghost"
                onClick={() => setPending(null)}
                disabled={busy}
              >
                Fermer
              </button>
              {user.gemmes >= pending.price ? (
                <button className="modal__btn" onClick={confirmBuy} disabled={busy}>
                  {busy ? 'Achat…' : `Acheter pour ${pending.price} 💎`}
                </button>
              ) : (
                <button className="modal__btn modal__btn--off" disabled>
                  Pas assez de gemmes 💎
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de demande de skin sur mesure */}
      {skinForm && (
        <div className="modal" onClick={() => !busy && setSkinForm(false)}>
          <form
            className="modal__card skin-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitSkinRequest}
          >
            <h3 className="modal__title">🎨 Décris ton skin de rêve !</h3>
            <textarea
              className="skin-form__textarea"
              value={skinDesc}
              onChange={(e) => setSkinDesc(e.target.value)}
              placeholder="Décris ton skin en détail : couleurs, accessoires, style, personnage inspirant…"
              rows={5}
              maxLength={800}
              autoFocus
            />
            <input
              className="skin-form__input"
              value={skinRef}
              onChange={(e) => setSkinRef(e.target.value)}
              placeholder="Une référence image ? (colle un lien)"
              maxLength={400}
            />
            <p className="modal__cost">
              Coût : <strong>💎 20</strong> — débité à l’envoi.
            </p>
            <div className="modal__actions">
              <button
                type="button"
                className="modal__btn modal__btn--ghost"
                onClick={() => setSkinForm(false)}
                disabled={busy}
              >
                Annuler
              </button>
              <button className="modal__btn" type="submit" disabled={busy}>
                {busy ? 'Envoi…' : 'Envoyer ma demande 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="av__toast">{toast}</div>}
    </div>
  )
}
