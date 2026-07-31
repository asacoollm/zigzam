import MiniGuy from './MiniGuy'

// 👥 Contacts — trois bonhommes alignés côte à côte qui font signe de la main.
export default function IconContacts({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="59" rx="26" ry="3.2" fill="#2b2350" opacity="0.16" />

      <MiniGuy x="13" y="42" scale="0.68" color="#ff4d8d" shade="#d6276b" armR="up" eyes="happy" />
      <MiniGuy x="51" y="42" scale="0.68" color="#3dd68c" shade="#1f9d63" armL="up" eyes="happy" />
      <MiniGuy x="32" y="38" scale="0.86" color="#7c3aff" shade="#5a1fd4" armL="up" armR="up" eyes="happy" />
    </svg>
  )
}
