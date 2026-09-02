import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
import { saveAvatar, buyAccessory } from '../lib/auth'
import { buyCustomSkin, getMyCustomSkins } from '../lib/modules'
import { saveAvatarLoadout, getMyAvatarLoadouts, deleteAvatarLoadout } from '../lib/loadouts'
import {
  CATEGORIES, normalizeAvatar, isUnlocked, accKey, getSaisonItems,
  getSaisonsPossedees, loadoutToAvatar, SAISON_LABELS, SAISON_EMOJIS,
} from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Avatar.css'

const CUSTOM_TAB_ID = '__custom'

export default function Avatar() {
  const { user, updateUser } = useAuth()
  const { active: saisonActive, terminee: saisonTerminee, slug: saisonSlug } = useSaison()
  const navigate = useNavigate()

  const [avatar, setAvatar] = useState(() => normalizeAvatar(user.avatar))

  // ⭐ Skins Sur Mesure : uniquement ceux VALIDÉS par Asacool (jamais ceux en
  // attente — c'est ce qui les garde invisibles tant que la validation
  // n'a pas eu lieu, même si le skin est techniquement déjà « acquis »).
  const [myCustomSkins, setMyCustomSkins] = useState([])
  useEffect(() => {
    let on = true
    getMyCustomSkins(user.id).then((list) => on && setMyCustomSkins(Array.isArray(list) ? list : []))
    return () => { on = false }
  }, [user.id])
  const customItems = useMemo(
    () => myCustomSkins.map((s) => ({ id: s.item_id, label: s.nom, price: 20, _cat: s.category })),
    [myCustomSkins],
  )

  // Un onglet virtuel par saison : celle en cours, plus toutes celles dont
  // l'élève possède déjà au moins un skin (gardés à vie, ré-équipables même
  // une fois la saison terminée).
  const saisonSlugs = useMemo(() => {
    const slugs = getSaisonsPossedees(avatar)
    if (saisonSlug && saisonActive && !slugs.includes(saisonSlug)) slugs.unshift(saisonSlug)
    // La saison en cours passe toujours en tête.
    return slugs.sort((a, b) => (a === saisonSlug ? -1 : b === saisonSlug ? 1 : 0))
  }, [avatar, saisonSlug, saisonActive])

  // Onglets de saison (id = `__saison:<slug>`), suivis des catégories normales.
  // Une catégorie dont TOUS les items sont exclusifs de saison (ex. « Skins
  // complets ») n'apparaît pas dans les onglets normaux : elle serait vide.
  const TABS = useMemo(() => {
    const catsNormales = CATEGORIES.filter((c) => c.items.some((it) => !it.saison))
    return [
      ...saisonSlugs.map((slug) => ({
        id: `__saison:${slug}`,
        label: SAISON_LABELS[slug] || 'Exclusif',
        emoji: SAISON_EMOJIS[slug] || '⭐',
        virtual: true,
      })),
      ...(customItems.length
        ? [{ id: CUSTOM_TAB_ID, label: '⭐ Skin Sur Mesure', emoji: '⭐', virtual: true }]
        : []),
      ...catsNormales,
    ]
  }, [saisonSlugs, customItems])

  const [tab, setTab] = useState(
    saisonSlugs.length ? `__saison:${saisonSlugs[0]}` : CATEGORIES[0].id,
  )
  const [pending, setPending] = useState(null) // accessoire payant en attente de confirmation
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [skinForm, setSkinForm] = useState(false) // formulaire de demande de skin sur mesure
  const [skinDesc, setSkinDesc] = useState('')
  const [skinRef, setSkinRef] = useState('')
  const [celebrate, setCelebrate] = useState(null) // avatar fêté après un achat (animation)

  // 👗 Tenues sauvegardées
  const [loadouts, setLoadouts] = useState([])
  const [saveForm, setSaveForm] = useState(false)   // modale « nommer la tenue »
  const [loadoutName, setLoadoutName] = useState('')
  const [pendingDeleteLook, setPendingDeleteLook] = useState(null) // tenue en attente de suppression

  useEffect(() => {
    let on = true
    getMyAvatarLoadouts(user.id).then((list) => on && setLoadouts(Array.isArray(list) ? list : []))
    return () => { on = false }
  }, [user.id])

  // Onglet de saison : `__saison:<slug>` → on en extrait le slug.
  const tabSaisonSlug = tab.startsWith('__saison:') ? tab.slice('__saison:'.length) : null
  const isSaisonTab = !!tabSaisonSlug
  const isCustomTab = tab === CUSTOM_TAB_ID
  const saisonItems = useMemo(() => getSaisonItems(tabSaisonSlug), [tabSaisonSlug])
  // La saison de l'onglet courant tourne-t-elle vraiment en ce moment ?
  const tabSaisonEnCours = !!tabSaisonSlug
    && saisonActive && tabSaisonSlug === saisonSlug && !saisonTerminee
  const tabEmoji = SAISON_EMOJIS[tabSaisonSlug] || '⭐'

  // Un skin de saison non possédé n'est achetable que pendant sa saison.
  const estFerme = (item, owned) => !!item.saison && !owned
    && !(saisonActive && item.saison === saisonSlug && !saisonTerminee)
  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === tab),
    [tab],
  )

  // Catégorie native d'un item (pour l'onglet saison, chaque item porte _cat).
  const catOf = (item) => item._cat || tab

  // Items affichés dans la grille : onglet saison = items de saison ;
  // onglet skin sur mesure = skins validés de l'utilisateur ; onglets
  // normaux = leurs items SANS les exclusifs de saison.
  const gridItems = isSaisonTab
    ? saisonItems
    : isCustomTab
      ? customItems
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
    // Un skin de saison ne s'achète que pendant SA saison. Une fois acquis il
    // reste équipable à vie, y compris après la fin.
    if (estFerme(item, owned)) {
      flash(`${SAISON_EMOJIS[item.saison] || '⭐'} Saison terminée — ce skin n’est plus disponible à l’achat.`)
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

  // 👗 --- Tenues sauvegardées ---
  const openSaveLook = () => {
    setLoadoutName('')
    setSaveForm(true)
  }

  const submitSaveLook = async (e) => {
    e.preventDefault()
    const nom = loadoutName.trim()
    if (!nom) {
      flash('Donne un petit nom à ta tenue 👗')
      return
    }
    setBusy(true)
    const res = await saveAvatarLoadout(user.id, nom, avatar)
    setBusy(false)
    if (res.error === 'trop_de_looks') {
      setSaveForm(false)
      flash('Tu as déjà 6 tenues sauvegardées, supprimes-en une avant d’en ajouter une nouvelle !')
      return
    }
    if (res.error) {
      flash(res.error)
      return
    }
    setSaveForm(false)
    setLoadouts((prev) => [
      { id: res.id, nom, avatar, date_creation: new Date().toISOString() },
      ...prev,
    ])
    flash('💾 Tenue sauvegardée !')
  }

  // Équipe une tenue entière (uniquement ce que l'élève possède encore ;
  // rien n'est ajouté à `owned` — c'est un changement gratuit comme un autre).
  const equipLook = async (lo) => {
    const next = loadoutToAvatar(lo.avatar, avatar)
    setAvatar(next)
    updateUser({ avatar: next })
    const res = await saveAvatar(user.id, next)
    if (res.error) flash(res.error)
    else flash(`✨ Tenue « ${lo.nom} » équipée !`)
  }

  const confirmDeleteLook = async () => {
    if (!pendingDeleteLook) return
    setBusy(true)
    const res = await deleteAvatarLoadout(user.id, pendingDeleteLook.id)
    setBusy(false)
    if (res.error) {
      flash(res.error === 'introuvable' ? 'Cette tenue n’existe plus.' : res.error)
      setPendingDeleteLook(null)
      return
    }
    setLoadouts((prev) => prev.filter((l) => l.id !== pendingDeleteLook.id))
    setPendingDeleteLook(null)
    flash('🗑️ Tenue supprimée.')
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
          <button className="av__save-look" onClick={openSaveLook}>
            💾 Enregistrer cette tenue
          </button>
        </section>

        <section className="av__panel">
          {/* Onglets de catégories (+ onglet exclusif de saison en tête) */}
          <div className="av__tabs" role="tablist">
            {TABS.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={tab === c.id}
                className={`av__tab ${tab === c.id ? 'av__tab--on' : ''} ${
                  c.id === CUSTOM_TAB_ID ? 'av__tab--custom' : c.virtual ? 'av__tab--saison' : ''
                }`}
                onClick={() => setTab(c.id)}
              >
                <span className="av__tab-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Bandeau de l'onglet exclusif de saison */}
          {isSaisonTab && (
            <p className={`av__saison-note ${tabSaisonEnCours ? '' : 'av__saison-note--over'}`}>
              {tabEmoji}{' '}
              {tabSaisonEnCours
                ? 'Skins exclusifs de la saison ! Achète-les pendant la saison : ils restent à vie sur ton compte.'
                : 'Saison terminée — tu gardes à vie les skins déjà acquis, mais les autres ne sont plus achetables.'}
            </p>
          )}

          {/* Bandeau de l'onglet « Skin Sur Mesure » */}
          {isCustomTab && (
            <p className="av__saison-note av__saison-note--custom">
              ⭐ Skin créé spécialement pour toi par Asacool, déjà acquis —
              choisis-le pour l'équiper !
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
              const closed = estFerme(item, owned)
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

      {/* 👗 Mes tenues sauvegardées */}
      <section className="av__looks">
        <h2 className="av__looks-title">👗 Mes tenues sauvegardées</h2>
        {loadouts.length === 0 ? (
          <p className="av__looks-empty">Tu n'as pas encore sauvegardé de tenue !</p>
        ) : (
          <div className="av__looks-grid">
            {loadouts.map((lo) => (
              <div key={lo.id} className="look">
                <button
                  className="look__equip"
                  onClick={() => equipLook(lo)}
                  title={`Équiper « ${lo.nom} »`}
                >
                  <FallGuy className="look__preview" avatar={lo.avatar} />
                  <span className="look__name">{lo.nom}</span>
                </button>
                <button
                  className="look__del"
                  onClick={() => setPendingDeleteLook(lo)}
                  aria-label={`Supprimer la tenue ${lo.nom}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

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

      {/* 👗 Modale : nommer la tenue à sauvegarder */}
      {saveForm && (
        <div className="modal" onClick={() => !busy && setSaveForm(false)}>
          <form
            className="modal__card skin-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitSaveLook}
          >
            <h3 className="modal__title">💾 Enregistrer cette tenue</h3>
            <p className="modal__desc">Donne-lui un petit nom pour la retrouver plus tard.</p>
            <input
              className="skin-form__input"
              value={loadoutName}
              onChange={(e) => setLoadoutName(e.target.value)}
              placeholder="Ex : Look plage"
              maxLength={40}
              autoFocus
            />
            <div className="modal__actions">
              <button
                type="button"
                className="modal__btn modal__btn--ghost"
                onClick={() => setSaveForm(false)}
                disabled={busy}
              >
                Annuler
              </button>
              <button className="modal__btn" type="submit" disabled={busy}>
                {busy ? 'Sauvegarde…' : 'Sauvegarder 💾'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 👗 Modale : confirmation de suppression d'une tenue */}
      {pendingDeleteLook && (
        <div className="modal" onClick={() => !busy && setPendingDeleteLook(null)}>
          <div className="modal__card" onClick={(e) => e.stopPropagation()}>
            <FallGuy className="modal__preview" avatar={pendingDeleteLook.avatar} />
            <h3 className="modal__title">Supprimer « {pendingDeleteLook.nom} » ?</h3>
            <p className="modal__desc">Cette tenue sauvegardée sera perdue (ton bonhomme actuel ne change pas).</p>
            <div className="modal__actions">
              <button
                className="modal__btn modal__btn--ghost"
                onClick={() => setPendingDeleteLook(null)}
                disabled={busy}
              >
                Annuler
              </button>
              <button className="modal__btn" onClick={confirmDeleteLook} disabled={busy}>
                {busy ? 'Suppression…' : 'Supprimer 🗑️'}
              </button>
            </div>
          </div>
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
