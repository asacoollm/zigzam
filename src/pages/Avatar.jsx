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

    // Cas spécial : skin sur mesure → débit + ouverture d'une discussion avec Asacool.
    if (tab === 'special') {
      setBusy(true)
      const res = await buyCustomSkin(user.id)
      setBusy(false)
      if (res.error) {
        flash(res.error)
        setPending(null)
        return
      }
      updateUser({ gemmes: res.gemmes })
      setPending(null)
      flash('🎉 Ta demande est envoyée ! Asacool a reçu ta demande officielle dans Discuter. Décris-lui ton skin de rêve !')
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

      {toast && <div className="av__toast">{toast}</div>}
    </div>
  )
}
