import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
import { saveAvatar, buyAccessory } from '../lib/auth'
import { buyCustomSkin } from '../lib/modules'
import {
  CATEGORIES, normalizeAvatar, isUnlocked, accKey, getSaisonItems, SAISON_LABELS,
} from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Avatar.css'

export default function Avatar() {
  const { user, updateUser } = useAuth()
  const { active: saisonActive, terminee: saisonTerminee, slug: saisonSlug } = useSaison()
  const navigate = useNavigate()

  const [avatar, setAvatar] = useState(() => normalizeAvatar(user.avatar))

  // Items exclusifs de la saison courante (ex. Jurassic Web), agrégés dans un
  // onglet virtuel. Onglet visible pendant la saison OU si l'élève en possède
  // déjà (skins gardés à vie, ré-équipables après la fin).
  const saisonItems = useMemo(() => getSaisonItems(saisonSlug || 'jurassic'), [saisonSlug])
  const ownsAnySaison = saisonItems.some((it) =>
    (avatar.owned ?? []).includes(accKey(it._cat, it.id)))
  const showSaisonTab = !!saisonSlug && (saisonActive || ownsAnySaison)

  // Liste des onglets : l'onglet saison (virtuel) en tête s'il est visible.
  const TABS = useMemo(() => {
    if (!showSaisonTab) return CATEGORIES
    return [
      { id: '__saison', label: SAISON_LABELS[saisonSlug] || 'Exclusif', emoji: '🦕', virtual: true },
      ...CATEGORIES,
    ]
  }, [showSaisonTab, saisonSlug])

  const [tab, setTab] = useState(showSaisonTab ? '__saison' : CATEGORIES[0].id)
  const [pending, setPending] = useState(null) // accessoire payant en attente de confirmation
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [skinForm, setSkinForm] = useState(false) // formulaire de demande de skin sur mesure
  const [skinDesc, setSkinDesc] = useState('')
  const [skinRef, setSkinRef] = useState('')
  const [celebrate, setCelebrate] = useState(null) // avatar fêté après un achat (animation)

  const isSaisonTab = tab === '__saison'
  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === tab),
    [tab],
  )

  // Catégorie native d'un item (pour l'onglet saison, chaque item porte _cat).
  const catOf = (item) => item._cat || tab

  // Items affichés dans la grille : onglet saison = items de saison ;
  // onglets normaux = leurs items SANS les exclusifs de saison.
  const gridItems = isSaisonTab
    ? saisonItems
    : (activeCategory?.items ?? []).filter((it) => !it.saison)

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
    const cat = catOf(item)
    const owned = (avatar.owned ?? []).includes(accKey(cat, item.id))
    // Skin de saison terminée non possédé : plus achetable (mais conservé si acquis).
    if (item.saison && saisonTerminee && !owned) {
      flash('🦕 Saison terminée — ce skin n’est plus disponible à l’achat.')
      return
    }
    // Retirer l'accessoire déjà équipé (sauf la couleur, toujours présente).
    if (avatar[cat] === item.id) {
      if (cat !== 'color') applyFree({ [cat]: null })
      return
    }
    // Gratuit ou déjà acheté → on équipe directement.
    if (isUnlocked(avatar, cat, item)) {
      applyFree({ [cat]: item.id })
      return
    }
    // Payant non possédé → popup d'aperçu (achat possible si assez de gemmes).
    setPending(item)
  }

  const confirmBuy = async () => {
    if (!pending) return

    // Cas spécial : skin sur mesure → on demande d'abord la description du skin de rêve.
    if (catOf(pending) === 'special') {
      setPending(null)
      setSkinDesc('')
      setSkinRef('')
      setSkinForm(true)
      return
    }

    setBusy(true)
    const res = await buyAccessory(user.id, catOf(pending), pending.id, pending.price)
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
    // Animation de célébration : le bonhomme paraît avec son nouvel accessoire.
    setCelebrate(nextAvatar)
    window.clearTimeout(confirmBuy._t)
    confirmBuy._t = window.setTimeout(() => setCelebrate(null), 2800)
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
          {/* Onglets de catégories (+ onglet exclusif de saison en tête) */}
          <div className="av__tabs" role="tablist">
            {TABS.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={tab === c.id}
                className={`av__tab ${tab === c.id ? 'av__tab--on' : ''} ${c.virtual ? 'av__tab--saison' : ''}`}
                onClick={() => setTab(c.id)}
              >
                <span className="av__tab-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Bandeau de l'onglet exclusif de saison */}
          {isSaisonTab && (
            <p className={`av__saison-note ${saisonTerminee ? 'av__saison-note--over' : ''}`}>
              {saisonTerminee
                ? '🦕 Saison terminée — tu gardes à vie les skins déjà acquis, mais les autres ne sont plus achetables.'
                : '🦕 Skins exclusifs de la saison ! Achète-les pendant la saison : ils restent à vie sur ton compte.'}
            </p>
          )}

          {/* Grille d'accessoires de la catégorie active */}
          <div className="av__grid">
            {gridItems.map((item) => {
              const cat = catOf(item)
              const equipped = avatar[cat] === item.id
              const unlocked = isUnlocked(avatar, cat, item)
              const owned = (avatar.owned ?? []).includes(accKey(cat, item.id))
              const affordable = user.gemmes >= item.price
              const closed = item.saison && saisonTerminee && !owned
              const locked = closed || (!unlocked && !affordable)

              return (
                <button
                  key={`${cat}:${item.id}`}
                  className={`acc ${equipped ? 'acc--on' : ''} ${
                    locked ? 'acc--locked' : ''
                  } ${closed ? 'acc--closed' : ''}`}
                  onClick={() => pickItem(item)}
                >
                  <FallGuy
                    className="acc__preview"
                    avatar={{ color: '#c9cde0', [cat]: item.id }}
                  />
                  <span className="acc__label">{item.label}</span>
                  {closed ? (
                    <span className="acc__tag acc__tag--closed">Saison terminée</span>
                  ) : item.price === 0 ? (
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
              avatar={{ ...avatar, [catOf(pending)]: pending.id }}
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

      {/* Célébration plein écran après un achat d'accessoire */}
      {celebrate && (
        <div className="celebrate" onClick={() => setCelebrate(null)}>
          <div className="celebrate__confetti" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className={`celebrate__bit celebrate__bit--${i % 6}`} />
            ))}
          </div>
          <div className="celebrate__stars" aria-hidden="true">
            {['✨', '⭐', '🌟', '✨', '⭐', '🌟', '✨', '⭐'].map((s, i) => (
              <span key={i} className={`celebrate__star celebrate__star--${i}`}>{s}</span>
            ))}
          </div>
          <div className="celebrate__bubble">Trop stylé ! 😎</div>
          <FallGuy
            className="celebrate__hero"
            avatar={celebrate}
            anim="pose"
            expression="moque"
            role={user.role}
          />
        </div>
      )}

      {toast && <div className="av__toast">{toast}</div>}
    </div>
  )
}
