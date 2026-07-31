// ⚙️ Paramètres — grand engrenage violet + petit engrenage orange encastré,
// effet métallique avec reflets. Pas de personnage.
const OUTLINE = '#2b2350'

function gearPath(cx, cy, rOuter, rInner, teeth, toothLen) {
  const step = (Math.PI * 2) / (teeth * 2)
  let d = ''
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOuter + toothLen : rOuter
    const a = i * step - Math.PI / 2
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '
  }
  return d + 'Z'
}

export default function IconParametres({ className = '' }) {
  const bigD = gearPath(27, 36, 15, 0, 9, 4.2)
  const smallD = gearPath(43, 21, 8.5, 0, 7, 3)

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
        <linearGradient id="par-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c2a3ff" /><stop offset="0.5" stopColor="#7c3aff" /><stop offset="1" stopColor="#5a1fd4" />
        </linearGradient>
        <linearGradient id="par-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffcb9e" /><stop offset="0.5" stopColor="#ff8c42" /><stop offset="1" stopColor="#d9640f" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="58" rx="20" ry="3" fill="#2b2350" opacity="0.14" />

      {/* Grand engrenage violet */}
      <path d={bigD} fill="url(#par-violet)" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="27" cy="36" r="15" fill="none" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="27" cy="36" r="6.5" fill="#fff" opacity="0.9" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="27" cy="36" r="2.6" fill="url(#par-violet)" />
      <path d="M20 27 Q23 24 28 25" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.55" />

      {/* Petit engrenage orange, encastré en haut à droite */}
      <path d={smallD} fill="url(#par-orange)" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="43" cy="21" r="8.5" fill="none" stroke={OUTLINE} strokeWidth="2" />
      <circle cx="43" cy="21" r="3.6" fill="#fff" opacity="0.9" stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="43" cy="21" r="1.4" fill="url(#par-orange)" />
      <path d="M39 16 Q41 14.5 44 15.3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  )
}
