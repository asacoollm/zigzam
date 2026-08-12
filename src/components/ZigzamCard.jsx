import { RARITE_INFO, TYPE_INFO } from '../lib/cartes'
import FallGuy from './FallGuy'
import './ZigzamCard.css'

// Carte façon Pokémon : cadre coloré selon la rareté, bonhomme Fall Guys
// avec un skin (couleur/chapeau/lunettes) au centre, type en bas.
// `locked` = grisée (pas encore possédée, page Collection).
export default function ZigzamCard({ card, locked = false, className = '' }) {
  if (!card) return null
  const rarete = RARITE_INFO[card.rarete] || RARITE_INFO.normale
  const type = TYPE_INFO[card.type] || TYPE_INFO.donut
  const holo = card.rarete === 'incroyable' || card.rarete === 'impossible'

  return (
    <div
      className={`zcard zcard--${card.rarete} ${holo ? 'zcard--holo' : ''} ${locked ? 'zcard--locked' : ''} ${className}`}
    >
      <div className="zcard__inner">
        <div className="zcard__head">
          <span className="zcard__nom">{card.nom}</span>
          <span className="zcard__rarete">{rarete.label}</span>
        </div>
        <div className="zcard__stage">
          <FallGuy className="zcard__avatar" avatar={card.skin_data} />
        </div>
        <div className="zcard__foot">
          <span className="zcard__type">{type.emoji} {type.label}</span>
        </div>
        {holo && <span className="zcard__shine" aria-hidden="true" />}
      </div>
    </div>
  )
}
