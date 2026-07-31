import MiniGuy from './MiniGuy'

// 💬 Discuter — deux bonhommes qui se font face, bulles de dialogue entre eux.
export default function IconDiscuter({ className = '' }) {
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
        <linearGradient id="disc-bubble1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#ffd6e6" />
        </linearGradient>
        <linearGradient id="disc-bubble2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6f4ff" />
          <stop offset="1" stopColor="#8fe0ff" />
        </linearGradient>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="32" cy="60" rx="22" ry="3.2" fill="#2b2350" opacity="0.16" />

      {/* Bulle ronde (à gauche) */}
      <circle cx="21" cy="15" r="8.5" fill="url(#disc-bubble1)" stroke="#2b2350" strokeWidth="2" />
      <path d="M18 22 L14 28 L22 23 Z" fill="url(#disc-bubble1)" stroke="#2b2350" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="17.5" cy="15" r="1.6" fill="#ff4d8d" opacity="0.7" />
      <circle cx="21.5" cy="15" r="1.6" fill="#ff4d8d" opacity="0.7" />
      <circle cx="25.5" cy="15" r="1.6" fill="#ff4d8d" opacity="0.7" />

      {/* Bulle rectangulaire (à droite) */}
      <rect x="34" y="6" width="20" height="14" rx="6" fill="url(#disc-bubble2)" stroke="#2b2350" strokeWidth="2" />
      <path d="M40 20 L36 26 L45 21 Z" fill="url(#disc-bubble2)" stroke="#2b2350" strokeWidth="2" strokeLinejoin="round" />
      <line x1="38" y1="11" x2="50" y2="11" stroke="#2b7fb0" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <line x1="38" y1="15" x2="46" y2="15" stroke="#2b7fb0" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* Bonhomme rose à gauche */}
      <MiniGuy x="17" y="42" scale="0.86" color="#ff4d8d" shade="#d6276b" eyes="happy" />
      {/* Bonhomme bleu à droite */}
      <MiniGuy x="47" y="42" scale="0.86" color="#00bfff" shade="#009fe0" eyes="happy" />
    </svg>
  )
}
