import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDiscussions,
  getPublicDiscussions,
  createDiscussion,
  addParticipants,
  joinDiscussion,
  leaveDiscussion,
  deleteDiscussion,
  markRead,
  getMessages,
  sendMessage,
  subscribeToDiscussion,
  broadcastMessage,
  uploadVocal,
  sendVocalMessage,
  markVocalEcoute,
  cleanupVocaux,
} from '../lib/modules'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import { VoiceRecorder, VocalBubble } from '../components/VoiceMessage'
import './Discuter.css'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'à l’instant'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function titreDiscussion(disc) {
  if (disc.type === 'public' && disc.titre) return disc.titre
  if (disc.pseudos && disc.pseudos.length > 0) return disc.pseudos.join(', ')
  return 'Discussion'
}

// ─── Formulaire nouvelle discussion ─────────────────────────────────────────

function NouvelleDiscussionForm({ onClose, onCreate, prefillNumero }) {
  const [typeChoisi, setTypeChoisi] = useState('privee')
  const [titre, setTitre] = useState('')
  const [numerosRaw, setNumerosRaw] = useState(prefillNumero || '')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    let type, numeros, titreFinal

    if (typeChoisi === 'publique') {
      if (!titre.trim()) {
        setErreur('Il faut un titre pour une discussion publique !')
        return
      }
      type = 'public'
      numeros = []
      titreFinal = titre.trim()
    } else {
      const parsed = numerosRaw
        .split(/[,\s]+/)
        .map((n) => n.trim())
        .filter((n) => /^\d{4}$/.test(n))
      if (parsed.length === 0) {
        setErreur('Entre au moins un numéro à 4 chiffres !')
        return
      }
      type = 'prive'
      numeros = parsed
      titreFinal = ''
    }

    setLoading(true)
    await onCreate(titreFinal, type, numeros)
    setLoading(false)
  }

  return (
    <div className="disc__modal-overlay" onClick={onClose}>
      <div className="disc__modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="disc__modal-titre">✨ Nouvelle discussion</h3>

        <div className="disc__type-tabs">
          {[
            { id: 'privee', label: '🔒 Privée' },
            { id: 'groupe', label: '👥 Groupe' },
            { id: 'publique', label: '🌍 Publique' },
          ].map((t) => (
            <button
              key={t.id}
              className={`disc__type-tab${typeChoisi === t.id ? ' disc__type-tab--active' : ''}`}
              onClick={() => { setTypeChoisi(t.id); setErreur('') }}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="disc__form">
          {typeChoisi === 'publique' ? (
            <input
              className="disc__input"
              type="text"
              placeholder="Titre de la discussion…"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={60}
            />
          ) : (
            <div>
              <input
                className="disc__input"
                type="text"
                placeholder={
                  typeChoisi === 'groupe'
                    ? 'Numéros séparés par des virgules (ex: 1234, 5678)'
                    : 'Numéro à 4 chiffres (ex: 1234)'
                }
                value={numerosRaw}
                onChange={(e) => setNumerosRaw(e.target.value)}
              />
              <p className="disc__hint">
                {typeChoisi === 'groupe'
                  ? 'Entre les numéros des amis que tu veux inviter 😄'
                  : 'Entre le numéro de ton ami 😊'}
              </p>
            </div>
          )}

          {erreur && <p className="disc__erreur">{erreur}</p>}

          <div className="disc__form-actions">
            <button type="button" className="disc__btn disc__btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="disc__btn disc__btn--main" disabled={loading}>
              {loading ? 'Création…' : 'Créer 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Vue conversation ────────────────────────────────────────────────────────

function ConversationView({ disc, userId, onBack, onDeleted }) {
  const [messages, setMessages] = useState([])
  const [loadingMsg, setLoadingMsg] = useState(true)
  const [saisie, setSaisie] = useState('')
  const [sending, setSending] = useState(false)
  const [vocalActive, setVocalActive] = useState(false)
  const [erreur, setErreur] = useState('')
  const [showAddPart, setShowAddPart] = useState(false)
  const [numerosAjout, setNumerosAjout] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addErreur, setAddErreur] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Charger les messages + s'abonner
  useEffect(() => {
    let cancelled = false
    setLoadingMsg(true)
    setMessages([])
    setErreur('')

    markRead(userId, disc.id)

    getMessages(disc.id).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs || [])
        setLoadingMsg(false)
      }
    })

    const ch = subscribeToDiscussion(disc.id, (msg) => {
      if (!cancelled) {
        setMessages((prev) => [...prev, msg])
      }
    })
    channelRef.current = ch

    return () => {
      cancelled = true
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [disc.id, userId])

  // Auto-scroll vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleEnvoyer(e) {
    e.preventDefault()
    const contenu = saisie.trim()
    if (!contenu || sending) return
    setSending(true)
    setErreur('')

    const res = await sendMessage(disc.id, userId, contenu)
    if (res.error) {
      setErreur(res.error)
    } else if (res.message) {
      setMessages((prev) => [...prev, res.message])
      if (channelRef.current) {
        broadcastMessage(channelRef.current, res.message)
      }
      setSaisie('')
    }
    setSending(false)
    inputRef.current?.focus()
  }

  // Envoi d'un message vocal : upload du fichier puis enregistrement en base.
  async function handleSendVocal(blob, ext) {
    setErreur('')
    const up = await uploadVocal(userId, blob, ext)
    if (up.error) {
      setErreur(up.error)
      return
    }
    const res = await sendVocalMessage(disc.id, userId, up.url)
    if (res.error) {
      setErreur(res.error)
    } else if (res.message) {
      setMessages((prev) => [...prev, res.message])
      if (channelRef.current) {
        broadcastMessage(channelRef.current, res.message)
      }
    }
  }

  // À la lecture d'un vocal : on note que cet utilisateur l'a écouté.
  function handlePlayVocal(messageId) {
    markVocalEcoute(messageId, userId)
  }

  async function handleSupprimer() {
    if (!window.confirm('Supprimer cette discussion ? Cette action est définitive !')) return
    const res = await deleteDiscussion(disc.id, userId)
    if (res?.status === 'ok' || res?.status === 'not_owner') {
      onDeleted()
    }
  }

  async function handleQuitter() {
    await leaveDiscussion(userId, disc.id)
    onDeleted()
  }

  async function handleAjouter(e) {
    e.preventDefault()
    const nums = numerosAjout
      .split(/[,\s]+/)
      .map((n) => n.trim())
      .filter((n) => /^\d{4}$/.test(n))
    if (nums.length === 0) {
      setAddErreur('Entre au moins un numéro valide !')
      return
    }
    setAddLoading(true)
    setAddErreur('')
    await addParticipants(disc.id, nums)
    setAddLoading(false)
    setNumerosAjout('')
    setShowAddPart(false)
  }

  const peutAjouter = disc.est_createur && (disc.type === 'prive' || disc.type === 'public')

  return (
    <div className="disc__conv">
      {/* En-tête conversation */}
      <div className="disc__conv-header">
        <button className="disc__btn-back" onClick={onBack} type="button">
          ⬅️ Retour
        </button>
        <span className="disc__conv-titre">{titreDiscussion(disc)}</span>
        <div className="disc__conv-actions">
          {peutAjouter && (
            <button
              className="disc__btn disc__btn--sm"
              onClick={() => setShowAddPart((v) => !v)}
              type="button"
            >
              ➕ Ajouter
            </button>
          )}
          {disc.est_createur ? (
            <button className="disc__btn disc__btn--danger disc__btn--sm" onClick={handleSupprimer} type="button">
              🗑️ Supprimer
            </button>
          ) : (
            <button className="disc__btn disc__btn--danger disc__btn--sm" onClick={() => setConfirmLeave(true)} type="button">
              🚪 Quitter définitivement
            </button>
          )}
        </div>
      </div>

      {confirmLeave && (
        <div className="disc__leave-overlay" onClick={() => setConfirmLeave(false)}>
          <div className="disc__leave-card" onClick={(e) => e.stopPropagation()}>
            <span className="disc__leave-emoji">🚪</span>
            <h3 className="disc__leave-title">Quitter définitivement cette discussion ?</h3>
            <p className="disc__leave-text">
              Es-tu sûr ? Tu ne pourras plus lire les messages de cette discussion.
            </p>
            <div className="disc__leave-actions">
              <button className="disc__btn disc__btn--ghost" type="button" onClick={() => setConfirmLeave(false)}>
                Annuler
              </button>
              <button className="disc__btn disc__btn--danger" type="button" onClick={handleQuitter}>
                Oui, quitter définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panneau ajouter participants */}
      {showAddPart && (
        <form className="disc__add-part" onSubmit={handleAjouter}>
          <input
            className="disc__input disc__input--sm"
            type="text"
            placeholder="Numéros séparés par virgules…"
            value={numerosAjout}
            onChange={(e) => setNumerosAjout(e.target.value)}
          />
          {addErreur && <p className="disc__erreur">{addErreur}</p>}
          <button className="disc__btn disc__btn--main disc__btn--sm" type="submit" disabled={addLoading}>
            {addLoading ? 'Ajout…' : 'Inviter 🎉'}
          </button>
        </form>
      )}

      {/* Liste des messages */}
      <div className="disc__messages">
        {loadingMsg ? (
          <p className="disc__etat">Chargement des messages…</p>
        ) : messages.length === 0 ? (
          <p className="disc__etat">Soyez les premiers à discuter ici ! 👋</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.auteur?.id === userId
            return (
              <div
                key={msg.id}
                className={`disc__bubble-wrap${isMine ? ' disc__bubble-wrap--mine' : ' disc__bubble-wrap--other'}`}
              >
                {!isMine && (
                  <div className="disc__bubble-other-header">
                    <FallGuy
                      avatar={msg.auteur?.avatar || null}
                      className="disc__bubble-av"
                      anim="idle"
                      role={msg.auteur?.role}
                    />
                    <span className="disc__bubble-pseudo">{msg.auteur?.pseudo || '?'}</span>
                  </div>
                )}
                <div className={`disc__bubble${isMine ? ' disc__bubble--mine' : ' disc__bubble--other'}`}>
                  {msg.type === 'vocal' ? (
                    <VocalBubble msg={msg} isMine={isMine} onPlay={() => handlePlayVocal(msg.id)} />
                  ) : (
                    <span className="disc__bubble-text">{msg.contenu}</span>
                  )}
                  <span className="disc__bubble-time">{formatDate(msg.date)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <form className="disc__saisie" onSubmit={handleEnvoyer}>
        {erreur && <p className="disc__erreur disc__erreur--saisie">{erreur}</p>}
        <div className="disc__saisie-row">
          {!vocalActive && (
            <>
              <input
                ref={inputRef}
                className="disc__input disc__input--msg"
                type="text"
                placeholder="Écris ton message… ✍️"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                maxLength={500}
                autoComplete="off"
              />
              <button
                className="disc__btn disc__btn--send"
                type="submit"
                disabled={sending || !saisie.trim()}
              >
                {sending ? '…' : '➤'}
              </button>
            </>
          )}
          <VoiceRecorder
            onSend={handleSendVocal}
            onActiveChange={setVocalActive}
            disabled={sending}
          />
        </div>
      </form>
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function Discuter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mesDiscs, setMesDiscs] = useState([])
  const [publiques, setPubliques] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreurListe, setErreurListe] = useState('')

  const [discActive, setDiscActive] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [prefillNumero, setPrefillNumero] = useState('')

  const loadListes = useCallback(async () => {
    setLoading(true)
    setErreurListe('')
    try {
      const [m, p] = await Promise.all([
        getDiscussions(user.id),
        getPublicDiscussions(user.id),
      ])
      setMesDiscs(m || [])
      setPubliques(p || [])
    } catch {
      setErreurListe('Impossible de charger les discussions. Réessaie !')
    }
    setLoading(false)
  }, [user.id])

  // Charger les listes au montage
  useEffect(() => {
    loadListes()
  }, [loadListes])

  // Nettoyage des vocaux écoutés par tous depuis +24h (au chargement du module).
  useEffect(() => {
    cleanupVocaux()
  }, [])

  // Prefill depuis location.state
  useEffect(() => {
    if (location.state?.startNumero) {
      setPrefillNumero(location.state.startNumero)
      setShowForm(true)
    }
  }, [location.state])

  async function handleJoindre(discId) {
    await joinDiscussion(user.id, discId)
    await loadListes()
    // Ouvre la conversation
    const found = publiques.find((p) => p.id === discId)
    if (found) setDiscActive({ ...found, type: 'public', est_createur: false })
  }

  async function handleOuvrirPublique(disc) {
    // Construire un objet disc enrichi
    const enriched = {
      ...disc,
      est_createur: false,
      pseudos: [],
    }
    // Chercher dans mesDiscs si déjà présente
    const found = mesDiscs.find((d) => d.id === disc.id)
    if (found) {
      setDiscActive(found)
    } else {
      setDiscActive(enriched)
    }
  }

  async function handleCreer(titre, type, numeros) {
    const res = await createDiscussion(user.id, titre, type, numeros)
    if (res.error) {
      return
    }
    setShowForm(false)
    setPrefillNumero('')
    await loadListes()
    // Ouvrir la nouvelle discussion
    if (res.id) {
      // Recharger et trouver la discussion
      const nouvelles = await getDiscussions(user.id)
      setMesDiscs(nouvelles || [])
      const newDisc = nouvelles?.find((d) => d.id === res.id)
      if (newDisc) setDiscActive(newDisc)
    }
  }

  function handleDiscDeleted() {
    setDiscActive(null)
    loadListes()
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────

  return (
    <div className="disc">
      <Backdrop />

      {/* Barre du haut */}
      <div className="disc__topbar">
        <button className="disc__btn-back" onClick={() => navigate('/dashboard')} type="button">
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
      </div>

      {/* Vue conversation */}
      {discActive ? (
        <ConversationView
          disc={discActive}
          userId={user.id}
          userAvatar={user.avatar}
          onBack={() => { setDiscActive(null); loadListes() }}
          onDeleted={handleDiscDeleted}
        />
      ) : (
        /* Vue liste */
        <div className="disc__liste">
          <div className="disc__liste-header">
            <h2 className="disc__titre-page">💬 Discuter</h2>
            <button
              className="disc__btn disc__btn--main"
              onClick={() => setShowForm(true)}
              type="button"
            >
              ➕ Nouvelle discussion
            </button>
          </div>

          {loading ? (
            <p className="disc__etat">Chargement de tes discussions…</p>
          ) : erreurListe ? (
            <p className="disc__erreur">{erreurListe}</p>
          ) : (
            <>
              {/* Mes discussions */}
              <section className="disc__section">
                <h3 className="disc__section-titre">Mes discussions</h3>
                {mesDiscs.length === 0 ? (
                  <p className="disc__etat disc__etat--vide">
                    Aucune discussion pour l'instant… Lance-toi ! 😊
                  </p>
                ) : (
                  <ul className="disc__disc-list">
                    {mesDiscs.map((d) => (
                      <li key={d.id}>
                        <button
                          className="disc__disc-item"
                          onClick={() => setDiscActive(d)}
                          type="button"
                        >
                          <div className="disc__disc-item-main">
                            <span className="disc__disc-nom">
                              {titreDiscussion(d)}
                              {d.type === 'public' && (
                                <span className="disc__badge-public">🌍 Public</span>
                              )}
                            </span>
                            {d.dernier_message && (
                              <span className="disc__disc-apercu">{d.dernier_message}</span>
                            )}
                          </div>
                          <div className="disc__disc-item-meta">
                            {d.derniere_date && (
                              <span className="disc__disc-date">{formatDate(d.derniere_date)}</span>
                            )}
                            {d.non_lu && <span className="disc__pastille-nonlu" aria-label="Non lu" />}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Discussions publiques */}
              <section className="disc__section">
                <h3 className="disc__section-titre">🌍 Discussions publiques</h3>
                {publiques.length === 0 ? (
                  <p className="disc__etat disc__etat--vide">
                    Pas de discussion publique pour l'instant !
                  </p>
                ) : (
                  <ul className="disc__disc-list">
                    {publiques.map((d) => (
                      <li key={d.id}>
                        <div className="disc__disc-item disc__disc-item--public">
                          <div className="disc__disc-item-main">
                            <span className="disc__disc-nom">{d.titre}</span>
                            <span className="disc__disc-apercu">
                              👥 {d.nb_participants} participant{d.nb_participants !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="disc__disc-item-meta">
                            {d.rejoint ? (
                              <button
                                className="disc__btn disc__btn--sm disc__btn--ghost"
                                onClick={() => handleOuvrirPublique(d)}
                                type="button"
                              >
                                Ouvrir
                              </button>
                            ) : (
                              <button
                                className="disc__btn disc__btn--sm disc__btn--main"
                                onClick={() => handleJoindre(d.id)}
                                type="button"
                              >
                                Rejoindre
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Modal nouvelle discussion */}
      {showForm && (
        <NouvelleDiscussionForm
          onClose={() => { setShowForm(false); setPrefillNumero('') }}
          onCreate={handleCreer}
          prefillNumero={prefillNumero}
        />
      )}
    </div>
  )
}
