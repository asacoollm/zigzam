import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  getMapCoffreState, openMapCoffre, getMapBoutique, getMyMapAchats, buyMapArticle,
} from '../lib/map'
import { getPaysBySlug } from '../data/mapPays'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './MapPays.css'

// Compte à rebours simple (précision à la minute, pas à la seconde).
function formatCompteARebours(iso) {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'quelques instants'
  const totalMin = Math.ceil(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

// Page d'un pays de la Map Zigzam : coffre du jour, visiteurs en ligne (Presence
// Realtime) et boutique en mini pièces violettes 💜 propres à ce pays.
export default function MapPays() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { slug } = useParams()
  const pays = getPaysBySlug(slug)

  const [coffre, setCoffre] = useState(null) // { disponible, prochaine_ouverture }
  const [miniPieces, setMiniPieces] = useState(null)
  const [opening, setOpening] = useState(false)
  const [, setTick] = useState(0) // force le recalcul du compte à rebours chaque minute

  const [visiteurs, setVisiteurs] = useState([])

  const [boutique, setBoutique] = useState(null)
  const [achats, setAchats] = useState(null) // Set<article_id>
  const [buying, setBuying] = useState(null)

  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  // ---- Coffre du jour : état initial ----
  useEffect(() => {
    if (!user?.id || !pays) return
    let on = true
    getMapCoffreState(user.id, pays.slug).then((state) => {
      if (!on || state.error) return
      setCoffre({ disponible: state.disponible, prochaine_ouverture: state.prochaine_ouverture })
      setMiniPieces(state.mini_pieces)
    })
    return () => { on = false }
  }, [user?.id, pays])

  // ---- Compte à rebours : recalculé chaque minute, bascule auto en « disponible ».
  useEffect(() => {
    if (!coffre || coffre.disponible) return
    const id = setInterval(() => {
      if (coffre.prochaine_ouverture && new Date(coffre.prochaine_ouverture).getTime() <= Date.now()) {
        setCoffre({ disponible: true, prochaine_ouverture: null })
      } else {
        setTick((t) => t + 1)
      }
    }, 60000)
    return () => clearInterval(id)
  }, [coffre])

  // ---- Revalidation serveur toutes les ~5 min pendant le compte à rebours :
  //      corrige toute dérive (horloge client, coffre ouvert depuis un autre
  //      appareil…) sans dépendre uniquement du recalcul local ci-dessus.
  useEffect(() => {
    if (!coffre || coffre.disponible || !user?.id || !pays) return
    const id = setInterval(() => {
      getMapCoffreState(user.id, pays.slug).then((state) => {
        if (state.error) return
        setCoffre({ disponible: state.disponible, prochaine_ouverture: state.prochaine_ouverture })
        setMiniPieces(state.mini_pieces)
      })
    }, 300000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coffre?.disponible, user?.id, pays])

  const handleOpenCoffre = async () => {
    if (opening || !coffre?.disponible || !user || !pays) return
    setOpening(true)
    const res = await openMapCoffre(user.id, pays.slug)
    setOpening(false)
    if (res.error) {
      flash("Tu as déjà ouvert ce coffre aujourd'hui !")
      setCoffre({ disponible: false, prochaine_ouverture: new Date(Date.now() + 24 * 3600 * 1000).toISOString() })
      return
    }
    setMiniPieces(res.mini_pieces)
    setCoffre({ disponible: false, prochaine_ouverture: new Date(Date.now() + 24 * 3600 * 1000).toISOString() })
    flash(`+${res.gain} mini pièces 💜 !`)
  }

  // ---- Visiteurs en ligne sur ce pays (Presence Realtime, channel par pays) ----
  useEffect(() => {
    if (!user?.id || !pays) return
    let alive = true
    const channel = supabase.channel(`zigzam:map:${pays.slug}`, {
      config: { presence: { key: user.id } },
    })

    const sync = () => {
      if (!alive) return
      const state = channel.presenceState()
      const list = Object.entries(state)
        .filter(([uid]) => uid !== user.id)
        .map(([uid, metas]) => ({ id: uid, ...metas[0] }))
      setVisiteurs(list)
    }

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ pseudo: user.pseudo, avatar: user.avatar, role: user.role })
        }
      })

    return () => {
      alive = false
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, pays?.slug])

  // ---- Boutique : catalogue du pays + articles déjà possédés ----
  useEffect(() => {
    if (!user?.id || !pays) return
    let on = true
    Promise.all([getMapBoutique(pays.slug), getMyMapAchats(user.id)]).then(([articles, mine]) => {
      if (!on) return
      setBoutique(articles)
      setAchats(new Set(mine))
    })
    return () => { on = false }
  }, [user?.id, pays])

  const handleBuy = async (article) => {
    if (buying || achats?.has(article.id) || (miniPieces ?? 0) < article.prix) return
    setBuying(article.id)
    const res = await buyMapArticle(user.id, article.id)
    setBuying(null)
    if (res.error) {
      flash(
        res.error === 'pas_assez_de_pieces'
          ? 'Pas assez de mini pièces 💜 pour cet article !'
          : "Oups, cet article n'est plus disponible.",
      )
      return
    }
    setMiniPieces(res.mini_pieces_restantes)
    setAchats((prev) => new Set(prev).add(article.id))
    flash(`✨ ${article.nom} débloqué !`)
  }

  return (
    <div className="mpays">
      <Backdrop />

      <header className="mpays__top">
        <button className="mpays__retour" onClick={() => navigate('/map')}>⬅️ Retour à la carte</button>
        <ZigzamLogo size="sm" />
        <span />
      </header>

      {!pays ? (
        <div className="mpays__contenu">
          <span className="mpays__emoji">🗺️</span>
          <h1 className="mpays__titre stroke-title">Pays inconnu</h1>
        </div>
      ) : (
        <div className="mpays__contenu">
          <span className="mpays__emoji">{pays.emoji}</span>
          <h1 className="mpays__titre stroke-title">{pays.nom}</h1>

          {/* Visiteurs en ligne — Presence Realtime */}
          <div className="mpays__visiteurs">
            <span className="mpays__visiteurs-titre">Sur place en ce moment</span>
            {visiteurs.length === 0 ? (
              <p className="mpays__visiteurs-vide">Tu es seul(e) ici pour l'instant 🏝️</p>
            ) : (
              <div className="mpays__visiteurs-liste">
                {visiteurs.map((v) => (
                  <div key={v.id} className="mpays__visiteur" title={v.pseudo}>
                    <FallGuy className="mpays__visiteur-av" avatar={v.avatar} role={v.role} anim="idle" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total de mini pièces du pays — toujours visible */}
          <div className="mpays__pieces">💜 {miniPieces ?? '…'} mini pièces</div>

          {/* Coffre du jour */}
          <section className="mpays__section">
            <h2 className="mpays__section-titre">🎁 Coffre du jour</h2>
            {coffre === null ? (
              <p className="mpays__loading">Chargement…</p>
            ) : coffre.disponible ? (
              <button className="mpays__btn mpays__btn--coffre" onClick={handleOpenCoffre} disabled={opening}>
                {opening ? 'Ouverture…' : '🎁 Ouvrir le coffre'}
              </button>
            ) : (
              <p className="mpays__countdown">
                ⏳ Prochain coffre dans <strong>{formatCompteARebours(coffre.prochaine_ouverture)}</strong>
              </p>
            )}
          </section>

          {/* Boutique */}
          <section className="mpays__section">
            <h2 className="mpays__section-titre">🛍️ Boutique</h2>
            {boutique === null ? (
              <p className="mpays__loading">Chargement…</p>
            ) : (
              <div className="mpays__boutique-grid">
                {boutique.map((article) => {
                  const possede = achats?.has(article.id)
                  const abordable = (miniPieces ?? 0) >= article.prix
                  return (
                    <div key={article.id} className={`mpays__article ${possede ? 'mpays__article--possede' : ''}`}>
                      <span className="mpays__article-emoji">{article.emoji}</span>
                      <span className="mpays__article-nom">{article.nom}</span>
                      <span className="mpays__article-prix">💜 {article.prix}</span>
                      {possede ? (
                        <span className="mpays__article-badge">✓ Possédé</span>
                      ) : (
                        <button
                          className="mpays__btn mpays__btn--acheter"
                          onClick={() => handleBuy(article)}
                          disabled={!abordable || buying === article.id}
                        >
                          {buying === article.id ? '…' : 'Acheter'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {toast && <div className="mpays__toast">{toast}</div>}
    </div>
  )
}
