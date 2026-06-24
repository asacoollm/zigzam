import { useSaison } from '../context/SaisonContext'
import './ZigzamLogo.css'

// Couleurs de la signature, appliquées lettre par lettre.
const LETTERS = [
  { ch: 'Z', color: 'var(--rose)' },
  { ch: 'i', color: 'var(--orange)' },
  { ch: 'g', color: 'var(--violet)' },
  { ch: 'z', color: 'var(--bleu)' },
  { ch: 'a', color: 'var(--vert)' },
  { ch: 'm', color: 'var(--rose)' },
]

export default function ZigzamLogo({ size = 'md', className = '' }) {
  const { active, saison } = useSaison()

  const logo = (
    <span
      className={`zlogo zlogo--${size} ${active ? 'zlogo--saison' : ''} ${className}`}
      aria-label="Zigzam"
    >
      {LETTERS.map((l, i) => (
        <span
          key={i}
          className="zlogo__letter"
          data-ch={l.ch}
          style={{ color: l.color, animationDelay: `${i * 0.12}s` }}
          aria-hidden="true"
        >
          {l.ch}
        </span>
      ))}
    </span>
  )

  // Pendant une saison, on garde les couleurs mais on ajoute une texture
  // « écailles » + un tremblement, et un sous-titre sous le grand logo.
  if (active && (size === 'lg' || size === 'md')) {
    return (
      <span className="zlogo-wrap zlogo-wrap--saison">
        {logo}
        <span className="zlogo__sub">{saison?.theme?.emoji || '🦕'} {saison?.titre || 'Jurassic Web'} — Saison {saison?.theme?.numero || saison?.numero || 1}</span>
      </span>
    )
  }

  return logo
}
