import './JurassicDecor.css'

// ============================================================
//  Décor immersif de la saison « Jurassic Web 🦕 ».
//  Rendu DERRIÈRE le contenu (via Backdrop) quand la saison est active :
//   - ciel sombre + éclairs verts occasionnels
//   - volcans fumants en arrière-plan
//   - œufs de dino 3D, os et empreintes flottants
//   - un petit dino qui traverse l'écran en courant
//   - des fougères préhistoriques qui se balancent en bas
//  Tout est en SVG ; les animations vivent dans JurassicDecor.css.
// ============================================================

// — Une fougère (frond) : tige centrale arquée + folioles de part et d'autre.
function Fern({ flip = false, tint = '#1f7a34' }) {
  // Folioles régulières le long de la nervure, décroissantes vers la pointe.
  const leaflets = []
  for (let i = 0; i < 11; i++) {
    const t = i / 11
    const y = 150 - t * 150 // de la base (150) vers la pointe (0)
    const x = 40 + t * 14 * (flip ? -1 : 1) // légère courbure
    const len = 30 * (1 - t * 0.7)
    leaflets.push(
      <g key={i}>
        <path
          d={`M${x} ${y} q${(flip ? -1 : 1) * (len * 0.7)} ${-len * 0.4} ${(flip ? -1 : 1) * len} ${-len * 0.2}`}
          stroke={tint} strokeWidth={3.2 - t * 1.6} fill="none" strokeLinecap="round"
        />
        <path
          d={`M${x} ${y} q${(flip ? 1 : -1) * (len * 0.7)} ${-len * 0.4} ${(flip ? 1 : -1) * len} ${-len * 0.2}`}
          stroke={tint} strokeWidth={3.2 - t * 1.6} fill="none" strokeLinecap="round"
        />
      </g>,
    )
  }
  return (
    <svg className="jfern__svg" viewBox="0 0 90 152" fill="none" aria-hidden="true">
      {/* nervure principale */}
      <path d={`M${flip ? 50 : 40} 152 Q${flip ? 40 : 50} 70 ${flip ? 54 : 36} 2`}
        stroke={tint} strokeWidth="4" fill="none" strokeLinecap="round" />
      {leaflets}
    </svg>
  )
}

// — Un œuf de dino coloré avec effet 3D (dégradé radial) + ombre dessous.
function Egg({ id, c1, c2, c3, spots }) {
  return (
    <svg className="jegg__svg" viewBox="0 0 60 80" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`egg-${id}`} cx="0.38" cy="0.3" r="0.85">
          <stop offset="0" stopColor={c1} />
          <stop offset="0.55" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="74" rx="16" ry="4.5" fill="#000" opacity="0.28" />
      {/* forme d'œuf : pointu en haut, rond en bas */}
      <path d="M30 4 C44 4 52 32 52 50 C52 67 42 76 30 76 C18 76 8 67 8 50 C8 32 16 4 30 4 Z"
        fill={`url(#egg-${id})`} />
      {/* taches façon œuf de reptile */}
      <g fill={spots} opacity="0.5">
        <ellipse cx="22" cy="40" rx="4" ry="3" />
        <ellipse cx="36" cy="54" rx="3.4" ry="2.6" />
        <ellipse cx="28" cy="62" rx="2.6" ry="2" />
        <ellipse cx="38" cy="34" rx="2.4" ry="1.8" />
      </g>
      {/* reflet brillant */}
      <ellipse cx="23" cy="26" rx="7" ry="11" fill="#fff" opacity="0.32" />
    </svg>
  )
}

// — Un os de dino stylisé (forme d'haltère arrondie).
function Bone() {
  return (
    <svg className="jbone__svg" viewBox="0 0 70 30" fill="none" aria-hidden="true">
      <g fill="#f3efe2" stroke="#cfc6ad" strokeWidth="1.5">
        <circle cx="11" cy="9" r="8" /><circle cx="11" cy="21" r="8" />
        <circle cx="59" cy="9" r="8" /><circle cx="59" cy="21" r="8" />
        <rect x="11" y="9" width="48" height="12" rx="6" />
      </g>
    </svg>
  )
}

// — Une empreinte de dino à trois doigts.
function Footprint({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 46" fill="none" aria-hidden="true">
      <g fill="#0a2e0a">
        <ellipse cx="20" cy="32" rx="9" ry="11" />
        <path d="M20 22 q-3 -16 -7 -16 q-4 2 -1 12 q2 6 8 8 Z" />
        <path d="M20 20 q0 -18 0 -18 q4 0 4 12 q0 7 -4 8 Z" />
        <path d="M20 22 q3 -16 7 -16 q4 2 1 12 q-2 6 -8 8 Z" />
      </g>
    </svg>
  )
}

// — Le petit dino qui traverse l'écran en courant (silhouette T-Rex).
function Runner() {
  return (
    <svg className="jrunner__svg" viewBox="0 0 120 90" fill="none" aria-hidden="true">
      {/* corps + queue + tête */}
      <path d="M6 40 Q22 30 40 34 Q46 16 70 16 Q96 14 104 34 Q108 50 92 54
               Q90 64 78 64 L82 80 L72 80 L66 62 Q52 64 44 56
               L40 80 L30 80 L32 52 Q14 50 6 40 Z"
        fill="#2f8a3d" stroke="#1c5e26" strokeWidth="2" />
      {/* ventre plus clair */}
      <path d="M40 50 Q56 60 74 56 Q66 62 54 60 Q46 58 40 50 Z" fill="#7ed07e" opacity="0.7" />
      {/* plaques dorsales */}
      <path d="M44 30 l4 -8 4 8 4 -8 4 8 4 -8 4 8" fill="#235e2b" />
      {/* mâchoire + dents */}
      <path d="M92 38 q12 1 14 6 q-7 0 -14 2 Z" fill="#2f8a3d" />
      <path d="M97 44 l2 0 0 3 -2 0 M101 44 l2 0 0 3 -2 0" fill="#fff" />
      {/* œil */}
      <circle cx="90" cy="28" r="3" fill="#fff" /><circle cx="91" cy="28" r="1.6" fill="#0a2e0a" />
      {/* petits bras */}
      <path d="M78 44 q8 2 10 7" stroke="#1c5e26" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function JurassicDecor() {
  return (
    <div className="jdecor" aria-hidden="true">
      {/* Brume sombre + éclairs verts dans le ciel */}
      <div className="jdecor__sky" />
      <div className="jdecor__lightning" />
      <svg className="jdecor__bolt" viewBox="0 0 60 200" fill="none" aria-hidden="true">
        <path d="M34 0 L14 90 L30 90 L8 200 L46 78 L28 78 L42 0 Z"
          fill="#d6ffd6" stroke="#8ff196" strokeWidth="2" />
      </svg>

      {/* Volcans fumants en arrière-plan */}
      {[1, 2].map((n) => (
        <div key={n} className={`jvolcano jvolcano--${n}`}>
          <svg className="jvolcano__svg" viewBox="0 0 200 130" fill="none" aria-hidden="true">
            <path d="M0 130 L70 30 Q80 18 100 18 Q120 18 130 30 L200 130 Z" fill="#11331a" />
            <path d="M70 32 L100 18 L130 32 L116 44 Q100 38 84 44 Z" fill="#3a1a0a" />
            {/* coulée de lave */}
            <path d="M96 22 Q92 60 100 100 Q108 60 104 22 Z" fill="#ff6a2b" opacity="0.85" />
            <path d="M100 20 Q98 50 100 84 Q102 50 100 20 Z" fill="#ffd23f" opacity="0.9" />
          </svg>
          <span className="jsmoke jsmoke--a" />
          <span className="jsmoke jsmoke--b" />
          <span className="jsmoke jsmoke--c" />
        </div>
      ))}

      {/* Œufs de dino flottants */}
      <span className="jegg jegg--1"><Egg id="1" c1="#bff0c8" c2="#5ec77a" c3="#2f8a4a" spots="#1c5e2b" /></span>
      <span className="jegg jegg--2"><Egg id="2" c1="#ffe0b3" c2="#f0a45a" c3="#c4702a" spots="#7a3f12" /></span>
      <span className="jegg jegg--3"><Egg id="3" c1="#cfe6ff" c2="#6aa6e0" c3="#2f5e9a" spots="#1c3a66" /></span>

      {/* Os flottants */}
      <span className="jbone jbone--1"><Bone /></span>
      <span className="jbone jbone--2"><Bone /></span>

      {/* Empreintes qui apparaissent/disparaissent */}
      <div className="jtracks">
        {[0, 1, 2, 3, 4].map((i) => (
          <Footprint key={i} className={`jtrack jtrack--${i}`} />
        ))}
      </div>

      {/* Dino qui traverse en courant */}
      <div className="jrunner"><Runner /></div>

      {/* Fougères préhistoriques en bas */}
      <div className="jferns">
        <span className="jfern jfern--1"><Fern tint="#1c6e2e" /></span>
        <span className="jfern jfern--2"><Fern flip tint="#155c26" /></span>
        <span className="jfern jfern--3"><Fern tint="#22823a" /></span>
        <span className="jfern jfern--4"><Fern flip tint="#176328" /></span>
        <span className="jfern jfern--5"><Fern tint="#1c6e2e" /></span>
      </div>
    </div>
  )
}
