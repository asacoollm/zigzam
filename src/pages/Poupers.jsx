import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPoupers } from '../lib/modules'
import { pouperRecordLabel, formatPouperValue } from '../lib/poupers'
import Backdrop from '../components/Backdrop'
import FallGuy from '../components/FallGuy'
import ZigzamLogo from '../components/ZigzamLogo'
import './Poupers.css'

export default function Poupers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [poupers, setPoupers] = useState(null) // null = chargement

  useEffect(() => {
    let on = true
    getPoupers().then((list) => on && setPoupers(list))
    return () => { on = false }
  }, [])

  return (
    <div className="poup">
      <Backdrop />

      <header className="poup__top">
        <button className="poup__retour" onClick={() => navigate('/dashboard')}>
          ⬅️ Retour
        </button>
        <ZigzamLogo size="sm" />
        <span />
      </header>

      <h1 className="poup__titre stroke-title">🪆 Poupers Collectore</h1>
      <p className="poup__sous-titre">
        Des poupées uniques qui récompensent les meilleurs records de Zigzam !
      </p>

      {poupers === null ? (
        <p className="poup__loading">Chargement des poupées…</p>
      ) : (
        <div className="poup__grid">
          {poupers.map((p) => {
            const isMoi = p.detenteur?.id === user.id
            return (
              <div key={p.id} className={`poup__carte ${isMoi ? 'poup__carte--moi' : ''}`}>
                {isMoi && <span className="poup__badge-moi">👑 C'est toi !</span>}
                <div className="poup__doll-wrap">
                  <img className="poup__doll" src={p.image_url} alt={p.nom} />
                </div>
                <h2 className="poup__nom">{p.nom}</h2>
                <p className="poup__record">{pouperRecordLabel(p.record_type)}</p>
                <p className="poup__desc">{p.description}</p>

                {p.detenteur ? (
                  <div className="poup__detenteur">
                    <FallGuy
                      className="poup__detenteur-avatar"
                      avatar={p.detenteur.avatar}
                      role={p.detenteur.role}
                      vip={p.detenteur.vip}
                    />
                    <div className="poup__detenteur-info">
                      <span className="poup__detenteur-pseudo">{p.detenteur.pseudo}</span>
                      <span className="poup__detenteur-valeur">
                        {formatPouperValue(p.record_type, p.record_valeur)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="poup__libre">Personne pour l'instant 🔓</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
