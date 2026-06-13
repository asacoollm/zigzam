import { normalizeAvatar, resolveColor } from '../lib/avatar'
import {
  renderHat, renderGlasses, renderHair, renderSport, renderAnimal, renderFace,
} from './avatarParts'
import './FallGuy.css'

// Défs de couleurs spéciales (dégradés / motifs / effets) — rendues une fois par SVG.
function ColorDefs() {
  return (
    <>
      <linearGradient id="fg-rainbow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ff4d8d" /><stop offset="0.25" stopColor="#ff8c42" />
        <stop offset="0.5" stopColor="#3dd68c" /><stop offset="0.75" stopColor="#00bfff" />
        <stop offset="1" stopColor="#7c3aff" />
      </linearGradient>
      <linearGradient id="body-rainbow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff4d8d" /><stop offset="0.3" stopColor="#ff8c42" />
        <stop offset="0.55" stopColor="#3dd68c" /><stop offset="0.8" stopColor="#00bfff" />
        <stop offset="1" stopColor="#7c3aff" />
      </linearGradient>
      <linearGradient id="body-sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd23f" /><stop offset="0.5" stopColor="#ff8c42" />
        <stop offset="1" stopColor="#ff4d8d" />
      </linearGradient>
      <radialGradient id="body-galaxy" cx="0.4" cy="0.3" r="0.9">
        <stop offset="0" stopColor="#7c3aff" /><stop offset="0.6" stopColor="#3b2080" />
        <stop offset="1" stopColor="#160a33" />
      </radialGradient>
      <linearGradient id="body-ocean" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7ce7ff" /><stop offset="1" stopColor="#0077c8" />
      </linearGradient>
      <linearGradient id="body-flames" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ffd23f" /><stop offset="0.5" stopColor="#ff8c42" />
        <stop offset="1" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="body-gold" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#fff3b0" /><stop offset="0.5" stopColor="#ffcf3f" />
        <stop offset="1" stopColor="#c98a17" />
      </linearGradient>
      <linearGradient id="body-silver" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#ffffff" /><stop offset="0.5" stopColor="#cfd6e0" />
        <stop offset="1" stopColor="#8b94a3" />
      </linearGradient>
      <linearGradient id="body-holo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a0f0ff" /><stop offset="0.3" stopColor="#ffb3f0" />
        <stop offset="0.6" stopColor="#c3b3ff" /><stop offset="1" stopColor="#b3fff0" />
      </linearGradient>
      <pattern id="body-stars" width="22" height="22" patternUnits="userSpaceOnUse">
        <rect width="22" height="22" fill="#5a1fd4" />
        <path d="M11 3 l1.6 3.4 3.8 .3 -2.9 2.6 .9 3.7 -3.4 -2 -3.4 2 .9 -3.7 -2.9 -2.6 3.8 -.3 Z" fill="#ffd93f" />
      </pattern>
      <pattern id="body-dots" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#ff4d8d" />
        <circle cx="8" cy="8" r="3" fill="#fff" opacity="0.9" />
      </pattern>
      <pattern id="body-stripes" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="18" height="18" fill="#ff8c42" />
        <rect width="9" height="18" fill="#ffd23f" />
      </pattern>
      <pattern id="body-camo" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#5a7a3a" />
        <ellipse cx="10" cy="12" rx="9" ry="7" fill="#3f5a28" />
        <ellipse cx="30" cy="28" rx="10" ry="8" fill="#3f5a28" />
        <ellipse cx="28" cy="8" rx="6" ry="5" fill="#86a85a" />
        <ellipse cx="8" cy="32" rx="6" ry="5" fill="#86a85a" />
      </pattern>
    </>
  )
}

// Petit bonhomme « Fall Guys » (haricot) en SVG, personnalisable.
// - `avatar` : objet { color, hat, glasses, hair, sport, animal, face } (prioritaire)
// - `color`  : couleur simple (id ou hex) pour les usages décoratifs
// - `anim`   : 'idle' | 'jump' | 'walk' (animations du compagnon)
export default function FallGuy({ color = 'violet', avatar = null, anim = null, className = '' }) {
  const a = avatar ? normalizeAvatar(avatar) : null
  const colorId = a?.color || color
  const { fill: bodyFill } = resolveColor(colorId)
  const cls = `fg ${anim ? 'fg--' + anim : ''} ${className}`.trim()

  return (
    <svg
      className={cls}
      viewBox="0 -24 120 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs><ColorDefs /></defs>

      {/* Jambes */}
      <rect x="39" y="118" width="14" height="34" rx="7" fill={bodyFill} />
      <rect x="67" y="118" width="14" height="34" rx="7" fill={bodyFill} />
      {/* Pieds */}
      <ellipse cx="43" cy="152" rx="13" ry="8" fill="#fff" />
      <ellipse cx="77" cy="152" rx="13" ry="8" fill="#fff" />

      {/* Bras */}
      <rect x="4" y="58" width="15" height="46" rx="7.5" fill={bodyFill} />
      <rect x="101" y="58" width="15" height="46" rx="7.5" fill={bodyFill} />

      {/* Cheveux (derrière le corps/visage, sous le chapeau) */}
      {a?.hair && renderHair(a.hair)}

      {/* Corps en haricot + reflet */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={bodyFill} />
      <ellipse cx="48" cy="44" rx="26" ry="22" fill="#fff" opacity="0.18" />

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

      {/* Bouche / visage */}
      {a?.face && renderFace(a.face)}

      {/* Lunettes (devant les yeux) */}
      {a?.glasses && renderGlasses(a.glasses)}

      {/* Chapeau (par-dessus les cheveux) */}
      {a?.hat && renderHat(a.hat)}

      {/* Sport (tenu / posé) */}
      {a?.sport && renderSport(a.sport)}

      {/* Animal de compagnie */}
      {a?.animal && renderAnimal(a.animal)}
    </svg>
  )
}
