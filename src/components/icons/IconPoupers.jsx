// 🪆 Poupers Collectore — icône de tuile dashboard (emoji, cohérent avec
// le style des autres icônes SVG mais bien plus simple : une poupée vaudou
// n'a pas besoin d'un dessin sur mesure pour être reconnaissable).
export default function IconPoupers({ className = '' }) {
  return (
    <span
      className={className}
      role="img"
      aria-label="Poupers"
      style={{
        fontSize: '40px', lineHeight: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
      }}
    >
      🪆
    </span>
  )
}
