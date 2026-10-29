// ============================================================
//  ✨ SKINS COMPLETS — Saison Halloween
// ============================================================
//  Même mécanique que les skins complets Disney (disneyFull.jsx) :
//  un skin complet REMPLACE le bonhomme en entier (jambes, pieds,
//  bras, corps en haricot, panneau visage, yeux, joues, bouche,
//  cheveux). FallGuy.jsx ne rend alors QUE ce <g> (+ l'animal de
//  compagnie éventuel, qui vit à côté, + le badge de rôle) : chapeau,
//  lunettes, cheveux et objet de sport posés par ailleurs n'ont plus
//  d'effet visuel tant que le skin complet est équipé — comme pour
//  n'importe quel skin complet déjà présent dans le jeu.
//
//  Repère (identique à FallGuy.jsx / avatarParts.jsx / disneyFull.jsx) :
//   - viewBox « 0 -24 120 192 », centre x = 60
//   - le bonhomme occupe y ≈ 16..160, pieds au sol vers y = 152
//   - crâne : demi-cercle de centre (60,58) et de rayon 42 (sommet y=16)
//   - corps « haricot » : capsule x 18..102, y 16..132
//   - bras : x 4..19 et x 101..116, y 58..104
//   - jambes : x 39..53 et x 67..81, y 118..152
//  Chaque skin respecte cet encombrement pour que la mise en page
//  (grilles, mini-avatars du sélecteur) ne bouge pas.
//
//  RÈGLES DE DESSIN
//   - Personnages 100% ORIGINAUX, mignons et rigolos — aucune
//     ressemblance avec un personnage de film/série/jeu connu.
//   - Aplats + 2/3 nuances d'ombre et de reflet, contours sombres fins.
//   - Aucun <defs> ni gradient à `id` : plusieurs avatars cohabitent
//     sur la même page, les ids entreraient en collision.
//   - Pas de sang, pas de gore, rien de réellement effrayant.
// ============================================================

// Contour commun : un brun-violet sombre, plus doux qu'un noir pur.
const T = '#241c2a'

// ------------------------------------------------------------
//  🧛 hfullvampire — « Petit Vampire » : grande cape noire doublée
//  de rouge, col haut dressé, peau pâle, petits crocs rigolos,
//  nœud papillon rouge, cheveux noirs gominés.
// ------------------------------------------------------------
function vampire() {
  const peau = '#ffe6da'
  const peauF = '#e8b89e'
  const noir = '#18121f'
  const noirC = '#2a2135'
  const rouge = '#d41f1f'
  const rougeF = '#9e1515'

  return (
    <g>
      {/* Grande cape noire doublée de rouge (DERRIÈRE tout le reste) */}
      <path d="M10 30 Q60 4 110 30 L118 138 Q60 158 2 138 Z" fill={noir} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 34 Q60 10 106 34 L110 60 Q60 42 10 60 Z" fill={rouge} opacity="0.88" />
      <path d="M8 90 Q60 110 112 90 L110 132 Q60 150 10 132 Z" fill={rouge} opacity="0.2" />
      {/* col haut dressé de chaque côté du visage, doublé de rouge */}
      <path d="M30 40 Q20 10 44 0 Q36 26 42 44 Z" fill={noir} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 38 Q27 16 42 6 Q37 26 41 40 Z" fill={rouge} opacity="0.85" />
      <path d="M90 40 Q100 10 76 0 Q84 26 78 44 Z" fill={noir} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M87 38 Q93 16 78 6 Q83 26 79 40 Z" fill={rouge} opacity="0.85" />

      {/* Jambes */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      {/* petites chaussures noires */}
      <ellipse cx="44" cy="150" rx="13" ry="8" fill={noirC} stroke={T} strokeWidth="2" />
      <ellipse cx="76" cy="150" rx="13" ry="8" fill={noirC} stroke={T} strokeWidth="2" />
      <ellipse cx="40" cy="147" rx="4.5" ry="2.2" fill="#fff" opacity="0.3" />
      <ellipse cx="72" cy="147" rx="4.5" ry="2.2" fill="#fff" opacity="0.3" />

      {/* Bras noirs, mains pâles */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <circle cx="12.5" cy="104" r="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill={peau} stroke={T} strokeWidth="1.5" />

      {/* Corps (costume noir) + reflet */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={noir} stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.08" />
      {/* plastron blanc + nœud papillon rouge */}
      <path d="M44 48 L60 72 L76 48 Z" fill="#fff" opacity="0.92" />
      <ellipse cx="51" cy="56" rx="7" ry="4.6" fill={rouge} stroke={rougeF} strokeWidth="1.2" transform="rotate(-18 51 56)" />
      <ellipse cx="69" cy="56" rx="7" ry="4.6" fill={rouge} stroke={rougeF} strokeWidth="1.2" transform="rotate(18 69 56)" />
      <circle cx="60" cy="56" r="3" fill={rougeF} />

      {/* Visage pâle */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill={peau} />
      <ellipse cx="47" cy="52" rx="11" ry="7" fill="#fff" opacity="0.3" />
      <circle cx="49" cy="60" r="6" fill={T} />
      <circle cx="71" cy="60" r="6" fill={T} />
      <circle cx="51.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="73.4" cy="57.6" r="2.1" fill="#fff" />
      {/* petites joues roses, pour rester mignon malgré la pâleur */}
      <circle cx="40" cy="70" r="4.2" fill="#ff9fb0" opacity="0.55" />
      <circle cx="80" cy="70" r="4.2" fill="#ff9fb0" opacity="0.55" />
      {/* sourire avec deux petits crocs rigolos (jamais de sang) */}
      <path d="M50 71 Q60 78 70 71" stroke={T} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M54.5 72.2 l-1.6 4 l3 -1.5 Z" fill="#fff" stroke={peauF} strokeWidth="0.4" />
      <path d="M65.5 72.2 l1.6 4 l-3 -1.5 Z" fill="#fff" stroke={peauF} strokeWidth="0.4" />

      {/* Cheveux noirs gominés en arrière, pointe sur le front */}
      <path d="M16 46 Q10 12 60 10 Q110 12 104 46 Q60 38 16 46 Z" fill={noir} />
      <path d="M50 40 Q60 52 70 40 Q60 44 50 40 Z" fill={noir} />
      <path d="M30 22 Q48 12 68 14 Q52 20 40 34 Z" fill={noirC} opacity="0.5" />
      <g stroke="#0d0a12" strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round">
        <path d="M60 11 Q46 24 36 38" />
        <path d="M60 11 Q74 24 84 38" />
      </g>
    </g>
  )
}

// ------------------------------------------------------------
//  Registre des skins complets. Clé = id de l'item (lib/avatar.js).
//  Chaque valeur est une fonction qui renvoie LE BONHOMME ENTIER.
// ------------------------------------------------------------
export const HALLOWEEN_FULL = {
  hfullvampire: () => vampire(),
}
