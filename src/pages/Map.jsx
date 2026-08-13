import { useNavigate } from 'react-router-dom'
import { useSaison } from '../context/SaisonContext'
import { isSaisonActive } from '../lib/saison'
import { PAYS_PERMANENTS, PAYS_SAISONNIERS } from '../data/mapPays'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import './Map.css'

// ============================================================
//  Map Zigzam 🗺️ — grande carte SVG du monde, une île par pays.
//   - 6 pays permanents, toujours visibles.
//   - 2 pays saisonniers (Jurassic Web, Zigzamland Paris), affichés
//     seulement quand leur saison est active en base.
//   - Survol : halo lumineux + léger zoom. Clic : navigation /map/:slug.
//  Les illustrations sont volontairement simples (silhouettes + accents),
//  chaque pays reste identifiable par sa couleur et son emoji.
// ============================================================

// — Base commune : silhouette d'île « patatoïde » réutilisée par tous les
//   pays, seule la couleur change. Les accents du biome viennent par-dessus.
function IlotBase({ fill, stroke }) {
  return (
    <path
      d="M-95 55 C-96 18 -58 2 -18 8 C12 -12 55 -10 76 14 C102 22 102 54 70 63 C28 77 -60 76 -95 55 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="4"
      strokeLinejoin="round"
    />
  )
}

function ArtIleDoree() {
  return (
    <>
      <IlotBase fill="#ffe9a8" stroke="#e8b04b" />
      {[-30, 20].map((x) => (
        <g key={x} transform={`translate(${x} -8)`}>
          <path d="M0 40 Q-6 6 4 -30" fill="none" stroke="#a9762f" strokeWidth="5" strokeLinecap="round" />
          <g fill="#3dd68c" stroke="#1f9d63" strokeWidth="2">
            <ellipse cx="-14" cy="-36" rx="16" ry="8" transform="rotate(-25 -14 -36)" />
            <ellipse cx="14" cy="-36" rx="16" ry="8" transform="rotate(25 14 -36)" />
            <ellipse cx="0" cy="-42" rx="16" ry="8" />
            <ellipse cx="-10" cy="-30" rx="14" ry="7" transform="rotate(-55 -10 -30)" />
            <ellipse cx="10" cy="-30" rx="14" ry="7" transform="rotate(55 10 -30)" />
          </g>
        </g>
      ))}
      <g fill="#fff" opacity="0.85">
        <circle cx="-58" cy="32" r="3" />
        <circle cx="-45" cy="40" r="2.4" />
        <circle cx="55" cy="38" r="3" />
      </g>
    </>
  )
}

function ArtTerreDeLave() {
  return (
    <>
      <IlotBase fill="#4a3226" stroke="#2a1a12" />
      {[{ x: -30, s: 1 }, { x: 28, s: 0.8 }].map(({ x, s }, i) => (
        <g key={i} transform={`translate(${x} 10) scale(${s})`}>
          <path d="M-38 40 L-6 -42 Q0 -50 6 -42 L38 40 Z" fill="#6b4630" stroke="#2a1a12" strokeWidth="4" strokeLinejoin="round" />
          <path d="M-6 -42 Q0 -50 6 -42 L14 -22 Q0 -14 -14 -22 Z" fill="#3a2418" />
          <path d="M0 -38 Q-8 -6 0 30 Q8 -6 0 -38 Z" fill="#ff8a3f" />
          <path d="M0 -30 Q-4 -6 0 18 Q4 -6 0 -30 Z" fill="#ffd23f" />
        </g>
      ))}
      <ellipse className="map__smoke" cx="-30" cy="-64" rx="12" ry="9" fill="#cbb9ae" opacity="0.55" />
      <ellipse className="map__smoke map__smoke--b" cx="28" cy="-56" rx="10" ry="7" fill="#cbb9ae" opacity="0.5" />
    </>
  )
}

function ArtRoyaumeGlace() {
  return (
    <>
      <IlotBase fill="#eaf7ff" stroke="#8fd0f0" />
      {[{ x: -28, h: 60 }, { x: 22, h: 46 }].map(({ x, h }, i) => (
        <path
          key={i}
          d={`M${x - 34} 46 L${x} ${46 - h} L${x + 34} 46 Z`}
          fill="#dff3ff"
          stroke="#7cc4e8"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      ))}
      <path d="M-56 40 L-28 -14 L0 40 Z" fill="#fff" opacity="0.7" />
      <g stroke="#bfeaff" strokeWidth="2" opacity="0.9">
        <path d="M-70 20 l10 10 M-60 20 l-10 10 M-65 12 v18" />
        <path d="M52 34 l8 8 M44 34 l-8 8 M48 28 v16" />
      </g>
    </>
  )
}

function ArtDesertDeSable() {
  return (
    <>
      <IlotBase fill="#f0c877" stroke="#c98f3a" />
      <path d="M-95 44 Q-50 18 0 40 Q45 58 95 32 L95 63 Q28 77 -60 76 Q-90 68 -95 55 Z" fill="#f7dd9e" opacity="0.85" />
      <g transform="translate(-8 -6)">
        <rect x="-6" y="-38" width="12" height="52" rx="6" fill="#3f9d5c" />
        <path d="M-6 -14 Q-30 -18 -28 -34" fill="none" stroke="#3f9d5c" strokeWidth="8" strokeLinecap="round" />
        <path d="M6 -22 Q28 -26 27 -40" fill="none" stroke="#3f9d5c" strokeWidth="8" strokeLinecap="round" />
      </g>
      <g stroke="#ffd23f" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M60 -50 l10 -10 M74 -46 l14 -4 M64 -62 l4 -14" />
      </g>
    </>
  )
}

function ArtForetMystique() {
  return (
    <>
      <IlotBase fill="#bff0c8" stroke="#3dd68c" />
      {[{ x: -46, s: 0.85 }, { x: 0, s: 1.05 }, { x: 42, s: 0.9 }].map(({ x, s }, i) => (
        <g key={i} transform={`translate(${x} 0) scale(${s})`}>
          <rect x="-4" y="4" width="8" height="26" fill="#6b4630" />
          <circle cx="0" cy="-14" r="26" fill="#2d8b2d" stroke="#1c5e26" strokeWidth="3" />
          <circle cx="-9" cy="-22" r="9" fill="#3dd68c" opacity="0.7" />
        </g>
      ))}
      <g fill="#ffe9a8">
        <circle cx="-70" cy="10" r="3" className="map__firefly" />
        <circle cx="60" cy="-4" r="2.6" className="map__firefly map__firefly--b" />
        <circle cx="15" cy="30" r="2.4" className="map__firefly" />
      </g>
    </>
  )
}

function ArtCiteNeon() {
  return (
    <>
      <IlotBase fill="#2b2350" stroke="#181233" />
      {[
        { x: -50, w: 26, h: 60, c: '#ff4d8d' },
        { x: -16, w: 22, h: 82, c: '#7c3aff' },
        { x: 14, w: 24, h: 66, c: '#00bfff' },
        { x: 44, w: 20, h: 48, c: '#ff8c42' },
      ].map(({ x, w, h, c }, i) => (
        <g key={i}>
          <rect x={x - w / 2} y={40 - h} width={w} height={h} rx="3" fill="#1c1740" stroke={c} strokeWidth="2.5" />
          {Array.from({ length: Math.max(1, Math.floor(h / 16)) }).map((_, r) => (
            <rect key={r} x={x - w / 2 + 4} y={40 - h + 8 + r * 16} width={w - 8} height="6" fill={c} opacity="0.8" />
          ))}
        </g>
      ))}
    </>
  )
}

function ArtJurassicWeb() {
  return (
    <>
      <IlotBase fill="#bff0c8" stroke="#3dd68c" />
      <path d="M-30 40 L-40 -10 Q-42 -34 -20 -40 Q4 -46 12 -24 L18 40 Z" fill="#2f8a3d" stroke="#1c5e26" strokeWidth="3" />
      <circle cx="-14" cy="-30" r="3.4" fill="#fff" />
      <circle cx="-13" cy="-30" r="1.8" fill="#0a2e0a" />
      <g fill="none" stroke="#1c6e2e" strokeWidth="3" strokeLinecap="round">
        <path d="M40 40 Q42 4 50 -20" />
        <path d="M50 -20 q10 -6 14 -16 M50 -12 q12 0 18 -8 M50 -4 q12 4 20 0" />
      </g>
      <ellipse cx="60" cy="30" rx="12" ry="16" fill="#e6f5c8" stroke="#8bc34a" strokeWidth="2.5" />
    </>
  )
}

function ArtZigzamlandParis() {
  return (
    <>
      <IlotBase fill="#ffe3f3" stroke="#e8a8c8" />
      <g transform="translate(0 -4)">
        <rect x="-24" y="-30" width="48" height="46" fill="#c9a8ff" stroke="#7c3aff" strokeWidth="3" />
        {[-24, 24].map((x) => (
          <g key={x}>
            <rect x={x - 7} y="-52" width="14" height="26" fill="#c9a8ff" stroke="#7c3aff" strokeWidth="3" />
            <path d={`M${x - 9} -52 L${x} -66 L${x + 9} -52 Z`} fill="#ff4d8d" stroke="#d6276b" strokeWidth="2.5" />
          </g>
        ))}
        <path d="M0 -30 L-9 -46 L9 -46 Z" fill="#ffd76a" stroke="#e8a800" strokeWidth="2.5" />
        <rect x="-6" y="-6" width="12" height="16" fill="#7c3aff" />
      </g>
      <g fill="#ffd76a" className="map__sparkle">
        <path d="M-58 10 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
        <path d="M58 -6 l2.4 6.4 6.4 2.4 -6.4 2.4 -2.4 6.4 -2.4 -6.4 -6.4 -2.4 6.4 -2.4 Z" />
      </g>
    </>
  )
}

const ART = {
  'ile-doree': ArtIleDoree,
  'terre-de-lave': ArtTerreDeLave,
  'royaume-glace': ArtRoyaumeGlace,
  'desert-de-sable': ArtDesertDeSable,
  'foret-mystique': ArtForetMystique,
  'cite-neon': ArtCiteNeon,
  'jurassic-web': ArtJurassicWeb,
  'zigzamland-paris': ArtZigzamlandParis,
}

// Vague décorative répétée horizontalement (tuile ~100px de large).
const WAVE_D = 'M-50,0 Q0,-14 50,0 T150,0 T250,0 T350,0 T450,0 T550,0 T650,0 T750,0 T850,0 T950,0 T1050,0'

function Zone({ pays, navigate }) {
  const go = () => navigate(`/map/${pays.slug}`)
  return (
    <g transform={`translate(${pays.cx} ${pays.cy})`}>
      <g
        className="map__zone"
        style={{ '--zone-glow': pays.couleur }}
        role="button"
        tabIndex={0}
        aria-label={`Aller à ${pays.nom}`}
        onClick={go}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } }}
      >
        <circle className="map__halo" r="98" />
        <ellipse className="map__shadow" cx="0" cy="74" rx="92" ry="16" />
        {ART[pays.slug]()}
        <circle className="map__badge" cy="-72" r="27" />
        <text className="map__badge-emoji" y="-72" textAnchor="middle" dominantBaseline="central">{pays.emoji}</text>
        <text className="map__label" y="98" textAnchor="middle" dominantBaseline="hanging">
          {pays.nomLignes.map((ligne, i) => (
            <tspan key={ligne} x="0" dy={i === 0 ? 0 : '1.1em'}>{ligne}</tspan>
          ))}
        </text>
      </g>
    </g>
  )
}

export default function Map() {
  const navigate = useNavigate()
  const { saisons } = useSaison()

  const paysSaisonniersActifs = PAYS_SAISONNIERS.filter((p) => (
    isSaisonActive(saisons?.find((s) => s.slug === p.saisonSlug))
  ))

  return (
    <div className="map">
      <Backdrop />

      <header className="map__top">
        <button className="map__retour" onClick={() => navigate('/dashboard')}>⬅️ Retour</button>
        <ZigzamLogo size="sm" />
        <span />
      </header>

      <h1 className="map__titre stroke-title">🗺️ Map Zigzam</h1>
      <p className="map__sous-titre">Explore les pays de Zigzam et pars à l'aventure !</p>

      <div className="map__scene-wrap">
        <svg className="map__scene" viewBox="0 0 1100 920" role="img" aria-label="Carte du monde de Zigzam">
          <defs>
            <linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8fe3ff" />
              <stop offset="1" stopColor="#c8f3ff" />
            </linearGradient>
            <linearGradient id="mapSea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5cc8f0" />
              <stop offset="1" stopColor="#2f8fd6" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="1100" height="320" fill="url(#mapSky)" />
          <rect x="0" y="290" width="1100" height="630" fill="url(#mapSea)" />

          <g className="map__sun" transform="translate(980 110)">
            <circle r="46" fill="#ffd23f" stroke="#f0a800" strokeWidth="3" />
            <g stroke="#ffd23f" strokeWidth="6" strokeLinecap="round">
              <path d="M0 -46 v-18 M0 46 v18 M-46 0 h-18 M46 0 h18" />
              <path d="M-33 -33 l-13 -13 M33 33 l13 13 M33 -33 l13 -13 M-33 33 l-13 -13" />
            </g>
          </g>

          {[
            { cx: 150, cy: 80, s: 1 },
            { cx: 520, cy: 55, s: 0.8 },
            { cx: 830, cy: 100, s: 0.55 },
          ].map((c, i) => (
            <g key={i} className={`map__cloud map__cloud--${i}`} transform={`translate(${c.cx} ${c.cy}) scale(${c.s})`}>
              <ellipse cx="-30" cy="6" rx="30" ry="18" fill="#fff" />
              <ellipse cx="10" cy="-6" rx="36" ry="24" fill="#fff" />
              <ellipse cx="50" cy="8" rx="26" ry="16" fill="#fff" />
              <rect x="-58" y="6" width="130" height="18" rx="9" fill="#fff" />
            </g>
          ))}

          {[330, 430, 530, 630, 730, 830].map((y, i) => (
            <path
              key={y}
              className={`map__wave map__wave--${i % 2}`}
              d={WAVE_D}
              transform={`translate(-50 ${y})`}
              stroke="#fff"
              strokeWidth="3"
              fill="none"
              opacity={0.22 - i * 0.02}
            />
          ))}

          {PAYS_PERMANENTS.map((p) => (
            <Zone key={p.slug} pays={p} navigate={navigate} />
          ))}
          {paysSaisonniersActifs.map((p) => (
            <Zone key={p.slug} pays={p} navigate={navigate} />
          ))}
        </svg>
      </div>
    </div>
  )
}
