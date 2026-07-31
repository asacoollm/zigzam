import MiniGuy from './MiniGuy'

// 🛍️ Shop — bonhomme jaune qui porte deux sacs de shopping colorés,
// avec des étoiles qui sortent des sacs.
const OUTLINE = '#2b2350'

function Bag({ x, top, bottom, star }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-7 -2 Q-7 -9 0 -9 Q7 -9 7 -2" fill="none" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
      <path d="M-9 -3 L9 -3 L7.5 16 Q7 18 5 18 L-5 18 Q-7 18 -7.5 16 Z" fill={top} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M-9 -3 L9 -3 L8.4 3 L-8.4 3 Z" fill={bottom} />
      <path
        transform={`translate(0 ${star.y}) scale(0.85)`}
        d="M0 -5 L1.4 -1.4 5 -1.1 2.1 1.2 3.1 4.8 0 2.8 -3.1 4.8 -2.1 1.2 -5 -1.1 -1.4 -1.4 Z"
        fill={star.color} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round"
      />
    </g>
  )
}

export default function IconShop({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#2b2350" opacity="0.16" />

      {/* Bonhomme jaune, bras portant les sacs */}
      <MiniGuy x="32" y="48" scale="0.9" color="#ffd23f" shade="#c98a17" armL="none" armR="none" eyes="happy" />

      {/* Étoiles qui jaillissent, derrière les sacs */}
      <g transform="translate(15 20)">
        <Bag x="0" top="#ff4d8d" bottom="#d6276b" star={{ y: -14, color: '#ffd23f' }} />
      </g>
      <g transform="translate(45 22)">
        <Bag x="0" top="#00bfff" bottom="#009fe0" star={{ y: -14, color: '#3dd68c' }} />
      </g>
    </svg>
  )
}
