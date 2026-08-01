import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import { exchange, sendValue, getTransactions } from '../lib/modules'
import './Economie.css'

export default function Economie() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  // États échange
  const [exchangeMsg, setExchangeMsg] = useState(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)

  // États envoi
  const [numero, setNumero] = useState('')
  const [montant, setMontant] = useState('')
  const [devise, setDevise] = useState('donut')
  const [sendMsg, setSendMsg] = useState(null)
  const [sendLoading, setSendLoading] = useState(false)

  // Historique
  const [transactions, setTransactions] = useState([])
  const [histoLoading, setHistoLoading] = useState(true)
  const [histoOpen, setHistoOpen] = useState(false) // replié par défaut (5 dernières)

  const chargerHistorique = useCallback(async () => {
    setHistoLoading(true)
    const data = await getTransactions(user.id)
    setTransactions(data || [])
    setHistoLoading(false)
  }, [user.id])

  useEffect(() => {
    chargerHistorique()
  }, [chargerHistorique])

  const handleExchange = async (sens) => {
    setExchangeLoading(true)
    setExchangeMsg(null)
    const res = await exchange(user.id, sens)
    if (res.ok) {
      updateUser({ donuts: res.donuts, gemmes: res.gemmes })
      setExchangeMsg({ type: 'ok', text: 'Échange réussi ! ✨' })
      chargerHistorique()
    } else {
      setExchangeMsg({ type: 'err', text: res.error })
    }
    setExchangeLoading(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    setSendMsg(null)
    const numStr = numero.trim()
    const montantInt = parseInt(montant, 10)
    if (!/^\d{4}$/.test(numStr)) {
      setSendMsg({ type: 'err', text: 'Le numéro doit faire exactement 4 chiffres.' })
      return
    }
    if (!montantInt || montantInt <= 0) {
      setSendMsg({ type: 'err', text: 'Indique un montant valide.' })
      return
    }
    setSendLoading(true)
    const res = await sendValue(user.id, numStr, devise, montantInt)
    if (res.ok) {
      updateUser({ donuts: res.donuts, gemmes: res.gemmes })
      setSendMsg({ type: 'ok', text: 'Envoyé ! 🎉' })
      setNumero('')
      setMontant('')
      chargerHistorique()
    } else {
      setSendMsg({ type: 'err', text: res.error })
    }
    setSendLoading(false)
  }

  const formaterDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="eco">
      <Backdrop />

      {/* Barre du haut */}
      <div className="eco__top">
        <button className="eco__retour" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
      </div>

      <h1 className="eco__titre">Mon Économie 💰</h1>

      {/* Solde */}
      <div className="eco__solde">
        <div className="eco__pastille eco__pastille--orange">
          🍩 <span className="eco__pastille-valeur">{user.donuts}</span>
          <span className="eco__pastille-label">donuts</span>
        </div>
        <div className="eco__pastille eco__pastille--bleu">
          💎 <span className="eco__pastille-valeur">{user.gemmes}</span>
          <span className="eco__pastille-label">gemmes</span>
        </div>
      </div>

      {/* Échanger */}
      <section className="eco__carte">
        <h2 className="eco__carte-titre">🔄 Échanger</h2>
        <p className="eco__taux">
          Taux officiel Zigzam&nbsp;: <strong>5 🍩 = 1 💎</strong>
        </p>

        <div className="eco__exchange-btns">
          <button
            className="eco__btn"
            onClick={() => handleExchange('donut_to_gem')}
            disabled={exchangeLoading}
          >
            5 🍩 → 1 💎
          </button>
          <button
            className="eco__btn"
            onClick={() => handleExchange('gem_to_donut')}
            disabled={exchangeLoading}
          >
            1 💎 → 5 🍩
          </button>
        </div>

        {exchangeMsg && (
          <p className={`eco__msg eco__msg--${exchangeMsg.type}`}>{exchangeMsg.text}</p>
        )}
      </section>

      {/* Envoyer à un ami */}
      <section className="eco__carte">
        <h2 className="eco__carte-titre">🎁 Envoyer à un ami</h2>
        <form className="eco__form" onSubmit={handleSend}>
          <label className="eco__label" htmlFor="eco-numero">
            Numéro de l'ami (4 chiffres)
          </label>
          <input
            id="eco-numero"
            className="eco__input"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="ex : 1234"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />

          <label className="eco__label" htmlFor="eco-montant">
            Montant
          </label>
          <input
            id="eco-montant"
            className="eco__input"
            type="number"
            min="1"
            placeholder="ex : 10"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />

          <div className="eco__devise-choix">
            <button
              type="button"
              className={`eco__devise-btn${devise === 'donut' ? ' eco__devise-btn--actif' : ''}`}
              onClick={() => setDevise('donut')}
            >
              🍩 Donut
            </button>
            <button
              type="button"
              className={`eco__devise-btn${devise === 'gemme' ? ' eco__devise-btn--actif' : ''}`}
              onClick={() => setDevise('gemme')}
            >
              💎 Gemme
            </button>
          </div>

          <button className="eco__btn eco__btn--full" type="submit" disabled={sendLoading}>
            {sendLoading ? 'Envoi…' : 'Envoyer 🚀'}
          </button>

          {sendMsg && (
            <p className={`eco__msg eco__msg--${sendMsg.type}`}>{sendMsg.text}</p>
          )}
        </form>
      </section>

      {/* Historique */}
      <section className="eco__carte">
        <h2 className="eco__carte-titre">📜 Historique</h2>

        {histoLoading ? (
          <p className="eco__histo-vide">Chargement…</p>
        ) : transactions.length === 0 ? (
          <p className="eco__histo-vide">Aucune transaction pour l'instant.</p>
        ) : (
          <>
            <ul className="eco__histo-liste">
              {(histoOpen ? transactions : transactions.slice(0, 5)).map((tx) => (
                <li key={tx.id} className="eco__histo-item">
                  <span className="eco__histo-icone">
                    {tx.devise === 'gemme' ? '💎' : '🍩'}
                  </span>
                  <span className="eco__histo-desc">{tx.description}</span>
                  <span
                    className={`eco__histo-montant ${tx.montant >= 0 ? 'eco__histo-montant--positif' : 'eco__histo-montant--negatif'}`}
                  >
                    {tx.montant >= 0 ? '+' : ''}{tx.montant}
                  </span>
                  <span className="eco__histo-date">{formaterDate(tx.date)}</span>
                </li>
              ))}
            </ul>
            {transactions.length > 5 && (
              <button
                className="eco__histo-toggle"
                onClick={() => setHistoOpen((v) => !v)}
                aria-expanded={histoOpen}
              >
                {histoOpen
                  ? 'Réduire ▲'
                  : `Voir tout l'historique (${transactions.length}) ▼`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
