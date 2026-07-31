// 🍩💎 Donuts & Gemmes — pile de 3 donuts glacés à gauche, 3 gemmes brillantes à droite.
const OUTLINE = '#2b2350'

// Chaque sprinkle est un décalage LOCAL [dx, dy, couleur, angle] par rapport au centre du donut.
function Donut({ x, y, r, glaze, sprinkles }) {
  const hole = r * 0.36
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        fillRule="evenodd"
        d={`M0 ${-r} A ${r} ${r} 0 1 0 0.01 ${-r} Z M0 ${-hole} A ${hole} ${hole} 0 1 0 0.01 ${-hole} Z`}
        fill={`url(#${glaze})`}
        stroke={OUTLINE}
        strokeWidth="2"
      />
      <ellipse cx={-r * 0.3} cy={-r * 0.4} rx={r * 0.4} ry={r * 0.22} fill="#fff" opacity="0.35" />
      {sprinkles.map(([dx, dy, color, angle], i) => (
        <rect
          key={i}
          x={dx - 1.6} y={dy - 0.7} width="3.2" height="1.4" rx="0.7"
          fill={color}
          transform={`rotate(${angle} ${dx} ${dy})`}
        />
      ))}
    </g>
  )
}

function Gem({ x, y, s, top, bottom }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 -2 L0 -11 L9 -2 L0 2 Z" fill={top} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-9 -2 L0 10 L9 -2 L0 2 Z" fill={bottom} stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-5 -3 L-1 -8 L2 -5 Z" fill="#fff" opacity="0.55" />
    </g>
  )
}

export default function IconDonutsGemmes({ className = '' }) {
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
        <linearGradient id="dg-glaze-rose" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb3d6" /><stop offset="1" stopColor="#ff4d8d" />
        </linearGradient>
        <linearGradient id="dg-glaze-orange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcb9e" /><stop offset="1" stopColor="#ff8c42" />
        </linearGradient>
        <linearGradient id="dg-glaze-violet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6c2ff" /><stop offset="1" stopColor="#7c3aff" />
        </linearGradient>
        <linearGradient id="dg-gem-blue-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7f3ff" /><stop offset="1" stopColor="#00bfff" />
        </linearGradient>
        <linearGradient id="dg-gem-blue-bot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00bfff" /><stop offset="1" stopColor="#009fe0" />
        </linearGradient>
        <linearGradient id="dg-gem-violet-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6d9ff" /><stop offset="1" stopColor="#a373ff" />
        </linearGradient>
        <linearGradient id="dg-gem-violet-bot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c3aff" /><stop offset="1" stopColor="#5a1fd4" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="59" rx="26" ry="3" fill="#2b2350" opacity="0.14" />

      {/* Pile de donuts (gauche), du fond vers le premier plan */}
      <Donut
        x="18" y="18" r="8" glaze="dg-glaze-violet"
        sprinkles={[[-3, -3, '#ffd23f', 20], [3, -2, '#3dd68c', -30], [0, 4, '#fff', 60]]}
      />
      <Donut
        x="15" y="33" r="9.5" glaze="dg-glaze-orange"
        sprinkles={[[-4, -3, '#7c3aff', 15], [4, -4, '#00bfff', -25], [4, 4, '#fff', 50], [-4, 5, '#ff4d8d', 10]]}
      />
      <Donut
        x="19" y="50" r="11" glaze="dg-glaze-rose"
        sprinkles={[[-5, -4, '#ffd23f', 10], [5, -3, '#3dd68c', -20], [4, 5, '#00bfff', 40], [-5, 5, '#fff', -10]]}
      />

      {/* Gemmes brillantes (droite) */}
      <Gem x="52" y="18" s="0.72" top="url(#dg-gem-violet-top)" bottom="url(#dg-gem-violet-bot)" />
      <Gem x="53" y="50" s="0.78" top="url(#dg-gem-blue-top)" bottom="url(#dg-gem-blue-bot)" />
      <Gem x="45" y="36" s="1.1" top="url(#dg-gem-blue-top)" bottom="url(#dg-gem-blue-bot)" />
    </svg>
  )
}
