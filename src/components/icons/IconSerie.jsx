// 🎬 Série Zigzam — clap de cinéma noir et blanc ouvert, avec un petit
// bonhomme rose assis dessus comme sur une scène, étoiles autour.
const OUTLINE = '#2b2350'

function Star({ x, y, s, color }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -5 L1.4 -1.4 5 -1.1 2.1 1.2 3.1 4.8 0 2.8 -3.1 4.8 -2.1 1.2 -5 -1.1 -1.4 -1.4 Z"
      fill={color} stroke={OUTLINE} strokeWidth="1"
    />
  )
}

export default function IconSerie({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="58" rx="22" ry="3" fill="#2b2350" opacity="0.16" />

      <Star x="10" y="16" s="0.9" color="#ffd23f" />
      <Star x="54" y="14" s="0.7" color="#00bfff" />
      <Star x="55" y="34" s="0.55" color="#ff4d8d" />

      {/* Planche du bas */}
      <rect x="8" y="34" width="48" height="20" rx="3" fill="#2b2350" stroke={OUTLINE} strokeWidth="2" />
      <rect x="11" y="37" width="16" height="6" fill="#fff" opacity="0.9" />
      <rect x="30" y="37" width="16" height="6" fill="#fff" opacity="0.9" />

      {/* Clap du haut, ouvert (pivoté) */}
      <g transform="translate(8 30) rotate(-16)">
        <rect x="0" y="-8" width="48" height="10" rx="2.5" fill="#2b2350" stroke={OUTLINE} strokeWidth="2" />
        <rect x="2" y="-6.5" width="6" height="7" fill="#fff" transform="skewX(-20)" />
        <rect x="12" y="-6.5" width="6" height="7" fill="#fff" transform="skewX(-20)" />
        <rect x="22" y="-6.5" width="6" height="7" fill="#fff" transform="skewX(-20)" />
        <rect x="32" y="-6.5" width="6" height="7" fill="#fff" transform="skewX(-20)" />
        <rect x="42" y="-6.5" width="6" height="7" fill="#fff" transform="skewX(-20)" />
      </g>
      <circle cx="8" cy="30" r="2.6" fill="#ffd23f" stroke={OUTLINE} strokeWidth="1.4" />

      {/* Bonhomme rose assis sur la planche, jambes pendantes */}
      <g transform="translate(32 40)">
        <rect x="-4.5" y="10" width="4" height="9" rx="2" fill="#d6276b" />
        <rect x="1.5" y="10" width="4" height="9" rx="2" fill="#d6276b" />
        <ellipse cx="0" cy="4" rx="12.5" ry="11" fill="#ff4d8d" stroke={OUTLINE} strokeWidth="2.2" />
        <ellipse cx="-4" cy="-1.5" rx="5.5" ry="4" fill="#fff" opacity="0.3" />
        <ellipse cx="0" cy="5" rx="8" ry="6" fill="#fff" opacity="0.96" />
        <circle cx="-3" cy="4.5" r="1.7" fill={OUTLINE} />
        <circle cx="3" cy="4.5" r="1.7" fill={OUTLINE} />
        <circle cx="-6.5" cy="7.5" r="1.7" fill="#ff6f9e" opacity="0.75" />
        <circle cx="6.5" cy="7.5" r="1.7" fill="#ff6f9e" opacity="0.75" />
        <path d="M-2.5 9 q2.5 2 5 0" stroke={OUTLINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <ellipse cx="-11" cy="0" rx="3.6" ry="7" fill="#ff4d8d" stroke={OUTLINE} strokeWidth="1.8" />
        <ellipse cx="11" cy="0" rx="3.6" ry="7" fill="#ff4d8d" stroke={OUTLINE} strokeWidth="1.8" />
      </g>
    </svg>
  )
}
