// ============================================================
//  Dessins SVG de tous les accessoires de l'avatar.
//  Repère du bonhomme : viewBox 0 -24 120 192, centre x=60.
//  - Crâne ~ y 16, yeux à cx 49/71 cy 60, panneau visage y 42..78
//  - Bras droit ~ x 101..116 / main ~ (106,96), bouche ~ y 70
//  Chaque fonction renvoie un <g>. Clé = id de l'item (cf. lib/avatar.js).
//  Les cheveux sont rendus DERRIÈRE le visage et SOUS les chapeaux.
// ============================================================

const C = {
  rose: '#ff4d8d', orange: '#ff8c42', jaune: '#fbbf24', vert: '#3dd68c',
  bleu: '#00bfff', violet: '#7c3aff', rouge: '#ef4444', blanc: '#f5f5fb',
  noir: '#2b2350', brun: '#7a4a2a', brunF: '#5b3a29', gris: '#9aa3b2',
  grisF: '#6b7280', or: '#ffcf3f', orF: '#e0a92a', peau: '#ffd9b0',
}

// ----------------------------------------------------------------
//  CHEVEUX  (épousent le crâne ~ y 6..40, rendus derrière le visage,
//  couverts par les chapeaux)
// ----------------------------------------------------------------
const HAIR = {
  short: () => <path d="M22 36 Q22 8 60 8 Q98 8 98 36 Q92 22 60 22 Q28 22 22 36 Z" fill={C.brunF} />,
  spiky: () => (
    <path d="M24 30 L30 6 L40 22 L49 2 L60 20 L71 2 L80 22 L90 6 L96 30 Q60 18 24 30 Z" fill={C.brunF} />
  ),
  side: () => (
    <path d="M22 32 Q22 6 60 7 Q98 8 98 28 Q90 16 60 16 Q40 16 30 24 Q26 28 22 32 Z" fill={C.brun} />
  ),
  bowl: () => <path d="M20 34 Q20 2 60 2 Q100 2 100 34 Q60 20 20 34 Z" fill="#3a2a1a" />,
  fringe: () => (
    <g fill={C.brun}>
      <path d="M22 34 Q22 6 60 6 Q98 6 98 34 Q60 20 22 34 Z" />
      <path d="M30 30 l4 13 5 -12 5 13 5 -12 5 13 5 -12 5 13 5 -13 Q60 26 30 30 Z" />
    </g>
  ),
  buzz: () => <path d="M24 32 Q24 12 60 12 Q96 12 96 32 Q90 24 60 24 Q30 24 24 32 Z" fill="#8a6a4a" opacity="0.9" />,
  wavy: () => (
    <path d="M22 30 q10 -12 19 -3 q10 -13 19 -3 q10 -13 19 -3 q10 -11 19 -1 Q60 12 22 30 Z" fill={C.brun} />
  ),
  curly: () => (
    <g fill={C.brunF}>
      {[26, 38, 50, 60, 70, 82, 94].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 14 : 9} r="9" />)}
      <path d="M22 30 Q60 18 98 30 Q60 22 22 30 Z" />
    </g>
  ),
  ponytail: () => (
    <g fill={C.brun}>
      <path d="M22 32 Q22 6 60 6 Q98 6 98 30 Q60 18 22 32 Z" />
      <path d="M94 16 q18 4 16 28 q-3 14 -13 18 q9 -18 3 -30 q-3 -10 -12 -10 Z" />
    </g>
  ),
  pigtails: () => (
    <g fill={C.brun}>
      <path d="M22 32 Q22 6 60 6 Q98 6 98 32 Q60 18 22 32 Z" />
      <circle cx="18" cy="44" r="10" /><circle cx="102" cy="44" r="10" />
    </g>
  ),
  bun: () => (
    <g fill={C.brunF}>
      <path d="M22 32 Q22 8 60 8 Q98 8 98 32 Q60 18 22 32 Z" />
      <circle cx="60" cy="-2" r="10" />
    </g>
  ),
  fro: () => (
    <g fill="#2f2016">
      <circle cx="60" cy="14" r="22" />
      <circle cx="36" cy="22" r="11" /><circle cx="84" cy="22" r="11" />
    </g>
  ),
  braid: () => (
    <g fill={C.brun}>
      <path d="M22 32 Q22 8 60 8 Q98 8 98 30 Q60 18 22 32 Z" />
      <g transform="translate(100 24)">
        <ellipse cx="0" cy="8" rx="6" ry="6" /><ellipse cx="0" cy="20" rx="7" ry="6" />
        <ellipse cx="0" cy="32" rx="6" ry="6" /><path d="M0 38 l-4 7 4 -1 4 1 Z" />
      </g>
    </g>
  ),
  mohawk: () => (
    <g>
      <path d="M53 20 L56 -8 L60 20 Z" fill={C.rose} />
      <path d="M58 20 L62 -10 L66 20 Z" fill={C.violet} />
      <path d="M63 20 L67 -8 L71 20 Z" fill={C.bleu} />
      <path d="M40 26 Q60 18 80 26 Q60 22 40 26 Z" fill={C.violet} />
    </g>
  ),
  topknot: () => (
    <g fill={C.noir}>
      <path d="M24 30 Q24 8 60 8 Q96 8 96 30 Q60 20 24 30 Z" />
      <rect x="54" y="-4" width="12" height="12" rx="5" />
    </g>
  ),
  emo: () => (
    <g fill={C.noir}>
      <path d="M20 34 Q20 4 60 4 Q100 4 100 34 Q60 18 20 34 Z" />
      <path d="M28 28 Q42 56 66 52 Q44 46 40 26 Z" />
    </g>
  ),
  dreads: () => (
    <g fill="#3a2a1a">
      <path d="M22 30 Q22 6 60 6 Q98 6 98 30 Q60 20 22 30 Z" />
      {[24, 34, 46, 60, 74, 86, 96].map((x, i) => (
        <rect key={i} x={x - 3} y="18" width="6" height={26 + (i % 3) * 8} rx="3" />
      ))}
    </g>
  ),
  spacebuns: () => (
    <g fill={C.brunF}>
      <path d="M22 32 Q22 6 60 6 Q98 6 98 32 Q60 18 22 32 Z" />
      <circle cx="34" cy="0" r="11" /><circle cx="86" cy="0" r="11" />
    </g>
  ),
  afro: () => (
    <g fill="#2f2016">
      <circle cx="60" cy="8" r="32" />
      <circle cx="26" cy="24" r="16" /><circle cx="94" cy="24" r="16" />
    </g>
  ),
  long: () => (
    <g fill={C.brun}>
      <path d="M20 30 Q20 4 60 4 Q100 4 100 30 Q60 18 20 30 Z" />
      <path d="M20 26 Q6 70 16 116 L30 116 Q24 70 30 34 Z" />
      <path d="M100 26 Q114 70 104 116 L90 116 Q96 70 90 34 Z" />
    </g>
  ),
  rainbow: () => <path d="M20 34 Q20 2 60 2 Q100 2 100 34 Q60 20 20 34 Z" fill="url(#fg-rainbow)" />,
}

// ----------------------------------------------------------------
//  LUNETTES  (devant les yeux : cx 49/71, cy 60)
// ----------------------------------------------------------------
const bridge = <line x1="58" y1="60" x2="62" y2="60" stroke={C.noir} strokeWidth="3" />

const GLASSES = {
  round: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.noir} strokeWidth="3">
      <circle cx="49" cy="60" r="9" /><circle cx="71" cy="60" r="9" />{bridge}
    </g>
  ),
  square: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.noir} strokeWidth="3">
      <rect x="40" y="52" width="18" height="16" rx="4" /><rect x="62" y="52" width="18" height="16" rx="4" />{bridge}
    </g>
  ),
  sun: () => (
    <g fill={C.noir}>
      <rect x="40" y="52" width="18" height="16" rx="7" /><rect x="62" y="52" width="18" height="16" rx="7" />
      <rect x="57" y="58" width="6" height="3" />
    </g>
  ),
  nerd: () => (
    <g>
      <g fill="rgba(255,255,255,0.3)" stroke={C.noir} strokeWidth="4">
        <circle cx="49" cy="60" r="9" /><circle cx="71" cy="60" r="9" />
      </g>
      <rect x="57" y="58" width="6" height="4" fill={C.blanc} stroke={C.noir} strokeWidth="1" />
    </g>
  ),
  eyemask: () => (
    <path d="M34 54 Q60 48 86 54 Q86 70 71 70 Q63 70 60 64 Q57 70 49 70 Q34 70 34 54 Z" fill={C.noir} />
  ),
  sportband: () => (
    <g>
      <path d="M34 56 Q60 50 86 56 L86 64 Q60 60 34 64 Z" fill={C.bleu} />
      <path d="M40 58 Q60 54 80 58" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  ),
  halfmoon: () => (
    <g fill="none" stroke={C.brunF} strokeWidth="3">
      <path d="M40 62 a9 9 0 0 0 18 0" /><path d="M62 62 a9 9 0 0 0 18 0" />
      <line x1="58" y1="62" x2="62" y2="62" />
    </g>
  ),
  star: () => (
    <g>
      <rect x="40" y="52" width="18" height="16" rx="4" fill={C.noir} /><rect x="62" y="52" width="18" height="16" rx="4" fill={C.noir} />{bridge}
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
      <path d="M40 53 h18 v6 q0 9 -9 9 q-9 0 -9 -9 Z" /><path d="M62 53 h18 v6 q0 9 -9 9 q-9 0 -9 -9 Z" />
      <line x1="58" y1="55" x2="62" y2="55" />
    </g>
  ),
  swim: () => (
    <g stroke="#0090c8" strokeWidth="2.5">
      <circle cx="49" cy="60" r="9" fill="rgba(0,191,255,0.45)" /><circle cx="71" cy="60" r="9" fill="rgba(0,191,255,0.45)" />
      <path d="M40 58 Q34 56 30 58 M80 58 Q86 56 90 58" fill="none" /><line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  cateye: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.rose} strokeWidth="3">
      <path d="M39 56 q4 -6 19 -2 q-2 12 -11 12 q-9 0 -8 -10 Z" /><path d="M81 56 q-4 -6 -19 -2 q2 12 11 12 q9 0 8 -10 Z" />
    </g>
  ),
  cyber: () => (
    <g stroke={C.noir} strokeWidth="2.5">
      <rect x="40" y="52" width="18" height="16" rx="4" fill="rgba(239,68,68,0.6)" /><rect x="62" y="52" width="18" height="16" rx="4" fill="rgba(0,191,255,0.6)" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  pixel: () => (
    <g>
      <rect x="40" y="52" width="18" height="16" fill={C.noir} /><rect x="62" y="52" width="18" height="16" fill={C.noir} />
      <rect x="44" y="56" width="10" height="8" fill={C.bleu} /><rect x="66" y="56" width="10" height="8" fill={C.vert} />
      <rect x="58" y="58" width="4" height="3" fill={C.noir} />
    </g>
  ),
  monocle: () => (
    <g>
      <circle cx="71" cy="60" r="10" fill="rgba(255,255,255,0.3)" stroke={C.or} strokeWidth="3" />
      <path d="M71 70 Q74 82 80 86" stroke={C.or} strokeWidth="1.5" fill="none" />
    </g>
  ),
  ski: () => (
    <g>
      <rect x="36" y="50" width="48" height="20" rx="10" fill="rgba(0,191,255,0.5)" stroke={C.noir} strokeWidth="3" />
      <rect x="33" y="57" width="6" height="6" rx="2" fill={C.noir} /><rect x="81" y="57" width="6" height="6" rx="2" fill={C.noir} />
    </g>
  ),
  rainbow: () => (
    <g stroke={C.noir} strokeWidth="2">
      <rect x="40" y="52" width="18" height="16" rx="7" fill="url(#fg-rainbow)" /><rect x="62" y="52" width="18" height="16" rx="7" fill="url(#fg-rainbow)" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  gold: () => (
    <g fill="rgba(255,255,255,0.2)" stroke={C.or} strokeWidth="3.5">
      <circle cx="49" cy="60" r="9" /><circle cx="71" cy="60" r="9" />{bridge}
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
      <rect x="40" y="52" width="18" height="16" rx="3" /><rect x="62" y="52" width="18" height="16" rx="3" />
      <path d="M55 48 l3 4 -3 4 -3 -4 Z" fill={C.bleu} stroke="none" /><line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  stargiant: () => (
    <g>
      <path d="M49 48 l4 8 9 1 -6 6 2 9 -9 -5 -9 5 2 -9 -6 -6 9 -1 Z" fill={C.jaune} stroke={C.orange} strokeWidth="1.5" />
      <path d="M73 48 l4 8 9 1 -6 6 2 9 -9 -5 -9 5 2 -9 -6 -6 9 -1 Z" fill={C.rose} stroke={C.violet} strokeWidth="1.5" />
    </g>
  ),
  laser: () => (
    <g>
      <rect x="36" y="55" width="48" height="9" rx="4" fill={C.noir} />
      <rect x="39" y="57" width="42" height="5" rx="2.5" fill={C.rouge} />
      <circle cx="84" cy="59" r="2.5" fill={C.rose} /><circle cx="36" cy="59" r="2.5" fill={C.rose} />
    </g>
  ),
}

// ----------------------------------------------------------------
//  VISAGES / bouches  (sous les yeux, ~ y 70, centre x 60)
// ----------------------------------------------------------------
const FACE = {
  smile: () => <path d="M52 69 q8 8 16 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />,
  grin: () => (
    <g>
      <path d="M50 68 q10 11 20 0 Z" fill={C.noir} />
      <path d="M53 69 q7 6 14 0 Z" fill="#fff" />
    </g>
  ),
  tongue: () => (
    <g>
      <path d="M51 68 q9 9 18 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M56 72 q4 9 9 1 q-1 -3 -9 -1 Z" fill={C.rose} />
    </g>
  ),
  surprised: () => <ellipse cx="60" cy="71" rx="4.5" ry="6" fill={C.noir} />,
  kiss: () => (
    <g>
      <path d="M56 70 q4 -4 8 0 q-4 5 -8 0 Z" fill={C.rose} />
      <path d="M68 64 q6 -2 9 2" stroke={C.rose} strokeWidth="2" fill="none" />
    </g>
  ),
  tooth: () => (
    <g>
      <path d="M52 69 q8 7 16 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="58" y="69" width="5" height="6" rx="1.5" fill="#fff" stroke={C.noir} strokeWidth="0.8" />
    </g>
  ),
  buckteeth: () => (
    <g>
      <path d="M52 68 q8 4 16 0" stroke={C.noir} strokeWidth="2.5" fill="none" />
      <rect x="55" y="69" width="5" height="8" rx="1.5" fill="#fff" stroke={C.noir} strokeWidth="0.8" />
      <rect x="60" y="69" width="5" height="8" rx="1.5" fill="#fff" stroke={C.noir} strokeWidth="0.8" />
    </g>
  ),
  moustache: () => (
    <g fill={C.brunF}>
      <path d="M48 66 Q60 62 72 66 Q66 72 60 68 Q54 72 48 66 Z" />
      <path d="M53 71 q7 6 14 0" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  moustachecurly: () => (
    <g>
      <path d="M60 67 Q50 64 44 68 Q40 72 46 72 Q44 67 52 68 Q57 69 60 70 Q63 69 68 68 Q76 67 74 72 Q80 72 76 68 Q70 64 60 67 Z" fill={C.noir} />
    </g>
  ),
  clown: () => (
    <g>
      <path d="M49 68 q11 12 22 0 Z" fill={C.rouge} />
      <circle cx="60" cy="62" r="5" fill={C.rouge} />
    </g>
  ),
  ninja: () => (
    <g>
      <rect x="33" y="64" width="54" height="14" fill={C.noir} />
      <rect x="33" y="64" width="54" height="3" fill="#1a1530" />
    </g>
  ),
  vampire: () => (
    <g>
      <path d="M52 68 q8 7 16 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M55 70 l2 5 2 -5 Z" fill="#fff" /><path d="M63 70 l2 5 2 -5 Z" fill="#fff" />
    </g>
  ),
  beard: () => (
    <g>
      <path d="M40 64 Q42 92 60 92 Q78 92 80 64 Q70 76 60 76 Q50 76 40 64 Z" fill="#3a2a1a" />
      <path d="M52 70 q8 6 16 0" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  goldteeth: () => (
    <g>
      <path d="M50 68 q10 11 20 0 Z" fill={C.noir} />
      <rect x="54" y="69" width="4" height="5" fill={C.or} /><rect x="58" y="70" width="4" height="5" fill={C.or} />
      <rect x="62" y="69" width="4" height="5" fill={C.or} />
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
    </g>
  ),
  golf: () => (
    <g>
      <circle cx="98" cy="86" r="6" fill="#fff" stroke="rgba(0,0,0,0.12)" />
      <path d="M104 90 L114 112" stroke={C.grisF} strokeWidth="3" /><path d="M114 112 q5 0 6 4" stroke={C.grisF} strokeWidth="3" fill="none" />
    </g>
  ),
  bowling: () => ball(C.violet, (
    <g fill={C.noir}><circle cx="103" cy="92" r="1.6" /><circle cx="109" cy="92" r="1.6" /><circle cx="106" cy="97" r="1.6" /></g>
  )),
  dumbbell: () => (
    <g fill={C.grisF}>
      <rect x="92" y="93" width="28" height="6" rx="3" />
      <rect x="90" y="87" width="7" height="18" rx="2" fill={C.noir} /><rect x="115" y="87" width="7" height="18" rx="2" fill={C.noir} />
    </g>
  ),
  boxe: () => (
    <g fill={C.rouge}>
      <path d="M98 92 q-8 0 -8 8 q0 8 9 9 l9 0 0 -16 q-4 -1 -10 -1 Z" />
      <rect x="106" y="98" width="6" height="9" rx="2" fill="#c81e1e" />
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
  ski: () => (
    <g>
      <rect x="34" y="118" width="6" height="44" rx="3" fill={C.bleu} transform="rotate(-8 37 140)" />
      <rect x="78" y="118" width="6" height="44" rx="3" fill={C.rose} transform="rotate(8 81 140)" />
      <path d="M30 118 v40 M92 118 v40" stroke={C.grisF} strokeWidth="2" />
    </g>
  ),
  shield: () => (
    <g transform="translate(104 92)">
      <path d="M0 -14 L14 -8 Q14 12 0 18 Q-14 12 -14 -8 Z" fill={C.bleu} stroke={C.violet} strokeWidth="2" />
      <path d="M0 -10 L0 14 M-11 -3 L11 -3" stroke="#fff" strokeWidth="2" />
      <circle cx="0" cy="-3" r="3" fill={C.jaune} />
    </g>
  ),
  surf: () => (
    <g>
      <path d="M104 52 Q120 96 104 150 Q92 96 104 52 Z" fill={C.vert} />
      <line x1="104" y1="60" x2="104" y2="142" stroke="#fff" strokeWidth="2" />
      <path d="M104 52 Q110 80 104 100" stroke={C.rose} strokeWidth="3" fill="none" />
    </g>
  ),
  scooter: () => (
    <g stroke={C.violet} strokeWidth="3" fill="none">
      <path d="M100 96 L100 150 L84 150 M100 150 L116 150" /><path d="M100 96 L112 96" />
      <circle cx="84" cy="154" r="5" fill={C.noir} stroke="none" /><circle cx="116" cy="154" r="5" fill={C.noir} stroke="none" />
    </g>
  ),
  bike: () => (
    <g stroke={C.bleu} strokeWidth="2.5" fill="none">
      <circle cx="86" cy="146" r="11" /><circle cx="112" cy="146" r="11" />
      <path d="M86 146 L99 130 L112 146 M99 130 L104 130 M99 130 L94 122" /><line x1="112" y1="146" x2="106" y2="130" />
    </g>
  ),
  guitar: () => (
    <g transform="rotate(28 104 100)">
      <ellipse cx="104" cy="108" rx="13" ry="16" fill={C.rouge} />
      <circle cx="104" cy="108" r="4" fill={C.noir} />
      <rect x="101" y="68" width="6" height="34" rx="2" fill={C.brunF} />
      <rect x="99" y="62" width="10" height="8" rx="2" fill={C.noir} />
    </g>
  ),
  lightsaber: () => (
    <g transform="rotate(20 104 100)">
      <rect x="100" y="58" width="8" height="52" rx="4" fill={C.vert} opacity="0.9" />
      <rect x="102" y="58" width="4" height="52" fill="#eafff2" />
      <rect x="99" y="108" width="10" height="18" rx="2" fill={C.grisF} />
      <rect x="99" y="113" width="10" height="3" fill={C.noir} />
    </g>
  ),
  trophy: () => (
    <g>
      <path d="M96 86 h20 v6 q0 9 -10 9 q-10 0 -10 -9 Z" fill={C.or} />
      <path d="M96 88 q-7 0 -7 6 q0 5 7 5 M116 88 q7 0 7 6 q0 5 -7 5" stroke={C.or} strokeWidth="2.5" fill="none" />
      <rect x="102" y="101" width="8" height="7" fill={C.orF} /><rect x="98" y="108" width="16" height="4" rx="1" fill={C.orF} />
      <path d="M106 88 l1.4 3 3.2 .3 -2.4 2.3 .6 3.2 -2.8 -1.6 -2.8 1.6 .6 -3.2 -2.4 -2.3 3.2 -.3 Z" fill="#fff7cf" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  ANIMAUX  (compagnons — au sol à gauche, ou sur l'épaule droite)
// ----------------------------------------------------------------
// Les dessins d'animaux sont centrés sur l'origine ; la taille et la position
// finales sont appliquées par ANIMAL_PLACEMENT (cf. renderAnimal).
const ground = (children) => <g>{children}</g>
const shoulder = (children) => <g>{children}</g>

const ANIMAL = {
  cat: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={C.grisF} />
      <circle cx="0" cy="2" r="9" fill={C.grisF} />
      <path d="M-8 -5 l-3 -8 6 4 Z M8 -5 l3 -8 -6 4 Z" fill={C.grisF} />
      <circle cx="-3.5" cy="1" r="1.6" fill={C.noir} /><circle cx="3.5" cy="1" r="1.6" fill={C.noir} />
      <path d="M-9 3 h-6 M9 3 h6" stroke={C.noir} strokeWidth="0.8" />
      <path d="M11 18 q9 -2 7 -12" stroke={C.grisF} strokeWidth="4" fill="none" />
    </g>
  ),
  dog: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={C.brun} />
      <circle cx="0" cy="2" r="9" fill="#a06a3a" />
      <ellipse cx="-9" cy="2" rx="3.5" ry="7" fill={C.brun} /><ellipse cx="9" cy="2" rx="3.5" ry="7" fill={C.brun} />
      <circle cx="-3.5" cy="0" r="1.6" fill={C.noir} /><circle cx="3.5" cy="0" r="1.6" fill={C.noir} />
      <ellipse cx="0" cy="5" rx="2.4" ry="1.8" fill={C.noir} />
    </g>
  ),
  bird: () => ground(
    <g>
      <ellipse cx="0" cy="12" rx="9" ry="10" fill={C.bleu} />
      <circle cx="0" cy="0" r="7" fill={C.bleu} />
      <path d="M7 0 l7 2 -7 2 Z" fill={C.orange} /><circle cx="2" cy="-1" r="1.5" fill={C.noir} />
      <path d="M-2 12 q-9 -2 -9 5 q7 0 9 -1 Z" fill="#0090c8" />
    </g>
  ),
  fish: () => <g>
    <ellipse cx="0" cy="0" rx="13" ry="9" fill={C.orange} />
    <path d="M11 0 l9 -7 0 14 Z" fill={C.orange} />
    <circle cx="-5" cy="-1" r="2" fill={C.noir} /><path d="M-2 -5 q5 -3 9 0" stroke="#d96c1e" strokeWidth="1.4" fill="none" />
  </g>,
  rabbit: () => ground(
    <g fill="#e9e3f0">
      <ellipse cx="0" cy="16" rx="10" ry="10" /><circle cx="0" cy="3" r="8" />
      <ellipse cx="-4" cy="-9" rx="3" ry="9" /><ellipse cx="4" cy="-9" rx="3" ry="9" />
      <circle cx="-3" cy="2" r="1.4" fill={C.noir} /><circle cx="3" cy="2" r="1.4" fill={C.noir} />
      <circle cx="0" cy="6" r="1.6" fill={C.rose} />
    </g>
  ),
  frog: () => ground(
    <g fill={C.vert}>
      <ellipse cx="0" cy="14" rx="13" ry="11" />
      <circle cx="-6" cy="2" r="5" /><circle cx="6" cy="2" r="5" />
      <circle cx="-6" cy="2" r="2.4" fill="#fff" /><circle cx="6" cy="2" r="2.4" fill="#fff" />
      <circle cx="-6" cy="2" r="1.2" fill={C.noir} /><circle cx="6" cy="2" r="1.2" fill={C.noir} />
      <path d="M-7 16 q7 5 14 0" stroke="#1f9d68" strokeWidth="1.8" fill="none" />
    </g>
  ),
  turtle: () => ground(
    <g>
      <path d="M-14 18 q14 -18 28 0 Z" fill={C.vert} />
      <path d="M-14 18 q14 -18 28 0" fill="none" stroke="#1f9d68" strokeWidth="1.8" />
      <circle cx="16" cy="15" r="4.5" fill="#8fd64a" />
      <ellipse cx="-13" cy="19" rx="3.5" ry="2.4" fill="#8fd64a" /><ellipse cx="13" cy="19" rx="3.5" ry="2.4" fill="#8fd64a" />
    </g>
  ),
  hamster: () => ground(
    <g fill="#e0b97a">
      <ellipse cx="0" cy="14" rx="12" ry="11" />
      <circle cx="-8" cy="4" r="3.5" /><circle cx="8" cy="4" r="3.5" />
      <circle cx="-3.5" cy="10" r="1.5" fill={C.noir} /><circle cx="3.5" cy="10" r="1.5" fill={C.noir} />
      <ellipse cx="0" cy="15" rx="7" ry="5" fill="#f0d4a0" /><circle cx="0" cy="12" r="1.2" fill={C.rose} />
    </g>
  ),
  fox: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={C.orange} />
      <circle cx="0" cy="3" r="9" fill={C.orange} />
      <path d="M-8 -4 l-4 -10 7 5 Z M8 -4 l4 -10 -7 5 Z" fill={C.orange} />
      <path d="M0 3 q-6 5 0 9 q6 -4 0 -9 Z" fill="#fff" />
      <circle cx="-3.5" cy="1" r="1.4" fill={C.noir} /><circle cx="3.5" cy="1" r="1.4" fill={C.noir} />
    </g>
  ),
  bee: () => <g>
    <ellipse cx="0" cy="0" rx="11" ry="8" fill={C.jaune} />
    <path d="M-4 -7 v14 M4 -7 v14" stroke={C.noir} strokeWidth="3" />
    <ellipse cx="-5" cy="-8" rx="5" ry="4" fill="#fff" opacity="0.8" /><ellipse cx="5" cy="-8" rx="5" ry="4" fill="#fff" opacity="0.8" />
    <circle cx="11" cy="-1" r="1.4" fill={C.noir} />
  </g>,
  ladybug: () => ground(
    <g>
      <ellipse cx="0" cy="12" rx="12" ry="11" fill={C.rouge} />
      <circle cx="0" cy="1" r="4.5" fill={C.noir} />
      <line x1="0" y1="4" x2="0" y2="22" stroke={C.noir} strokeWidth="1.8" />
      <circle cx="-6" cy="11" r="2" fill={C.noir} /><circle cx="6" cy="11" r="2" fill={C.noir} />
      <circle cx="-5" cy="18" r="2" fill={C.noir} /><circle cx="5" cy="18" r="2" fill={C.noir} />
    </g>
  ),
  butterfly: () => <g>
    <ellipse cx="-5" cy="-4" rx="6" ry="7" fill={C.rose} /><ellipse cx="5" cy="-4" rx="6" ry="7" fill={C.violet} />
    <ellipse cx="-5" cy="6" rx="5" ry="5" fill={C.bleu} /><ellipse cx="5" cy="6" rx="5" ry="5" fill={C.vert} />
    <rect x="-1" y="-8" width="2" height="17" rx="1" fill={C.noir} />
  </g>,
  panda: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill="#fff" /><circle cx="0" cy="2" r="9" fill="#fff" />
      <circle cx="-7" cy="-6" r="3.5" fill={C.noir} /><circle cx="7" cy="-6" r="3.5" fill={C.noir} />
      <ellipse cx="-3.5" cy="2" rx="3" ry="3.5" fill={C.noir} /><ellipse cx="3.5" cy="2" rx="3" ry="3.5" fill={C.noir} />
      <circle cx="0" cy="7" r="1.5" fill={C.noir} />
    </g>
  ),
  penguin: () => ground(
    <g>
      <ellipse cx="0" cy="8" rx="10" ry="15" fill={C.noir} />
      <ellipse cx="0" cy="11" rx="6" ry="10" fill="#fff" />
      <circle cx="-3" cy="0" r="1.5" fill={C.noir} /><circle cx="3" cy="0" r="1.5" fill={C.noir} />
      <path d="M-2 3 l4 0 -2 4 Z" fill={C.orange} />
      <ellipse cx="-5" cy="23" rx="3.5" ry="2" fill={C.orange} /><ellipse cx="5" cy="23" rx="3.5" ry="2" fill={C.orange} />
    </g>
  ),
  owl: () => shoulder(
    <g>
      <ellipse cx="0" cy="8" rx="11" ry="13" fill={C.brun} />
      <path d="M-9 -4 l-2 -7 6 4 Z M9 -4 l2 -7 -6 4 Z" fill={C.brun} />
      <circle cx="-4" cy="2" r="4.5" fill="#fff" /><circle cx="4" cy="2" r="4.5" fill="#fff" />
      <circle cx="-4" cy="2" r="2" fill={C.noir} /><circle cx="4" cy="2" r="2" fill={C.noir} />
      <path d="M-2 5 l2 3 2 -3 Z" fill={C.orange} />
    </g>
  ),
  cow: () => ground(
    <g>
      {/* corps + tête */}
      <ellipse cx="0" cy="16" rx="13" ry="11" fill="#fff" />
      <circle cx="0" cy="2" r="9.5" fill="#fff" />
      {/* cornes */}
      <path d="M-8 -7 q-6 -2 -9 2 q5 0 7 3 Z M8 -7 q6 -2 9 2 q-5 0 -7 3 Z" fill="#d9c08a" />
      {/* oreilles */}
      <ellipse cx="-10" cy="0" rx="3.5" ry="2.5" fill="#fff" /><ellipse cx="10" cy="0" rx="3.5" ry="2.5" fill="#fff" />
      {/* taches noires */}
      <ellipse cx="-8" cy="17" rx="5.5" ry="4.5" fill={C.noir} />
      <ellipse cx="7" cy="13" rx="4.5" ry="4" fill={C.noir} />
      <circle cx="6" cy="-3" r="3.2" fill={C.noir} />
      {/* museau */}
      <ellipse cx="0" cy="7" rx="6.5" ry="5" fill={C.rose} />
      <circle cx="-2.5" cy="7" r="1.1" fill="#c2628a" /><circle cx="2.5" cy="7" r="1.1" fill="#c2628a" />
      {/* yeux */}
      <circle cx="-4" cy="1" r="1.4" fill={C.noir} /><circle cx="4" cy="1" r="1.4" fill={C.noir} />
      {/* pis */}
      <path d="M-3 25 l-1 4 M0 26 l0 4 M3 25 l1 4" stroke={C.rose} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  ghost: () => ground(
    <g>
      <path d="M-11 18 V2 Q-11 -10 0 -10 Q11 -10 11 2 V18 Q7 12 4 18 Q1 12 -2 18 Q-5 12 -8 18 Z" fill="#eef0ff" opacity="0.92" stroke={C.gris} strokeWidth="1" />
      <circle cx="-4" cy="2" r="2" fill={C.noir} /><circle cx="4" cy="2" r="2" fill={C.noir} />
      <ellipse cx="0" cy="8" rx="2.5" ry="3" fill={C.noir} />
    </g>
  ),
  snake: () => (
    <g>
      <path d="M-9 10 q-5 -7 3 -8 q9 -1 4 8 q-3 6 4 6 q9 0 5 -9"
        fill="none" stroke={C.vert} strokeWidth="5" strokeLinecap="round" />
      <circle cx="12" cy="-4" r="4" fill={C.vert} />
      <circle cx="13.5" cy="-5" r="1" fill={C.noir} />
      <path d="M15 -2 l5 1 -5 1.5" stroke={C.rouge} strokeWidth="1.2" fill="none" />
    </g>
  ),
  parrot: () => shoulder(
    <g>
      <ellipse cx="0" cy="8" rx="8" ry="13" fill={C.vert} />
      <circle cx="0" cy="-5" r="7" fill={C.rouge} />
      <path d="M6 -6 q7 1 5 7 q-4 -2 -6 -2 Z" fill={C.jaune} /><circle cx="-1" cy="-6" r="1.5" fill={C.noir} />
      <path d="M-6 8 q-8 5 -7 14 q6 -3 8 -7 Z" fill={C.bleu} />
    </g>
  ),
  shark: () => ground(
    <g>
      <path d="M-14 12 Q-2 0 14 8 Q4 14 14 18 Q0 22 -14 12 Z" fill={C.gris} />
      <path d="M0 0 L4 -10 L9 2 Z" fill={C.grisF} />
      <circle cx="-7" cy="9" r="1.6" fill={C.noir} />
      <path d="M-4 12 l4 0 -2 3 Z" fill="#fff" />
    </g>
  ),
  dino: () => ground(
    <g>
      {/* silhouette T-Rex : queue, corps, grosse tête, pattes */}
      <path d="M-17 10 Q-12 6 -7 8 Q-12 -2 0 -3 Q2 -13 11 -11 Q19 -9 18 -1
               Q18 7 11 8 Q12 15 5 17 L7 24 L1 24 L-1 18
               Q-9 19 -10 11 L-9 24 L-15 24 L-15 12 Z"
        fill={C.vert} stroke="#1f9d68" strokeWidth="1" />
      {/* plaques dorsales */}
      <path d="M-7 -2 l2 -5 2 5 2 -4 2 4 2 -4 2 4" fill="#2f8a5a" />
      {/* dents */}
      <path d="M6 5 l2 0 0 2 -2 0 M9 5 l2 0 0 2 -2 0 M12 5 l2 0 0 2 -2 0" fill="#fff" />
      {/* oeil */}
      <circle cx="12" cy="-3" r="1.7" fill={C.noir} />
    </g>
  ),
  alien: () => ground(
    <g>
      {/* corps fin */}
      <ellipse cx="0" cy="18" rx="6" ry="8" fill="#7ee787" />
      <path d="M-6 18 l-7 5 M6 18 l7 5" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" />
      {/* grand crâne */}
      <ellipse cx="0" cy="2" rx="12" ry="14" fill="#7ee787" />
      <ellipse cx="0" cy="-3" rx="12" ry="9" fill="#8ff196" />
      {/* yeux immenses en amande */}
      <ellipse cx="-5" cy="3" rx="4.2" ry="6.5" fill={C.noir} transform="rotate(-16 -5 3)" />
      <ellipse cx="5" cy="3" rx="4.2" ry="6.5" fill={C.noir} transform="rotate(16 5 3)" />
      <circle cx="-6" cy="0" r="1.3" fill="#fff" /><circle cx="4" cy="0" r="1.3" fill="#fff" />
      {/* petite bouche */}
      <path d="M-2 13 q2 2 4 0" stroke="#3a7a4a" strokeWidth="1.2" fill="none" />
      {/* antennes */}
      <line x1="-5" y1="-13" x2="-8" y2="-21" stroke="#5bbf63" strokeWidth="1.6" />
      <line x1="5" y1="-13" x2="8" y2="-21" stroke="#5bbf63" strokeWidth="1.6" />
      <circle cx="-8" cy="-22" r="2.4" fill={C.vert} /><circle cx="8" cy="-22" r="2.4" fill={C.vert} />
    </g>
  ),
  dragon: () => ground(
    <g>
      {/* aile membranée */}
      <path d="M2 2 Q20 -12 24 4 Q16 1 13 7 Q11 0 2 2 Z" fill="#5a1fd4" />
      <path d="M24 4 L18 3 M24 4 L15 7" stroke="#3b1499" strokeWidth="1" />
      {/* queue */}
      <path d="M-9 14 Q-18 16 -18 8 Q-14 12 -10 10 Z" fill={C.vert} />
      {/* corps + tête */}
      <ellipse cx="0" cy="12" rx="11" ry="10" fill={C.vert} />
      <circle cx="-3" cy="0" r="8.5" fill={C.vert} />
      <ellipse cx="0" cy="14" rx="6" ry="6" fill="#bff0c8" />
      {/* écailles dorsales */}
      <path d="M-9 3 l2 -4 2 4 2 -4 2 4 2 -4 2 4" fill="#2f8a5a" />
      {/* cornes */}
      <path d="M-7 -7 l-1 -6 4 4 Z M-1 -8 l1 -6 3 5 Z" fill="#2f8a5a" />
      {/* yeux + naseaux */}
      <circle cx="-6" cy="-1" r="1.6" fill={C.jaune} /><circle cx="0" cy="-2" r="1.6" fill={C.jaune} />
      <circle cx="-9" cy="2" r="0.9" fill={C.noir} />
      {/* feu */}
      <path d="M-11 2 Q-20 0 -25 3 Q-20 4 -22 6 Q-16 5 -18 8 Q-12 6 -11 2 Z" fill={C.orange} />
      <path d="M-13 3 Q-19 2 -22 4 Q-17 4 -16 5 Z" fill={C.jaune} />
    </g>
  ),
  unicorn: () => ground(
    <g>
      {/* crinière colorée (derrière) */}
      <path d="M-4 -8 q-12 3 -11 18 q5 -6 10 -10 q-4 8 -2 14 q4 -7 5 -16 Z" fill={C.rose} />
      <path d="M-2 -7 q-8 5 -6 16 q4 -5 7 -12 Z" fill={C.violet} />
      {/* corps + tête */}
      <ellipse cx="0" cy="16" rx="11" ry="10" fill="#fff" />
      <circle cx="0" cy="3" r="9.5" fill="#fff" />
      <path d="M-8 -4 l-2 -7 5 4 Z" fill="#fff" />
      {/* corne arc-en-ciel segmentée */}
      <path d="M4 -6 l3 -14 4 4 Z" fill="#ffd23f" />
      <path d="M5.2 -9 l3.5 0" stroke={C.orange} strokeWidth="1.6" />
      <path d="M5.9 -12 l3 0" stroke={C.rose} strokeWidth="1.6" />
      <path d="M6.6 -15 l2.4 0" stroke={C.bleu} strokeWidth="1.6" />
      {/* queue colorée */}
      <path d="M10 14 q10 0 10 13 q-5 -4 -11 -6 Z" fill={C.bleu} />
      <path d="M10 16 q7 2 8 11 q-4 -4 -9 -7 Z" fill={C.vert} />
      {/* visage */}
      <circle cx="-2" cy="3" r="1.5" fill={C.noir} /><circle cx="4" cy="3" r="1.5" fill={C.noir} />
      <ellipse cx="1" cy="9" rx="4" ry="3" fill="#ffe3ef" />
      <circle cx="0" cy="9" r="1" fill={C.rose} />
    </g>
  ),
}

// Position + échelle finales de chaque animal sur le bonhomme.
//  - petits (épaule) ~ scale 0.95 ; moyens (à gauche) ~ 1.5 ;
//  - grands (à droite, presque aussi grands que lui) ~ 2.2 ; volants près de la tête.
const ANIMAL_MED = 'translate(24 112) scale(1.5)'
const ANIMAL_PLACEMENT = {
  // petits — sur l'épaule droite
  owl: 'translate(90 40) scale(0.95)',
  parrot: 'translate(90 40) scale(0.95)',
  hamster: 'translate(92 42) scale(0.95)',
  snake: 'translate(88 38) scale(1)',
  // volants — près de la tête à droite
  bee: 'translate(94 22) scale(0.9)',
  butterfly: 'translate(94 22) scale(0.9)',
  ladybug: 'translate(94 24) scale(0.85)',
  fish: 'translate(22 92) scale(1.2)',
  // grands — à droite, bien visibles
  dragon: 'translate(84 78) scale(2.2)',
  dino: 'translate(84 78) scale(2.2)',
  unicorn: 'translate(84 78) scale(2.2)',
  cow: 'translate(84 78) scale(2.2)',
  alien: 'translate(84 78) scale(2.2)',
  shark: 'translate(84 84) scale(2.2)',
}

// ---- Sélecteurs exportés ----
export function renderHat(id) { return HATS[id]?.() ?? null }
export function renderGlasses(id) { return GLASSES[id]?.() ?? null }
export function renderHair(id) { return HAIR[id]?.() ?? null }
export function renderSport(id) { return SPORT[id]?.() ?? null }
export function renderFace(id) { return FACE[id]?.() ?? null }
export function renderAnimal(id) {
  const draw = ANIMAL[id]?.()
  if (!draw) return null
  return <g transform={ANIMAL_PLACEMENT[id] ?? ANIMAL_MED}>{draw}</g>
}

// ----------------------------------------------------------------
//  CHAPEAUX  (posés sur le crâne, centrés x=60 ; couvrent le haut des cheveux)
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
      <circle cx="44" cy="22" r="2" fill={C.blanc} /><circle cx="60" cy="19" r="2" fill={C.blanc} /><circle cx="76" cy="22" r="2" fill={C.blanc} />
    </g>
  ),
  party: () => (
    <g>
      <path d="M60 -18 L44 24 L76 24 Z" fill={C.rose} />
      <path d="M52 4 L68 4 M48 14 L72 14" stroke={C.jaune} strokeWidth="3" />
      <circle cx="60" cy="-18" r="4" fill={C.bleu} />
    </g>
  ),
  grad: () => (
    <g>
      <rect x="48" y="14" width="24" height="14" rx="3" fill={C.noir} />
      <path d="M34 14 L60 6 L86 14 L60 22 Z" fill={C.noir} />
      <circle cx="60" cy="14" r="2" fill={C.or} />
      <path d="M60 14 L84 14 L84 28" stroke={C.or} strokeWidth="2" fill="none" /><circle cx="84" cy="30" r="3" fill={C.or} />
    </g>
  ),
  straw: () => (
    <g>
      <ellipse cx="60" cy="24" rx="42" ry="9" fill={C.jaune} />
      <path d="M38 24 Q60 -2 82 24 Z" fill="#f0b41e" /><rect x="40" y="18" width="40" height="6" rx="3" fill={C.orange} />
    </g>
  ),
  chef: () => (
    <g>
      <rect x="40" y="16" width="40" height="12" rx="3" fill={C.blanc} />
      <circle cx="46" cy="10" r="11" fill={C.blanc} /><circle cx="60" cy="6" r="13" fill={C.blanc} /><circle cx="74" cy="10" r="11" fill={C.blanc} />
    </g>
  ),
  helmet: () => (
    <g>
      <path d="M26 26 Q60 -6 94 26 Q60 16 26 26 Z" fill={C.bleu} />
      <path d="M50 4 L54 24 M62 1 L62 23 M74 5 L70 24" stroke="#0090c8" strokeWidth="3" />
      <path d="M26 26 q-4 4 0 8" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  police: () => (
    <g>
      <path d="M34 18 Q60 6 86 18 L86 22 L34 22 Z" fill="#1f3a8a" />
      <path d="M34 22 q26 6 52 0 l0 4 q-26 5 -52 0 Z" fill="#16285e" />
      <rect x="52" y="9" width="16" height="9" rx="2" fill={C.or} />
    </g>
  ),
  santa: () => (
    <g>
      <path d="M30 24 Q52 -14 86 -8 Q70 6 78 24 Z" fill={C.rouge} />
      <rect x="28" y="20" width="56" height="9" rx="4.5" fill={C.blanc} /><circle cx="86" cy="-8" r="6" fill={C.blanc} />
    </g>
  ),
  flower: () => (
    <g>
      <path d="M26 22 Q60 10 94 22" stroke={C.vert} strokeWidth="4" fill="none" />
      {[30, 45, 60, 75, 90].map((x, i) => (
        <g key={i} transform={`translate(${x} ${18 - (i === 2 ? 4 : 0)})`}>
          {[[0, -3], [-3, 1], [3, 1]].map(([dx, dy], j) => (
            <circle key={j} cx={dx} cy={dy} r="2.4" fill={[C.rose, C.jaune, C.bleu, C.rose, C.violet][i]} />
          ))}
          <circle cx="0" cy="0" r="1.6" fill={C.or} />
        </g>
      ))}
    </g>
  ),
  cowboy: () => (
    <g>
      <path d="M10 26 Q60 42 110 26 Q86 16 60 16 Q34 16 10 26 Z" fill={C.brun} />
      <path d="M36 24 Q60 -8 84 24 Q60 16 36 24 Z" fill={C.brunF} />
      <rect x="36" y="18" width="48" height="6" rx="3" fill={C.noir} />
      <circle cx="60" cy="21" r="2.5" fill={C.or} />
    </g>
  ),
  sombrero: () => (
    <g>
      <ellipse cx="60" cy="26" rx="52" ry="12" fill={C.orange} />
      <ellipse cx="60" cy="26" rx="52" ry="12" fill="none" stroke={C.rouge} strokeWidth="2" />
      <path d="M38 26 Q60 -12 82 26 Z" fill="#e07a2a" /><rect x="40" y="20" width="40" height="6" rx="3" fill={C.rouge} />
    </g>
  ),
  cactus: () => (
    <g>
      <rect x="52" y="-12" width="16" height="36" rx="8" fill={C.vert} />
      <path d="M52 4 q-12 0 -12 -10 q0 -6 5 -6 q5 0 5 6 l0 4 q0 2 2 2 Z" fill={C.vert} />
      <path d="M68 8 q12 0 12 -10 q0 -6 -5 -6 q-5 0 -5 6 l0 4 q0 2 -2 2 Z" fill={C.vert} />
      <circle cx="60" cy="-6" r="3" fill={C.rose} />
      <path d="M56 2 v6 M60 -2 v8 M64 4 v6" stroke="#2fae74" strokeWidth="1.2" />
    </g>
  ),
  pizza: () => (
    <g>
      <path d="M60 -16 L34 24 L86 24 Z" fill={C.jaune} stroke="#e6a52a" strokeWidth="2" />
      <path d="M34 24 L86 24 L82 18 Q60 22 38 18 Z" fill="#d6722a" />
      <circle cx="56" cy="6" r="3.5" fill={C.rouge} /><circle cx="66" cy="14" r="3.5" fill={C.rouge} /><circle cx="52" cy="16" r="3" fill={C.rouge} />
      <circle cx="62" cy="-2" r="2.5" fill="#3aa55a" />
    </g>
  ),
  witch: () => (
    <g>
      <ellipse cx="60" cy="24" rx="40" ry="8" fill={C.violet} />
      <path d="M44 24 Q56 -18 84 -6 Q70 8 76 24 Z" fill="#5a1fd4" />
      <rect x="46" y="18" width="28" height="7" rx="2" fill={C.noir} /><rect x="56" y="18" width="9" height="7" fill={C.or} />
    </g>
  ),
  pirate: () => (
    <g>
      <path d="M22 24 Q60 30 98 24 Q88 10 60 10 Q32 10 22 24 Z" fill={C.noir} />
      <path d="M30 18 Q60 26 90 18 Q60 22 30 18 Z" fill={C.noir} />
      <circle cx="60" cy="15" r="5" fill={C.blanc} /><circle cx="58" cy="14" r="1" fill={C.noir} /><circle cx="62" cy="14" r="1" fill={C.noir} />
    </g>
  ),
  viking: () => (
    <g>
      <path d="M30 24 Q60 0 90 24 Z" fill={C.gris} />
      <rect x="30" y="20" width="60" height="6" rx="3" fill={C.grisF} />
      <path d="M30 22 Q14 14 16 0 Q26 10 34 18 Z" fill="#f3ead0" /><path d="M90 22 Q106 14 104 0 Q94 10 86 18 Z" fill="#f3ead0" />
    </g>
  ),
  tophat: () => (
    <g>
      <ellipse cx="60" cy="24" rx="40" ry="8" fill={C.noir} />
      <rect x="40" y="-8" width="40" height="32" rx="3" fill={C.noir} /><rect x="40" y="14" width="40" height="6" fill={C.rouge} />
    </g>
  ),
  astronaut: () => (
    <g>
      <path d="M30 22 Q30 -14 60 -14 Q90 -14 90 22 Q60 30 30 22 Z" fill="#eef2f8" stroke={C.gris} strokeWidth="2" />
      <rect x="40" y="2" width="40" height="20" rx="9" fill="#1a2438" />
      <ellipse cx="52" cy="9" rx="7" ry="5" fill="#5aa0ff" opacity="0.8" />
      <rect x="26" y="14" width="6" height="10" rx="2" fill={C.gris} /><rect x="88" y="14" width="6" height="10" rx="2" fill={C.gris} />
    </g>
  ),
  crown: () => (
    <g>
      <path d="M28 26 L30 -2 L44 16 L60 -8 L76 16 L90 -2 L92 26 Z" fill={C.or} stroke={C.orF} strokeWidth="1.5" />
      <rect x="28" y="22" width="64" height="8" rx="2" fill={C.orF} />
      <circle cx="60" cy="12" r="4" fill={C.rose} /><circle cx="38" cy="18" r="3" fill={C.bleu} /><circle cx="82" cy="18" r="3" fill={C.bleu} />
      <circle cx="60" cy="-8" r="3" fill={C.rouge} />
    </g>
  ),
  halo: () => (
    <g>
      <ellipse cx="60" cy="0" rx="28" ry="9" fill="none" stroke={C.or} strokeWidth="5" />
      <ellipse cx="60" cy="0" rx="28" ry="9" fill="none" stroke="#fff3b0" strokeWidth="1.5" />
    </g>
  ),
}
