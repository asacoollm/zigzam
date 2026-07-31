import MiniGuy from './MiniGuy'

// 🎨 Avatar — bonhomme orange qui se regarde dans un miroir brillant, entouré
// d'un chapeau, de lunettes et d'une étoile qui flottent.
export default function IconAvatar({ className = '' }) {
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
        <linearGradient id="ava-mirror" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#cfe0ff" />
          <stop offset="1" stopColor="#8fb3e6" />
        </linearGradient>
        <linearGradient id="ava-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe28a" />
          <stop offset="1" stopColor="#c98a17" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#2b2350" opacity="0.16" />

      {/* Chapeau flottant */}
      <g transform="translate(20 8) rotate(-12)">
        <path d="M-8 4 Q0 -6 8 4 Z" fill="#ff4d8d" stroke="#2b2350" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="-9" y="3" width="18" height="3.2" rx="1.6" fill="#d6276b" stroke="#2b2350" strokeWidth="1.4" />
      </g>

      {/* Étoile flottante */}
      <path
        transform="translate(34 6) scale(0.75)"
        d="M0 -7 L2 -2 7 -1.6 3 1.8 4.3 6.8 0 4 -4.3 6.8 -3 1.8 -7 -1.6 -2 -2 Z"
        fill="#ffd23f" stroke="#2b2350" strokeWidth="1.4" strokeLinejoin="round"
      />

      {/* Lunettes flottantes */}
      <g transform="translate(46 14)">
        <circle cx="-6" cy="0" r="5.2" fill="#fff" opacity="0.85" stroke="#2b2350" strokeWidth="1.6" />
        <circle cx="6" cy="0" r="5.2" fill="#fff" opacity="0.85" stroke="#2b2350" strokeWidth="1.6" />
        <line x1="-0.8" y1="0" x2="0.8" y2="0" stroke="#2b2350" strokeWidth="1.8" />
      </g>

      {/* Miroir ovale */}
      <g transform="translate(44 42)">
        <ellipse cx="0" cy="0" rx="12.5" ry="16" fill="url(#ava-frame)" stroke="#2b2350" strokeWidth="2.2" />
        <ellipse cx="0" cy="0" rx="9.5" ry="13" fill="url(#ava-mirror)" />
        <path d="M-6 -9 Q-3 -11 0 -9" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
        <circle cx="0" cy="-16.6" r="2" fill="url(#ava-frame)" stroke="#2b2350" strokeWidth="1.4" />
      </g>

      {/* Bonhomme orange qui se regarde */}
      <MiniGuy x="18" y="46" scale="0.9" color="#ff8c42" shade="#d9640f" armR="out" eyes="happy" />
    </svg>
  )
}
