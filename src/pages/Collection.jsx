import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyCards } from '../lib/cartes'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import ZigzamCard from '../components/ZigzamCard'
import './Collection.css'

export default function Collection() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState(null) // null = chargement

  useEffect(() => {
    let on = true
    getMyCards(user.id).then((list) => on && setCards(list))
    return () => { on = false }
  }, [user.id])

  const total = cards?.length ?? 0
  const possedees = cards?.filter((c) => c.possedee).length ?? 0

  return (
    <div className="coll">
      <Backdrop />
      <header className="coll__top">
        <button className="coll__back" onClick={() => navigate('/roulette')}>⬅️ Retour</button>
        <ZigzamLogo size="sm" />
        <span />
      </header>

      <h1 className="coll__title stroke-title">🃏 Ma Collection</h1>
      <p className="coll__hint">
        {cards === null ? 'Chargement…' : `${possedees} / ${total} cartes obtenues`}
      </p>

      {cards === null ? (
        <p className="coll__loading">Chargement des cartes…</p>
      ) : (
        <div className="coll__grid">
          {cards.map((c) => (
            <div key={c.id} className="coll__item">
              <ZigzamCard card={c} locked={!c.possedee} />
              {c.possedee && <span className="coll__badge">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
