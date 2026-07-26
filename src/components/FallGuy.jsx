import { normalizeAvatar, resolveColor } from '../lib/avatar'
import {
  renderHat, renderGlasses, renderHair, renderHairBack, renderSport, renderAnimal, renderFace,
  renderFull, animalWide,
} from './avatarParts'
import { DisneyColorDefs } from './disneyFaces'
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

      {/* ====== 🦕 JURASSIC WEB — couleurs exclusives de saison ====== */}
      {/* Camouflage Jungle : taches de vert sombre/clair. */}
      <pattern id="body-jcamo" width="46" height="46" patternUnits="userSpaceOnUse">
        <rect width="46" height="46" fill="#2f6b3a" />
        <ellipse cx="11" cy="13" rx="11" ry="9" fill="#1c4a26" />
        <ellipse cx="34" cy="31" rx="12" ry="10" fill="#1c4a26" />
        <ellipse cx="32" cy="9" rx="7" ry="6" fill="#5fa05a" />
        <ellipse cx="8" cy="35" rx="7" ry="6" fill="#5fa05a" />
        <ellipse cx="23" cy="22" rx="5" ry="4" fill="#86b855" />
      </pattern>
      {/* Écailles T-Rex : écailles gris-vert qui se chevauchent. */}
      <pattern id="body-jtrexskin" width="20" height="16" patternUnits="userSpaceOnUse">
        <rect width="20" height="16" fill="#566a54" />
        <path d="M0 8 a5 5 0 0 1 10 0 Z M10 8 a5 5 0 0 1 10 0 Z" fill="#3f5a3c" stroke="#2c3f2a" strokeWidth="0.6" />
        <path d="M-5 0 a5 5 0 0 1 10 0 Z M5 0 a5 5 0 0 1 10 0 Z M15 0 a5 5 0 0 1 10 0 Z" fill="#6b7d64" stroke="#2c3f2a" strokeWidth="0.6" />
      </pattern>
      {/* Dino Doré : or brillant façon fossile précieux. */}
      <linearGradient id="body-jdinogold" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#fff1c0" /><stop offset="0.45" stopColor="#e6b23a" />
        <stop offset="1" stopColor="#9a6a12" />
      </linearGradient>
      {/* Raptor Bleu : bleu électrique de « Blue » (Jurassic World). */}
      <linearGradient id="body-jraptorblue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7fd4ff" /><stop offset="0.5" stopColor="#1f6fd6" />
        <stop offset="1" stopColor="#123a8a" />
      </linearGradient>

      {/* ====== 🏰 ZIGZAMLAND PARIS — couleurs exclusives de saison ====== */}
      <DisneyColorDefs />

      {/* ====== 👑 PASS VIP — skins dorés/premium exclusifs ====== */}
      <linearGradient id="body-vipdiamond" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" /><stop offset="0.45" stopColor="#bfe9ff" />
        <stop offset="1" stopColor="#5fb8e6" />
      </linearGradient>
      <linearGradient id="body-vipemerald" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#c8ffe0" /><stop offset="0.45" stopColor="#22c98a" />
        <stop offset="1" stopColor="#0a6b46" />
      </linearGradient>
      <linearGradient id="body-vipruby" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#ffd0d8" /><stop offset="0.45" stopColor="#e0264f" />
        <stop offset="1" stopColor="#7a0f28" />
      </linearGradient>
      <linearGradient id="body-vipsapphire" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#cfe0ff" /><stop offset="0.45" stopColor="#2952d6" />
        <stop offset="1" stopColor="#122a7a" />
      </linearGradient>
      <linearGradient id="body-viprosegold" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#ffe4e0" /><stop offset="0.45" stopColor="#e8a0a0" />
        <stop offset="1" stopColor="#b06a5a" />
      </linearGradient>
      <linearGradient id="body-vipobsidian" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#c9a6ff" /><stop offset="0.45" stopColor="#2b1a4a" />
        <stop offset="1" stopColor="#0a0614" />
      </linearGradient>
    </>
  )
}

// Badge de rôle affiché sur le ventre du bonhomme (admin / superadmin).
function RoleBadge({ role }) {
  if (role === 'superadmin') {
    return (
      <g className="fg__badge">
        <circle cx="60" cy="100" r="12" fill="#f5b800" stroke="#fff" strokeWidth="2.5" />
        <text x="60" y="101" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="#fff">★</text>
      </g>
    )
  }
  if (role === 'admin') {
    return (
      <g className="fg__badge">
        <circle cx="60" cy="100" r="12" fill="#7c3aff" stroke="#fff" strokeWidth="2.5" />
        <text
          x="60" y="101" textAnchor="middle" dominantBaseline="central"
          fontSize="14" fontWeight="700" fill="#fff" fontFamily="Fredoka, sans-serif"
        >A</text>
      </g>
    )
  }
  return null
}

// Couronne dorée 👑 affichée au-dessus de la tête pour les membres Pass VIP actif.
function VipCrown({ vip }) {
  if (!vip) return null
  return (
    <text className="fg__vip" x="60" y="-4" textAnchor="middle" fontSize="22">👑</text>
  )
}

// ============================================================
//  Expressions faciales (Série Zigzam) : modifient yeux + bouche.
//  Repères : œil gauche ~ (49,60), œil droit ~ (71,60), bouche ~ y70-73.
// ============================================================
const LINE = { stroke: '#2b2350', strokeWidth: 3, strokeLinecap: 'round', fill: 'none' }

// Yeux selon l'expression (null = yeux par défaut).
function expressionEyes(expr) {
  switch (expr) {
    case 'fier': // mi-fermés satisfaits (petits arcs vers le haut)
      return (
        <>
          <path d="M43 61 q6 -5 12 0" {...LINE} />
          <path d="M65 61 q6 -5 12 0" {...LINE} />
        </>
      )
    case 'gene': // pupilles décalées sur le côté + goutte de sueur
      return (
        <>
          <circle cx="53" cy="61" r="4.6" fill="#2b2350" />
          <circle cx="75" cy="61" r="4.6" fill="#2b2350" />
          <circle cx="54.6" cy="59.4" r="1.5" fill="#fff" />
          <circle cx="76.6" cy="59.4" r="1.5" fill="#fff" />
          <path d="M88 49 q4.5 6 0 10 q-4.5 -4 0 -10 Z" fill="#7ce7ff" opacity="0.9" />
        </>
      )
    case 'blase': // à moitié fermés (paupière basse + petite pupille)
      return (
        <>
          <path d="M42 59 q7 2.5 14 0" {...LINE} strokeWidth="3.5" />
          <path d="M64 59 q7 2.5 14 0" {...LINE} strokeWidth="3.5" />
          <circle cx="49" cy="62.6" r="2.6" fill="#2b2350" />
          <circle cx="71" cy="62.6" r="2.6" fill="#2b2350" />
        </>
      )
    case 'moque': // clin d'œil : gauche ouvert, droit fermé
      return (
        <>
          <circle cx="49" cy="60" r="6.5" fill="#2b2350" />
          <circle cx="51.5" cy="57.5" r="2.2" fill="#fff" />
          <path d="M65 61 q6 4 12 0" {...LINE} />
        </>
      )
    case 'choque': // grands ouverts
      return (
        <>
          <circle cx="49" cy="59" r="7.6" fill="#2b2350" />
          <circle cx="71" cy="59" r="7.6" fill="#2b2350" />
          <circle cx="51.6" cy="56.4" r="2.7" fill="#fff" />
          <circle cx="73.6" cy="56.4" r="2.7" fill="#fff" />
        </>
      )
    case 'vexe': // contrarié / boudeur : sourcils froncés vers le centre
      return (
        <>
          <circle cx="49" cy="62" r="5.4" fill="#2b2350" />
          <circle cx="71" cy="62" r="5.4" fill="#2b2350" />
          <circle cx="51" cy="60" r="1.8" fill="#fff" />
          <circle cx="73" cy="60" r="1.8" fill="#fff" />
          <path d="M42 52 L57 58" {...LINE} />
          <path d="M78 52 L63 58" {...LINE} />
        </>
      )
    case 'triste': // tombants (pupilles + paupières inclinées)
      return (
        <>
          <circle cx="49" cy="62" r="5" fill="#2b2350" />
          <circle cx="71" cy="62" r="5" fill="#2b2350" />
          <path d="M42 55 L56 60.5" {...LINE} />
          <path d="M78 55 L64 60.5" {...LINE} />
        </>
      )
    default:
      return null
  }
}

// Bouche selon l'expression (null = bouche par défaut / accessoire visage).
function expressionMouth(expr) {
  switch (expr) {
    case 'fier': // sourire en coin confiant
      return <path d="M50 70 q10 7 20 -2" {...LINE} />
    case 'gene': // bouche tordue
      return <path d="M50 71 q4 -4 8 0 t8 1" {...LINE} />
    case 'blase': // bouche plate
      return <path d="M51 71 h18" {...LINE} />
    case 'moque': // sourire narquois asymétrique
      return <path d="M49 70 q11 8 22 -5" {...LINE} />
    case 'choque': // bouche en O
      return <ellipse cx="60" cy="72" rx="5.5" ry="6.5" fill="#2b2350" />
    case 'vexe': // petite moue boudeuse
      return <path d="M53 73 q7 -4 14 0" {...LINE} />
    case 'triste': // bouche en arc vers le bas
      return <path d="M50 73 q10 -7 20 0" {...LINE} />
    default:
      return null
  }
}

// Petit bonhomme « Fall Guys » (haricot) en SVG, personnalisable.
// - `avatar`     : objet { color, hat, glasses, hair, sport, animal, face } (prioritaire)
// - `color`      : couleur simple (id ou hex) pour les usages décoratifs
// - `anim`       : 'idle'|'jump'|'walk'|'fall'|'shrug'|'jumploop'|'collapse'
// - `eyesClosed` : true → yeux fermés (petits arcs), pour la Série Zigzam
// - `expression` : 'fier'|'gene'|'blase'|'moque'|'choque'|'vexe'|'triste'|'neutre' (Série Zigzam)
// - `role`       : 'admin' | 'superadmin' → affiche un badge sur le ventre
// - `vip`        : true → affiche une couronne dorée au-dessus de la tête
export default function FallGuy({
  color = 'violet', avatar = null, anim = null, className = '', role = null,
  eyesClosed = false, expression = null, vip = false,
}) {
  // Une expression (≠ neutre) prend la main sur les yeux et la bouche.
  const expr = expression && expression !== 'neutre' ? expression : null
  const a = avatar ? normalizeAvatar(avatar) : null
  const colorId = a?.color || color
  const { fill: bodyFill } = resolveColor(colorId)
  const cls = `fg ${anim ? 'fg--' + anim : ''} ${className}`.trim()
  // Skin complet (saison Zigzamland) : remplace tout le bonhomme s'il existe.
  const fullSkin = a?.full ? renderFull(a.full) : null
  // Tout animal de compagnie prend place À DROITE du bonhomme → on élargit le viewBox.
  const wide = a?.animal && animalWide(a.animal)
  const viewBox = wide ? '0 -24 214 192' : '0 -24 120 192'

  return (
    <svg
      className={cls}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs><ColorDefs /></defs>

      {/* Skin « complet » : remplace intégralement le bonhomme (corps, tête,
          membres, visage). Les accessoires posés dessus n'ont plus de sens,
          on rend donc UNIQUEMENT le skin — sauf l'animal de compagnie et le
          badge de rôle, qui vivent à côté du personnage. */}
      {fullSkin ? (
        <>
          {fullSkin}
          {a?.animal && renderAnimal(a.animal)}
          <RoleBadge role={role} />
          <VipCrown vip={vip} />
        </>
      ) : (
      <>
      {/* Jambes */}
      <rect x="39" y="118" width="14" height="34" rx="7" fill={bodyFill} />
      <rect x="67" y="118" width="14" height="34" rx="7" fill={bodyFill} />
      {/* Pieds */}
      <ellipse cx="43" cy="152" rx="13" ry="8" fill="#fff" />
      <ellipse cx="77" cy="152" rx="13" ry="8" fill="#fff" />

      {/* Bras */}
      <rect x="4" y="58" width="15" height="46" rx="7.5" fill={bodyFill} />
      <rect x="101" y="58" width="15" height="46" rx="7.5" fill={bodyFill} />

      {/* Cheveux — couche ARRIÈRE : longueurs qui tombent dans le dos (derrière le corps) */}
      {a?.hair && renderHairBack(a.hair)}

      {/* Corps en haricot + reflet */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={bodyFill} />
      <ellipse cx="48" cy="44" rx="26" ry="22" fill="#fff" opacity="0.18" />

      {/* Panneau visage */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill="#fff" opacity="0.96" />

      {/* Cheveux — couche AVANT : épouse le crâne + frange sur le front (par-dessus le visage, sous les yeux) */}
      {a?.hair && renderHair(a.hair)}

      {/* Yeux — fermés > expression > défaut (Série Zigzam) */}
      {eyesClosed ? (
        <>
          <path d="M42 60 q7 7 14 0" stroke="#2b2350" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M64 60 q7 7 14 0" stroke="#2b2350" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : expr ? (
        expressionEyes(expr)
      ) : (
        <>
          <circle cx="49" cy="60" r="6.5" fill="#2b2350" />
          <circle cx="71" cy="60" r="6.5" fill="#2b2350" />
          <circle cx="51.5" cy="57.5" r="2.2" fill="#fff" />
          <circle cx="73.5" cy="57.5" r="2.2" fill="#fff" />
        </>
      )}
      {/* Joues */}
      <circle cx="38" cy="70" r="4.5" fill="#ff8fb0" opacity="0.75" />
      <circle cx="82" cy="70" r="4.5" fill="#ff8fb0" opacity="0.75" />

      {/* Bouche — expression (Série Zigzam) sinon accessoire visage */}
      {expr ? expressionMouth(expr) : a?.face && renderFace(a.face)}

      {/* Lunettes (devant les yeux) */}
      {a?.glasses && renderGlasses(a.glasses)}

      {/* Chapeau (par-dessus les cheveux) */}
      {a?.hat && renderHat(a.hat)}

      {/* Sport (tenu / posé) */}
      {a?.sport && renderSport(a.sport)}

      {/* Animal de compagnie */}
      {a?.animal && renderAnimal(a.animal)}

      {/* Badge de rôle (admin / superadmin), par-dessus tout, sur le ventre */}
      <RoleBadge role={role} />
      <VipCrown vip={vip} />
      </>
      )}
    </svg>
  )
}
