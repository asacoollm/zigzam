import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDailyGiftStatus, claimDailyGift, buyBurgers,
  getMyMegaBoites, buyMegaBoite, buyVipPass,
} from '../lib/modules'
import { isVipActive, formatVipTimeLeft, useVipCountdown } from '../lib/vip'
import { CATEGORIES } from '../lib/avatar'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import MegaBoxArt from '../components/MegaBoxArt'
import ZigzamLogo from '../components/ZigzamLogo'
import './Shop.css'

const GIFT_EMOJI = { donut: '🍩', gemme: '💎', burger: '🍔' }
const GIFT_LABEL = { donut: 'donuts', gemme: 'gemmes', burger: 'burgers' }

const BURGER_OFFERS = [
  { amount: 10, cost: 1 },
  { amount: 50, cost: 4 },
  { amount: 100, cost: 7 },
]

const MEGA_NIVEAUX = [
  { id: 'normal', label: 'Normal', color: '#3dd68c', prix: 40 },
  { id: 'rare', label: 'Rare', color: '#00bfff', prix: 55 },
  { id: 'super_rare', label: 'Super Rare', color: '#a855f7', prix: 80 },
  { id: 'incroyable', label: 'Incroyable', color: '#ff8c42', prix: 120 },
  { id: 'impossible', label: 'IMPOSSIBLE !!!', color: '#ef4444', prix: 200 },
]

// Catégories d'accessoires « évergreen » (ni saison, ni VIP) affichées dans le catalogue.
const SHOP_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'special' && c.id !== 'full')

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function Shop() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const vipActive = isVipActive(user.vip_expire_at)
  useVipCountdown(vipActive)

  const [gift, setGift] = useState(null) // { claimed, next_reset }
  const [giftLoading, setGiftLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [giftResult, setGiftResult] = useState(null) // résultat animé après réclamation
  const [now, setNow] = useState(() => Date.now())

  const [megaCount, setMegaCount] = useState(0)
  const [busyMega, setBusyMega] = useState(null) // niveau en cours d'achat
  const [busyBurger, setBusyBurger] = useState(null) // offre en cours d'achat
  const [busyVip, setBusyVip] = useState(false)

  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  const loadGift = useCallback(() => {
    getDailyGiftStatus(user.id).then((s) => {
      setGift(s)
      setGiftLoading(false)
    })
  }, [user.id])

  const loadMega = useCallback(() => {
    getMyMegaBoites(user.id).then((b) => setMegaCount(Array.isArray(b) ? b.length : 0))
  }, [user.id])

  useEffect(() => {
    loadGift()
    loadMega()
  }, [loadGift, loadMega])

  // Compte à rebours en direct jusqu'au prochain cadeau.
  useEffect(() => {
    if (!gift?.claimed) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [gift?.claimed])

  const handleClaimGift = async () => {
    if (claiming) return
    setClaiming(true)
    const res = await claimDailyGift(user.id)
    setClaiming(false)
    if (res.error) {
      flash(res.error === 'déjà récupéré' ? 'Tu as déjà récupéré ton cadeau aujourd\'hui !' : res.error)
      loadGift()
      return
    }
    updateUser(res.soldes)
    setGiftResult(res)
    setGift({ claimed: true, next_reset: gift?.next_reset })
    loadGift()
  }

  const closeGiftCelebration = () => {
    setGiftResult(null)
    loadGift()
  }

  const handleBuyBurgers = async (offer) => {
    setBusyBurger(offer.amount)
    const res = await buyBurgers(user.id, offer.amount, offer.cost)
    setBusyBurger(null)
    if (res.error) {
      flash(res.error)
      return
    }
    updateUser({ gemmes: res.gemmes, burgers: res.burgers })
    flash(`+${offer.amount} 🍔 achetés !`)
  }

  const handleBuyMega = async (niveau) => {
    setBusyMega(niveau.id)
    const res = await buyMegaBoite(user.id, niveau.id)
    setBusyMega(null)
    if (res.error) {
      flash(res.error)
      return
    }
    updateUser({ burgers: res.burgers })
    loadMega()
    if (res.evolved) {
      const finalLabel = MEGA_NIVEAUX.find((n) => n.id === res.niveauFinal)?.label ?? res.niveauFinal
      flash(`✨ Coup de chance ! Ta boîte a évolué : ${niveau.label} → ${finalLabel} ! Direction /mega-boites 📦`)
    } else {
      flash(`Méga boîte ${niveau.label} achetée ! Direction /mega-boites pour l'ouvrir 📦`)
    }
  }

  const handleBuyVip = async () => {
    setBusyVip(true)
    const res = await buyVipPass(user.id)
    setBusyVip(false)
    if (res.error) {
      flash(res.error)
      return
    }
    updateUser({ donuts: res.donuts, gemmes: res.gemmes, burgers: res.burgers, vip_expire_at: res.vip_expire_at })
    loadMega()
    flash('👑 Pass VIP activé ! Une méga boîte Rare t\'attend dans /mega-boites 🎁')
  }

  const goToAvatar = (categoryId) => {
    navigate('/avatar', { state: { tab: categoryId } })
  }

  const remainingMs = gift?.next_reset ? new Date(gift.next_reset).getTime() - now : 0

  return (
    <div className="shop">
      <Backdrop />

      <div className="shop__top">
        <button className="shop__retour" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
      </div>

      <h1 className="shop__titre">Shop 🛍️</h1>

      <div className="shop__solde">
        <span className="shop__pastille shop__pastille--donut">🍩 {user.donuts}</span>
        <span className="shop__pastille shop__pastille--gem">💎 {user.gemmes}</span>
        <span className="shop__pastille shop__pastille--burger">🍔 {user.burgers ?? 0}</span>
        {vipActive && (
          <span className="shop__pastille shop__pastille--vip">
            👑 VIP · {formatVipTimeLeft(user.vip_expire_at)}
          </span>
        )}
      </div>

      {/* ---- Cadeau du jour ---- */}
      <section className="shop__carte shop__cadeau">
        <h2 className="shop__carte-titre">🎁 Cadeau du jour</h2>
        {giftLoading ? (
          <p className="shop__note">Chargement…</p>
        ) : gift?.claimed ? (
          <>
            <p className="shop__note">Tu as déjà récupéré ton cadeau aujourd'hui !</p>
            <p className="shop__countdown">⏳ Prochain cadeau dans {formatCountdown(remainingMs)}</p>
          </>
        ) : (
          <>
            <p className="shop__note">
              Un cadeau surprise t'attend : 💎, 🍔 ou 🍩 !
              {vipActive && ' 👑 Ta récompense sera doublée grâce à ton Pass VIP.'}
            </p>
            <button className="shop__btn shop__btn--gift" onClick={handleClaimGift} disabled={claiming}>
              {claiming ? 'Ouverture…' : 'Ouvrir mon cadeau 🎁'}
            </button>
          </>
        )}
      </section>

      {/* ---- Achat de burgers ---- */}
      <section className="shop__carte">
        <h2 className="shop__carte-titre">🍔 Acheter des Burgers</h2>
        <div className="shop__grid shop__grid--offers">
          {BURGER_OFFERS.map((offer) => (
            <button
              key={offer.amount}
              className="shop__offer"
              onClick={() => handleBuyBurgers(offer)}
              disabled={busyBurger !== null || user.gemmes < offer.cost}
            >
              <span className="shop__offer-amount">🍔 {offer.amount}</span>
              <span className="shop__offer-cost">{offer.cost} 💎</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Méga boîtes ---- */}
      <section className="shop__carte">
        <h2 className="shop__carte-titre">📦 Méga Boîtes</h2>
        <p className="shop__note">Bien plus généreuses que les boîtes mystères classiques !</p>
        {megaCount > 0 && (
          <button className="shop__mega-notif" onClick={() => navigate('/mega-boites')}>
            🎁 Tu as {megaCount} méga boîte{megaCount > 1 ? 's' : ''} à ouvrir ! Clique ici ✨
          </button>
        )}
        <div className="shop__grid shop__grid--mega">
          {MEGA_NIVEAUX.map((n) => (
            <button
              key={n.id}
              className="shop__mega"
              style={{ '--mega-color': n.color }}
              onClick={() => handleBuyMega(n)}
              disabled={busyMega !== null || (user.burgers ?? 0) < n.prix}
            >
              <MegaBoxArt niveau={n.id} className="shop__mega-art" />
              <span className="shop__mega-label">{n.label}</span>
              <span className="shop__mega-prix">🍔 {n.prix}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Pass VIP ---- */}
      <section className="shop__carte shop__vip">
        <h2 className="shop__carte-titre">👑 Pass VIP</h2>
        {vipActive ? (
          <p className="shop__note">
            Ton Pass VIP est actif encore <strong>{formatVipTimeLeft(user.vip_expire_at)}</strong>.
            Achète-le à nouveau pour prolonger de 2 semaines !
          </p>
        ) : (
          <p className="shop__note">Débloque 2 semaines d'avantages exclusifs !</p>
        )}
        <ul className="shop__vip-avantages">
          <li>⭐ Badge doré visible partout dans l'appli</li>
          <li>🍩 +20% de donuts sur tous les gains</li>
          <li>🎁 Cadeau du jour à récompense doublée</li>
          <li>📦 1 méga boîte Rare offerte immédiatement</li>
          <li>👑 Skins exclusifs dorés/premium dans Avatar</li>
        </ul>
        <button
          className="shop__btn shop__btn--vip"
          onClick={handleBuyVip}
          disabled={busyVip || user.donuts < 40 || user.gemmes < 5 || (user.burgers ?? 0) < 30}
        >
          {busyVip ? 'Achat…' : 'Activer le Pass VIP — 40 🍩 + 5 💎 + 30 🍔'}
        </button>
      </section>

      {/* ---- Catalogue accessoires ---- */}
      <section className="shop__carte">
        <h2 className="shop__carte-titre">🎨 Accessoires Avatar</h2>
        <p className="shop__note">Un aperçu ? Clique sur un accessoire pour foncer l'équiper dans Avatar 🎨</p>
        {SHOP_CATEGORIES.map((cat) => (
          <div key={cat.id} className="shop__cat">
            <h3 className="shop__cat-titre">{cat.emoji} {cat.label}</h3>
            <div className="shop__grid shop__grid--acc">
              {cat.items.filter((it) => !it.saison && !it.vip).map((item) => (
                <button
                  key={`${cat.id}:${item.id}`}
                  className="shop__acc"
                  onClick={() => goToAvatar(cat.id)}
                >
                  <FallGuy className="shop__acc-preview" avatar={{ color: '#c9cde0', [cat.id]: item.id }} />
                  <span className="shop__acc-label">{item.label}</span>
                  <span className="shop__acc-price">{item.price === 0 ? 'Gratuit' : `💎 ${item.price}`}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {toast && <div className="shop__toast">{toast}</div>}

      {/* ---- Animation de célébration du cadeau du jour ---- */}
      {giftResult && (
        <div className="shop-celebrate" onClick={closeGiftCelebration}>
          <div className="shop-celebrate__confetti" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className={`shop-celebrate__bit shop-celebrate__bit--${i % 6}`} />
            ))}
          </div>
          <FallGuy
            className="shop-celebrate__hero"
            avatar={user.avatar}
            anim="jump"
            expression="fier"
            role={user.role}
          />
          <div className="shop-celebrate__bubble">
            {giftResult.vip_double && <p className="shop-celebrate__vip">👑 Récompense doublée VIP !</p>}
            <p className="shop-celebrate__reward">
              +{giftResult.montant} {GIFT_EMOJI[giftResult.type]} {GIFT_LABEL[giftResult.type]}
            </p>
          </div>
          <button className="shop__btn" onClick={closeGiftCelebration}>Génial ! Continuer ✨</button>
        </div>
      )}
    </div>
  )
}
