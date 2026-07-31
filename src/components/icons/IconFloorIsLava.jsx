import MiniGuy from './MiniGuy'

// 🌋 Floor is Lava — bonhomme vert qui saute au-dessus d'une flaque de lave
// bouillonnante, bras levés en l'air.
export default function IconFloorIsLava({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flava-lava" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" /><stop offset="0.45" stopColor="#ff8c42" /><stop offset="1" stopColor="#c81e1e" />
        </linearGradient>
        <radialGradient id="flava-glow" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffe28a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffe28a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lueur de chaleur */}
      <ellipse cx="32" cy="46" rx="26" ry="16" fill="url(#flava-glow)" />

      {/* Flaque de lave */}
      <path
        d="M6 52 Q4 38 18 40 Q24 30 34 38 Q46 32 52 44 Q60 46 58 55 Q58 60 50 60 L14 60 Q6 60 6 52 Z"
        fill="url(#flava-lava)" stroke="#2b2350" strokeWidth="2.4" strokeLinejoin="round"
      />
      {/* Bulles de lave */}
      <circle cx="20" cy="47" r="3.4" fill="#ffd23f" opacity="0.85" />
      <circle cx="34" cy="51" r="2.4" fill="#ffd23f" opacity="0.75" />
      <circle cx="45" cy="46" r="3" fill="#ffd23f" opacity="0.8" />
      <circle cx="27" cy="43" r="1.8" fill="#fff" opacity="0.6" />

      {/* Bonhomme vert, en l'air, jambes repliées, bras levés */}
      <MiniGuy x="32" y="24" scale="0.92" color="#3dd68c" shade="#1f9d63" armL="up" armR="up" legs="jump" eyes="happy" />

      {/* Traits de saut */}
      <path d="M22 12 q-2 -4 0 -7" stroke="#3dd68c" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M42 12 q2 -4 0 -7" stroke="#3dd68c" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  )
}
