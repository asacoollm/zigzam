// ============================================================
//  SAISON HALLOWEEN — visages exclusifs + <defs> de couleur de corps.
//  Même organisation que disneyFaces.jsx (évite de doubler la taille
//  de avatarParts.jsx) :
//    • HALLOWEEN_FACE      → visages (yeux/bouche superposés)
//    • HalloweenColorDefs  → composant de <defs> (couleurs de corps)
//  ⚠ Aucun gradient avec id dans HALLOWEEN_FACE (risque de collision) :
//    uniquement des aplats et des opacités. Mignon et rigolo, jamais
//    effrayant — ce sont des accessoires cosmétiques, pas une farce.
// ============================================================

const H = {
  citrouille: '#ff7a18', citrouilleF: '#d4570a',
  // — vague 2 —
  squelette: '#1a1424', creme: '#fff4e0',
  bois: '#8a5a2b', boisF: '#5b3a1c', boisC: '#a97a45',
  paille: '#d4a85a', pailleC: '#e8c27a', slime: '#7bff4f',
}

// ----------------------------------------------------------------
//  VISAGES HALLOWEEN
//  Rendus APRÈS les yeux par défaut : on peut donc les recouvrir.
//  Repère : yeux par défaut à cx 49/71 cy 60, bouche vers y 70-76.
// ----------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const HALLOWEEN_FACE = {
  // Sourire de citrouille : maquillage façon citrouille sculptée, yeux
  // triangulaires oranges par-dessus les yeux par défaut + grand sourire.
  hvisagecitrouille: () => (
    <g>
      <path d="M41 52 L57 52 L49 67 Z" fill={H.citrouille} stroke={H.citrouilleF} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M63 52 L79 52 L71 67 Z" fill={H.citrouille} stroke={H.citrouilleF} strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M40 71 Q46 77 52 71 Q58 79 64 71 Q70 77 76 71 Q80 71 80 75
           Q66 89 54 89 Q42 89 40 75 Q40 71 40 71 Z"
        fill={H.citrouille} stroke={H.citrouilleF} strokeWidth="1.6" strokeLinejoin="round"
      />
    </g>
  ),

  // Squelette : maquillage noir et blanc, orbites noires, nez en cœur,
  // dents dessinées en bas du visage. Cartoon et mignon : pas d'effet
  // réaliste, pas de visage réellement effrayant.
  hvisagesquelette: () => (
    <g>
      <ellipse cx="49" cy="60" rx="9" ry="10" fill={H.squelette} />
      <ellipse cx="71" cy="60" rx="9" ry="10" fill={H.squelette} />
      <circle cx="49" cy="58" r="1.6" fill={H.creme} opacity="0.8" />
      <circle cx="71" cy="58" r="1.6" fill={H.creme} opacity="0.8" />
      <path d="M60 64 Q57 61 60 59 Q63 61 60 64 Z" fill={H.squelette} />
      <path
        d="M42 73 L78 73 L75 82 Q60 88 45 82 Z"
        fill={H.creme} stroke={H.squelette} strokeWidth="1.4" strokeLinejoin="round"
      />
      <g stroke={H.squelette} strokeWidth="1.1">
        <line x1="51" y1="73" x2="51" y2="81" />
        <line x1="60" y1="73" x2="60" y2="84" />
        <line x1="69" y1="73" x2="69" y2="81" />
      </g>
      <g stroke={H.squelette} strokeWidth="1" opacity="0.55" fill="none" strokeLinecap="round">
        <path d="M37 65 l4 5" />
        <path d="M83 65 l-4 5" />
      </g>
    </g>
  ),
}

// ----------------------------------------------------------------
//  ACCESSOIRES HALLOWEEN (tenus près de la main droite ~ (106,96))
// ----------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const HALLOWEEN_SPORT = {
  // Balai de sorcière : manche en bois, brins de paille liés, couleurs
  // de la saison (lien orange citrouille, étincelles vert slime).
  hbalai: () => (
    <g transform="rotate(14 106 96)">
      {/* manche en bois */}
      <rect x="103" y="56" width="6" height="50" rx="3" fill={H.bois} stroke={H.boisF} strokeWidth="1" />
      <rect x="104.4" y="58" width="1.6" height="46" fill={H.boisC} opacity="0.7" />
      {/* lien orange citrouille */}
      <rect x="101" y="104" width="10" height="5" rx="2" fill={H.citrouille} stroke={H.citrouilleF} strokeWidth="1" />
      {/* brins de paille liés */}
      <path d="M101 108 Q97 122 93 132 L100 133 Q102 120 104 109 Z" fill={H.paille} stroke={H.boisF} strokeWidth="0.9" />
      <path d="M104 108 L102 134 L110 134 L108 108 Z" fill={H.pailleC} stroke={H.boisF} strokeWidth="0.9" />
      <path d="M111 108 Q115 122 119 132 L112 133 Q110 120 108 109 Z" fill={H.paille} stroke={H.boisF} strokeWidth="0.9" />
      <g stroke={H.boisF} strokeWidth="0.7" opacity="0.6">
        <path d="M99 114 l-2 16 M106 112 l0 20 M113 114 l2 16" fill="none" />
      </g>
      {/* petites étincelles vert slime, couleur de la saison */}
      <g className="disney-scintille" fill={H.slime}>
        <path d="M96 70 l1.3 2.8 3 .3 -2.3 2 .7 3 -2.7 -1.6 -2.7 1.6 .7 -3 -2.3 -2 3 -.3 Z" />
        <path d="M118 86 l1 2.2 2.4 .2 -1.8 1.6 .6 2.4 -2.2 -1.3 -2.2 1.3 .6 -2.4 -1.8 -1.6 2.4 -.2 Z" opacity="0.9" />
      </g>
    </g>
  ),
}

// ----------------------------------------------------------------
//  <defs> des couleurs de corps exclusives de la saison « Halloween ».
//  Rendu une seule fois par avatar, via ColorDefs() dans FallGuy.jsx.
// ----------------------------------------------------------------
export function HalloweenColorDefs() {
  return (
    <>
      {/* Citrouille : orange avec de petits sillons verticaux plus
          foncés, façon citrouille sculptée. */}
      <pattern id="body-hcitrouille" width="18" height="36" patternUnits="userSpaceOnUse">
        <rect width="18" height="36" fill="#ff7a18" />
        <rect x="2" width="3" height="36" rx="1.5" fill="#d4570a" opacity="0.55" />
        <rect x="13" width="3" height="36" rx="1.5" fill="#d4570a" opacity="0.55" />
        <rect x="7.5" width="2" height="36" rx="1" fill="#ffb066" opacity="0.4" />
      </pattern>
    </>
  )
}
