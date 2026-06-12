import { getItem, normalizeAvatar } from '../lib/avatar'

// ---- Cheveux (dessinés en SVG, rendus DERRIÈRE le visage) ----
function Hair({ id }) {
  switch (id) {
    case 'spiky':
      return (
        <path
          d="M28 20 L34 2 L43 17 L52 0 L60 16 L68 0 L77 17 L86 3 L92 20 Z"
          fill="#5b3a29"
        />
      )
    case 'side':
      return (
        <path
          d="M26 24 Q28 6 60 7 Q88 8 92 22 Q72 12 50 16 Q36 18 26 24 Z"
          fill="#7a4a2a"
        />
      )
    case 'bowl':
      return (
        <path d="M24 30 Q60 -8 96 30 Q60 18 24 30 Z" fill="#3a2a1a" />
      )
    case 'mohawk':
      return (
        <g>
          <path d="M54 18 L57 -2 L60 18 Z" fill="#ff4d8d" />
          <path d="M58 18 L62 -4 L66 18 Z" fill="#7c3aff" />
          <path d="M63 18 L67 -2 L70 18 Z" fill="#00bfff" />
        </g>
      )
    case 'afro':
      return (
        <g fill="#2f2016">
          <circle cx="60" cy="14" r="27" />
          <circle cx="30" cy="26" r="14" />
          <circle cx="90" cy="26" r="14" />
        </g>
      )
    case 'long':
      return (
        <g fill="#6a4a2a">
          <path d="M22 30 Q8 64 18 100 L31 100 Q24 62 32 34 Z" />
          <path d="M98 30 Q112 64 102 100 L89 100 Q96 62 88 34 Z" />
        </g>
      )
    case 'rainbow':
      return (
        <path d="M24 30 Q60 -8 96 30 Q60 18 24 30 Z" fill="url(#fg-rainbow)" />
      )
    default:
      return null
  }
}

// ---- Lunettes (dessinées en SVG, rendues DEVANT les yeux) ----
function Glasses({ id }) {
  const dark = '#2b2350'
  switch (id) {
    case 'round':
      return (
        <g fill="rgba(255,255,255,0.25)" stroke={dark} strokeWidth="3">
          <circle cx="49" cy="60" r="9" />
          <circle cx="71" cy="60" r="9" />
          <line x1="58" y1="60" x2="62" y2="60" />
        </g>
      )
    case 'square':
      return (
        <g fill="rgba(255,255,255,0.25)" stroke={dark} strokeWidth="3">
          <rect x="40" y="52" width="18" height="16" rx="4" />
          <rect x="62" y="52" width="18" height="16" rx="4" />
          <line x1="58" y1="60" x2="62" y2="60" />
        </g>
      )
    case 'sun':
      return (
        <g fill={dark}>
          <rect x="40" y="52" width="18" height="16" rx="7" />
          <rect x="62" y="52" width="18" height="16" rx="7" />
          <rect x="57" y="58" width="6" height="3" />
        </g>
      )
    case 'star':
      return (
        <g>
          <rect x="40" y="52" width="18" height="16" rx="7" fill={dark} />
          <rect x="62" y="52" width="18" height="16" rx="7" fill={dark} />
          <rect x="57" y="58" width="6" height="3" fill={dark} />
          <text x="49" y="61" fontSize="11" textAnchor="middle" dominantBaseline="central">⭐</text>
          <text x="71" y="61" fontSize="11" textAnchor="middle" dominantBaseline="central">⭐</text>
        </g>
      )
    case 'heart':
      return (
        <g>
          <rect x="40" y="52" width="18" height="16" rx="7" fill="#ff4d8d" opacity="0.85" />
          <rect x="62" y="52" width="18" height="16" rx="7" fill="#ff4d8d" opacity="0.85" />
          <rect x="57" y="58" width="6" height="3" fill="#ff4d8d" />
          <text x="49" y="61" fontSize="10" textAnchor="middle" dominantBaseline="central">❤️</text>
          <text x="71" y="61" fontSize="10" textAnchor="middle" dominantBaseline="central">❤️</text>
        </g>
      )
    case 'ski':
      return (
        <g>
          <rect x="36" y="50" width="48" height="20" rx="10" fill="rgba(0,191,255,0.5)" stroke={dark} strokeWidth="3" />
          <rect x="33" y="57" width="6" height="6" rx="2" fill={dark} />
          <rect x="81" y="57" width="6" height="6" rx="2" fill={dark} />
        </g>
      )
    case 'cyber':
      return (
        <g stroke={dark} strokeWidth="2.5">
          <rect x="40" y="52" width="18" height="16" rx="4" fill="rgba(239,68,68,0.6)" />
          <rect x="62" y="52" width="18" height="16" rx="4" fill="rgba(0,191,255,0.6)" />
          <line x1="58" y1="60" x2="62" y2="60" />
        </g>
      )
    default:
      return null
  }
}

// Petit bonhomme « Fall Guys » (haricot) en SVG, personnalisable.
// - `avatar` : objet { color, hat, glasses, hair, sport } (prioritaire)
// - `color`  : couleur de corps simple (compat des usages décoratifs)
export default function FallGuy({ color = '#ff4d8d', avatar = null, className = '' }) {
  const a = avatar ? normalizeAvatar(avatar) : null
  const bodyColor = a?.color || color
  const gid = `fg-${bodyColor.replace('#', '')}`

  const hat = a ? getItem('hat', a.hat) : null
  const sport = a ? getItem('sport', a.sport) : null

  return (
    <svg
      className={className}
      viewBox="0 0 120 168"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.4" stopColor={bodyColor} />
          <stop offset="1" stopColor={bodyColor} />
        </linearGradient>
        <linearGradient id="fg-rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4d8d" />
          <stop offset="0.25" stopColor="#ff8c42" />
          <stop offset="0.5" stopColor="#3dd68c" />
          <stop offset="0.75" stopColor="#00bfff" />
          <stop offset="1" stopColor="#7c3aff" />
        </linearGradient>
      </defs>

      {/* Jambes */}
      <rect x="39" y="118" width="14" height="34" rx="7" fill={bodyColor} />
      <rect x="67" y="118" width="14" height="34" rx="7" fill={bodyColor} />
      {/* Pieds */}
      <ellipse cx="43" cy="152" rx="13" ry="8" fill="#fff" />
      <ellipse cx="77" cy="152" rx="13" ry="8" fill="#fff" />

      {/* Bras */}
      <rect x="4" y="58" width="15" height="46" rx="7.5" fill={bodyColor} />
      <rect x="101" y="58" width="15" height="46" rx="7.5" fill={bodyColor} />

      {/* Cheveux (derrière le corps/visage) */}
      {a?.hair && <Hair id={a.hair} />}

      {/* Corps en haricot */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={`url(#${gid})`} />

      {/* Panneau visage */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill="#fff" opacity="0.96" />
      {/* Yeux */}
      <circle cx="49" cy="60" r="6.5" fill="#2b2350" />
      <circle cx="71" cy="60" r="6.5" fill="#2b2350" />
      <circle cx="51.5" cy="57.5" r="2.2" fill="#fff" />
      <circle cx="73.5" cy="57.5" r="2.2" fill="#fff" />
      {/* Joues */}
      <circle cx="38" cy="70" r="4.5" fill="#ff8fb0" opacity="0.75" />
      <circle cx="82" cy="70" r="4.5" fill="#ff8fb0" opacity="0.75" />

      {/* Lunettes (devant les yeux) */}
      {a?.glasses && <Glasses id={a.glasses} />}

      {/* Chapeau (emoji, posé sur la tête) */}
      {hat && (
        <text x="60" y="13" fontSize="40" textAnchor="middle" dominantBaseline="central">
          {hat.glyph}
        </text>
      )}

      {/* Accessoire de sport (emoji, tenu près de la main droite) */}
      {sport && (
        <text x="107" y="103" fontSize="28" textAnchor="middle" dominantBaseline="central">
          {sport.glyph}
        </text>
      )}
    </svg>
  )
}
