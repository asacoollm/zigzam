import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
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

export default function SaisonAnnounce() {
  const { user } = useAuth()
  const { active, saison, joursRestants } = useSaison()
  const [open, setOpen] = useState(false)

  // Conditions d'affichage : connecté, onboarding fait, saison active, pas
  // encore vue cette session.
  const eligible = !!user && !user.premiere_connexion && active

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

  const titre = saison?.titre || 'Jurassic Web'
  const numero = saison?.theme?.numero || saison?.numero || 1

  return (
    <div className="sann" role="dialog" aria-modal="true">
      <div className="sann__backdrop" />
      <div className="sann__bolts" aria-hidden="true">
        <span className="sann__bolt sann__bolt--1" />
        <span className="sann__bolt sann__bolt--2" />
        <span className="sann__bolt sann__bolt--3" />
      </div>

      <div className="sann__card">
        <div className="sann__scene">
          <TRex />
        </div>

        <h1 className="sann__title" aria-label={`${titre}`}>
          {'JURASSIC'.split('').map((c, i) => (
            <span key={`a${i}`} className="sann__ch" style={{ animationDelay: `${i * 0.05}s` }}>{c}</span>
          ))}
          <span className="sann__title-space" />
          {'WEB'.split('').map((c, i) => (
            <span key={`b${i}`} className="sann__ch" style={{ animationDelay: `${(i + 8) * 0.05}s` }}>{c}</span>
          ))}
          <span className="sann__title-emoji">🦕</span>
        </h1>

        <p className="sann__subtitle">La Saison {numero} de Zigzam est arrivée !</p>

        <p className="sann__desc">
          Pendant 1 mois, Zigzam entre dans l’ère des dinosaures ! Découvre des skins
          exclusifs, une interface transformée et bien plus encore.
          <strong> Les skins achetés restent définitivement sur ton compte !</strong>
        </p>

        {joursRestants != null && (
          <div className="sann__countdown">
            <span className="sann__countdown-num">{joursRestants}</span>
            <span className="sann__countdown-label">
              {joursRestants > 1 ? 'jours restants' : 'jour restant'} dans la saison
            </span>
          </div>
        )}

        <button className="sann__btn" onClick={() => setOpen(false)}>
          Entrer dans le Jurassique 🦖
        </button>
      </div>
    </div>
  )
}
