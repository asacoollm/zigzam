// ============================================================
//  Dessins SVG de tous les accessoires de l'avatar.
//  Repère du bonhomme : viewBox 0 0 120 168, centre x=60.
//  - Crâne ~ y 16, yeux à cx 49/71 cy 60, panneau visage y 42..78
//  - Bras droit ~ x 101..116 / main ~ (106,100)
//  - Pieds ~ cx 43/77 cy 152
//  Chaque fonction renvoie un <g>. Clé = id de l'item (cf. lib/avatar.js).
// ============================================================

const C = {
  rose: '#ff4d8d', orange: '#ff8c42', jaune: '#fbbf24', vert: '#3dd68c',
  bleu: '#00bfff', violet: '#7c3aff', rouge: '#ef4444', blanc: '#f5f5fb',
  noir: '#2b2350', brun: '#7a4a2a', brunF: '#5b3a29', gris: '#9aa3b2',
  grisF: '#6b7280', or: '#ffcf3f', orF: '#e0a92a', peau: '#ffd9b0',
}

// ----------------------------------------------------------------
//  CHAPEAUX  (posés sur le crâne, centrés x=60, brim ~ y 22)
// ----------------------------------------------------------------
const HATS = {
  cap: () => (
    <g>
      <path d="M30 23 Q60 -5 90 23 Z" fill={C.bleu} />
      <path d="M60 23 q24 0 33 8 q-16 -1 -33 -2 Z" fill={C.bleu} />
      <circle cx="60" cy="-2" r="3" fill={C.violet} />
    </g>
  ),
  beanie: () => (
    <g>
      <path d="M30 24 Q60 -8 90 24 Z" fill={C.rose} />
      <rect x="28" y="20" width="64" height="9" rx="4.5" fill={C.violet} />
      <circle cx="60" cy="-4" r="6" fill={C.blanc} />
    </g>
  ),
  beret: () => (
    <g>
      <ellipse cx="60" cy="16" rx="34" ry="13" fill={C.rouge} />
      <ellipse cx="60" cy="20" rx="30" ry="7" fill="#c81e1e" />
      <circle cx="60" cy="2" r="3" fill="#c81e1e" />
    </g>
  ),
  bandana: () => (
    <g>
      <path d="M24 22 Q60 4 96 22 L94 30 Q60 18 26 30 Z" fill={C.vert} />
      <path d="M90 24 l14 -6 -4 12 Z" fill={C.vert} />
      <circle cx="44" cy="22" r="2" fill={C.blanc} />
      <circle cx="60" cy="19" r="2" fill={C.blanc} />
      <circle cx="76" cy="22" r="2" fill={C.blanc} />
    </g>
  ),
  party: () => (
    <g>
      <path d="M60 -16 L46 22 L74 22 Z" fill={C.rose} />
      <path d="M53 4 L67 4 M50 13 L70 13" stroke={C.jaune} strokeWidth="3" />
      <circle cx="60" cy="-16" r="4" fill={C.bleu} />
    </g>
  ),
  grad: () => (
    <g>
      <rect x="48" y="14" width="24" height="14" rx="3" fill={C.noir} />
      <path d="M34 14 L60 6 L86 14 L60 22 Z" fill={C.noir} />
      <circle cx="60" cy="14" r="2" fill={C.or} />
      <path d="M60 14 L84 14 L84 28" stroke={C.or} strokeWidth="2" fill="none" />
      <circle cx="84" cy="30" r="3" fill={C.or} />
    </g>
  ),
  straw: () => (
    <g>
      <ellipse cx="60" cy="24" rx="42" ry="9" fill={C.jaune} />
      <path d="M38 24 Q60 -2 82 24 Z" fill="#f0b41e" />
      <rect x="40" y="18" width="40" height="6" rx="3" fill={C.orange} />
    </g>
  ),
  cowboy: () => (
    <g>
      <path d="M18 24 Q60 36 102 24 Q84 18 60 18 Q36 18 18 24 Z" fill={C.brun} />
      <path d="M40 22 Q60 -4 80 22 Q60 16 40 22 Z" fill={C.brunF} />
      <rect x="40" y="18" width="40" height="5" rx="2.5" fill={C.noir} />
    </g>
  ),
  chef: () => (
    <g>
      <rect x="40" y="16" width="40" height="12" rx="3" fill={C.blanc} />
      <circle cx="46" cy="10" r="11" fill={C.blanc} />
      <circle cx="60" cy="6" r="13" fill={C.blanc} />
      <circle cx="74" cy="10" r="11" fill={C.blanc} />
    </g>
  ),
  helmet: () => (
    <g>
      <path d="M26 26 Q60 -6 94 26 Q60 16 26 26 Z" fill={C.bleu} />
      <path d="M50 4 L54 24 M62 1 L62 23 M74 5 L70 24" stroke="#0090c8" strokeWidth="3" />
      <path d="M26 26 q-4 4 0 8" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  sombrero: () => (
    <g>
      <ellipse cx="60" cy="26" rx="50" ry="11" fill={C.orange} />
      <ellipse cx="60" cy="26" rx="50" ry="11" fill="none" stroke={C.rouge} strokeWidth="2" />
      <path d="M40 26 Q60 -10 80 26 Z" fill="#e07a2a" />
      <rect x="40" y="20" width="40" height="6" rx="3" fill={C.rouge} />
    </g>
  ),
  witch: () => (
    <g>
      <ellipse cx="60" cy="24" rx="40" ry="8" fill={C.violet} />
      <path d="M44 24 Q56 -18 84 -6 Q70 8 76 24 Z" fill="#5a1fd4" />
      <rect x="46" y="18" width="28" height="7" rx="2" fill={C.noir} />
      <rect x="56" y="18" width="9" height="7" fill={C.or} />
    </g>
  ),
  crown: () => (
    <g>
      <path d="M32 24 L34 4 L46 16 L60 0 L74 16 L86 4 L88 24 Z" fill={C.or} />
      <rect x="32" y="22" width="56" height="6" rx="2" fill={C.orF} />
      <circle cx="60" cy="14" r="3" fill={C.rose} />
      <circle cx="40" cy="18" r="2.5" fill={C.bleu} />
      <circle cx="80" cy="18" r="2.5" fill={C.bleu} />
    </g>
  ),
  tophat: () => (
    <g>
      <ellipse cx="60" cy="24" rx="40" ry="8" fill={C.noir} />
      <rect x="40" y="-8" width="40" height="32" rx="3" fill={C.noir} />
      <rect x="40" y="14" width="40" height="6" fill={C.rouge} />
    </g>
  ),
  pirate: () => (
    <g>
      <path d="M22 24 Q60 30 98 24 Q88 10 60 10 Q32 10 22 24 Z" fill={C.noir} />
      <path d="M30 18 Q60 26 90 18 Q60 22 30 18 Z" fill={C.noir} />
      <circle cx="60" cy="15" r="5" fill={C.blanc} />
      <circle cx="58" cy="14" r="1" fill={C.noir} />
      <circle cx="62" cy="14" r="1" fill={C.noir} />
    </g>
  ),
  flower: () => (
    <g>
      <path d="M26 22 Q60 10 94 22" stroke={C.vert} strokeWidth="4" fill="none" />
      {[30, 45, 60, 75, 90].map((x, i) => (
        <g key={i} transform={`translate(${x} ${18 - (i === 2 ? 4 : 0)})`}>
          <circle cx="0" cy="-3" r="2.4" fill={[C.rose, C.jaune, C.bleu, C.rose, C.violet][i]} />
          <circle cx="-3" cy="1" r="2.4" fill={[C.rose, C.jaune, C.bleu, C.rose, C.violet][i]} />
          <circle cx="3" cy="1" r="2.4" fill={[C.rose, C.jaune, C.bleu, C.rose, C.violet][i]} />
          <circle cx="0" cy="0" r="1.6" fill={C.or} />
        </g>
      ))}
    </g>
  ),
  santa: () => (
    <g>
      <path d="M30 24 Q52 -14 86 -8 Q70 6 78 24 Z" fill={C.rouge} />
      <rect x="28" y="20" width="56" height="9" rx="4.5" fill={C.blanc} />
      <circle cx="86" cy="-8" r="6" fill={C.blanc} />
    </g>
  ),
  police: () => (
    <g>
      <path d="M34 18 Q60 6 86 18 L86 22 L34 22 Z" fill="#1f3a8a" />
      <path d="M34 22 q26 6 52 0 l0 4 q-26 5 -52 0 Z" fill="#16285e" />
      <rect x="52" y="9" width="16" height="9" rx="2" fill={C.or} />
    </g>
  ),
  viking: () => (
    <g>
      <path d="M30 24 Q60 0 90 24 Z" fill={C.gris} />
      <rect x="30" y="20" width="60" height="6" rx="3" fill={C.grisF} />
      <path d="M30 22 Q14 14 16 0 Q26 10 34 18 Z" fill="#f3ead0" />
      <path d="M90 22 Q106 14 104 0 Q94 10 86 18 Z" fill="#f3ead0" />
    </g>
  ),
  halo: () => (
    <g>
      <ellipse cx="60" cy="2" rx="26" ry="8" fill="none" stroke={C.or} strokeWidth="5" />
      <ellipse cx="60" cy="2" rx="26" ry="8" fill="none" stroke="#fff3b0" strokeWidth="1.5" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  LUNETTES  (devant les yeux : cx 49/71, cy 60)
// ----------------------------------------------------------------
const bridge = <line x1="58" y1="60" x2="62" y2="60" stroke={C.noir} strokeWidth="3" />

const GLASSES = {
  round: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.noir} strokeWidth="3">
      <circle cx="49" cy="60" r="9" />
      <circle cx="71" cy="60" r="9" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  square: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.noir} strokeWidth="3">
      <rect x="40" y="52" width="18" height="16" rx="4" />
      <rect x="62" y="52" width="18" height="16" rx="4" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  sun: () => (
    <g fill={C.noir}>
      <rect x="40" y="52" width="18" height="16" rx="7" />
      <rect x="62" y="52" width="18" height="16" rx="7" />
      <rect x="57" y="58" width="6" height="3" />
    </g>
  ),
  nerd: () => (
    <g>
      <g fill="rgba(255,255,255,0.3)" stroke={C.noir} strokeWidth="4">
        <circle cx="49" cy="60" r="9" />
        <circle cx="71" cy="60" r="9" />
      </g>
      <rect x="57" y="58" width="6" height="4" fill={C.blanc} stroke={C.noir} strokeWidth="1" />
    </g>
  ),
  eyemask: () => (
    <path d="M34 54 Q60 48 86 54 Q86 70 71 70 Q63 70 60 64 Q57 70 49 70 Q34 70 34 54 Z" fill={C.noir} />
  ),
  star: () => (
    <g>
      <rect x="40" y="52" width="18" height="16" rx="4" fill={C.noir} />
      <rect x="62" y="52" width="18" height="16" rx="4" fill={C.noir} />
      {bridge}
      <path d="M49 54 l2 4 4 .3 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.3 Z" fill={C.jaune} />
      <path d="M71 54 l2 4 4 .3 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.3 Z" fill={C.jaune} />
    </g>
  ),
  heart: () => (
    <g fill={C.rose}>
      <path d="M49 56 q3 -4 6 0 q2 3 -6 9 q-8 -6 -6 -9 q3 -4 6 0 Z" />
      <path d="M71 56 q3 -4 6 0 q2 3 -6 9 q-8 -6 -6 -9 q3 -4 6 0 Z" />
      <rect x="57" y="58" width="6" height="2.5" />
    </g>
  ),
  aviator: () => (
    <g fill="rgba(120,200,255,0.5)" stroke={C.grisF} strokeWidth="2.5">
      <path d="M40 53 h18 v6 q0 9 -9 9 q-9 0 -9 -9 Z" />
      <path d="M62 53 h18 v6 q0 9 -9 9 q-9 0 -9 -9 Z" />
      <line x1="58" y1="55" x2="62" y2="55" />
    </g>
  ),
  cateye: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.rose} strokeWidth="3">
      <path d="M39 56 q4 -6 19 -2 q-2 12 -11 12 q-9 0 -8 -10 Z" />
      <path d="M81 56 q-4 -6 -19 -2 q2 12 11 12 q9 0 8 -10 Z" />
    </g>
  ),
  cyber: () => (
    <g stroke={C.noir} strokeWidth="2.5">
      <rect x="40" y="52" width="18" height="16" rx="4" fill="rgba(239,68,68,0.6)" />
      <rect x="62" y="52" width="18" height="16" rx="4" fill="rgba(0,191,255,0.6)" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  sportband: () => (
    <g>
      <path d="M34 56 Q60 50 86 56 L86 64 Q60 60 34 64 Z" fill={C.bleu} />
      <path d="M40 58 Q60 54 80 58" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  ),
  pixel: () => (
    <g fill={C.noir}>
      <path d="M40 52 h18 v16 h-18 Z M44 56 h10 v8 h-10 Z" fillRule="evenodd" />
      <path d="M62 52 h18 v16 h-18 Z M66 56 h10 v8 h-10 Z" fillRule="evenodd" />
      <rect x="44" y="56" width="10" height="8" fill={C.bleu} />
      <rect x="66" y="56" width="10" height="8" fill={C.vert} />
    </g>
  ),
  rainbow: () => (
    <g stroke={C.noir} strokeWidth="2">
      <rect x="40" y="52" width="18" height="16" rx="7" fill="url(#fg-rainbow)" />
      <rect x="62" y="52" width="18" height="16" rx="7" fill="url(#fg-rainbow)" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  monocle: () => (
    <g>
      <circle cx="71" cy="60" r="10" fill="rgba(255,255,255,0.3)" stroke={C.or} strokeWidth="3" />
      <path d="M71 70 Q74 82 80 86" stroke={C.or} strokeWidth="1.5" fill="none" />
    </g>
  ),
  swim: () => (
    <g stroke="#0090c8" strokeWidth="2.5">
      <circle cx="49" cy="60" r="9" fill="rgba(0,191,255,0.45)" />
      <circle cx="71" cy="60" r="9" fill="rgba(0,191,255,0.45)" />
      <path d="M40 58 Q34 56 30 58 M80 58 Q86 56 90 58" fill="none" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  ski: () => (
    <g>
      <rect x="36" y="50" width="48" height="20" rx="10" fill="rgba(0,191,255,0.5)" stroke={C.noir} strokeWidth="3" />
      <rect x="33" y="57" width="6" height="6" rx="2" fill={C.noir} />
      <rect x="81" y="57" width="6" height="6" rx="2" fill={C.noir} />
    </g>
  ),
  halfmoon: () => (
    <g fill="none" stroke={C.brunF} strokeWidth="3">
      <path d="M40 62 a9 9 0 0 0 18 0" />
      <path d="M62 62 a9 9 0 0 0 18 0" />
      <line x1="58" y1="62" x2="62" y2="62" />
    </g>
  ),
  led: () => (
    <g>
      <rect x="38" y="54" width="44" height="12" rx="3" fill={C.noir} />
      {[44, 50, 56, 64, 70, 76].map((x, i) => (
        <rect key={i} x={x} y="57" width="3" height="6" fill={[C.rose, C.bleu, C.vert, C.jaune, C.bleu, C.rose][i]} />
      ))}
    </g>
  ),
  diamond: () => (
    <g stroke={C.bleu} strokeWidth="2.5" fill="rgba(0,191,255,0.2)">
      <rect x="40" y="52" width="18" height="16" rx="3" />
      <rect x="62" y="52" width="18" height="16" rx="3" />
      <path d="M55 48 l3 4 -3 4 -3 -4 Z" fill={C.bleu} stroke="none" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  gold: () => (
    <g fill="rgba(255,255,255,0.2)" stroke={C.or} strokeWidth="3.5">
      <circle cx="49" cy="60" r="9" />
      <circle cx="71" cy="60" r="9" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  CHEVEUX  (sur le crâne, rendus DERRIÈRE le visage)
// ----------------------------------------------------------------
const HAIR = {
  short: () => <path d="M24 32 Q60 -2 96 32 Q60 16 24 32 Z" fill={C.brunF} />,
  spiky: () => (
    <path d="M28 20 L34 2 L43 17 L52 0 L60 16 L68 0 L77 17 L86 3 L92 20 Z" fill={C.brunF} />
  ),
  side: () => (
    <path d="M26 24 Q28 6 60 7 Q88 8 92 22 Q72 12 50 16 Q36 18 26 24 Z" fill={C.brun} />
  ),
  bowl: () => <path d="M24 30 Q60 -8 96 30 Q60 18 24 30 Z" fill="#3a2a1a" />,
  fringe: () => (
    <g fill={C.brun}>
      <path d="M24 30 Q60 -6 96 30 Q60 16 24 30 Z" />
      <path d="M32 30 l4 12 5 -11 5 12 5 -11 5 12 5 -11 5 12 5 -12 Q60 26 32 30 Z" />
    </g>
  ),
  buzz: () => <path d="M26 30 Q60 2 94 30 Q60 20 26 30 Z" fill="#8a6a4a" opacity="0.85" />,
  wavy: () => (
    <path d="M24 28 q9 -10 18 -2 q9 -12 18 -2 q9 -12 18 -2 q9 -10 18 0 Q60 12 24 28 Z" fill={C.brun} />
  ),
  curly: () => (
    <g fill={C.brunF}>
      {[28, 40, 52, 60, 68, 80, 92].map((x, i) => (
        <circle key={i} cx={x} cy={i % 2 ? 12 : 8} r="8" />
      ))}
    </g>
  ),
  ponytail: () => (
    <g fill={C.brun}>
      <path d="M26 28 Q60 -4 94 28 Q60 16 26 28 Z" />
      <path d="M92 18 q16 6 14 26 q-3 12 -12 16 q8 -16 2 -28 q-3 -8 -10 -10 Z" />
    </g>
  ),
  pigtails: () => (
    <g fill={C.brun}>
      <path d="M28 26 Q60 -2 92 26 Q60 14 28 26 Z" />
      <circle cx="22" cy="40" r="9" />
      <circle cx="98" cy="40" r="9" />
    </g>
  ),
  bun: () => (
    <g fill={C.brunF}>
      <path d="M26 28 Q60 -2 94 28 Q60 16 26 28 Z" />
      <circle cx="60" cy="0" r="9" />
    </g>
  ),
  braid: () => (
    <g fill={C.brun}>
      <path d="M26 28 Q60 -2 94 28 Q60 16 26 28 Z" />
      <g transform="translate(96 22)">
        <ellipse cx="0" cy="6" rx="6" ry="5" />
        <ellipse cx="0" cy="16" rx="6.5" ry="5.5" />
        <ellipse cx="0" cy="26" rx="5.5" ry="5" />
        <path d="M0 32 l-3 6 3 -1 3 1 Z" />
      </g>
    </g>
  ),
  mohawk: () => (
    <g>
      <path d="M54 18 L57 -3 L60 18 Z" fill={C.rose} />
      <path d="M58 18 L62 -5 L66 18 Z" fill={C.violet} />
      <path d="M63 18 L67 -3 L70 18 Z" fill={C.bleu} />
    </g>
  ),
  afro: () => (
    <g fill="#2f2016">
      <circle cx="60" cy="12" r="28" />
      <circle cx="30" cy="26" r="14" />
      <circle cx="90" cy="26" r="14" />
    </g>
  ),
  topknot: () => (
    <g fill={C.noir}>
      <path d="M30 26 Q60 6 90 26 Q60 18 30 26 Z" />
      <rect x="55" y="2" width="10" height="10" rx="4" />
    </g>
  ),
  dreads: () => (
    <g fill="#3a2a1a">
      <path d="M26 26 Q60 0 94 26 Q60 16 26 26 Z" />
      {[28, 38, 60, 82, 92].map((x, i) => (
        <rect key={i} x={x - 3} y="20" width="6" height={22 + (i % 2) * 8} rx="3" />
      ))}
    </g>
  ),
  emo: () => (
    <g fill={C.noir}>
      <path d="M24 30 Q60 -6 96 30 Q60 14 24 30 Z" />
      <path d="M30 26 Q44 52 64 50 Q44 44 40 26 Z" />
    </g>
  ),
  spacebuns: () => (
    <g fill={C.brunF}>
      <path d="M28 26 Q60 -2 92 26 Q60 14 28 26 Z" />
      <circle cx="36" cy="4" r="9" />
      <circle cx="84" cy="4" r="9" />
    </g>
  ),
  long: () => (
    <g fill={C.brun}>
      <path d="M24 28 Q60 -6 96 28 Q60 14 24 28 Z" />
      <path d="M22 28 Q10 64 20 104 L32 104 Q26 64 32 34 Z" />
      <path d="M98 28 Q110 64 100 104 L88 104 Q94 64 88 34 Z" />
    </g>
  ),
  rainbow: () => (
    <g>
      <path d="M24 30 Q60 -8 96 30 Q60 18 24 30 Z" fill="url(#fg-rainbow)" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  SPORT  (tenu / posé — surtout à droite près de la main ~ (106,96))
// ----------------------------------------------------------------
const ball = (color, extra) => (
  <g>
    <circle cx="106" cy="96" r="12" fill={color} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
    {extra}
  </g>
)

const SPORT = {
  foot: () => ball('#ffffff', (
    <g fill={C.noir}>
      <path d="M106 90 l4 3 -1.5 5 h-5 l-1.5 -5 Z" />
      <circle cx="99" cy="99" r="2" /><circle cx="113" cy="99" r="2" /><circle cx="106" cy="106" r="2" />
    </g>
  )),
  basket: () => ball(C.orange, (
    <g stroke="#9a4d12" strokeWidth="1.4" fill="none">
      <line x1="94" y1="96" x2="118" y2="96" /><line x1="106" y1="84" x2="106" y2="108" />
      <path d="M97 87 Q106 96 97 105 M115 87 Q106 96 115 105" />
    </g>
  )),
  tennis: () => ball('#d4f02a', (
    <path d="M98 88 Q108 96 98 104 M114 88 Q104 96 114 104" stroke="#fff" strokeWidth="1.5" fill="none" />
  )),
  pingpong: () => (
    <g>
      <circle cx="98" cy="92" r="9" fill={C.rouge} />
      <rect x="95" y="100" width="6" height="10" rx="2" fill={C.brun} />
      <circle cx="112" cy="100" r="5" fill="#fff" stroke="rgba(0,0,0,0.1)" />
    </g>
  ),
  volley: () => ball('#ffffff', (
    <path d="M106 84 v24 M95 90 Q106 96 95 104 M117 90 Q106 96 117 104" stroke={C.bleu} strokeWidth="1.5" fill="none" />
  )),
  baseball: () => ball('#ffffff', (
    <path d="M98 88 Q104 96 98 104 M114 88 Q108 96 114 104" stroke={C.rouge} strokeWidth="1.5" fill="none" />
  )),
  rugby: () => (
    <g>
      <ellipse cx="106" cy="96" rx="9" ry="13" fill={C.brun} transform="rotate(28 106 96)" />
      <line x1="101" y1="91" x2="111" y2="101" stroke="#fff" strokeWidth="1.5" />
      <line x1="103" y1="94" x2="107" y2="98" stroke="#fff" strokeWidth="1.2" />
    </g>
  ),
  golf: () => (
    <g>
      <circle cx="98" cy="86" r="6" fill="#fff" stroke="rgba(0,0,0,0.12)" />
      <circle cx="96" cy="85" r="1" fill="#ccc" /><circle cx="100" cy="85" r="1" fill="#ccc" /><circle cx="98" cy="88" r="1" fill="#ccc" />
      <path d="M104 90 L114 112" stroke={C.grisF} strokeWidth="3" />
      <path d="M114 112 q5 0 6 4" stroke={C.grisF} strokeWidth="3" fill="none" />
    </g>
  ),
  bowling: () => ball(C.violet, (
    <g fill={C.noir}><circle cx="103" cy="92" r="1.6" /><circle cx="109" cy="92" r="1.6" /><circle cx="106" cy="97" r="1.6" /></g>
  )),
  dumbbell: () => (
    <g fill={C.grisF}>
      <rect x="92" y="93" width="28" height="6" rx="3" />
      <rect x="90" y="87" width="7" height="18" rx="2" fill={C.noir} />
      <rect x="115" y="87" width="7" height="18" rx="2" fill={C.noir} />
    </g>
  ),
  boxe: () => (
    <g fill={C.rouge}>
      <path d="M98 92 q-8 0 -8 8 q0 8 9 9 l9 0 0 -16 q-4 -1 -10 -1 Z" />
      <rect x="106" y="98" width="6" height="9" rx="2" fill="#c81e1e" />
      <path d="M12 92 q8 0 8 8 q0 8 -9 9 l-9 0 0 -16 q4 -1 10 -1 Z" transform="translate(0 0)" />
    </g>
  ),
  hockey: () => (
    <g>
      <path d="M96 78 L108 104 L120 104" stroke={C.brun} strokeWidth="4" fill="none" />
      <ellipse cx="92" cy="118" rx="7" ry="3.5" fill={C.noir} />
    </g>
  ),
  medal: () => (
    <g>
      <path d="M54 40 L60 70 M66 40 L60 70" stroke={C.rouge} strokeWidth="5" />
      <circle cx="60" cy="78" r="9" fill={C.or} stroke={C.orF} strokeWidth="2" />
      <path d="M60 73 l1.6 3.4 3.6 .4 -2.7 2.5 .7 3.6 -3.2 -1.8 -3.2 1.8 .7 -3.6 -2.7 -2.5 3.6 -.4 Z" fill={C.orF} />
    </g>
  ),
  skate: () => (
    <g>
      <rect x="24" y="150" width="72" height="8" rx="4" fill={C.rouge} />
      <path d="M24 154 q-6 0 -8 6 M96 154 q6 0 8 6" stroke="#c81e1e" strokeWidth="3" fill="none" />
      <circle cx="38" cy="162" r="4" fill={C.noir} /><circle cx="82" cy="162" r="4" fill={C.noir} />
    </g>
  ),
  surf: () => (
    <g>
      <path d="M104 56 Q120 96 104 150 Q92 96 104 56 Z" fill={C.vert} />
      <line x1="104" y1="64" x2="104" y2="142" stroke="#fff" strokeWidth="2" />
      <path d="M104 56 Q110 80 104 100" stroke={C.rose} strokeWidth="3" fill="none" />
    </g>
  ),
  ski: () => (
    <g>
      <rect x="34" y="118" width="6" height="44" rx="3" fill={C.bleu} transform="rotate(-8 37 140)" />
      <rect x="78" y="118" width="6" height="44" rx="3" fill={C.rose} transform="rotate(8 81 140)" />
      <path d="M30 118 v40 M92 118 v40" stroke={C.grisF} strokeWidth="2" />
    </g>
  ),
  scooter: () => (
    <g stroke={C.violet} strokeWidth="3" fill="none">
      <path d="M100 96 L100 150 L84 150 M100 150 L116 150" />
      <path d="M100 96 L112 96" />
      <circle cx="84" cy="154" r="5" fill={C.noir} stroke="none" />
      <circle cx="116" cy="154" r="5" fill={C.noir} stroke="none" />
    </g>
  ),
  bike: () => (
    <g stroke={C.bleu} strokeWidth="2.5" fill="none">
      <circle cx="86" cy="146" r="11" /><circle cx="112" cy="146" r="11" />
      <path d="M86 146 L99 130 L112 146 M99 130 L104 130 M99 130 L94 122" />
      <line x1="112" y1="146" x2="106" y2="130" />
    </g>
  ),
  cup: () => (
    <g fill={C.or}>
      <path d="M96 86 h20 v6 q0 9 -10 9 q-10 0 -10 -9 Z" />
      <path d="M96 88 q-7 0 -7 6 q0 5 7 5 M116 88 q7 0 7 6 q0 5 -7 5" stroke={C.or} strokeWidth="2.5" fill="none" />
      <rect x="102" y="101" width="8" height="7" /><rect x="98" y="108" width="16" height="4" rx="1" />
    </g>
  ),
  trophy: () => (
    <g>
      <path d="M98 84 h16 v5 q0 8 -8 8 q-8 0 -8 -8 Z" fill={C.or} />
      <rect x="103" y="97" width="6" height="6" fill={C.orF} />
      <rect x="99" y="103" width="14" height="4" rx="1" fill={C.orF} />
      <path d="M106 84 l1.6 3.2 3.4 .4 -2.5 2.4 .6 3.4 -3.1 -1.7 -3.1 1.7 .6 -3.4 -2.5 -2.4 3.4 -.4 Z" fill="#fff7cf" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  ANIMAUX  (compagnons — au sol à gauche, ou sur l'épaule droite)
// ----------------------------------------------------------------
const ground = (children) => <g transform="translate(20 132)">{children}</g>
const shoulder = (children) => <g transform="translate(94 40)">{children}</g>

const ANIMAL = {
  cat: () => ground(
    <g>
      <ellipse cx="0" cy="14" rx="9" ry="8" fill={C.grisF} />
      <circle cx="0" cy="2" r="8" fill={C.grisF} />
      <path d="M-7 -4 l-2 -7 5 3 Z M7 -4 l2 -7 -5 3 Z" fill={C.grisF} />
      <circle cx="-3" cy="1" r="1.4" fill={C.noir} /><circle cx="3" cy="1" r="1.4" fill={C.noir} />
      <path d="M-8 3 h-5 M8 3 h5" stroke={C.noir} strokeWidth="0.7" />
      <path d="M9 16 q8 -2 6 -10" stroke={C.grisF} strokeWidth="3" fill="none" />
    </g>
  ),
  dog: () => ground(
    <g>
      <ellipse cx="0" cy="14" rx="9" ry="8" fill={C.brun} />
      <circle cx="0" cy="2" r="8" fill="#a06a3a" />
      <ellipse cx="-8" cy="2" rx="3" ry="6" fill={C.brun} /><ellipse cx="8" cy="2" rx="3" ry="6" fill={C.brun} />
      <circle cx="-3" cy="0" r="1.4" fill={C.noir} /><circle cx="3" cy="0" r="1.4" fill={C.noir} />
      <ellipse cx="0" cy="4" rx="2" ry="1.6" fill={C.noir} />
    </g>
  ),
  bird: () => ground(
    <g>
      <ellipse cx="0" cy="10" rx="8" ry="9" fill={C.bleu} />
      <circle cx="0" cy="0" r="6" fill={C.bleu} />
      <path d="M6 0 l6 2 -6 2 Z" fill={C.orange} />
      <circle cx="2" cy="-1" r="1.3" fill={C.noir} />
      <path d="M-2 10 q-8 -2 -8 4 q6 0 8 -1 Z" fill="#0090c8" />
    </g>
  ),
  fish: () => <g transform="translate(18 96)">
    <ellipse cx="0" cy="0" rx="11" ry="7" fill={C.orange} />
    <path d="M10 0 l8 -6 0 12 Z" fill={C.orange} />
    <circle cx="-4" cy="-1" r="1.6" fill={C.noir} />
    <path d="M-2 -4 q4 -3 8 0" stroke="#d96c1e" strokeWidth="1.2" fill="none" />
  </g>,
  rabbit: () => ground(
    <g fill="#e9e3f0">
      <ellipse cx="0" cy="14" rx="8" ry="8" />
      <circle cx="0" cy="3" r="7" />
      <ellipse cx="-4" cy="-7" rx="2.5" ry="8" /><ellipse cx="4" cy="-7" rx="2.5" ry="8" />
      <circle cx="-2.5" cy="2" r="1.2" fill={C.noir} /><circle cx="2.5" cy="2" r="1.2" fill={C.noir} />
      <circle cx="0" cy="5" r="1.3" fill={C.rose} />
    </g>
  ),
  frog: () => ground(
    <g fill={C.vert}>
      <ellipse cx="0" cy="12" rx="11" ry="9" />
      <circle cx="-5" cy="2" r="4" /><circle cx="5" cy="2" r="4" />
      <circle cx="-5" cy="2" r="2" fill="#fff" /><circle cx="5" cy="2" r="2" fill="#fff" />
      <circle cx="-5" cy="2" r="1" fill={C.noir} /><circle cx="5" cy="2" r="1" fill={C.noir} />
      <path d="M-6 14 q6 4 12 0" stroke="#1f9d68" strokeWidth="1.5" fill="none" />
    </g>
  ),
  turtle: () => ground(
    <g>
      <path d="M-12 16 q12 -16 24 0 Z" fill={C.vert} />
      <path d="M-12 16 q12 -16 24 0" fill="none" stroke="#1f9d68" strokeWidth="1.5" />
      <circle cx="14" cy="13" r="4" fill="#8fd64a" />
      <ellipse cx="-11" cy="17" rx="3" ry="2" fill="#8fd64a" /><ellipse cx="11" cy="17" rx="3" ry="2" fill="#8fd64a" />
    </g>
  ),
  fox: () => ground(
    <g>
      <ellipse cx="0" cy="14" rx="9" ry="8" fill={C.orange} />
      <circle cx="0" cy="3" r="7" fill={C.orange} />
      <path d="M-7 -3 l-3 -8 6 4 Z M7 -3 l3 -8 -6 4 Z" fill={C.orange} />
      <path d="M0 3 q-5 4 0 7 q5 -3 0 -7 Z" fill="#fff" />
      <circle cx="-3" cy="1" r="1.2" fill={C.noir} /><circle cx="3" cy="1" r="1.2" fill={C.noir} />
    </g>
  ),
  panda: () => ground(
    <g>
      <ellipse cx="0" cy="14" rx="9" ry="8" fill="#fff" />
      <circle cx="0" cy="2" r="8" fill="#fff" />
      <circle cx="-6" cy="-5" r="3" fill={C.noir} /><circle cx="6" cy="-5" r="3" fill={C.noir} />
      <ellipse cx="-3" cy="2" rx="2.5" ry="3" fill={C.noir} /><ellipse cx="3" cy="2" rx="2.5" ry="3" fill={C.noir} />
      <circle cx="0" cy="6" r="1.3" fill={C.noir} />
    </g>
  ),
  penguin: () => ground(
    <g>
      <ellipse cx="0" cy="8" rx="9" ry="13" fill={C.noir} />
      <ellipse cx="0" cy="11" rx="5.5" ry="9" fill="#fff" />
      <circle cx="-2.5" cy="0" r="1.3" fill="#fff" /><circle cx="2.5" cy="0" r="1.3" fill="#fff" />
      <path d="M-2 3 l4 0 -2 3 Z" fill={C.orange} />
      <ellipse cx="-5" cy="20" rx="3" ry="1.5" fill={C.orange} /><ellipse cx="5" cy="20" rx="3" ry="1.5" fill={C.orange} />
    </g>
  ),
  hamster: () => ground(
    <g fill="#e0b97a">
      <ellipse cx="0" cy="12" rx="10" ry="9" />
      <circle cx="-7" cy="4" r="3" /><circle cx="7" cy="4" r="3" />
      <circle cx="-3" cy="9" r="1.3" fill={C.noir} /><circle cx="3" cy="9" r="1.3" fill={C.noir} />
      <ellipse cx="0" cy="13" rx="6" ry="4" fill="#f0d4a0" />
      <circle cx="0" cy="11" r="1" fill={C.rose} />
    </g>
  ),
  bee: () => <g transform="translate(92 28)">
    <ellipse cx="0" cy="0" rx="9" ry="6" fill={C.jaune} />
    <path d="M-3 -5 v10 M3 -5 v10" stroke={C.noir} strokeWidth="2.5" />
    <ellipse cx="-4" cy="-6" rx="4" ry="3" fill="#fff" opacity="0.8" /><ellipse cx="4" cy="-6" rx="4" ry="3" fill="#fff" opacity="0.8" />
    <circle cx="9" cy="-1" r="1.2" fill={C.noir} />
  </g>,
  butterfly: () => <g transform="translate(92 28)">
    <ellipse cx="-4" cy="-3" rx="5" ry="6" fill={C.rose} /><ellipse cx="4" cy="-3" rx="5" ry="6" fill={C.violet} />
    <ellipse cx="-4" cy="5" rx="4" ry="4" fill={C.bleu} /><ellipse cx="4" cy="5" rx="4" ry="4" fill={C.vert} />
    <rect x="-0.8" y="-6" width="1.6" height="14" rx="0.8" fill={C.noir} />
  </g>,
  ladybug: () => ground(
    <g>
      <ellipse cx="0" cy="11" rx="10" ry="9" fill={C.rouge} />
      <circle cx="0" cy="2" r="4" fill={C.noir} />
      <line x1="0" y1="5" x2="0" y2="20" stroke={C.noir} strokeWidth="1.5" />
      <circle cx="-5" cy="10" r="1.6" fill={C.noir} /><circle cx="5" cy="10" r="1.6" fill={C.noir} />
      <circle cx="-4" cy="16" r="1.6" fill={C.noir} /><circle cx="4" cy="16" r="1.6" fill={C.noir} />
    </g>
  ),
  owl: () => shoulder(
    <g>
      <ellipse cx="0" cy="6" rx="9" ry="11" fill={C.brun} />
      <path d="M-8 -3 l-2 -6 5 3 Z M8 -3 l2 -6 -5 3 Z" fill={C.brun} />
      <circle cx="-3.5" cy="0" r="3.5" fill="#fff" /><circle cx="3.5" cy="0" r="3.5" fill="#fff" />
      <circle cx="-3.5" cy="0" r="1.6" fill={C.noir} /><circle cx="3.5" cy="0" r="1.6" fill={C.noir} />
      <path d="M-2 3 l2 3 2 -3 Z" fill={C.orange} />
    </g>
  ),
  parrot: () => shoulder(
    <g>
      <ellipse cx="0" cy="6" rx="7" ry="11" fill={C.vert} />
      <circle cx="0" cy="-4" r="6" fill={C.rouge} />
      <path d="M5 -5 q6 1 4 6 q-3 -2 -5 -2 Z" fill={C.jaune} />
      <circle cx="-1" cy="-5" r="1.3" fill={C.noir} />
      <path d="M-5 6 q-7 4 -6 12 q5 -3 7 -6 Z" fill={C.bleu} />
    </g>
  ),
  snake: () => (
    <g fill="none" stroke={C.vert} strokeWidth="6" strokeLinecap="round">
      <path d="M34 44 Q48 34 60 44 Q72 54 86 44" />
      <g stroke="none">
        <circle cx="88" cy="42" r="4.5" fill={C.vert} />
        <circle cx="90" cy="41" r="1" fill={C.noir} />
        <path d="M92 43 l5 1 -5 1" stroke={C.rouge} strokeWidth="1" fill="none" />
      </g>
    </g>
  ),
  dino: () => ground(
    <g fill={C.vert}>
      <ellipse cx="0" cy="13" rx="11" ry="9" />
      <circle cx="6" cy="4" r="6" />
      <path d="M-10 8 l-4 0 4 -4 Z M-9 12 l-5 2 5 1 Z" />
      <path d="M-6 6 l2 -5 2 5 1 -5 2 5" fill="#1f9d68" />
      <circle cx="8" cy="3" r="1.2" fill={C.noir} />
    </g>
  ),
  dragon: () => shoulder(
    <g>
      <ellipse cx="0" cy="6" rx="8" ry="10" fill={C.violet} />
      <circle cx="0" cy="-3" r="6" fill={C.violet} />
      <path d="M-4 -8 l-2 -5 4 3 Z M4 -8 l2 -5 -4 3 Z" fill="#5a1fd4" />
      <path d="M6 8 q12 -2 10 -14 q-2 8 -10 8 Z" fill={C.rose} />
      <circle cx="-2" cy="-4" r="1.3" fill={C.jaune} /><circle cx="3" cy="-4" r="1.3" fill={C.jaune} />
    </g>
  ),
  unicorn: () => ground(
    <g>
      <ellipse cx="0" cy="14" rx="9" ry="8" fill="#fff" />
      <circle cx="0" cy="3" r="7" fill="#fff" />
      <path d="M-6 -3 l-2 -6 4 3 Z" fill="#fff" />
      <path d="M3 -4 l3 -10 2 2 Z" fill={C.or} />
      <path d="M-4 -2 q-8 4 -6 12 q4 -4 8 -8 Z" fill={C.rose} />
      <circle cx="-1" cy="2" r="1.2" fill={C.noir} /><circle cx="4" cy="2" r="1.2" fill={C.noir} />
    </g>
  ),
}

// ---- Sélecteurs exportés ----
export function renderHat(id) { return HATS[id]?.() ?? null }
export function renderGlasses(id) { return GLASSES[id]?.() ?? null }
export function renderHair(id) { return HAIR[id]?.() ?? null }
export function renderSport(id) { return SPORT[id]?.() ?? null }
export function renderAnimal(id) { return ANIMAL[id]?.() ?? null }
