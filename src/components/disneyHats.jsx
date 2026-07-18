// ============================================================
//  SAISON DISNEY — chapeaux & coiffures exclusifs de l'avatar.
//  Même repère que avatarParts.jsx : viewBox 0 -24 120 192, centre x=60.
//   - Crâne = demi-cercle centre (60,58) rayon ~42, sommet à y=16
//   - Yeux à cx 49/71 cy 60, panneau visage y 42..78
//   - Corps : rect x18 y16 w84 h116 rx42 ; bras x4..19 et x101..116
//  Les chapeaux se posent sur le sommet du crâne, centrés x=60.
//  Les cheveux sont en DEUX couches :
//   - DISNEY_HAIR      : calotte + frange, rendue DEVANT le corps
//   - DISNEY_HAIR_BACK : longueurs qui tombent dans le dos, DERRIÈRE le corps
//  Aucun <defs>/gradient (les id entreraient en collision entre avatars) :
//  uniquement des aplats, des opacités et des nuances distinctes.
// ============================================================

// ----------------------------------------------------------------
//  PALETTES (recopiées d'avatarParts.jsx puis étendues « Zigzamland »)
// ----------------------------------------------------------------
const C = {
  rose: '#ff4d8d', orange: '#ff8c42', jaune: '#fbbf24', vert: '#3dd68c',
  bleu: '#00bfff', violet: '#7c3aff', rouge: '#ef4444', blanc: '#f5f5fb',
  noir: '#2b2350', brun: '#7a4a2a', brunF: '#5b3a29', gris: '#9aa3b2',
  grisF: '#6b7280', or: '#ffcf3f', orF: '#e0a92a', peau: '#ffd9b0',
  // — teintes ajoutées pour la saison Disney —
  nuit: '#1e2a6e', nuitF: '#121a48', nuitC: '#33418f', // sorcier
  // Cendrillon : argent volontairement contrasté (`argentF` sert de contour),
  // sinon le diadème se noie sur le corps clair de l'aperçu.
  argent: '#e8eefb', argentF: '#5d7398', argentC: '#ffffff', // Cendrillon
  rougeD: '#e5202e', rougeF: '#a3121c', rougeC: '#ff6b6b', // Minnie / Riri / nœud
  marine: '#2f6fd0', marineF: '#1d4a94', // Donald
  tigre: '#f79a3c', tigreC: '#ffb45e', tigreF: '#8a4412', rayure: '#241a14', // Tigrou
  criniere: '#c8641f', crinC: '#e8933f', // Roi Lion
  stitch: '#3f7fd6', stitchF: '#20518f', stitchC: '#8ec4f5', // Stitch
  genie: '#2f8fd6', genieF: '#1b5f96', genieC: '#79caf2', // Génie
  encre: '#15131f', encreC: '#3a3552', // haut-de-forme Picsou
  feuille: '#3aa55a', feuilleF: '#237a3d', // Clochette / Tiana
}

// Palette cheveux : { base, dark, light } par teinte.
const H = {
  noir: { base: '#26222f', dark: '#15121d', light: '#46415a' },
  jet: { base: '#1b1925', dark: '#0d0c13', light: '#3b3650' },
  brunF: { base: '#3b2a1c', dark: '#261910', light: '#5e4631' },
  brun: { base: '#5b3a24', dark: '#3d2716', light: '#7f5638' },
  chat: { base: '#714a28', dark: '#4d301a', light: '#9a6a39' },
  blond: { base: '#dca94a', dark: '#b3842f', light: '#f4d585' },
  roux: { base: '#b5532a', dark: '#8a3b1c', light: '#d77c46' },
  // — teintes Disney —
  // Blond platine « champagne » : légèrement CHAUD et plus clair que le corps
  // du bonhomme (l'aperçu du sélecteur utilise un gris-bleu #c9cde0). Un
  // platine froid s'y fondrait et donnerait un rendu « verre » au lieu de
  // cheveux ; la teinte `dark` sert de contour.
  platine: { base: '#f6edcf', dark: '#bda772', light: '#fffaea' },
  ariel: { base: '#c8341a', dark: '#8f1f0d', light: '#ec6a3e' },
  corbeau: { base: '#1e1a2c', dark: '#0e0c17', light: '#453e63' },
  neige: { base: '#ecedf3', dark: '#c0c3d2', light: '#ffffff' },
}

// Calotte qui épouse le crâne (demi-cercle centre 60,58).
//  - midY    : niveau de la frange au centre du front
//  - templeY : niveau de la naissance des cheveux sur les tempes
const skull = (midY = 48, templeY = 50) =>
  `M16 ${templeY} Q10 13 60 11 Q110 13 104 ${templeY} Q60 ${midY} 16 ${templeY} Z`

// Calotte texturée réutilisable : base + mèches + reflet + ombre de frange.
const cap = (c, midY = 48, templeY = 50, extra = null) => (
  <g>
    <path d={skull(midY, templeY)} fill={c.base} />
    <g stroke={c.dark} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round">
      <path d="M60 13 Q42 30 30 46" />
      <path d="M60 13 Q54 30 49 48" />
      <path d="M60 13 Q66 30 71 48" />
      <path d="M60 13 Q78 28 92 46" />
    </g>
    <path d="M33 25 Q49 14 69 16 Q53 22 42 39 Z" fill={c.light} opacity="0.5" />
    <path d={`M16 ${templeY} Q60 ${midY} 104 ${templeY} Q60 ${midY - 6} 16 ${templeY} Z`} fill={c.dark} opacity="0.3" />
    {extra}
  </g>
)

// ----------------------------------------------------------------
//  PETITS MOTIFS RÉUTILISABLES
// ----------------------------------------------------------------

// Étoile à 5 branches (centrée sur 0,0, rayon ~5) — à placer via <g transform>.
const ETOILE = 'M0 -5 L1.5 -1.6 L5 -1.4 L2.2 0.8 L3.2 4.4 L0 2.4 L-3.2 4.4 L-2.2 0.8 L-5 -1.4 L-1.5 -1.6 Z'
// Croissant de lune (centré sur 0,0, hauteur ~9).
const LUNE = 'M1 -4.5 A4.5 4.5 0 1 0 1 4.5 A5.5 5.5 0 1 1 1 -4.5 Z'
// Éclat scintillant à 4 branches.
const ECLAT = 'M0 -8 Q1.2 -1.2 7 0 Q1.2 1.2 0 8 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -8 Z'

// Petite fleur à 5 pétales.
const fleur = (x, y, r, petale, coeur = C.or) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx="0" cy={-r} rx={r * 0.52} ry={r * 0.74} fill={petale} transform={`rotate(${a})`} />
    ))}
    <circle cx="0" cy="0" r={r * 0.46} fill={coeur} />
  </g>
)

// Chevrons d'entrelacement de tresse, posés le long d'une ligne médiane.
// pts = [[x, y, angle], …] ; l = demi-largeur de la tresse.
const tressage = (c, pts, l = 8) => (
  <g>
    {pts.map(([x, y, a], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
        <path d={`M${-l} -4 Q0 2 ${l} -4`} stroke={c.dark} strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round" />
        <path d={`M${-l + 1} 3 Q0 -2 ${l - 1} 3`} stroke={c.light} strokeWidth="1.8" fill="none" opacity="0.55" strokeLinecap="round" />
      </g>
    ))}
  </g>
)

// ================================================================
//  CHAPEAUX DISNEY
// ================================================================
export const DISNEY_HATS = {
  // — Oreilles Mickey : deux grands disques noirs + fin serre-tête.
  dears: () => (
    <g>
      {/* serre-tête : posé HAUT sur le crâne, fin, pour ne pas barrer le
          front comme un sourcil (il s'arrête au niveau des tempes, y~34) */}
      <path d="M26 34 Q60 8 94 34" fill="none" stroke={C.noir} strokeWidth="4" strokeLinecap="round" />
      <path d="M28 32 Q60 12 92 32" fill="none" stroke="#5a5280" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <g className="d-ears-wiggle">
        {[27, 93].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="4" r="20" fill="#17141f" stroke="#000" strokeWidth="2" />
            <circle cx={x} cy="4" r="15" fill="#221e2c" />
            {/* reflet lunaire en haut-gauche */}
            <path d={`M${x - 13} -4 Q${x - 8} -16 ${x + 3} -17 Q${x - 6} -11 ${x - 9} 1 Z`} fill="#5d5678" opacity="0.55" />
            <circle cx={x - 6} cy="-8" r="2.6" fill="#8a83a8" opacity="0.5" />
          </g>
        ))}
      </g>
      {/* attaches du serre-tête, à la base de chaque oreille */}
      <g fill={C.noir}>
        <ellipse cx="32" cy="20" rx="4" ry="3" transform="rotate(-30 32 20)" />
        <ellipse cx="88" cy="20" rx="4" ry="3" transform="rotate(30 88 20)" />
      </g>
    </g>
  ),

  // — Chapeau Sorcier : cône bleu nuit penché, bord ondulé, étoiles et lunes dorées.
  dsorcier: () => (
    <g>
      {/* cône */}
      <path d="M34 24 Q30 -2 45 -22 Q59 -8 88 24 Z" fill={C.nuit} stroke={C.nuitF} strokeWidth="2" strokeLinejoin="round" />
      {/* face éclairée à droite */}
      <path d="M46 -18 Q52 -4 80 22 L62 24 Q48 6 43 -8 Z" fill={C.nuitC} opacity="0.65" />
      {/* pli d'ombre à gauche */}
      <path d="M36 22 Q34 2 44 -16 Q40 4 42 22 Z" fill={C.nuitF} opacity="0.6" />
      {/* bord ondulé retroussé */}
      <path d="M18 24 q11 -7 22 -2 q10 5 20 0 q10 -5 20 0 q11 5 22 -2 l2 9 q-11 7 -22 2 q-10 -5 -20 0 q-10 5 -20 0 q-11 -5 -22 2 Z"
        fill="#27357f" stroke={C.nuitF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 27 q11 -6 22 -1 q10 4 20 0 q10 -4 20 0 q11 4 22 -1" fill="none" stroke={C.nuitC} strokeWidth="1.4" opacity="0.7" />
      {/* étoiles et lunes dorées */}
      <g className="d-stars-twinkle">
        <g fill={C.or} stroke={C.orF} strokeWidth="0.8">
          <path d={ETOILE} transform="translate(46 -10) scale(0.62)" />
          <path d={ETOILE} transform="translate(62 12) scale(0.78)" />
          <path d={ETOILE} transform="translate(41 8) scale(0.5)" />
          <path d={ETOILE} transform="translate(76 20) scale(0.55)" />
          <path d={LUNE} transform="translate(53 1) rotate(20) scale(0.7)" />
          <path d={LUNE} transform="translate(30 30) rotate(-15) scale(0.55)" />
        </g>
        <g fill="#fff3b0" opacity="0.8">
          <circle cx="70" cy="4" r="1.3" /><circle cx="37" cy="-2" r="1.1" /><circle cx="88" cy="29" r="1.2" />
        </g>
      </g>
    </g>
  ),

  // — Couronne Cendrillon : fin diadème argenté à pointes + éclat scintillant.
  dcendrillon: () => (
    <g>
      <path d="M30 30 L33 5 L43 20 L51 0 L60 17 L69 0 L77 20 L87 5 L90 30 Z"
        fill={C.argent} stroke={C.argentF} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M33 5 L43 20 L38 28 Z" fill={C.argentC} opacity="0.8" />
      <path d="M51 0 L60 17 L55 27 Z" fill={C.argentC} opacity="0.8" />
      <rect x="27" y="26" width="66" height="7.5" rx="3.5" fill="#cfdcf2" stroke={C.argentF} strokeWidth="2" />
      <path d="M29 28 q31 -3 62 0" stroke={C.argentC} strokeWidth="1.4" fill="none" opacity="0.9" />
      {/* pierres bleu pâle */}
      <g stroke={C.argentF} strokeWidth="1">
        <circle cx="51" cy="0" r="2.6" fill="#bfe6ff" />
        <circle cx="69" cy="0" r="2.6" fill="#bfe6ff" />
        <circle cx="60" cy="29.5" r="3.2" fill="#8fd4ff" />
        <circle cx="40" cy="29.5" r="2.2" fill="#bfe6ff" />
        <circle cx="80" cy="29.5" r="2.2" fill="#bfe6ff" />
      </g>
      {/* éclat scintillant */}
      <g className="d-sparkle" fill="#ffffff">
        <path d={ECLAT} transform="translate(60 15) scale(0.85)" />
        <path d={ECLAT} transform="translate(84 12) scale(0.4)" opacity="0.8" />
      </g>
    </g>
  ),

  // — Chapeau Picsou : haut-de-forme noir légèrement penché, large bande blanche.
  dpicsou: () => (
    <g transform="rotate(-9 60 22)">
      <ellipse cx="60" cy="25" rx="42" ry="9" fill={C.encre} />
      <ellipse cx="60" cy="23" rx="42" ry="9" fill="#221e33" stroke={C.encre} strokeWidth="1.5" />
      <path d="M39 -13 L39 23 Q60 30 81 23 L81 -13 Z" fill="#221e33" />
      <path d="M39 -13 L39 23 Q48 26 52 26 L52 -13 Z" fill={C.encre} opacity="0.7" />
      <path d="M72 -12 Q76 4 76 22" stroke={C.encreC} strokeWidth="3" fill="none" opacity="0.55" />
      <ellipse cx="60" cy="-13" rx="21" ry="6" fill={C.encreC} stroke={C.encre} strokeWidth="1.5" />
      {/* large bande blanche */}
      <path d="M39 5 L81 5 L81 16 Q60 21 39 16 Z" fill={C.blanc} stroke="#cbd2df" strokeWidth="1.2" />
      <path d="M41 7 L52 7 L52 17 Q46 16 41 15 Z" fill="#dfe4ee" />
    </g>
  ),

  // — Bandana Minnie : gros nœud papillon rouge à pois blancs.
  dminnie: () => (
    <g className="d-bow-pop">
      {/* boucle gauche */}
      <path d="M55 10 Q33 -12 21 0 Q11 12 25 21 Q40 27 55 21 Z" fill={C.rougeD} stroke={C.rougeF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 12 Q34 -4 25 3 Q19 11 28 17 Q40 21 52 18 Z" fill={C.rougeC} opacity="0.35" />
      {/* boucle droite */}
      <path d="M65 10 Q87 -12 99 0 Q109 12 95 21 Q80 27 65 21 Z" fill={C.rougeD} stroke={C.rougeF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M68 12 Q86 -4 95 3 Q101 11 92 17 Q80 21 68 18 Z" fill={C.rougeC} opacity="0.25" />
      {/* nœud central */}
      <rect x="51" y="4" width="18" height="20" rx="7" fill="#c8161f" stroke={C.rougeF} strokeWidth="2" />
      <path d="M55 8 q5 -3 10 0" stroke={C.rougeC} strokeWidth="1.8" fill="none" opacity="0.6" />
      {/* pois blancs */}
      <g fill={C.blanc}>
        <circle cx="32" cy="4" r="3" /><circle cx="24" cy="14" r="2.6" /><circle cx="42" cy="16" r="3" />
        <circle cx="88" cy="4" r="3" /><circle cx="96" cy="14" r="2.6" /><circle cx="78" cy="16" r="3" />
        <circle cx="60" cy="16" r="2.2" opacity="0.9" />
      </g>
    </g>
  ),

  // — Casque de Donald : calot de marin bleu, ruban noir et pompon.
  ddonald: () => (
    <g>
      <path d="M33 18 Q34 -4 60 -4 Q86 -4 87 18 Q60 26 33 18 Z" fill={C.marine} stroke={C.marineF} strokeWidth="2" />
      <path d="M38 4 Q48 -3 62 -3 Q48 2 42 14 Z" fill="#7fc0ff" opacity="0.5" />
      <path d="M74 -1 Q84 6 85 17 Q78 8 70 3 Z" fill={C.marineF} opacity="0.5" />
      {/* ruban noir à la base */}
      <path d="M32 16 Q60 25 88 16 L89 23 Q60 32 31 23 Z" fill="#171426" stroke="#0d0b16" strokeWidth="1.4" />
      <path d="M34 19 Q60 26 86 19" stroke="#3a3552" strokeWidth="1.3" fill="none" opacity="0.8" />
      {/* pans du ruban qui pendent à droite */}
      <path d="M84 21 l10 8 -3 4 -9 -7 Z" fill="#171426" />
      {/* pompon */}
      <circle cx="60" cy="-8" r="6" fill={C.blanc} stroke="#c8d0dd" strokeWidth="1.3" />
      <circle cx="58" cy="-10" r="2.2" fill="#ffffff" />
    </g>
  ),

  // — Bonnet Tigrou : bonnet rayé orange et noir + deux petites oreilles rondes.
  dtigrou: () => (
    <g>
      {/* oreilles */}
      {[25, 95].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="0" r="12" fill={C.tigre} stroke={C.tigreF} strokeWidth="2" />
          <circle cx={x} cy="1" r="6" fill={C.rayure} opacity="0.55" />
          <circle cx={x - 3} cy="-5" r="2.6" fill={C.tigreC} opacity="0.7" />
        </g>
      ))}
      {/* bonnet */}
      <path d="M26 26 Q28 -5 60 -5 Q92 -5 94 26 Q60 16 26 26 Z" fill={C.tigre} stroke={C.tigreF} strokeWidth="2" />
      {/* rayures noires */}
      <g stroke={C.rayure} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.92">
        <path d="M38 22 q-3 -11 1 -19" />
        <path d="M50 18 q-2 -12 0 -21" />
        <path d="M62 17 q0 -12 0 -22" />
        <path d="M74 18 q2 -12 0 -21" />
        <path d="M86 22 q3 -11 -1 -19" />
      </g>
      {/* reflet */}
      <path d="M32 12 Q42 -1 58 -3 Q42 3 36 18 Z" fill={C.tigreC} opacity="0.35" />
      {/* revers */}
      <path d="M23 22 Q60 12 97 22 L97 31 Q60 22 23 31 Z" fill={C.tigreC} stroke={C.tigreF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M26 25 Q60 17 94 25" stroke={C.tigre} strokeWidth="1.6" fill="none" opacity="0.8" />
    </g>
  ),

  // — Couronne Roi Lion : couronne dorée cerclée d'une crinière rousse touffue.
  dlionking: () => (
    <g>
      {/* crinière touffue (grosses touffes puis mèches plus claires) */}
      <g className="d-mane-breathe">
        <g fill={C.criniere}>
          {[[18, 30, 13], [26, 12, 12], [40, 0, 12], [60, -8, 13], [80, 0, 12], [94, 12, 12], [102, 30, 13], [14, 44, 10], [106, 44, 10]]
            .map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        </g>
        <g fill={C.crinC} opacity="0.75">
          {[[24, 26, 7], [32, 10, 6.5], [46, 1, 6], [60, -4, 6.5], [74, 1, 6], [88, 10, 6.5], [96, 26, 7]]
            .map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        </g>
        <g stroke="#9c4712" strokeWidth="1.4" fill="none" opacity="0.55" strokeLinecap="round">
          <path d="M20 34 q-6 6 -4 12" /><path d="M100 34 q6 6 4 12" />
          <path d="M36 4 q-4 -7 -1 -12" /><path d="M84 4 q4 -7 1 -12" />
        </g>
      </g>
      {/* couronne dorée */}
      <path d="M35 28 L37 4 L48 17 L60 -2 L72 17 L83 4 L85 28 Z" fill={C.or} stroke="#c98f14" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M37 4 L48 17 L43 27 Z" fill="#ffe28a" opacity="0.7" />
      <path d="M72 17 L83 4 L82 27 Z" fill={C.orF} opacity="0.6" />
      <path d="M33 24 Q60 32 87 24 L87 32 Q60 40 33 32 Z" fill={C.orF} stroke="#c98f14" strokeWidth="1.6" strokeLinejoin="round" />
      <g stroke="#c98f14" strokeWidth="0.9">
        <circle cx="60" cy="10" r="3.6" fill={C.rouge} />
        <circle cx="45" cy="20" r="2.4" fill="#3ab5e8" />
        <circle cx="75" cy="20" r="2.4" fill="#3ab5e8" />
        <circle cx="60" cy="-2" r="2.6" fill="#fff3b0" />
      </g>
    </g>
  ),

  // — Bob Stitch : deux grandes oreilles bleues tombantes, encoche sur la gauche.
  dstitch: () => (
    <g className="d-ears-wiggle">
      {/* calotte bleue qui relie les deux oreilles */}
      <path d="M28 26 Q30 0 60 0 Q90 0 92 26 Q60 16 28 26 Z" fill={C.stitch} stroke={C.stitchF} strokeWidth="2" />
      <path d="M36 12 Q46 2 60 2 Q46 7 40 22 Z" fill={C.stitchC} opacity="0.45" />
      {/* oreille gauche (avec l'encoche caractéristique) */}
      <path d="M34 12 Q6 4 4 42 Q3 72 18 80 Q30 82 30 68 Q27 44 40 24 Z"
        fill={C.stitch} stroke={C.stitchF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 20 Q14 16 12 44 Q11 66 20 73 Q25 74 24 63 Q23 42 37 26 Z" fill={C.stitchC} opacity="0.55" />
      {/* encoche */}
      <path d="M4 34 L15 40 L4 47 Z" fill="#0f3d70" />
      <path d="M6 35 L13 40 L6 45 Z" fill={C.stitchF} />
      {/* oreille droite */}
      <path d="M86 12 Q114 4 116 42 Q117 72 102 80 Q90 82 90 68 Q93 44 80 24 Z"
        fill={C.stitch} stroke={C.stitchF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M87 20 Q106 16 108 44 Q109 66 100 73 Q95 74 96 63 Q97 42 83 26 Z" fill={C.stitchC} opacity="0.55" />
      {/* ombres douces au pli */}
      <g stroke={C.stitchF} strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M22 30 Q17 52 22 70" /><path d="M98 30 Q103 52 98 70" />
      </g>
      {/* touffe de poils sur le dessus */}
      <path d="M52 2 q3 -9 8 -11 q5 2 8 11 q-8 -4 -16 0 Z" fill={C.stitchF} />
    </g>
  ),

  // — Chignon Clochette : petit chignon blond haut et serré + feuille/fleur verte.
  dclochette: () => (
    <g>
      {/* calotte blonde, cheveux tirés vers le haut */}
      {cap(H.blond, 44, 47)}
      {/* élastique serré à la base du chignon */}
      <path d="M48 10 q12 -8 24 0 q-12 6 -24 0 Z" fill={H.blond.dark} opacity="0.8" />
      {/* petit chignon haut et serré */}
      <ellipse cx="60" cy="0" rx="14" ry="12.5" fill={H.blond.base} stroke={H.blond.dark} strokeWidth="1.8" />
      <g stroke={H.blond.dark} strokeWidth="1.6" fill="none" opacity="0.65">
        <path d="M48 0 Q60 -11 72 0" /><path d="M50 6 Q60 -2 70 6" /><path d="M52 -7 Q60 1 68 -7" />
      </g>
      <ellipse cx="54" cy="-6" rx="4.4" ry="3" fill={H.blond.light} opacity="0.6" />
      {/* feuille verte glissée dans le chignon */}
      <path d="M71 -2 Q86 -8 92 -20 Q89 -3 76 3 Z" fill={C.feuille} stroke={C.feuilleF} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M74 -1 Q85 -8 90 -18" stroke={C.feuilleF} strokeWidth="1.2" fill="none" opacity="0.85" />
      <path d="M75 -3 Q83 -7 88 -14" stroke="#7fdc9a" strokeWidth="1.1" fill="none" opacity="0.7" />
      {/* fleurette blanche de l'autre côté */}
      {fleur(46, -12, 5.4, '#f2fff0', '#ffe98a')}
      <g className="d-sparkle" fill="#ffffff" opacity="0.9">
        <path d={ECLAT} transform="translate(84 -14) scale(0.4)" />
      </g>
    </g>
  ),

  // — Turban Génie : turban bleu enroulé, grosse gemme dorée et plume.
  dgenie: () => (
    <g>
      <path d="M24 28 Q22 -6 60 -8 Q98 -6 96 28 Q60 18 24 28 Z" fill={C.genie} stroke={C.genieF} strokeWidth="2" />
      {/* enroulements du tissu */}
      <g stroke={C.genieF} strokeWidth="2" fill="none" opacity="0.75" strokeLinecap="round">
        <path d="M25 21 Q60 6 95 21" />
        <path d="M26 27 Q60 14 94 27" />
        <path d="M30 12 Q60 -1 90 12" />
        <path d="M38 3 Q60 -6 82 3" />
      </g>
      <path d="M28 8 Q44 -6 62 -7 Q44 -1 33 16 Z" fill={C.genieC} opacity="0.5" />
      <path d="M84 2 Q94 10 95 26 Q88 12 78 6 Z" fill={C.genieF} opacity="0.4" />
      {/* base du turban */}
      <path d="M23 24 Q60 14 97 24 L97 32 Q60 23 23 32 Z" fill="#2178b6" stroke={C.genieF} strokeWidth="1.8" strokeLinejoin="round" />
      {/* gemme dorée */}
      <path d="M60 3 l8 7 -8 10 -8 -10 Z" fill={C.or} stroke="#c98f14" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M60 6 l4.5 4 -4.5 5.5 -4.5 -5.5 Z" fill="#fff3b0" opacity="0.85" />
      <g className="d-sparkle" fill="#ffffff">
        <path d={ECLAT} transform="translate(66 4) scale(0.38)" />
      </g>
      {/* plume */}
      <g className="d-feather-wave">
        <path d="M64 -4 Q72 -24 88 -24 Q80 -8 68 2 Z" fill={C.blanc} stroke="#c3ccdc" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M67 -3 Q75 -17 85 -21" stroke="#c3ccdc" strokeWidth="1.3" fill="none" />
        <g stroke="#dde3ee" strokeWidth="1" fill="none" opacity="0.9">
          <path d="M70 -7 l6 -6" /><path d="M74 -11 l6 -5" /><path d="M67 -2 l5 -6" />
        </g>
      </g>
    </g>
  ),

  // — Casquette Riri : petite casquette rouge à visière, légèrement tournée.
  driri: () => (
    <g transform="rotate(-8 60 20)">
      <path d="M32 24 Q60 -20 88 24 Q60 15 32 24 Z" fill={C.rougeD} stroke={C.rougeF} strokeWidth="2" strokeLinejoin="round" />
      {/* coutures des panneaux */}
      <g stroke={C.rougeF} strokeWidth="1.3" fill="none" opacity="0.7">
        <path d="M60 -6 Q56 8 55 20" /><path d="M60 -6 Q64 8 65 20" />
        <path d="M44 6 Q42 14 42 22" /><path d="M76 6 Q78 14 78 22" />
      </g>
      <path d="M38 16 Q48 -2 60 -5 Q46 3 42 20 Z" fill={C.rougeC} opacity="0.4" />
      {/* visière tournée vers la droite */}
      <path d="M60 22 q27 0 35 9 q-19 0 -35 -3 Z" fill="#c8161f" stroke={C.rougeF} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M64 24 q22 1 28 6" stroke={C.rougeC} strokeWidth="1.3" fill="none" opacity="0.6" />
      {/* bouton du sommet */}
      <circle cx="60" cy="-6" r="3.6" fill="#c8161f" stroke={C.rougeF} strokeWidth="1.2" />
      {/* liseré de base */}
      <path d="M32 22 Q60 13 88 22" stroke={C.rougeF} strokeWidth="2" fill="none" />
    </g>
  ),

  // — Nœud papillon Picsou : petit nœud rouge posé au sommet du crâne.
  dnoeud: () => (
    <g className="d-bow-pop">
      <path d="M57 6 Q42 -4 39 6 Q37 17 57 15 Z" fill={C.rougeD} stroke={C.rougeF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M63 6 Q78 -4 81 6 Q83 17 63 15 Z" fill={C.rougeD} stroke={C.rougeF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M54 7 Q44 1 42 7 Q41 13 54 12 Z" fill={C.rougeC} opacity="0.35" />
      <path d="M66 7 Q76 1 78 7 Q79 13 66 12 Z" fill={C.rougeC} opacity="0.2" />
      <ellipse cx="60" cy="10.5" rx="5" ry="6" fill="#c8161f" stroke={C.rougeF} strokeWidth="1.6" />
      <path d="M57 7 q3 -2 6 0" stroke={C.rougeC} strokeWidth="1.5" fill="none" opacity="0.7" />
    </g>
  ),
}

// ================================================================
//  CHEVEUX DISNEY — couche AVANT (calotte + frange, devant le corps)
// ================================================================
export const DISNEY_HAIR = {
  // — Raiponce : calotte blond doré fleurie (l'immense tresse est dans HAIR_BACK).
  draiponce: () => cap(H.blond, 47, 50, (
    <g>
      {/* raie centrale + mèches encadrant le visage */}
      <path d="M60 12 Q58 30 57 48" stroke={H.blond.dark} strokeWidth="1.4" fill="none" opacity="0.5" />
      <path d="M18 46 Q14 66 20 84 Q26 86 28 80 Q24 64 28 46 Z" fill={H.blond.base} />
      <path d="M102 46 Q106 66 100 84 Q94 86 92 80 Q96 64 92 46 Z" fill={H.blond.base} />
      <g stroke={H.blond.light} strokeWidth="1.4" fill="none" opacity="0.55">
        <path d="M23 50 Q20 66 24 80" /><path d="M97 50 Q100 66 96 80" />
      </g>
      {/* couronne de fleurs */}
      {fleur(30, 40, 5, '#8fd9ff')}
      {fleur(45, 30, 4.4, '#ffb3d9')}
      {fleur(60, 25, 4, '#eaffe0')}
      {fleur(76, 30, 4.4, '#ffb3d9')}
      {fleur(91, 40, 5, '#8fd9ff')}
    </g>
  )),

  // — Elsa : calotte blond platine + grosse tresse ramenée sur l'épaule droite.
  delsa: () => (
    <g>
      {cap(H.platine, 46, 49)}
      {/* contour de la calotte : indispensable sur une teinte aussi claire,
          sinon la chevelure se fond dans le corps du bonhomme */}
      <path d={skull(46, 49)} fill="none" stroke={H.platine.dark} strokeWidth="1.8" strokeLinejoin="round" />
      {/* mèche qui part de la tempe droite vers la tresse */}
      <path d="M94 32 Q108 42 104 56 Q98 46 88 42 Z"
        fill={H.platine.base} stroke={H.platine.dark} strokeWidth="1.5" strokeLinejoin="round" />
      {/* tresse latérale, ramenée sur l'épaule droite */}
      <g className="d-braid-sway">
        <path d="M100 42 Q116 60 113 90 Q111 110 101 118 Q93 120 93 111 Q101 99 103 82 Q104 62 92 48 Z"
          fill={H.platine.base} stroke={H.platine.dark} strokeWidth="2" strokeLinejoin="round" />
        {/* ombre le long du bord intérieur pour détacher la tresse du visage */}
        <path d="M94 48 Q104 64 103 84 Q101 102 94 114 Q98 100 98 82 Q98 62 90 48 Z" fill={H.platine.dark} opacity="0.55" />
        <path d="M108 56 Q114 76 110 100" stroke={H.platine.light} strokeWidth="2.4" fill="none" opacity="0.8" />
        {tressage(H.platine, [[103, 58, 32], [108, 74, 12], [108, 92, -6], [103, 108, -26]], 7)}
        {/* pointe + petit ruban glacé */}
        <path d="M94 116 q9 3 8 -4 l-2 12 q-5 3 -7 -1 Z" fill={H.platine.dark} />
        <path d="M93 110 q10 4 12 -2" stroke="#9fd9f5" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      {/* cristaux de givre */}
      <g className="d-sparkle" fill="#eaf8ff">
        <path d={ECLAT} transform="translate(38 26) scale(0.34)" />
        <path d={ECLAT} transform="translate(72 20) scale(0.28)" />
      </g>
    </g>
  ),

  // — Ariel : longue chevelure rousse ondulée et volumineuse (masse dans HAIR_BACK).
  dariel: () => (
    <g>
      {cap(H.ariel, 47, 50, (
        <path d="M28 26 Q48 12 76 18 Q98 24 100 46 Q88 28 58 30 Q40 32 33 42 Z" fill={H.ariel.dark} opacity="0.35" />
      ))}
      {/* mèches ondulées qui encadrent le visage */}
      <g fill={H.ariel.base}>
        <path d="M18 44 Q8 66 16 88 Q22 102 32 100 Q22 82 26 62 Q28 50 32 44 Z" />
        <path d="M102 44 Q112 66 104 88 Q98 102 88 100 Q98 82 94 62 Q92 50 88 44 Z" />
      </g>
      <g stroke={H.ariel.dark} strokeWidth="1.5" fill="none" opacity="0.5">
        <path d="M23 50 q-5 18 0 36" /><path d="M97 50 q5 18 0 36" />
      </g>
      <g stroke={H.ariel.light} strokeWidth="1.6" fill="none" opacity="0.55">
        <path d="M28 52 q-3 18 1 34" /><path d="M92 52 q3 18 -1 34" />
        <path d="M36 22 q10 -6 22 -5" />
      </g>
    </g>
  ),

  // — Vaiana : longs cheveux noirs ondulés et épais (masse dans HAIR_BACK).
  dvaiana: () => (
    <g>
      {cap(H.corbeau, 48, 51)}
      <g fill={H.corbeau.base}>
        <path d="M18 46 q-8 24 -2 46 q4 14 14 12 q-8 -22 -4 -40 q2 -12 6 -18 Z" />
        <path d="M102 46 q8 24 2 46 q-4 14 -14 12 q8 -22 4 -40 q-2 -12 -6 -18 Z" />
      </g>
      {/* ondulations */}
      <g stroke={H.corbeau.light} strokeWidth="1.6" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M24 52 q-5 10 0 20 q5 10 0 20" />
        <path d="M96 52 q5 10 0 20 q-5 10 0 20" />
        <path d="M30 24 q8 -6 18 -6" />
      </g>
      <g stroke={H.corbeau.dark} strokeWidth="1.8" fill="none" opacity="0.6">
        <path d="M30 54 q-4 12 0 24" /><path d="M90 54 q4 12 0 24" />
      </g>
      {/* petite fleur de tiaré sur la tempe droite */}
      {fleur(94, 34, 5, '#fff6dc', '#ffcf3f')}
    </g>
  ),

  // — Mulan : cheveux noirs mi-longs lisses + petit chignon aux baguettes dorées.
  dmulan: () => (
    <g>
      {cap(H.jet, 47, 50)}
      {/* mèches lisses le long du visage */}
      <g fill={H.jet.base}>
        <path d="M18 46 Q14 68 18 88 L30 88 Q26 68 30 46 Z" />
        <path d="M102 46 Q106 68 102 88 L90 88 Q94 68 90 46 Z" />
      </g>
      <g stroke={H.jet.light} strokeWidth="1.4" fill="none" opacity="0.45">
        <path d="M24 52 v32" /><path d="M96 52 v32" />
      </g>
      {/* chignon au sommet */}
      <ellipse cx="60" cy="0" rx="15" ry="12" fill={H.jet.base} stroke={H.jet.dark} strokeWidth="1.6" />
      <g stroke={H.jet.dark} strokeWidth="1.5" fill="none" opacity="0.7">
        <path d="M47 0 Q60 -9 73 0" /><path d="M49 5 Q60 -2 71 5" />
      </g>
      <ellipse cx="55" cy="-5" rx="4.5" ry="3" fill={H.jet.light} opacity="0.5" />
      {/* baguettes dorées plantées dans le chignon */}
      <g stroke={C.or} strokeWidth="3.2" strokeLinecap="round">
        <path d="M44 8 L84 -8" /><path d="M46 14 L86 -2" />
      </g>
      <g stroke="#fff3b0" strokeWidth="1" strokeLinecap="round" opacity="0.8">
        <path d="M48 6 L80 -7" /><path d="M50 12 L82 -1" />
      </g>
      <circle cx="84" cy="-8" r="3.2" fill={C.rouge} stroke={C.orF} strokeWidth="1" />
      <circle cx="86" cy="-2" r="3.2" fill={C.rouge} stroke={C.orF} strokeWidth="1" />
    </g>
  ),

  // — Cruella : perruque bicolore, moitié gauche blanche / moitié droite noire.
  dcruella: () => (
    <g>
      {/* volume bouffant : touffes blanches à gauche, noires à droite */}
      <g fill={H.neige.base} stroke={H.neige.dark} strokeWidth="1.6">
        <circle cx="26" cy="26" r="18" /><circle cx="34" cy="6" r="16" /><circle cx="49" cy="-4" r="15" />
      </g>
      <g fill={H.jet.base}>
        <circle cx="94" cy="26" r="18" /><circle cx="86" cy="6" r="16" /><circle cx="71" cy="-4" r="15" />
      </g>
      {/* calotte, coupée net au milieu */}
      <path d={skull(48)} fill={H.neige.base} stroke={H.neige.dark} strokeWidth="1.5" />
      <path d="M60 11 Q110 13 104 50 Q82 45 60 48 Z" fill={H.jet.base} />
      {/* démarcation franche */}
      <path d="M60 -19 L60 48" stroke={H.jet.dark} strokeWidth="1.6" opacity="0.55" />
      {/* mèches côté blanc */}
      <g stroke={H.neige.dark} strokeWidth="1.4" fill="none" opacity="0.75" strokeLinecap="round">
        <path d="M56 6 Q40 16 30 38" /><path d="M52 -2 Q34 6 24 24" /><path d="M56 16 Q44 28 38 44" />
      </g>
      {/* mèches côté noir */}
      <g stroke={H.jet.light} strokeWidth="1.4" fill="none" opacity="0.6" strokeLinecap="round">
        <path d="M64 6 Q80 16 90 38" /><path d="M68 -2 Q86 6 96 24" /><path d="M64 16 Q76 28 82 44" />
      </g>
      {/* pointes qui retombent devant les épaules */}
      <path d="M16 40 Q8 62 16 78 Q24 76 26 68 Q20 54 26 42 Z" fill={H.neige.base} stroke={H.neige.dark} strokeWidth="1.2" />
      <path d="M104 40 Q112 62 104 78 Q96 76 94 68 Q100 54 94 42 Z" fill={H.jet.base} />
      {/* reflets */}
      <circle cx="38" cy="2" r="5" fill={H.neige.light} opacity="0.9" />
      <circle cx="82" cy="2" r="5" fill={H.jet.light} opacity="0.5" />
    </g>
  ),

  // — Mirabel : grande afro brune très volumineuse, parsemée de fleurs colorées.
  dmirabel: () => (
    <g>
      <circle cx="60" cy="20" r="40" fill={H.brunF.base} />
      <g fill={H.brunF.base}>
        <circle cx="20" cy="32" r="16" /><circle cx="100" cy="32" r="16" />
        <circle cx="30" cy="0" r="15" /><circle cx="90" cy="0" r="15" />
        <circle cx="60" cy="-18" r="16" />
        <circle cx="14" cy="52" r="11" /><circle cx="106" cy="52" r="11" />
      </g>
      {/* boucles en creux (ombres) */}
      <g fill={H.brunF.dark} opacity="0.4">
        {[[40, 12, 8], [76, 14, 8], [60, 34, 9], [26, 30, 6], [94, 30, 6], [58, 2, 7]]
          .map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      {/* boucles éclairées */}
      <g fill={H.brunF.light} opacity="0.45">
        {[[44, 2, 5], [74, 2, 5], [30, 18, 4], [90, 18, 4], [60, -12, 5]]
          .map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      {/* petites fleurs colorées (broderie Encanto) */}
      {fleur(26, 14, 4.6, '#ffcf3f')}
      {fleur(48, -10, 4.2, '#ff6fae')}
      {fleur(80, -8, 4.4, '#5ec7ff')}
      {fleur(98, 20, 4.6, '#7ce08a')}
      {fleur(36, 40, 4, '#ff8c42')}
      {fleur(88, 44, 4, '#c08bff')}
    </g>
  ),

  // — Tiana : chignon élégant relevé + fleur de nénuphar sur le côté.
  dtiana: () => (
    <g>
      {cap(H.brunF, 45, 48, (
        <g stroke={H.brunF.light} strokeWidth="1.3" fill="none" opacity="0.5" strokeLinecap="round">
          <path d="M24 44 Q40 22 60 14" /><path d="M32 46 Q46 26 62 16" /><path d="M96 44 Q80 22 60 14" />
        </g>
      ))}
      {/* chignon relevé, légèrement décalé */}
      <ellipse cx="62" cy="-2" rx="18" ry="14" fill={H.brunF.base} stroke={H.brunF.dark} strokeWidth="1.8" />
      <g stroke={H.brunF.dark} strokeWidth="1.6" fill="none" opacity="0.65">
        <path d="M46 -2 Q62 -14 78 -2" /><path d="M48 4 Q62 -6 76 4" /><path d="M50 -9 Q62 0 74 -9" />
      </g>
      <ellipse cx="55" cy="-8" rx="5" ry="3.4" fill={H.brunF.light} opacity="0.55" />
      {/* torsade de base */}
      <path d="M45 9 Q62 0 79 9 Q62 16 45 9 Z" fill={H.brunF.dark} opacity="0.75" />
      {/* fleur de nénuphar verte et blanche */}
      <g transform="translate(32 8)">
        <g fill="#eef7e6" stroke="#b9d3ad" strokeWidth="1">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="0" cy="-7" rx="3.6" ry="6.4" transform={`rotate(${a})`} />
          ))}
        </g>
        <g fill="#cfe9bd" opacity="0.9">
          {[30, 150, 270].map((a) => (
            <ellipse key={a} cx="0" cy="-5" rx="2.8" ry="4.6" transform={`rotate(${a})`} />
          ))}
        </g>
        <circle cx="0" cy="0" r="3" fill={C.or} />
        {/* feuille de nénuphar */}
        <path d="M6 6 Q18 8 20 18 Q10 20 4 12 Z" fill={C.feuille} stroke={C.feuilleF} strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </g>
  ),

  // — Belle : cheveux bruns tirés en arrière, demi-queue et ruban bleu.
  dbelle: () => (
    <g>
      {cap(H.brun, 44, 47, (
        <g stroke={H.brun.light} strokeWidth="1.4" fill="none" opacity="0.55" strokeLinecap="round">
          <path d="M22 42 Q40 20 62 13" /><path d="M30 45 Q46 24 63 15" />
          <path d="M98 42 Q80 20 58 13" /><path d="M90 45 Q74 24 57 15" />
        </g>
      ))}
      {/* mèches folles devant les oreilles */}
      <path d="M20 42 Q16 56 20 66 Q25 66 26 60 Q23 52 26 44 Z" fill={H.brun.base} />
      <path d="M100 42 Q104 56 100 66 Q95 66 94 60 Q97 52 94 44 Z" fill={H.brun.base} />
      {/* rassemblement de la demi-queue au sommet */}
      <path d="M46 16 Q60 6 74 16 Q60 12 46 16 Z" fill={H.brun.dark} opacity="0.6" />
      {/* ruban bleu */}
      <g className="d-bow-pop">
        <path d="M57 8 Q45 0 42 8 Q40 17 57 15 Z" fill="#3d7ee0" stroke="#22539e" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M63 8 Q75 0 78 8 Q80 17 63 15 Z" fill="#3d7ee0" stroke="#22539e" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M54 8 Q46 4 45 8 Q44 12 54 11 Z" fill="#7fb2ef" opacity="0.5" />
        <ellipse cx="60" cy="11" rx="4.6" ry="5.4" fill="#2f68c4" stroke="#22539e" strokeWidth="1.4" />
        {/* pans du ruban */}
        <path d="M56 16 q-8 8 -10 16 l6 1 q3 -9 8 -14 Z" fill="#3d7ee0" stroke="#22539e" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M64 16 q8 8 10 16 l-6 1 q-3 -9 -8 -14 Z" fill="#3d7ee0" stroke="#22539e" strokeWidth="1.3" strokeLinejoin="round" />
      </g>
    </g>
  ),
}

// ================================================================
//  CHEVEUX DISNEY — couche ARRIÈRE (derrière le corps)
//  Seul ce qui dépasse de la silhouette du corps est visible.
// ================================================================
export const DISNEY_HAIR_BACK = {
  // — Raiponce : la tresse dorée démesurée qui descend jusqu'en bas du cadre.
  draiponce: () => (
    <g>
      {/* masse arrière, plus large que le corps */}
      <path d="M18 30 Q60 16 102 30 Q108 62 102 96 Q60 84 18 96 Q12 62 18 30 Z" fill={H.blond.dark} />
      <path d="M22 34 Q60 24 98 34 Q102 60 98 84 Q60 74 22 84 Q18 60 22 34 Z" fill={H.blond.base} opacity="0.8" />
      {/* immense tresse qui part du sommet, part à droite et descend jusqu'en bas */}
      <g className="d-braid-sway">
        <path d="M64 18 Q118 30 116 80 Q114 126 98 156 Q92 167 79 165 Q88 152 96 128 Q108 96 106 74 Q104 40 62 34 Z"
          fill={H.blond.base} stroke={H.blond.dark} strokeWidth="2" strokeLinejoin="round" />
        {/* reflet le long du bord intérieur */}
        <path d="M68 26 Q104 40 102 76 Q104 100 94 128 Q88 148 83 160 Q92 146 96 124 Q106 96 98 72 Q92 42 66 32 Z"
          fill={H.blond.light} opacity="0.45" />
        {/* entrelacements */}
        {tressage(H.blond, [
          [84, 28, 26], [100, 44, 58], [109, 64, 82], [111, 88, 88],
          [108, 112, 100], [101, 134, 116], [92, 152, 132],
        ], 9)}
        {/* pointe + ruban mauve */}
        <path d="M80 163 q11 3 13 -6 l-3 11 q-7 4 -11 -1 Z" fill={H.blond.dark} />
        <path d="M79 156 q12 4 16 -4" stroke="#c08bff" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* petites fleurs tressées dans la longueur */}
        {fleur(97, 50, 4.2, '#ffb3d9')}
        {fleur(111, 78, 4, '#8fd9ff')}
        {fleur(105, 118, 4.2, '#eaffe0')}
        {fleur(93, 148, 3.8, '#ffb3d9')}
      </g>
    </g>
  ),

  // — Elsa : masse platine dans le dos (la tresse elle-même est devant).
  delsa: () => (
    <g>
      <path d="M20 32 Q60 20 100 32 Q104 58 100 86 Q60 76 20 86 Q16 58 20 32 Z" fill={H.platine.dark} />
      <path d="M14 44 Q6 76 14 104 L32 104 Q26 78 28 48 Z" fill={H.platine.dark} />
      <path d="M18 52 Q12 78 18 98" stroke={H.platine.base} strokeWidth="2" fill="none" opacity="0.6" />
    </g>
  ),

  // — Ariel : chevelure rousse volumineuse et ondulée qui tombe dans le dos.
  dariel: () => (
    <g className="d-hair-flow">
      <path d="M18 28 Q60 14 102 28 Q110 60 106 96 Q60 82 14 96 Q10 60 18 28 Z" fill={H.ariel.dark} />
      {/* grosses vagues latérales */}
      <path d="M10 42 Q0 74 8 106 Q12 126 26 128 Q16 106 20 84 Q22 62 30 46 Z" fill={H.ariel.base} stroke={H.ariel.dark} strokeWidth="1.6" />
      <path d="M110 42 Q120 74 112 106 Q108 126 94 128 Q104 106 100 84 Q98 62 90 46 Z" fill={H.ariel.base} stroke={H.ariel.dark} strokeWidth="1.6" />
      {/* boucles terminales */}
      <path d="M8 104 q-6 16 6 22 q12 5 16 -6 q-10 4 -14 -4 Z" fill={H.ariel.base} stroke={H.ariel.dark} strokeWidth="1.4" />
      <path d="M112 104 q6 16 -6 22 q-12 5 -16 -6 q10 4 14 -4 Z" fill={H.ariel.base} stroke={H.ariel.dark} strokeWidth="1.4" />
      <g stroke={H.ariel.light} strokeWidth="1.8" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M16 52 q-6 22 -2 44" /><path d="M104 52 q6 22 2 44" />
        <path d="M24 60 q-4 20 0 38" /><path d="M96 60 q4 20 0 38" />
      </g>
    </g>
  ),

  // — Vaiana : longs cheveux noirs très épais, ondulés, jusqu'aux hanches.
  dvaiana: () => (
    <g className="d-hair-flow">
      <path d="M16 30 Q60 16 104 30 Q110 64 104 100 Q60 86 16 100 Q10 64 16 30 Z" fill={H.corbeau.dark} />
      <path d="M10 44 Q2 80 10 118 Q14 134 28 134 Q18 108 20 82 Q22 60 30 48 Z" fill={H.corbeau.base} stroke={H.corbeau.dark} strokeWidth="1.6" />
      <path d="M110 44 Q118 80 110 118 Q106 134 92 134 Q102 108 100 82 Q98 60 90 48 Z" fill={H.corbeau.base} stroke={H.corbeau.dark} strokeWidth="1.6" />
      {/* ondulations épaisses */}
      <g stroke={H.corbeau.light} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M17 56 q-6 14 -1 28 q5 14 -1 26" />
        <path d="M103 56 q6 14 1 28 q-5 14 1 26" />
        <path d="M25 64 q-4 14 0 28 q4 14 0 24" />
        <path d="M95 64 q4 14 0 28 q-4 14 0 24" />
      </g>
      {/* pointes */}
      <path d="M12 124 q4 12 16 10 l-2 8 q-14 1 -18 -12 Z" fill={H.corbeau.base} />
      <path d="M108 124 q-4 12 -16 10 l2 8 q14 1 18 -12 Z" fill={H.corbeau.base} />
    </g>
  ),

  // — Mulan : masse noire mi-longue, lisse, coupée net au niveau des épaules.
  dmulan: () => (
    <g>
      <path d="M20 30 Q60 18 100 30 Q104 56 100 84 Q60 74 20 84 Q16 56 20 30 Z" fill={H.jet.dark} />
      <path d="M14 42 Q10 70 14 96 L34 96 Q30 70 30 46 Z" fill={H.jet.dark} />
      <path d="M106 42 Q110 70 106 96 L86 96 Q90 70 90 46 Z" fill={H.jet.dark} />
      <g stroke={H.jet.light} strokeWidth="1.5" fill="none" opacity="0.4">
        <path d="M20 52 v38" /><path d="M100 52 v38" />
      </g>
    </g>
  ),

  // — Belle : la demi-queue brune qui retombe dans le dos.
  dbelle: () => (
    <g>
      <path d="M24 32 Q60 22 96 32 Q100 54 96 76 Q60 68 24 76 Q20 54 24 32 Z" fill={H.brun.dark} />
      <path d="M50 34 Q34 62 42 100 Q46 116 60 118 Q74 116 78 100 Q86 62 70 34 Z" fill={H.brun.base} stroke={H.brun.dark} strokeWidth="1.8" />
      <g stroke={H.brun.dark} strokeWidth="1.6" fill="none" opacity="0.55">
        <path d="M52 46 q-8 30 -2 60" /><path d="M68 46 q8 30 2 60" />
      </g>
      <path d="M58 40 q-6 28 -2 56" stroke={H.brun.light} strokeWidth="2" fill="none" opacity="0.5" />
      {/* boucle finale */}
      <path d="M44 106 q6 18 16 16 q10 2 16 -16 q-6 22 -16 20 q-10 2 -16 -20 Z" fill={H.brun.base} />
    </g>
  ),
}

// ----------------------------------------------------------------
//  CLASSES D'ANIMATION UTILISÉES (le CSS reste à écrire) :
//   .d-ears-wiggle    — dears, dstitch      : léger balancement des oreilles
//   .d-stars-twinkle  — dsorcier            : scintillement des étoiles/lunes
//   .d-sparkle        — dcendrillon, dclochette, dgenie, delsa : éclat pulsé
//   .d-bow-pop        — dminnie, dnoeud, dbelle : petit rebond du nœud
//   .d-mane-breathe   — dlionking           : respiration de la crinière
//   .d-feather-wave   — dgenie              : ondulation de la plume
//   .d-braid-sway     — draiponce, delsa    : balancement de la tresse
//   .d-hair-flow      — dariel, dvaiana     : ondulation lente de la chevelure
// ----------------------------------------------------------------
