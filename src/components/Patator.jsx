import './Patator.css'

// ============================================================
//  PATATOR 🥔 — la patate de compagnie de la Série Zigzam.
//  Une patate toute mignonne en SVG : grands yeux, petits bras,
//  petits pieds. Elle ne parle pas, mais a des expressions.
//
//  props :
//   - expression : null (yeux normaux) | 'sparkle' (yeux qui brillent ✨)
//   - eyesClosed : true → yeux fermés (clignement lent)
//   - anim       : 'wave' → fait un petit signe de la main
//   - className  : classes supplémentaires
// ============================================================
export default function Patator({ expression = null, eyesClosed = false, anim = null, className = '' }) {
  const sparkle = expression === 'sparkle'
  const waving = anim === 'wave'
  const cls = `pat ${sparkle ? 'pat--sparkle' : ''} ${className}`.trim()

  return (
    <svg
      className={cls}
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pat-body" cx="0.4" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#e8b878" />
          <stop offset="0.7" stopColor="#d49a55" />
          <stop offset="1" stopColor="#bd8038" />
        </radialGradient>
      </defs>

      {/* Petits pieds */}
      <ellipse cx="60" cy="133" rx="11" ry="7" fill="#b97f3e" />
      <ellipse cx="86" cy="133" rx="11" ry="7" fill="#b97f3e" />

      {/* Bras gauche (petit, posé) */}
      <ellipse cx="28" cy="98" rx="8" ry="13" fill="#cf944f" transform="rotate(18 28 98)" />

      {/* Bras droit — fait coucou quand `wave` */}
      <g className={`pat__arm-right ${waving ? 'pat__arm-right--wave' : ''}`}>
        <ellipse cx="116" cy="98" rx="8" ry="13" fill="#cf944f" transform="rotate(-18 116 98)" />
      </g>

      {/* Corps de la patate (forme bosselée) */}
      <path
        d="M34 86 C30 58, 54 34, 78 36 C104 38, 120 60, 116 88 C113 112, 96 132, 70 130 C44 128, 38 112, 34 86 Z"
        fill="url(#pat-body)"
        stroke="#a96f30"
        strokeWidth="2.5"
      />

      {/* Petites taches « yeux de patate » (dimples) */}
      <ellipse cx="50" cy="58" rx="3.4" ry="2.4" fill="#a96f30" opacity="0.45" />
      <ellipse cx="100" cy="56" rx="3" ry="2.2" fill="#a96f30" opacity="0.45" />
      <ellipse cx="58" cy="108" rx="3" ry="2.2" fill="#a96f30" opacity="0.4" />

      {/* Joues roses */}
      <circle cx="50" cy="92" r="6" fill="#ff9bb6" opacity="0.6" />
      <circle cx="102" cy="92" r="6" fill="#ff9bb6" opacity="0.6" />

      {/* Yeux */}
      {eyesClosed ? (
        <>
          <path d="M50 78 q10 9 20 0" stroke="#3a2a14" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <path d="M80 78 q10 9 20 0" stroke="#3a2a14" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* Grands yeux blancs */}
          <ellipse cx="60" cy="78" rx="12" ry="14" fill="#fff" stroke="#3a2a14" strokeWidth="2" />
          <ellipse cx="90" cy="78" rx="12" ry="14" fill="#fff" stroke="#3a2a14" strokeWidth="2" />
          {/* Pupilles */}
          <circle cx="61" cy="80" r="7.5" fill="#2b2350" />
          <circle cx="91" cy="80" r="7.5" fill="#2b2350" />
          {/* Reflets (plus de brillance en mode sparkle) */}
          <circle cx="64" cy="76.5" r="2.6" fill="#fff" />
          <circle cx="94" cy="76.5" r="2.6" fill="#fff" />
          {sparkle && (
            <>
              <circle cx="58" cy="82" r="1.6" fill="#fff" />
              <circle cx="88" cy="82" r="1.6" fill="#fff" />
            </>
          )}
        </>
      )}

      {/* Bouche : petit sourire (plus grand et heureux en mode sparkle) */}
      {sparkle ? (
        <path d="M64 100 q11 11 22 0" stroke="#3a2a14" strokeWidth="3" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M67 100 q8 7 16 0" stroke="#3a2a14" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}

      {/* Étoiles de bonheur autour de la patate (mode sparkle) */}
      {sparkle && (
        <g className="pat__stars">
          {[
            { x: 30, y: 36, s: 1 },
            { x: 110, y: 32, s: 1.3 },
            { x: 122, y: 74, s: 0.9 },
            { x: 20, y: 70, s: 1.1 },
          ].map((st, i) => (
            <path
              key={i}
              className={`pat__star pat__star--${i}`}
              transform={`translate(${st.x} ${st.y}) scale(${st.s})`}
              d="M0 -7 L2 -2 L7 -2 L3 1.5 L4.5 6.5 L0 3.5 L-4.5 6.5 L-3 1.5 L-7 -2 L-2 -2 Z"
              fill="#ffd23f"
              stroke="#ff8c42"
              strokeWidth="0.8"
            />
          ))}
        </g>
      )}
    </svg>
  )
}
