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
