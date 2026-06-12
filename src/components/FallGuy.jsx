import { normalizeAvatar } from '../lib/avatar'
import {
  renderHat,
  renderGlasses,
  renderHair,
  renderSport,
  renderAnimal,
} from './avatarParts'

// Petit bonhomme « Fall Guys » (haricot) en SVG, personnalisable.
// - `avatar` : objet { color, hat, glasses, hair, sport, animal } (prioritaire)
// - `color`  : couleur de corps simple (compat des usages décoratifs)
// Tous les accessoires sont dessinés en SVG (cf. avatarParts.jsx).
export default function FallGuy({ color = '#ff4d8d', avatar = null, className = '' }) {
  const a = avatar ? normalizeAvatar(avatar) : null
  const bodyColor = a?.color || color
  const gid = `fg-${bodyColor.replace('#', '')}`

  return (
    <svg
      className={className}
      viewBox="0 -24 120 192"
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
      {a?.hair && renderHair(a.hair)}

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
      {a?.glasses && renderGlasses(a.glasses)}

      {/* Chapeau (sur la tête) */}
      {a?.hat && renderHat(a.hat)}

      {/* Accessoire de sport (tenu / posé) */}
      {a?.sport && renderSport(a.sport)}

      {/* Animal de compagnie */}
      {a?.animal && renderAnimal(a.animal)}
    </svg>
  )
}
