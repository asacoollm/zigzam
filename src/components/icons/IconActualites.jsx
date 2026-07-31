import MiniGuy from './MiniGuy'

// 📰 Actualités — bonhomme violet qui tient un journal déplié avec une une illustrée.
export default function IconActualites({ className = '' }) {
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
        <linearGradient id="actu-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#f0ecff" />
        </linearGradient>
      </defs>

      <ellipse cx="32" cy="60" rx="20" ry="3" fill="#2b2350" opacity="0.16" />

      {/* Bonhomme violet, bras levés tenant le journal */}
      <MiniGuy x="32" y="46" scale="0.95" color="#7c3aff" shade="#5a1fd4" armL="up" armR="up" eyes="happy" />

      {/* Journal déplié, double page */}
      <g>
        <path d="M12 14 L31 10 L31 40 L12 44 Z" fill="url(#actu-paper)" stroke="#2b2350" strokeWidth="2" strokeLinejoin="round" />
        <path d="M52 14 L33 10 L33 40 L52 44 Z" fill="url(#actu-paper)" stroke="#2b2350" strokeWidth="2" strokeLinejoin="round" />
        <path d="M31 10 L33 10 L33 40 L31 40 Z" fill="#d6c2ff" opacity="0.6" />

        {/* Photo en une, colorée */}
        <rect x="15.5" y="15" width="12" height="9" rx="1.5" fill="#ff8c42" stroke="#2b2350" strokeWidth="1.4" />
        <path d="M16 22.5 L20 18.5 L23 21.5 L25.5 18.8 L27 22.5 Z" fill="#ffd23f" />
        <circle cx="24" cy="17.5" r="1.4" fill="#fff" />

        {/* Lignes de texte, colonne gauche */}
        <line x1="15.5" y1="27" x2="27.5" y2="26.3" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        <line x1="15.5" y1="30.5" x2="27.5" y2="29.8" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
        <line x1="15.5" y1="34" x2="24" y2="33.5" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />

        {/* Lignes de texte, colonne droite */}
        <line x1="37" y1="17" x2="48.5" y2="16.3" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
        <line x1="37" y1="20.5" x2="48.5" y2="19.8" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
        <line x1="37" y1="24" x2="46" y2="23.4" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
        <line x1="37" y1="28.5" x2="48.5" y2="27.8" stroke="#ff4d8d" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
        <line x1="37" y1="32" x2="44" y2="31.5" stroke="#7c3aff" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  )
}
