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
  return (
    <span className={`zlogo zlogo--${size} ${className}`} aria-label="Zigzam">
      {LETTERS.map((l, i) => (
        <span
          key={i}
          className="zlogo__letter"
          style={{ color: l.color, animationDelay: `${i * 0.12}s` }}
          aria-hidden="true"
        >
          {l.ch}
        </span>
      ))}
    </span>
  )
}
