import MiniGuy from './MiniGuy'

// 🛡️ Admin — bonhomme doré, couronne dorée, badge étoile sur le ventre,
// rayons de lumière dorés tout autour.
const OUTLINE = '#2b2350'

function Ray({ angle, len, color }) {
  return (
    <path
      d={`M0 0 L-3 ${-len} L3 ${-len} Z`}
      fill={color}
      opacity="0.55"
      transform={`rotate(${angle}) translate(0 -14)`}
    />
  )
}

export default function IconAdmin({ className = '' }) {
  const rays = Array.from({ length: 10 }, (_, i) => i * 36)

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
        <linearGradient id="adm-gold" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff3b0" /><stop offset="0.5" stopColor="#ffcf3f" /><stop offset="1" stopColor="#c98a17" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="58" rx="20" ry="3" fill="#2b2350" opacity="0.16" />

      {/* Rayons dorés */}
      <g transform="translate(32 34)">
        {rays.map((a, i) => (
          <Ray key={i} angle={a} len={i % 2 === 0 ? 22 : 16} color="#ffd23f" />
        ))}
      </g>

      {/* Bonhomme doré */}
      <MiniGuy x="32" y="38" scale="0.95" color="url(#adm-gold)" shade="#c98a17" armL="down" armR="down" eyes="happy" />

      {/* Couronne */}
      <g transform="translate(32 15)">
        <path d="M-11 6 L-13 -6 -5 1 0 -9 5 1 13 -6 11 6 Z" fill="url(#adm-gold)" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="-13" cy="-6" r="1.8" fill="#ff4d8d" />
        <circle cx="0" cy="-9" r="2" fill="#00bfff" />
        <circle cx="13" cy="-6" r="1.8" fill="#3dd68c" />
      </g>

      {/* Badge étoile sur le ventre */}
      <circle cx="32" cy="51" r="6.5" fill="#ffd23f" stroke="#fff" strokeWidth="2" />
      <path
        d="M32 46.5 L33.2 49.6 36.5 49.9 34 52.1 34.8 55.4 32 53.6 29.2 55.4 30 52.1 27.5 49.9 30.8 49.6 Z"
        fill="#fff"
      />
    </svg>
  )
}
