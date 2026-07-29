import FallGuy from './FallGuy'
import JurassicDecor from './JurassicDecor'
import DisneyDecor from './DisneyDecor'
import { useSaison } from '../context/SaisonContext'
import './Backdrop.css'

// Décor immersif + teintes des bonhommes, par saison.
//  Une saison sans entrée ici retombe sur le décor normal (garde-fou).
const DECORS = {
  jurassic: { Decor: JurassicDecor, guys: ['#3dd68c', '#8ff196'] },
  disney: { Decor: DisneyDecor, guys: ['#ffd76a', '#ff8fc7'] },
}

// ⚡ Éclair stylisé façon comic book.
function Bolt({ className }) {
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden="true">
      <path d="M38 2 L6 56 L26 56 L18 98 L56 40 L34 40 Z" fill="#ffd23f" stroke="#2b2350" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}

// ✦ Étoile à 4 branches façon BD.
function ComicStar({ className, color = '#fff' }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <path d="M30 0 Q34 24 60 30 Q34 36 30 60 Q26 36 0 30 Q26 24 30 0 Z" fill={color} stroke="#2b2350" strokeWidth="2.5" />
    </svg>
  )
}

// ⬡ Hexagone gaming en 3D (relief coloré + ombre dessous).
function Hexagon({ className, color, dark }) {
  return (
    <svg viewBox="0 0 100 94" className={className} aria-hidden="true">
      <polygon points="50,10 93,32 93,68 50,90 7,68 7,32" fill={dark} />
      <polygon points="50,4 93,26 93,62 50,84 7,62 7,26" fill={color} stroke="#2b2350" strokeWidth="2" />
    </svg>
  )
}

// ◆ Losange gaming en 3D.
function Diamond({ className, color, dark }) {
  return (
    <svg viewBox="0 0 90 96" className={className} aria-hidden="true">
      <polygon points="45,10 88,47 45,90 2,47" fill={dark} />
      <polygon points="45,4 88,41 45,84 2,41" fill={color} stroke="#2b2350" strokeWidth="2" />
    </svg>
  )
}

// ▲ Triangle gaming en 3D.
function Triangle({ className, color, dark }) {
  return (
    <svg viewBox="0 0 100 96" className={className} aria-hidden="true">
      <polygon points="50,12 96,90 4,90" fill={dark} />
      <polygon points="50,4 96,82 4,82" fill={color} stroke="#2b2350" strokeWidth="2" />
    </svg>
  )
}

// 🎊 Confettis colorés figés (décor).
const CONFETTI = [
  { top: '8%', left: '22%', rot: -18, color: 'var(--rose)', shape: 'rect' },
  { top: '14%', left: '46%', rot: 30, color: 'var(--vert)', shape: 'circle' },
  { top: '6%', left: '68%', rot: 12, color: 'var(--bleu)', shape: 'rect' },
  { top: '30%', left: '4%', rot: -30, color: 'var(--orange)', shape: 'circle' },
  { top: '46%', left: '90%', rot: 20, color: 'var(--violet)', shape: 'rect' },
  { top: '62%', left: '14%', rot: 40, color: 'var(--bleu)', shape: 'rect' },
  { top: '70%', left: '54%', rot: -12, color: 'var(--rose)', shape: 'circle' },
  { top: '80%', left: '80%', rot: 16, color: 'var(--vert)', shape: 'rect' },
  { top: '20%', left: '86%', rot: -22, color: 'var(--orange)', shape: 'circle' },
  { top: '90%', left: '30%', rot: 8, color: 'var(--violet)', shape: 'rect' },
]

// Décor de fond partagé par toutes les pages.
//  - Hors saison : direction artistique « Gaming Pop » (Fortnite/Brawl Stars) —
//    blobs de couleur pure, éclairs, étoiles BD, confettis, formes géométriques
//    3D et bonhommes costumés.
//  - Pendant une saison : décor immersif dédié (Jurassic Web, Zigzamland…) +
//    bonhommes qui prennent l'attitude de la saison via le thème CSS.
export default function Backdrop() {
  const { active, slug } = useSaison()

  const theme = active ? DECORS[slug] : null
  if (theme) {
    const { Decor, guys } = theme
    return (
      <div className="backdrop backdrop--saison" aria-hidden="true">
        <Decor />
        {/* Bonhommes : conservés mais discrets, ils prennent la teinte de la saison. */}
        <FallGuy className="guy guy--1" color={guys[0]} />
        <FallGuy className="guy guy--2" color={guys[1]} />
      </div>
    )
  }

  return (
    <div className="backdrop" aria-hidden="true">
      {/* Gros blobs de couleur pure qui débordent des bords */}
      <span className="blob blob--1" />
      <span className="blob blob--2" />
      <span className="blob blob--3" />
      <span className="blob blob--4" />

      {/* Éclairs ⚡ dans les coins */}
      <Bolt className="bolt bolt--1" />
      <Bolt className="bolt bolt--2" />

      {/* Étoiles BD qui explosent ici et là */}
      <ComicStar className="star star--1" color="#ffd23f" />
      <ComicStar className="star star--2" color="#fff" />
      <ComicStar className="star star--3" color="#ff8fc7" />

      {/* Confettis figés */}
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={`confetti confetti--${c.shape}`}
          style={{ top: c.top, left: c.left, background: c.color, transform: `rotate(${c.rot}deg)` }}
        />
      ))}

      {/* Formes géométriques gaming en 3D (remplacent les anneaux/orbes) */}
      <Hexagon className="geo geo--hex" color="var(--rose)" dark="var(--rose-fonce)" />
      <Diamond className="geo geo--diamond" color="var(--bleu)" dark="var(--bleu-fonce)" />
      <Triangle className="geo geo--tri" color="var(--vert)" dark="var(--vert-fonce)" />
      <Hexagon className="geo geo--hex2" color="var(--orange)" dark="var(--orange-fonce)" />

      {/* Bonhommes Fall Guys costumés qui flottent */}
      <FallGuy className="guy guy--1" color="#ff4d8d" costume="cape" />
      <FallGuy className="guy guy--2" color="#00bfff" costume="cowboy" />
      <FallGuy className="guy guy--3" color="#3dd68c" costume="shades" />
      <FallGuy className="guy guy--4" color="#ffcf3f" costume="crown" />
    </div>
  )
}
