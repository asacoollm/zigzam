import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
import FallGuy from './FallGuy'
import './SaisonAnnounce.css'

// Clé de session : l'annonce s'affiche à chaque connexion (effacée au logout
// par AuthContext.signOut), une seule fois par session.
const SEEN_KEY = 'zigzam:saison-annonce-vue'

// Grand T-Rex SVG qui rugit (mâchoire animée via .dino-roar-jaw).
function TRex() {
  return (
    <svg className="sann__trex" viewBox="0 0 220 200" fill="none" aria-hidden="true">
      {/* queue */}
      <path d="M40 150 Q8 150 4 120 Q22 138 44 132 Z" fill="#2f6b3a" />
      {/* jambe + pied */}
      <path d="M120 120 L110 188 L138 188 L140 124 Z" fill="#2f6b3a" stroke="#1c4a26" strokeWidth="3" />
      <ellipse cx="124" cy="188" rx="24" ry="8" fill="#235e2b" />
      {/* corps */}
      <path d="M44 96 Q30 150 96 158 Q160 158 158 96 Q150 50 96 52 Q56 54 44 96 Z"
        fill="#3f8a4a" stroke="#1c4a26" strokeWidth="3" />
      {/* ventre clair */}
      <path d="M70 120 Q96 150 140 124 Q110 140 80 130 Z" fill="#8ff196" opacity="0.55" />
      {/* plaques dorsales */}
      <path d="M58 70 l6 -12 6 12 6 -12 6 12 6 -12 6 12 6 -12 6 12" fill="#235e2b" />
      {/* petit bras */}
      <path d="M96 104 q-14 4 -16 18 q8 -2 12 2" stroke="#1c4a26" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* tête */}
      <g className="sann__head">
        <path d="M150 56 Q210 50 214 84 Q212 100 176 100 Q150 100 146 76 Z"
          fill="#3f8a4a" stroke="#1c4a26" strokeWidth="3" />
        {/* gueule rouge */}
        <path d="M168 82 Q200 90 210 82 Q196 92 172 90 Z" fill="#7a1f1f" />
        {/* dents du haut */}
        <g fill="#fff" stroke="#d8d8d8" strokeWidth="0.6">
          {[170, 180, 190, 200].map((x, i) => (
            <path key={i} d={`M${x} 84 l4 9 l4 -9 Z`} />
          ))}
        </g>
        {/* mâchoire inférieure animée (rugissement) */}
        <g className="dino-roar-jaw">
          <path d="M152 92 Q186 116 212 96 Q190 106 160 102 Z"
            fill="#2f6b3a" stroke="#1c4a26" strokeWidth="2.5" />
          <g fill="#fff">
            {[168, 180, 192].map((x, i) => (
              <path key={i} d={`M${x} 100 l4 -8 l4 8 Z`} />
            ))}
          </g>
        </g>
        {/* narine + œil féroce */}
        <circle cx="206" cy="74" r="2" fill="#1c4a26" />
        <circle cx="184" cy="68" r="6" fill="#f5d000" />
        <circle cx="184" cy="68" r="2.6" fill="#000" />
        <path d="M176 60 q8 -4 16 0" stroke="#1c4a26" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// Château de conte de fées illuminé (scène de la saison Zigzamland).
function ChateauAnnonce() {
  return (
    <svg className="sann__chateau" viewBox="0 0 260 200" fill="none" aria-hidden="true">
      {/* halo */}
      <ellipse cx="130" cy="176" rx="126" ry="40" fill="#6a7cff" opacity="0.22" />
      <ellipse cx="130" cy="170" rx="80" ry="30" fill="#ffd76a" opacity="0.16" />

      {/* tours arrière */}
      <g fill="#2a2a6e" stroke="#1b1b52" strokeWidth="1.8">
        <rect x="30" y="96" width="24" height="86" rx="3" />
        <path d="M25 96 L42 66 L59 96 Z" fill="#3b3b8c" />
        <rect x="206" y="96" width="24" height="86" rx="3" />
        <path d="M201 96 L218 66 L235 96 Z" fill="#3b3b8c" />
      </g>

      {/* corps principal */}
      <rect x="72" y="114" width="116" height="68" rx="4" fill="#3f3f96" stroke="#242468" strokeWidth="2" />
      <g fill="#4a4aa8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={75 + i * 19} y="108" width="11" height="9" rx="1.5" />
        ))}
      </g>

      {/* tours latérales */}
      <rect x="60" y="84" width="30" height="98" rx="4" fill="#4a4aa8" stroke="#242468" strokeWidth="2" />
      <path d="M54 84 L75 44 L96 84 Z" fill="#ff7ab8" stroke="#d1478d" strokeWidth="2" />
      <rect x="170" y="84" width="30" height="98" rx="4" fill="#4a4aa8" stroke="#242468" strokeWidth="2" />
      <path d="M164 84 L185 44 L206 84 Z" fill="#ff7ab8" stroke="#d1478d" strokeWidth="2" />

      {/* tour centrale */}
      <rect x="112" y="56" width="36" height="126" rx="4" fill="#5555bd" stroke="#2b2b74" strokeWidth="2" />
      <path d="M104 56 L130 4 L156 56 Z" fill="#ff8fc7" stroke="#d1478d" strokeWidth="2" />
      <path d="M130 4 L156 56 L130 56 Z" fill="#e86aad" opacity="0.6" />

      {/* étoile au sommet */}
      <g className="sann__topstar">
        <path d="M130 -6 l4.4 10 10.6 .9 -8.2 7 2.5 10.4 -9.3 -5.7 -9.3 5.7 2.5 -10.4 -8.2 -7 10.6 -.9 Z"
          fill="#ffe07a" stroke="#ffb733" strokeWidth="1.4" />
      </g>

      {/* porte */}
      <path d="M118 182 L118 152 Q130 136 142 152 L142 182 Z" fill="#2a1f52" stroke="#171034" strokeWidth="2" />
      <path d="M122 182 L122 155 Q130 142 138 155 L138 182 Z" fill="#ffcf6a" opacity="0.55" />

      {/* fenêtres illuminées */}
      <g>
        {[[68, 100], [68, 126], [178, 100], [178, 126], [118, 76], [136, 76],
          [86, 138], [104, 138], [150, 138], [168, 138], [38, 118], [214, 118],
        ].map(([x, y], i) => (
          <path
            key={i}
            className={`sann__win sann__win--${i % 6}`}
            d={`M${x} ${y + 13} L${x} ${y + 4} Q${x + 5} ${y - 3} ${x + 10} ${y + 4} L${x + 10} ${y + 13} Z`}
            fill="#ffd76a"
          />
        ))}
      </g>

      <rect x="96" y="182" width="68" height="7" rx="2" fill="#33306e" />
    </svg>
  )
}

// Scène de la modale Halloween : une citrouille souriante + un petit
// fantôme mignon qui flotte à côté. Jamais effrayant.
function SceneHalloween() {
  return (
    <div className="sann__halloween-scene">
      <svg className="sann__pumpkin" viewBox="0 0 70 60" fill="none" aria-hidden="true">
        <path d="M35 10 Q38 2 42 6 Q39 8 38 12" stroke="#4a7a2a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <ellipse cx="35" cy="36" rx="32" ry="22" fill="#ff7a18" />
        <g stroke="#e8650a" strokeWidth="2" opacity="0.65">
          <path d="M17 16 Q13 36 17 56" fill="none" />
          <path d="M26 13 Q22 36 26 58" fill="none" />
          <path d="M44 13 Q48 36 44 58" fill="none" />
          <path d="M53 16 Q57 36 53 56" fill="none" />
        </g>
        <g fill="#fff4e0">
          <path d="M18 32 L26 32 L22 40 Z" />
          <path d="M44 32 L52 32 L48 40 Z" />
          <path d="M16 46 Q35 56 54 46 Q35 50 16 46 Z" />
        </g>
      </svg>
      <svg className="sann__ghost" viewBox="0 0 60 64" fill="none" aria-hidden="true">
        <path
          d="M30 2 C14 2 4 14 4 30 L4 56 Q9 50 14 56 Q19 50 24 56 Q27 52 30 56 Q33 52 36 56 Q41 50 46 56 Q51 50 56 56 L56 30 C56 14 46 2 30 2 Z"
          fill="#fff4e0"
        />
        <circle cx="21" cy="28" r="3.4" fill="#2b1750" />
        <circle cx="39" cy="28" r="3.4" fill="#2b1750" />
        <path d="M24 38 Q30 44 36 38" stroke="#2b1750" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="34" r="3" fill="#ff9fb0" opacity="0.5" />
        <circle cx="46" cy="34" r="3" fill="#ff9fb0" opacity="0.5" />
      </svg>
    </div>
  )
}

// Salve de feux d'artifice affichée dans la modale (ouverture + clic bouton).
function FeuxModale({ cle }) {
  const teintes = [
    ['#ffd76a', '#ff7ab8', '#fff6d8'],
    ['#7ce7ff', '#c3b3ff', '#fff6d8'],
    ['#ff8fc7', '#ffe07a', '#a0f0ff'],
    ['#ffe07a', '#7ce7ff', '#ff7ab8'],
  ]
  return (
    <div className="sann__fw" key={cle} aria-hidden="true">
      {teintes.map((t, n) => (
        <svg className={`sann__fw-svg sann__fw-svg--${n}`} key={n} viewBox="-60 -60 120 120" fill="none">
          <g className="sann__fw-burst">
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2
              const r2 = i % 2 === 0 ? 46 : 33
              return (
                <g key={i}>
                  <line
                    x1={Math.cos(a) * 12} y1={Math.sin(a) * 12}
                    x2={Math.cos(a) * r2} y2={Math.sin(a) * r2}
                    stroke={t[i % t.length]} strokeWidth="2.6" strokeLinecap="round"
                  />
                  <circle cx={Math.cos(a) * r2} cy={Math.sin(a) * r2} r="2.4" fill={t[i % t.length]} />
                </g>
              )
            })}
            <circle cx="0" cy="0" r="5" fill="#fff6d8" opacity="0.9" />
          </g>
        </svg>
      ))}
    </div>
  )
}

// ============================================================
//  Contenu de la modale, par saison. Une saison sans entrée ici
//  n'affiche pas d'annonce (garde-fou).
// ============================================================
const CONTENUS = {
  jurassic: {
    mots: ['JURASSIC', 'WEB'],
    emoji: '🦕',
    scene: <TRex />,
    desc: (
      <>
        Pendant 1 mois, Zigzam entre dans l’ère des dinosaures ! Découvre des skins
        exclusifs, une interface transformée et bien plus encore.
        <strong> Les skins achetés restent définitivement sur ton compte !</strong>
      </>
    ),
    bouton: 'Entrer dans le Jurassique 🦖',
  },
  disney: {
    mots: ['ZIGZAMLAND', 'PARIS'],
    emoji: '🏰',
    feux: true,
    scene: (
      <>
        <ChateauAnnonce />
        {/* Bonhomme aux oreilles Mickey qui danse devant le château */}
        <FallGuy
          className="sann__danseur"
          avatar={{ color: 'noir', hat: 'dears' }}
          anim="idle"
        />
      </>
    ),
    desc: (
      <>
        Bienvenue à Zigzamland Paris ! Pendant 1 mois, la magie Disney envahit
        Zigzam. Découvre des skins exclusifs inspirés de tes personnages préférés.
        <strong> Les skins achetés restent définitivement !</strong>
      </>
    ),
    bouton: 'Entrer dans la Magie ! 🏰',
  },
  halloween: {
    mots: ['JOYEUX', 'HALLOWEEN'],
    emoji: '🎃',
    scene: <SceneHalloween />,
    desc: (
      <>
        Jusqu’au 28 novembre, Zigzam se déguise pour Halloween ! De nouveaux
        skins et de nouveaux objets vont arriver petit à petit pendant toute
        la saison.
        <strong> Reviens souvent pour ne rien manquer !</strong>
        <br />
        ⚠️ Ces farces font sursauter, avec du son ! Tu peux les désactiver
        dans tes réglages.
      </>
    ),
    bouton: 'Entrer dans la saison 🎃',
  },
}

export default function SaisonAnnounce() {
  const { user } = useAuth()
  const { active, saison, slug, joursRestants } = useSaison()
  const [open, setOpen] = useState(false)
  // Incrémenté au clic du bouton → relance une salve de feux d'artifice.
  const [salve, setSalve] = useState(0)

  const contenu = slug ? CONTENUS[slug] : null

  // Conditions d'affichage : connecté, onboarding fait, saison active (et
  // connue), pas encore vue cette session.
  const eligible = !!user && !user.premiere_connexion && active && !!contenu

  useEffect(() => {
    if (!eligible) return
    let seen = false
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1' } catch { /* stockage indispo */ }
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true)
      try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
    }
  }, [eligible])

  if (!open || !eligible) return null

  const numero = saison?.theme?.numero || saison?.numero || 1
  const [mot1, mot2] = contenu.mots

  // Fermeture : une dernière salve de feux, puis on referme.
  const fermer = () => {
    if (contenu.feux) {
      setSalve((s) => s + 1)
      setTimeout(() => setOpen(false), 900)
    } else {
      setOpen(false)
    }
  }

  return (
    <div className={`sann sann--${slug}`} role="dialog" aria-modal="true">
      <div className="sann__backdrop" />
      <div className="sann__bolts" aria-hidden="true">
        <span className="sann__bolt sann__bolt--1" />
        <span className="sann__bolt sann__bolt--2" />
        <span className="sann__bolt sann__bolt--3" />
      </div>

      {contenu.feux && <FeuxModale cle={salve} />}

      <div className="sann__card">
        <div className="sann__scene">
          {contenu.scene}
        </div>

        <h1 className="sann__title" aria-label={saison?.titre || mot1}>
          {mot1.split('').map((c, i) => (
            <span key={`a${i}`} className="sann__ch" style={{ animationDelay: `${i * 0.05}s` }}>{c}</span>
          ))}
          <span className="sann__title-space" />
          {mot2.split('').map((c, i) => (
            <span key={`b${i}`} className="sann__ch" style={{ animationDelay: `${(i + mot1.length) * 0.05}s` }}>{c}</span>
          ))}
          <span className="sann__title-emoji">{contenu.emoji}</span>
        </h1>

        <p className="sann__subtitle">La Saison {numero} de Zigzam est arrivée !</p>

        <p className="sann__desc">{contenu.desc}</p>

        {joursRestants != null && (
          <div className="sann__countdown">
            <span className="sann__countdown-num">{joursRestants}</span>
            <span className="sann__countdown-label">
              {joursRestants > 1 ? 'jours restants' : 'jour restant'} dans la saison
            </span>
          </div>
        )}

        <button className="sann__btn" onClick={fermer}>
          {contenu.bouton}
        </button>
      </div>
    </div>
  )
}
