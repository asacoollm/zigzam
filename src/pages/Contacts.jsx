import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
import { getContacts, addContact, removeContact, searchUsers } from '../lib/modules'
import { TYPES_FARCES, getFarcesReglages, sendFarce, broadcastFarce } from '../lib/farces'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './Contacts.css'

export default function Contacts() {
  const { user, updateUser } = useAuth()
  const { active: saisonActive, slug: saisonSlug } = useSaison()
  const navigate = useNavigate()
  const farcesVisibles = saisonActive && saisonSlug === 'halloween'

  // --- Farces d'Halloween 🎃 ---
  const [farceCible, setFarceCible] = useState(null)  // contact ciblé (ouvre le choix)
  const [farceType, setFarceType] = useState(null)     // type choisi (ouvre la confirmation)
  const [farcePrix, setFarcePrix] = useState(10)
  const [farceBusy, setFarceBusy] = useState(false)
  const [farceMsg, setFarceMsg] = useState(null)
  const farceClickLockRef = useRef(false)

  useEffect(() => {
    if (!farcesVisibles) return
    getFarcesReglages().then((r) => setFarcePrix(r.prix ?? 10))
  }, [farcesVisibles])

  const flashFarce = (type, text) => {
    setFarceMsg({ type, text })
    window.setTimeout(() => setFarceMsg(null), 3500)
  }

  const handleEnvoyerFarce = async () => {
    // Verrou synchrone (pas seulement l'état React) : un double-clic très
    // rapide peut arriver avant le prochain rendu qui désactiverait le
    // bouton. Bloqué ~1s après le clic, indépendamment de la rapidité
    // de la réponse serveur.
    if (!farceCible || !farceType || farceBusy || farceClickLockRef.current) return
    farceClickLockRef.current = true
    setTimeout(() => { farceClickLockRef.current = false }, 1000)
    setFarceBusy(true)
    const res = await sendFarce(user.id, farceCible.id, farceType)
    setFarceBusy(false)
    if (res.error) {
      flashFarce('err', res.error)
      return
    }
    updateUser({ donuts: res.donuts })
    broadcastFarce({
      destinataire_id: farceCible.id,
      id: res.id,
      type: farceType,
      expediteur_pseudo: res.expediteur_pseudo,
      created_at: new Date().toISOString(),
    })
    flashFarce('ok', `🎃 Farce envoyée à ${res.destinataire_pseudo} !`)
    setFarceCible(null)
    setFarceType(null)
  }

  // --- Liste de contacts ---
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(true)

  // --- Ajout par numéro ---
  const [addNumero, setAddNumero] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [addMsg, setAddMsg] = useState(null) // { type: 'ok'|'err', text }

  // --- Recherche ---
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchBusy, setSearchBusy] = useState(false)
  const searchTimerRef = useRef(null)

  // Chargement initial des contacts
  useEffect(() => {
    let alive = true
    setLoadingContacts(true)
    getContacts(user.id).then((list) => {
      if (alive) {
        setContacts(list)
        setLoadingContacts(false)
      }
    })
    return () => { alive = false }
  }, [user.id])

  // Debounce recherche
  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchBusy(false)
      return
    }
    setSearchBusy(true)
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchUsers(searchQuery.trim())
      setSearchResults(results)
      setSearchBusy(false)
    }, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  // Flash message avec auto-effacement
  const flashAdd = (type, text) => {
    setAddMsg({ type, text })
    window.setTimeout(() => setAddMsg(null), 3000)
  }

  // Ajouter un contact par numéro
  const handleAddByNumero = async (e) => {
    e.preventDefault()
    const num = addNumero.trim()
    if (!num) return
    setAddBusy(true)
    const res = await addContact(user.id, num)
    setAddBusy(false)
    if (res.ok) {
      setContacts((prev) => {
        const exists = prev.some((c) => c.id === res.contact.id)
        return exists ? prev : [res.contact, ...prev]
      })
      setAddNumero('')
      flashAdd('ok', 'Ajouté ! 🎉')
    } else {
      flashAdd('err', res.error)
    }
  }

  // Ajouter un contact depuis les résultats de recherche
  const handleAddFromSearch = async (contact) => {
    const res = await addContact(user.id, contact.numero)
    if (res.ok) {
      setContacts((prev) => {
        const exists = prev.some((c) => c.id === res.contact.id)
        return exists ? prev : [res.contact, ...prev]
      })
      flashAdd('ok', `${contact.pseudo} ajouté ! 🎉`)
    } else {
      flashAdd('err', res.error)
    }
  }

  // Retirer un contact
  const handleRemove = async (contactId) => {
    await removeContact(user.id, contactId)
    setContacts((prev) => prev.filter((c) => c.id !== contactId))
  }

  // Discuter avec un contact
  const handleDiscuter = (contact) => {
    navigate('/discuter', { state: { startNumero: contact.numero } })
  }

  // Filtrer les résultats de recherche (exclure soi-même et déjà contacts)
  const filteredResults = searchResults.filter((u) => u.id !== user.id)

  return (
    <div className="contacts">
      <Backdrop />

      {/* Barre du haut */}
      <header className="contacts__top">
        <button className="contacts__back" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
      </header>

      {/* Bandeau saison Halloween : disparaît dès que la saison n'est plus active */}
      {farcesVisibles && (
        <div className="contacts__halloween-banner">
          🎃 Pendant Halloween, tu peux aussi envoyer des farces à tes amis ici !
          Clique sur 🎃 Envoyer une farce à côté d'un contact.
        </div>
      )}

      {/* Flash message global */}
      {addMsg && (
        <div className={`contacts__flash contacts__flash--${addMsg.type}`}>
          {addMsg.text}
        </div>
      )}

      {/* Section Ajouter par numéro */}
      <section className="contacts__card">
        <h2 className="contacts__section-title">➕ Ajouter un ami</h2>
        <form className="contacts__add-form" onSubmit={handleAddByNumero}>
          <input
            className="contacts__input"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="Numéro à 4 chiffres"
            value={addNumero}
            onChange={(e) => setAddNumero(e.target.value.replace(/\D/g, '').slice(0, 4))}
            disabled={addBusy}
            aria-label="Numéro de l'ami"
          />
          <button
            className="contacts__btn"
            type="submit"
            disabled={addBusy || addNumero.length === 0}
          >
            {addBusy ? 'Ajout…' : '➕ Ajouter'}
          </button>
        </form>
      </section>

      {/* Section Recherche */}
      <section className="contacts__card">
        <h2 className="contacts__section-title">🔍 Rechercher un ami</h2>
        <input
          className="contacts__input contacts__input--full"
          type="text"
          placeholder="Pseudo ou numéro…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Rechercher par pseudo ou numéro"
        />

        {searchBusy && (
          <p className="contacts__hint">Recherche en cours…</p>
        )}

        {!searchBusy && searchQuery.trim() && filteredResults.length === 0 && (
          <p className="contacts__hint">Aucun résultat pour « {searchQuery} »</p>
        )}

        {filteredResults.length > 0 && (
          <ul className="contacts__search-list">
            {filteredResults.map((u) => {
              const alreadyContact = contacts.some((c) => c.id === u.id)
              return (
                <li key={u.id} className="contacts__search-item">
                  <FallGuy avatar={u.avatar} className="contacts__av" anim="idle" role={u.role} />
                  <div className="contacts__info">
                    <span className="contacts__pseudo">{u.pseudo}</span>
                    <span className="contacts__numero">📞 {u.numero}</span>
                  </div>
                  {alreadyContact ? (
                    <span className="contacts__tag">Déjà ami ✓</span>
                  ) : (
                    <button
                      className="contacts__btn contacts__btn--sm"
                      onClick={() => handleAddFromSearch(u)}
                    >
                      Ajouter
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Section Mes contacts */}
      <section className="contacts__card">
        <h2 className="contacts__section-title">👥 Mes contacts</h2>

        {loadingContacts && (
          <p className="contacts__hint">Chargement…</p>
        )}

        {!loadingContacts && contacts.length === 0 && (
          <p className="contacts__empty">
            Aucun contact — ajoute tes amis avec leur numéro !
          </p>
        )}

        {!loadingContacts && contacts.length > 0 && (
          <ul className="contacts__list">
            {contacts.map((c) => (
              <li key={c.id} className="contacts__item">
                <FallGuy avatar={c.avatar} className="contacts__av" anim="idle" role={c.role} />
                <div className="contacts__info">
                  <span className="contacts__pseudo">{c.pseudo}</span>
                  <span className="contacts__numero">📞 {c.numero}</span>
                </div>
                <div className="contacts__actions">
                  <button
                    className="contacts__btn contacts__btn--sm contacts__btn--discuss"
                    onClick={() => handleDiscuter(c)}
                  >
                    💬 Discuter
                  </button>
                  {farcesVisibles && (
                    <button
                      className="contacts__btn contacts__btn--sm contacts__btn--farce"
                      onClick={() => { setFarceCible(c); setFarceType(null) }}
                    >
                      🎃 Envoyer une farce
                    </button>
                  )}
                  <button
                    className="contacts__btn contacts__btn--sm contacts__btn--remove"
                    onClick={() => handleRemove(c.id)}
                  >
                    Retirer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modale Farce d'Halloween 🎃 : choix du type, puis confirmation */}
      {farceCible && (
        <div className="farce-modal" onMouseDown={() => { setFarceCible(null); setFarceType(null) }}>
          <div className="farce-modal__panel" onMouseDown={(e) => e.stopPropagation()}>
            <button
              className="farce-modal__close"
              onClick={() => { setFarceCible(null); setFarceType(null) }}
              aria-label="Fermer"
            >
              ✕
            </button>

            <p className="farce-modal__warning">
              ⚠️ Ces farces font sursauter, avec du son ! Tu peux les désactiver dans tes réglages.
            </p>

            {!farceType ? (
              <>
                <h2 className="farce-modal__title">🎃 Envoyer une farce à {farceCible.pseudo}</h2>
                <ul className="farce-modal__list">
                  {TYPES_FARCES.map((t) => (
                    <li key={t.id}>
                      <button className="farce-modal__item" onClick={() => setFarceType(t.id)}>
                        <span className="farce-modal__item-emoji">{t.emoji}</span>
                        <span className="farce-modal__item-label">{t.label}</span>
                        <span className="farce-modal__item-prix">🍩 {farcePrix}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="farce-modal__title">
                  {TYPES_FARCES.find((t) => t.id === farceType)?.emoji} Envoyer une farce à{' '}
                  {farceCible.pseudo} pour {farcePrix} 🍩 ?
                </h2>
                <div className="farce-modal__confirm-row">
                  <button
                    className="contacts__btn contacts__btn--sm"
                    onClick={() => setFarceType(null)}
                    disabled={farceBusy}
                  >
                    Retour
                  </button>
                  <button
                    className="contacts__btn contacts__btn--sm contacts__btn--farce"
                    onClick={handleEnvoyerFarce}
                    disabled={farceBusy}
                  >
                    {farceBusy ? 'Envoi…' : 'Envoyer 🎃'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {farceMsg && (
        <div className={`contacts__flash contacts__flash--${farceMsg.type}`}>
          {farceMsg.text}
        </div>
      )}
    </div>
  )
}
