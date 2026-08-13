import { useNavigate, useParams } from 'react-router-dom'
import { getPaysBySlug } from '../data/mapPays'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import './MapPays.css'

// Page d'un pays de la Map Zigzam — vide pour l'instant, le contenu
// (mini-pièces, coffre…) arrivera dans une prochaine étape.
export default function MapPays() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const pays = getPaysBySlug(slug)

  return (
    <div className="mpays">
      <Backdrop />

      <header className="mpays__top">
        <button className="mpays__retour" onClick={() => navigate('/map')}>⬅️ Retour à la carte</button>
        <ZigzamLogo size="sm" />
        <span />
      </header>

      <div className="mpays__contenu">
        <span className="mpays__emoji">{pays?.emoji ?? '🗺️'}</span>
        <h1 className="mpays__titre stroke-title">{pays?.nom ?? 'Pays inconnu'}</h1>
        <p className="mpays__soon">🚧 Bientôt disponible ! Reviens vite explorer ce pays.</p>
      </div>
    </div>
  )
}
