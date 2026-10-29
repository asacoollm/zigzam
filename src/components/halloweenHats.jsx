// ============================================================
//  SAISON HALLOWEEN — chapeaux & coiffures exclusifs de l'avatar.
//  Même repère que avatarParts.jsx : viewBox 0 -24 120 192, centre x=60.
//   - Crâne = demi-cercle centre (60,58) rayon ~42, sommet à y=16
//   - Yeux à cx 49/71 cy 60, panneau visage y 42..78
//  Les chapeaux se posent sur le sommet du crâne, centrés x=60.
//  Aucun <defs>/gradient (les id entreraient en collision entre avatars) :
//  uniquement des aplats et des opacités. Mignon et rigolo, jamais
//  effrayant — ce sont des accessoires cosmétiques, pas une farce.
// ============================================================

// Palette locale de la saison Halloween.
const H = {
  citrouille: '#ff7a18', citrouilleF: '#d4570a', citrouilleC: '#ffb066',
  tige: '#3f6a22', creme: '#fff4e0', jaune: '#ffe14d',
}

export const HALLOWEEN_HATS = {
  // Tête de citrouille : une coque de citrouille creusée posée sur tout
  // le crâne, avec ses sillons, sa tige, et un visage sculpté qui brille
  // en jaune (yeux triangulaires + sourire), sans jamais faire peur.
  hcitrouillechap: () => (
    <g>
      {/* tige verte */}
      <path d="M58 -18 Q54 -28 62 -30 Q68 -27 61 -19" fill="none" stroke={H.tige} strokeWidth="5" strokeLinecap="round" />
      {/* coque de citrouille, posée sur tout le crâne */}
      <path d="M24 26 Q18 -18 60 -20 Q102 -18 96 26 Q60 36 24 26 Z" fill={H.citrouille} stroke={H.citrouilleF} strokeWidth="2" strokeLinejoin="round" />
      {/* sillons verticaux, façon citrouille sculptée */}
      <g stroke={H.citrouilleF} strokeWidth="3" opacity="0.55" fill="none">
        <path d="M34 -12 Q30 8 34 29" />
        <path d="M48 -17 Q45 8 47 32" />
        <path d="M73 -17 Q76 8 74 32" />
        <path d="M87 -12 Q91 8 87 29" />
      </g>
      {/* reflet doux en haut */}
      <path d="M38 -14 Q55 -22 70 -15" stroke={H.citrouilleC} strokeWidth="3" opacity="0.5" fill="none" strokeLinecap="round" />
      {/* yeux triangulaires qui brillent en jaune */}
      <g fill={H.jaune} stroke={H.citrouilleF} strokeWidth="1" strokeLinejoin="round">
        <path d="M38 0 L52 0 L45 14 Z" />
        <path d="M68 0 L82 0 L75 14 Z" />
      </g>
      {/* sourire sculpté */}
      <path
        d="M30 19 Q36 25 42 19 Q48 27 54 19 Q60 26 66 19 Q72 27 78 19 Q84 25 90 19 Q85 33 60 34 Q35 33 30 19 Z"
        fill={H.creme}
      />
    </g>
  ),
}
