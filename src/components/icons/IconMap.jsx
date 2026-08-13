// 🗺️ Map Zigzam — icône de tuile dashboard (emoji, même patron que IconPoupers).
export default function IconMap({ className = '' }) {
  return (
    <span
      className={className}
      role="img"
      aria-label="Map Zigzam"
      style={{
        fontSize: '40px', lineHeight: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
      }}
    >
      🗺️
    </span>
  )
}
