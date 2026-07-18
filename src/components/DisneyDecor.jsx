import './DisneyDecor.css'

// ============================================================
//  Décor de la saison « Zigzamland Paris ✨ » 🏰
//  ------------------------------------------------------------
//  Ciel de nuit étoilé, château de conte de fées illuminé en bas de
//  page, feux d'artifice périodiques, nuages roses pastel qui dérivent
//  et une pluie de particules magiques dorées.
//  Tout est en SVG / CSS ; les animations vivent dans DisneyDecor.css.
//  Rendu uniquement pendant la saison (cf. Backdrop.jsx).
// ============================================================

// Positions fixes des étoiles scintillantes : { gauche %, haut %, taille px,
// délai s, durée s }. Déterministe (pas de random) pour éviter que les
// étoiles ne « sautent » à chaque rendu de React.
const ETOILES = [
  [4, 8, 3, 0.0, 3.2], [11, 22, 2, 1.4, 4.1], [17, 5, 4, 0.7, 2.8],
  [23, 34, 2, 2.2, 3.6], [29, 14, 3, 0.3, 4.4], [35, 27, 2, 1.9, 3.0],
  [41, 6, 3, 1.1, 3.8], [47, 19, 2, 2.6, 4.2], [53, 31, 4, 0.5, 2.9],
  [58, 10, 2, 1.6, 3.5], [64, 24, 3, 0.9, 4.0], [70, 4, 2, 2.4, 3.3],
  [76, 17, 4, 0.2, 3.9], [81, 29, 2, 1.3, 4.5], [86, 9, 3, 2.0, 3.1],
  [91, 21, 2, 0.6, 3.7], [96, 33, 3, 1.8, 4.3], [8, 41, 2, 2.8, 3.4],
  [20, 47, 3, 0.4, 4.1], [33, 39, 2, 1.5, 2.9], [45, 44, 3, 2.3, 3.8],
  [57, 38, 2, 0.8, 4.4], [68, 46, 3, 1.7, 3.2], [79, 40, 2, 2.5, 3.6],
  [89, 48, 3, 1.0, 4.0], [2, 30, 2, 2.1, 3.5], [14, 12, 2, 0.1, 4.2],
  [26, 20, 3, 1.2, 3.0], [38, 32, 2, 2.7, 3.9], [50, 8, 2, 0.55, 4.6],
  [62, 16, 3, 1.45, 3.3], [73, 28, 2, 2.35, 4.1], [84, 36, 3, 0.35, 3.7],
  [94, 13, 2, 1.85, 3.4],
]

// Particules magiques dorées qui flottent vers le haut : { gauche %, délai, durée }.
const PARTICULES = [
  [6, 0.0, 13], [13, 2.4, 16], [21, 5.1, 14], [28, 1.2, 18], [36, 6.3, 15],
  [43, 3.7, 17], [51, 0.8, 14], [58, 4.9, 19], [66, 2.1, 15], [73, 7.2, 16],
  [81, 1.7, 18], [88, 5.5, 14], [95, 3.1, 17],
]

// Confettis dorés qui tombent lentement : { gauche %, délai, durée, rotation }.
const CONFETTIS = [
  [9, 0.0, 11, 18], [19, 3.2, 14, -24], [31, 6.4, 12, 40], [42, 1.8, 15, -12],
  [54, 4.6, 13, 30], [65, 8.1, 16, -36], [77, 2.7, 12, 22], [87, 5.9, 14, -18],
]

// ---- Château de conte de fées, illuminé, en bas de page --------------
// Fenêtres : chacune porte une classe `dcastle__win--n` dont l'animation
// CSS décale l'allumage, comme des lumières qui s'allument une à une.
function Chateau() {
  return (
    <svg className="dcastle__svg" viewBox="0 0 520 300" fill="none" aria-hidden="true">
      {/* halo lumineux derrière le château */}
      <ellipse cx="260" cy="250" rx="240" ry="90" fill="#6a7cff" opacity="0.18" />
      <ellipse cx="260" cy="240" rx="150" ry="70" fill="#ffd76a" opacity="0.12" />

      {/* ---- Tours arrière (plus sombres, en retrait) ---- */}
      <g fill="#2a2a6e" stroke="#1b1b52" strokeWidth="2">
        <rect x="86" y="150" width="34" height="120" rx="4" />
        <path d="M80 150 L103 104 L126 150 Z" fill="#3b3b8c" />
        <rect x="400" y="150" width="34" height="120" rx="4" />
        <path d="M394 150 L417 104 L440 150 Z" fill="#3b3b8c" />
      </g>

      {/* ---- Corps principal ---- */}
      <rect x="150" y="176" width="220" height="96" rx="5" fill="#3f3f96" stroke="#242468" strokeWidth="2.5" />
      {/* créneaux du corps principal */}
      <g fill="#4a4aa8">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={154 + i * 27} y="168" width="15" height="12" rx="2" />
        ))}
      </g>

      {/* ---- Tours latérales ---- */}
      <g>
        <rect x="130" y="130" width="44" height="142" rx="5" fill="#4a4aa8" stroke="#242468" strokeWidth="2.5" />
        <path d="M122 130 L152 70 L182 130 Z" fill="#ff7ab8" stroke="#d1478d" strokeWidth="2.5" />
        <rect x="346" y="130" width="44" height="142" rx="5" fill="#4a4aa8" stroke="#242468" strokeWidth="2.5" />
        <path d="M338 130 L368 70 L398 130 Z" fill="#ff7ab8" stroke="#d1478d" strokeWidth="2.5" />
      </g>

      {/* ---- Tour centrale : la plus haute ---- */}
      <rect x="228" y="86" width="64" height="186" rx="6" fill="#5555bd" stroke="#2b2b74" strokeWidth="2.5" />
      {/* créneaux de la tour centrale */}
      <g fill="#6363cc">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={231 + i * 16} y="78" width="10" height="11" rx="2" />
        ))}
      </g>
      {/* grande flèche rose */}
      <path d="M218 86 L260 4 L302 86 Z" fill="#ff8fc7" stroke="#d1478d" strokeWidth="2.5" />
      <path d="M260 4 L302 86 L260 86 Z" fill="#e86aad" opacity="0.6" />
      {/* petites flèches secondaires */}
      <path d="M206 130 L226 92 L246 130 Z" fill="#ff7ab8" stroke="#d1478d" strokeWidth="2" />
      <path d="M274 130 L294 92 L314 130 Z" fill="#ff7ab8" stroke="#d1478d" strokeWidth="2" />

      {/* ---- Étoile scintillante au sommet ---- */}
      <g className="dcastle__topstar">
        <path
          d="M260 -14 l6 15 16 1.4 -12.4 10.6 3.9 15.6 -13.5 -8.6 -13.5 8.6 3.9 -15.6 -12.4 -10.6 16 -1.4 Z"
          fill="#ffe07a" stroke="#ffb733" strokeWidth="1.6"
        />
      </g>

      {/* ---- Oriflammes ---- */}
      <g stroke="#ffd76a" strokeWidth="1.6">
        <line x1="152" y1="70" x2="152" y2="54" />
        <line x1="368" y1="70" x2="368" y2="54" />
      </g>
      <path className="dcastle__flag" d="M152 54 q14 4 26 -2 q-12 8 -26 10 Z" fill="#ffd76a" />
      <path className="dcastle__flag dcastle__flag--b" d="M368 54 q14 4 26 -2 q-12 8 -26 10 Z" fill="#ffd76a" />

      {/* ---- Grande porte voûtée ---- */}
      <path d="M238 272 L238 226 Q260 202 282 226 L282 272 Z" fill="#2a1f52" stroke="#171034" strokeWidth="2.5" />
      <path d="M244 272 L244 230 Q260 210 276 230 L276 272 Z" fill="#ffcf6a" opacity="0.5" className="dcastle__gate" />
      <line x1="260" y1="212" x2="260" y2="272" stroke="#171034" strokeWidth="1.6" />

      {/* ---- Fenêtres illuminées (s'allument une par une) ---- */}
      <g>
        {[
          // [x, y, tour]
          [146, 150], [146, 176], [146, 202],
          [362, 150], [362, 176], [362, 202],
          [244, 112], [268, 112], [244, 146], [268, 146],
          [172, 200], [196, 200], [324, 200], [300, 200],
          [98, 176], [98, 208], [412, 176], [412, 208],
        ].map(([x, y], i) => (
          <path
            key={i}
            className={`dcastle__win dcastle__win--${i % 6}`}
            d={`M${x} ${y + 16} L${x} ${y + 5} Q${x + 6} ${y - 4} ${x + 12} ${y + 5} L${x + 12} ${y + 16} Z`}
            fill="#ffd76a"
          />
        ))}
      </g>

      {/* ---- Pont / esplanade ---- */}
      <rect x="196" y="272" width="128" height="10" rx="3" fill="#33306e" />
      <rect x="60" y="270" width="400" height="6" rx="3" fill="#252152" opacity="0.7" />
    </svg>
  )
}

// ---- Un feu d'artifice : une salve d'étincelles qui éclatent -----------
function FeuArtifice({ className, teintes }) {
  return (
    <svg className={`dfw__svg ${className}`} viewBox="-60 -60 120 120" fill="none" aria-hidden="true">
      {/* traînée de montée */}
      <path className="dfw__trail" d="M0 58 L0 6" stroke={teintes[0]} strokeWidth="2.5" strokeLinecap="round" />
      {/* couronne d'étincelles */}
      <g className="dfw__burst">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          const r1 = 14
          const r2 = i % 2 === 0 ? 46 : 34
          return (
            <line
              key={i}
              x1={Math.cos(a) * r1} y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2} y2={Math.sin(a) * r2}
              stroke={teintes[i % teintes.length]}
              strokeWidth="2.6" strokeLinecap="round"
            />
          )
        })}
        {/* pointes lumineuses au bout des rayons */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          const r2 = i % 2 === 0 ? 46 : 34
          return (
            <circle
              key={i}
              cx={Math.cos(a) * r2} cy={Math.sin(a) * r2} r="2.6"
              fill={teintes[i % teintes.length]}
            />
          )
        })}
        <circle cx="0" cy="0" r="6" fill="#fff6d8" opacity="0.9" />
      </g>
    </svg>
  )
}

// ---- Petits éléments décoratifs flottants ------------------------------

// Étoile dorée « 3D » avec halo radial.
function EtoileMagique() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="#ffd76a" opacity="0.22" />
      <circle cx="24" cy="24" r="11" fill="#ffe9a8" opacity="0.3" />
      <path
        d="M24 3 l6 13.6 14.8 1.3 -11.2 9.8 3.4 14.5 -13 -7.8 -13 7.8 3.4 -14.5 -11.2 -9.8 14.8 -1.3 Z"
        fill="#ffe07a" stroke="#f0a92a" strokeWidth="1.6" strokeLinejoin="round"
      />
      {/* facette claire : donne le relief */}
      <path d="M24 3 l6 13.6 14.8 1.3 -11.2 9.8 -9.6 -24.7 Z" fill="#fff6d8" opacity="0.55" />
    </svg>
  )
}

// Baguette magique qui laisse une traînée d'étoiles.
function Baguette() {
  return (
    <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
      {/* traînée */}
      <g className="dwand__trail" fill="#ffe9a8">
        <circle cx="14" cy="46" r="2.6" opacity="0.75" />
        <circle cx="9" cy="52" r="1.9" opacity="0.55" />
        <circle cx="5" cy="57" r="1.3" opacity="0.35" />
      </g>
      {/* manche */}
      <rect x="16" y="16" width="5" height="34" rx="2.5" fill="#3a2f66"
        transform="rotate(-32 18.5 33)" />
      <rect x="16" y="38" width="5" height="12" rx="2.5" fill="#f5f2ff"
        transform="rotate(-32 18.5 44)" />
      {/* étoile au bout */}
      <path
        d="M40 6 l4.2 9.4 10.2 0.9 -7.7 6.8 2.3 10 -9 -5.4 -9 5.4 2.3 -10 -7.7 -6.8 10.2 -0.9 Z"
        fill="#ffe07a" stroke="#f0a92a" strokeWidth="1.4" strokeLinejoin="round"
      />
      <circle cx="40" cy="18" r="13" fill="#ffd76a" opacity="0.2" />
    </svg>
  )
}

// Chapeau de sorcier étoilé.
function ChapeauSorcier() {
  return (
    <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path d="M28 4 Q34 22 44 42 Q28 36 12 42 Q22 22 28 4 Z"
        fill="#2f3fa8" stroke="#1b2470" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 42 Q28 34 48 42 Q28 52 8 42 Z"
        fill="#3b4dc4" stroke="#1b2470" strokeWidth="2" strokeLinejoin="round" />
      {/* étoiles et lune dorées */}
      <path d="M25 18 l1.8 3.8 4.2 .4 -3.2 2.8 1 4.1 -3.8 -2.3 -3.8 2.3 1 -4.1 -3.2 -2.8 4.2 -.4 Z" fill="#ffd76a" />
      <path d="M35 32 q-4 1 -4 4 q4 -1 4 -4 Z" fill="#ffe9a8" />
      <circle cx="20" cy="34" r="1.8" fill="#ffd76a" />
    </svg>
  )
}

// Ballon coloré (la teinte est passée en prop).
function Ballon({ c1, c2 }) {
  return (
    <svg viewBox="0 0 40 62" fill="none" aria-hidden="true">
      <ellipse cx="20" cy="21" rx="16" ry="19" fill={c1} />
      <ellipse cx="14" cy="14" rx="5" ry="7" fill="#fff" opacity="0.35" />
      <path d="M20 40 l-4 5 8 0 -4 -5 Z" fill={c2} />
      <path d="M20 45 q5 8 -2 14 q-4 5 1 3" stroke="#ffe9a8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function DisneyDecor() {
  return (
    <div className="ddecor" aria-hidden="true">
      {/* Ciel bleu nuit profond */}
      <div className="ddecor__sky" />

      {/* Étoiles scintillantes */}
      <div className="ddecor__stars">
        {ETOILES.map(([l, t, s, d, dur], i) => (
          <span
            key={i}
            className="dstar"
            style={{
              left: `${l}%`, top: `${t}%`, width: `${s}px`, height: `${s}px`,
              animationDelay: `${d}s`, animationDuration: `${dur}s`,
            }}
          />
        ))}
      </div>

      {/* Nuages roses pastel qui dérivent lentement */}
      <div className="dclouds">
        <span className="dcloud dcloud--1" />
        <span className="dcloud dcloud--2" />
        <span className="dcloud dcloud--3" />
      </div>

      {/* Feux d'artifice : éclatent à tour de rôle sur un cycle de 30 s */}
      <div className="dfw dfw--1">
        <FeuArtifice className="dfw__svg--1" teintes={['#ffd76a', '#ff7ab8', '#fff6d8']} />
      </div>
      <div className="dfw dfw--2">
        <FeuArtifice className="dfw__svg--2" teintes={['#7ce7ff', '#c3b3ff', '#fff6d8']} />
      </div>
      <div className="dfw dfw--3">
        <FeuArtifice className="dfw__svg--3" teintes={['#ff8fc7', '#ffe07a', '#a0f0ff']} />
      </div>

      {/* Éléments décoratifs flottants */}
      <span className="dfloat dfloat--star1"><EtoileMagique /></span>
      <span className="dfloat dfloat--star2"><EtoileMagique /></span>
      <span className="dfloat dfloat--star3"><EtoileMagique /></span>
      <span className="dfloat dfloat--wand1"><Baguette /></span>
      <span className="dfloat dfloat--wand2"><Baguette /></span>
      <span className="dfloat dfloat--hat1"><ChapeauSorcier /></span>
      <span className="dfloat dfloat--hat2"><ChapeauSorcier /></span>

      {/* Ballons qui montent doucement */}
      <span className="dballoon dballoon--1"><Ballon c1="#ff5e8a" c2="#d1477a" /></span>
      <span className="dballoon dballoon--2"><Ballon c1="#ffd76a" c2="#e0a92a" /></span>
      <span className="dballoon dballoon--3"><Ballon c1="#7ce7ff" c2="#2aa9d1" /></span>
      <span className="dballoon dballoon--4"><Ballon c1="#c3b3ff" c2="#8f7ae0" /></span>

      {/* Particules magiques dorées qui montent */}
      <div className="dparts">
        {PARTICULES.map(([l, d, dur], i) => (
          <span
            key={i}
            className="dpart"
            style={{ left: `${l}%`, animationDelay: `${d}s`, animationDuration: `${dur}s` }}
          />
        ))}
      </div>

      {/* Confettis dorés qui tombent lentement */}
      <div className="dconf">
        {CONFETTIS.map(([l, d, dur, r], i) => (
          <span
            key={i}
            className="dconf__p"
            style={{
              left: `${l}%`, animationDelay: `${d}s`, animationDuration: `${dur}s`,
              '--dconf-rot': `${r}deg`,
            }}
          />
        ))}
      </div>

      {/* Le château illuminé, ancré en bas de page */}
      <div className="dcastle"><Chateau /></div>
    </div>
  )
}
