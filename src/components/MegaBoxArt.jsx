import './MegaBoxArt.css'

// ============================================================
//  MegaBoxArt — boîte cadeau façon "gacha box" (inspirée de Brawl Stars,
//  redessinée aux couleurs et à la patte Zigzam) : boîte trapue au
//  couvercle bombé, poignée, coins ornés selon la rareté, tête de
//  bonhomme Fall Guys sur la façade. 100% SVG, thème par niveau.
// ============================================================

const THEMES = {
  normal: {
    bodyTop: '#7cf0b5', bodyBottom: '#279a63',
    lidTop: '#8ff9c4', lidBottom: '#2fb876',
    corner: '#c7ccd6', cornerClass: '',
  },
  rare: {
    bodyTop: '#6fa8ff', bodyBottom: '#1d4aa0',
    lidTop: '#a98cff', lidBottom: '#5a1fd4',
    corner: '#f5c542', cornerClass: '',
  },
  super_rare: {
    bodyTop: '#c88bff', bodyBottom: '#6d21c9',
    lidTop: '#ffb0d6', lidBottom: '#d6408f',
    corner: '#e8ecff', cornerClass: 'mgart__corner--shine',
  },
  incroyable: {
    bodyTop: '#ffb066', bodyBottom: '#d9591f',
    lidTop: '#ff8f9f', lidBottom: '#c41f42',
    corner: '#f5c542', cornerClass: 'mgart__corner--glow',
  },
  impossible: {
    bodyTop: '#ff5d78', bodyBottom: '#7a0f28',
    lidTop: '#3a1a4a', lidBottom: '#120912',
    corner: 'url(#mgart-rainbow)', cornerClass: 'mgart__corner--rainbow',
  },
}

const OUTLINE = '#2b2350'

// Petit coin décoratif en losange arrondi, positionné à un coin de la boîte.
function Corner({ cx, cy, fill, cls }) {
  return (
    <rect
      className={`mgart__corner ${cls}`}
      x={-13} y={-13} width={26} height={26} rx={7}
      fill={fill}
      stroke={OUTLINE}
      strokeWidth={2.5}
      transform={`translate(${cx} ${cy}) rotate(45)`}
    />
  )
}

export default function MegaBoxArt({ niveau, className = '' }) {
  const t = THEMES[niveau] || THEMES.normal
  const uid = niveau || 'normal'

  return (
    <svg
      className={`mgart ${className}`}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`mgart-body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.bodyTop} />
          <stop offset="1" stopColor={t.bodyBottom} />
        </linearGradient>
        <linearGradient id={`mgart-lid-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.lidTop} />
          <stop offset="1" stopColor={t.lidBottom} />
        </linearGradient>
        <linearGradient id="mgart-rainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d8d" />
          <stop offset="0.25" stopColor="#ffd23f" />
          <stop offset="0.5" stopColor="#3dd68c" />
          <stop offset="0.75" stopColor="#00bfff" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="110" cy="204" rx="72" ry="12" fill="#000" opacity="0.2" />

      {/* Corps trapu */}
      <rect
        x="36" y="86" width="148" height="104" rx="26"
        fill={`url(#mgart-body-${uid})`}
        stroke={OUTLINE} strokeWidth="4"
      />
      <ellipse cx="80" cy="108" rx="38" ry="16" fill="#fff" opacity="0.16" />

      {/* Tête de bonhomme Fall Guys sur la façade */}
      <ellipse cx="110" cy="150" rx="34" ry="29" fill="#fff" opacity="0.95" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="97" cy="145" r="6" fill={OUTLINE} />
      <circle cx="123" cy="145" r="6" fill={OUTLINE} />
      <circle cx="99.2" cy="142.6" r="2" fill="#fff" />
      <circle cx="125.2" cy="142.6" r="2" fill="#fff" />
      <circle cx="86" cy="152" r="5" fill="#ff8fb0" opacity="0.75" />
      <circle cx="134" cy="152" r="5" fill="#ff8fb0" opacity="0.75" />
      <path d="M97 160 Q110 170 123 160" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Couvercle bombé */}
      <path
        d="M30 86 Q30 28 110 28 Q190 28 190 86 Z"
        fill={`url(#mgart-lid-${uid})`}
        stroke={OUTLINE} strokeWidth="4"
        strokeLinejoin="round"
      />
      <ellipse cx="78" cy="52" rx="30" ry="14" fill="#fff" opacity="0.22" />

      {/* Poignée */}
      <path d="M82 40 Q110 2 138 40" stroke={OUTLINE} strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="82" cy="40" r="5.5" fill={OUTLINE} />
      <circle cx="138" cy="40" r="5.5" fill={OUTLINE} />

      {/* Coins ornés selon la rareté */}
      <Corner cx={36} cy={86} fill={t.corner} cls={t.cornerClass} />
      <Corner cx={184} cy={86} fill={t.corner} cls={t.cornerClass} />
      <Corner cx={36} cy={190} fill={t.corner} cls={t.cornerClass} />
      <Corner cx={184} cy={190} fill={t.corner} cls={t.cornerClass} />
    </svg>
  )
}
