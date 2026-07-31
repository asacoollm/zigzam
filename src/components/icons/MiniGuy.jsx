// Petit bonhomme Fall Guys simplifié, réutilisé comme brique de base par
// plusieurs icônes de modules (silhouette haricot + visage + bras/jambes
// posables, dessinés PAR-DESSUS le corps pour rester toujours visibles).
// Coordonnées locales centrées sur (0,0), pensées pour une icône 64×64.
const OUTLINE = '#2b2350'

function Arm({ side, pose, color }) {
  if (!pose || pose === 'none') return null
  const sign = side === 'left' ? -1 : 1
  const base = { fill: color, stroke: OUTLINE, strokeWidth: 2 }
  if (pose === 'up') {
    // Bras levé façon membre articulé (ligne épaisse + main), pour ne pas
    // se confondre avec des oreilles quand les deux bras sont levés.
    const shoulder = `${sign * 13} -2`
    const hand = `${sign * 25} -19`
    return (
      <g>
        <path d={`M${shoulder} L${hand}`} stroke={OUTLINE} strokeWidth="13" strokeLinecap="round" fill="none" />
        <path d={`M${shoulder} L${hand}`} stroke={color} strokeWidth="9" strokeLinecap="round" fill="none" />
        <circle cx={sign * 25} cy="-19" r="4.4" fill={color} stroke={OUTLINE} strokeWidth="2" />
      </g>
    )
  }
  if (pose === 'out') {
    return <ellipse cx={sign * 22} cy="5" rx="9.5" ry="5.5" {...base} />
  }
  // 'down'
  return <ellipse cx={sign * 17} cy="14" rx="6" ry="11" {...base} />
}

function Legs({ pose, shade }) {
  if (pose === 'none') return null
  const base = { fill: shade, stroke: OUTLINE, strokeWidth: 2 }
  if (pose === 'jump') {
    return (
      <>
        <ellipse cx="-13" cy="15" rx="6" ry="9" transform="rotate(35 -13 15)" {...base} />
        <ellipse cx="13" cy="15" rx="6" ry="9" transform="rotate(-35 13 15)" {...base} />
      </>
    )
  }
  return (
    <>
      <ellipse cx="-7" cy="25" rx="6.5" ry="8" {...base} />
      <ellipse cx="7" cy="25" rx="6.5" ry="8" {...base} />
    </>
  )
}

function Eyes({ pose }) {
  if (pose === 'closed') {
    return (
      <>
        <path d="M-8 0.5 q3.5 3 7 0" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M1 0.5 q3.5 3 7 0" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    )
  }
  if (pose === 'happy') {
    return (
      <>
        <path d="M-8 1.5 q3.5 -4 7 0" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M1 1.5 q3.5 -4 7 0" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <circle cx="-4.5" cy="0.8" r="2.5" fill={OUTLINE} />
      <circle cx="4.5" cy="0.8" r="2.5" fill={OUTLINE} />
      <circle cx="-3.5" cy="-0.2" r="0.9" fill="#fff" />
      <circle cx="5.5" cy="-0.2" r="0.9" fill="#fff" />
    </>
  )
}

// `armL` / `armR` : 'down' | 'up' | 'out' | 'none' — `legs` : true | false | 'jump' | 'none'
export default function MiniGuy({
  x = 0, y = 0, scale = 1, color, shade,
  armL = 'down', armR = 'down', legs = true, eyes = 'open', mouth = true,
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Corps haricot + relief */}
      <ellipse cx="0" cy="0" rx="19" ry="22" fill={color} stroke={OUTLINE} strokeWidth="2.5" />
      <ellipse cx="-6.5" cy="-10" rx="9" ry="7" fill="#fff" opacity="0.3" />

      <Legs pose={legs === true ? 'stand' : legs} shade={shade} />
      <Arm side="left" pose={armL} color={color} />
      <Arm side="right" pose={armR} color={color} />

      {/* Visage, toujours par-dessus */}
      <ellipse cx="0" cy="1.5" rx="12.5" ry="9.5" fill="#fff" opacity="0.96" />
      <Eyes pose={eyes} />
      <circle cx="-9.5" cy="5" r="2.6" fill="#ff6f9e" opacity="0.75" />
      <circle cx="9.5" cy="5" r="2.6" fill="#ff6f9e" opacity="0.75" />
      {mouth && <path d="M-4 7 q4 3.5 8 0" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />}
    </g>
  )
}
