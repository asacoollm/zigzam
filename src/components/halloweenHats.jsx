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
  tige: '#3f6a22', creme: '#fff4e0', jaune: '#ffe14d', jauneF: '#c98a17',
  // — vague 2 —
  violet: '#4c1f96', violetC: '#6b3fc4', violetF: '#2e0f66',
  noir: '#17141f', noirC: '#3b3650', noirF: '#0d0c13',
}

// Petite étoile à 5 branches (centrée sur 0,0, rayon ~5) — via <g transform>.
const ETOILE = 'M0 -5 L1.5 -1.6 L5 -1.4 L2.2 0.8 L3.2 4.4 L0 2.4 L-3.2 4.4 L-2.2 0.8 L-5 -1.4 L-1.5 -1.6 Z'

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

  // Grand chapeau de sorcière étoilé : cône violet pointu, bord ondulé,
  // boucle jaune et étoiles dorées scintillantes.
  hsorcierestar: () => (
    <g>
      {/* cône pointu, bien grand */}
      <path d="M30 24 Q25 -8 48 -32 Q64 -12 94 24 Z" fill={H.violet} stroke={H.violetF} strokeWidth="2" strokeLinejoin="round" />
      {/* face éclairée à droite */}
      <path d="M50 -28 Q58 -8 84 22 L66 24 Q52 4 47 -14 Z" fill={H.violetC} opacity="0.55" />
      {/* pli d'ombre à gauche */}
      <path d="M32 22 Q30 0 42 -20 Q38 2 40 22 Z" fill={H.violetF} opacity="0.5" />
      {/* bord ondulé retroussé */}
      <path
        d="M14 24 q11 -7 22 -2 q10 5 20 0 q10 -5 20 0 q11 5 22 -2 l2 9 q-11 7 -22 2 q-10 -5 -20 0 q-10 5 -20 0 q-11 -5 -22 2 Z"
        fill={H.violetF} stroke={H.violetF} strokeWidth="1" strokeLinejoin="round"
      />
      {/* boucle jaune sur le bord */}
      <rect x="48" y="19" width="18" height="11" rx="2" fill={H.jaune} stroke={H.jauneF} strokeWidth="1.3" />
      <rect x="55" y="21.5" width="4" height="6" rx="1" fill={H.violetF} />
      {/* étoiles dorées scintillantes */}
      <g className="d-stars-twinkle" fill={H.jaune} stroke={H.jauneF} strokeWidth="0.8">
        <path d={ETOILE} transform="translate(49 -14) scale(0.65)" />
        <path d={ETOILE} transform="translate(68 10) scale(0.8)" />
        <path d={ETOILE} transform="translate(43 6) scale(0.5)" />
        <path d={ETOILE} transform="translate(82 20) scale(0.55)" />
      </g>
    </g>
  ),
}

// ----------------------------------------------------------------
//  CHEVEUX HALLOWEEN
// ----------------------------------------------------------------
export const HALLOWEEN_HAIR = {
  // Dracula : cheveux noirs gominés en arrière, avec une pointe sur le
  // front — mignon, pas de crocs ni d'air menaçant (c'est juste une coiffure).
  hdracula: () => (
    <g>
      {/* calotte gominée, bien plaquée sur le crâne */}
      <path d="M16 50 Q10 13 60 11 Q110 13 104 50 Q60 42 16 50 Z" fill={H.noir} />
      {/* pointe façon Dracula sur le front */}
      <path d="M50 44 Q60 55 70 44 Q60 48 50 44 Z" fill={H.noir} />
      {/* reflet gominé */}
      <path d="M30 24 Q48 14 68 16 Q52 22 40 36 Z" fill={H.noirC} opacity="0.5" />
      {/* mèches peignées bien en arrière */}
      <g stroke={H.noirF} strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M60 13 Q44 28 34 44" />
        <path d="M60 13 Q56 28 52 42" />
        <path d="M60 13 Q64 28 68 42" />
        <path d="M60 13 Q76 26 86 42" />
      </g>
    </g>
  ),
}

// ----------------------------------------------------------------
//  LUNETTES HALLOWEEN (posées sur les yeux, cx 49/71 cy 60)
// ----------------------------------------------------------------
export const HALLOWEEN_GLASSES = {
  // Deux petites citrouilles en guise de verres, chacune avec son sourire.
  hlunettescitrouille: () => (
    <g>
      <line x1="58" y1="60" x2="62" y2="60" stroke={H.citrouilleF} strokeWidth="2.6" />
      {[49, 71].map((cx) => (
        <g key={cx}>
          <path d={`M${cx} 50 Q${cx - 2} 47 ${cx + 1} 45`} stroke={H.tige} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx={cx} cy="60" rx="9" ry="8" fill={H.citrouille} stroke={H.citrouilleF} strokeWidth="1.6" />
          <g stroke={H.citrouilleF} strokeWidth="1" opacity="0.6">
            <line x1={cx - 4} y1="54" x2={cx - 4} y2="66" />
            <line x1={cx + 4} y1="54" x2={cx + 4} y2="66" />
          </g>
          <path d={`M${cx - 4} 62 Q${cx} 66 ${cx + 4} 62`} fill={H.creme} />
        </g>
      ))}
    </g>
  ),
}
