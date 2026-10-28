import './HalloweenDecor.css'

// ============================================================
//  Décor de la saison « Halloween 🎃 »
//  ------------------------------------------------------------
//  Ciel noir-violet avec un léger brouillard, une lune orange en haut à
//  droite, des toiles d'araignée dans les coins (avec de petites araignées
//  mignonnes qui descendent sur leur fil), des chauves-souris rigolotes qui
//  traversent l'écran de temps en temps, 2-3 fantômes mignons qui flottent,
//  et des citrouilles souriantes ancrées en bas de page.
//  Tout est en SVG / CSS ; les animations vivent dans HalloweenDecor.css.
//  Mignon et rigolo, jamais effrayant (public : élèves de 10 ans).
//  Rendu uniquement pendant la saison (cf. Backdrop.jsx).
// ============================================================

// ---- Lune orange, avec quelques cratères et un halo doux -------------
function Lune() {
  return (
    <svg className="hmoon__svg" viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill="#ff7a18" opacity="0.14" />
      <circle cx="80" cy="80" r="58" fill="#ffb066" opacity="0.18" />
      <circle cx="80" cy="80" r="46" fill="#ff7a18" stroke="#e8650a" strokeWidth="2" />
      {/* cratères, tout ronds et doux */}
      <circle cx="64" cy="62" r="7" fill="#e8650a" opacity="0.55" />
      <circle cx="96" cy="70" r="5" fill="#e8650a" opacity="0.5" />
      <circle cx="88" cy="98" r="8" fill="#e8650a" opacity="0.5" />
      <circle cx="60" cy="96" r="4" fill="#e8650a" opacity="0.45" />
    </svg>
  )
}

// ---- Toile d'araignée dans un coin, ancrée par 5 rayons + 4 arcs -------
function ToileAraignee() {
  const rayons = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 4) * (Math.PI / 2) // quart de cercle (coin)
    return [Math.cos(a) * 90, Math.sin(a) * 90]
  })
  return (
    <svg className="hweb__svg" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <g stroke="#e8e0ff" strokeWidth="1" opacity="0.4">
        {rayons.map(([x, y], i) => (
          <line key={i} x1="0" y1="0" x2={x} y2={y} />
        ))}
        {/* arcs concentriques, approximés par des quarts de cercle */}
        {[22, 42, 62, 82].map((r, i) => (
          <path key={i} d={`M0 ${r} A ${r} ${r} 0 0 1 ${r} 0`} fill="none" />
        ))}
      </g>
    </svg>
  )
}

// ---- Petite araignée mignonne : corps rond + 2 gros yeux + pattes -----
function Araignee() {
  return (
    <svg viewBox="0 0 40 36" fill="none" aria-hidden="true">
      {/* pattes, courbes douces */}
      <g stroke="#2a2040" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M14 18 Q4 14 2 8" />
        <path d="M14 20 Q3 20 1 20" />
        <path d="M14 22 Q4 26 3 32" />
        <path d="M26 18 Q36 14 38 8" />
        <path d="M26 20 Q37 20 39 20" />
        <path d="M26 22 Q36 26 37 32" />
      </g>
      {/* corps */}
      <circle cx="20" cy="20" r="9" fill="#3a2d5c" />
      <circle cx="20" cy="11" r="5.5" fill="#3a2d5c" />
      {/* grands yeux mignons */}
      <circle cx="17.5" cy="10" r="2.1" fill="#fff" />
      <circle cx="22.5" cy="10" r="2.1" fill="#fff" />
      <circle cx="17.8" cy="10.3" r="1.1" fill="#1a1430" />
      <circle cx="22.8" cy="10.3" r="1.1" fill="#1a1430" />
    </svg>
  )
}

// ---- Chauve-souris rigolote : ailes qui battent, bouille ronde --------
function ChauveSouris() {
  return (
    <svg className="hbat__svg" viewBox="0 0 80 50" fill="none" aria-hidden="true">
      <g className="hbat__wing hbat__wing--l">
        <path d="M38 24 Q18 6 2 10 Q14 16 18 24 Q10 26 0 24 Q12 34 32 28 Z" fill="#3a2d5c" />
      </g>
      <g className="hbat__wing hbat__wing--r">
        <path d="M42 24 Q62 6 78 10 Q66 16 62 24 Q70 26 80 24 Q68 34 48 28 Z" fill="#3a2d5c" />
      </g>
      {/* corps + tête, tout rond et sympathique */}
      <circle cx="40" cy="26" r="9" fill="#4a3a74" />
      <path d="M33 19 l2 -6 4 4Z" fill="#4a3a74" />
      <path d="M47 19 l-2 -6 -4 4Z" fill="#4a3a74" />
      <circle cx="36.5" cy="25" r="2" fill="#fff" />
      <circle cx="43.5" cy="25" r="2" fill="#fff" />
      <circle cx="36.8" cy="25.3" r="1" fill="#1a1430" />
      <circle cx="43.2" cy="25.3" r="1" fill="#1a1430" />
      {/* petit sourire, pas de crocs effrayants */}
      <path d="M37 30 Q40 32 43 30" stroke="#1a1430" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ---- Fantôme tout mignon : forme arrondie, grands yeux, sourit --------
function Fantome() {
  return (
    <svg className="hghost__svg" viewBox="0 0 60 64" fill="none" aria-hidden="true">
      <path
        d="M30 2 C14 2 4 14 4 30 L4 56 Q9 50 14 56 Q19 50 24 56 Q27 52 30 56 Q33 52 36 56 Q41 50 46 56 Q51 50 56 56 L56 30 C56 14 46 2 30 2 Z"
        fill="#fff4e0" opacity="0.92"
      />
      <circle cx="21" cy="28" r="3.4" fill="#2b1750" />
      <circle cx="39" cy="28" r="3.4" fill="#2b1750" />
      <path d="M24 38 Q30 44 36 38" stroke="#2b1750" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* petites joues roses, pour le côté mignon */}
      <circle cx="14" cy="34" r="3" fill="#ff9fb0" opacity="0.45" />
      <circle cx="46" cy="34" r="3" fill="#ff9fb0" opacity="0.45" />
    </svg>
  )
}

// ---- Citrouille souriante : côtes, tige verte, visage sculpté doux ----
function Citrouille() {
  return (
    <svg className="hpumpkin__svg" viewBox="0 0 70 60" fill="none" aria-hidden="true">
      <path d="M35 10 Q38 2 42 6 Q39 8 38 12" stroke="#4a7a2a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="35" cy="36" rx="32" ry="22" fill="#ff7a18" />
      <g stroke="#e8650a" strokeWidth="2" opacity="0.65">
        <path d="M17 16 Q13 36 17 56" fill="none" />
        <path d="M26 13 Q22 36 26 58" fill="none" />
        <path d="M44 13 Q48 36 44 58" fill="none" />
        <path d="M53 16 Q57 36 53 56" fill="none" />
      </g>
      {/* visage sculpté lumineux, rigolo (pas de crocs pointus) */}
      <g className="hpumpkin__glow" fill="#fff4e0">
        <path d="M18 32 L26 32 L22 40 Z" />
        <path d="M44 32 L52 32 L48 40 Z" />
        <path d="M16 46 Q35 56 54 46 Q35 50 16 46 Z" />
      </g>
    </svg>
  )
}

// Positions des toiles (coins) : haut-gauche et haut-droit.
const TOILES = [
  { cls: 'hweb--tl', fil: 'hweb__fil--tl', spiderDelay: 0 },
  { cls: 'hweb--tr', fil: 'hweb__fil--tr', spiderDelay: 6 },
]

// Chauves-souris : { top %, délai, durée du vol traversant }.
const CHAUVES_SOURIS = [
  [18, 0, 22],
  [46, 9, 26],
  [68, 16, 24],
]

// Fantômes flottants : { gauche %, haut %, taille px, délai }.
const FANTOMES = [
  [10, 30, 56, 0],
  [82, 55, 46, 3],
  [50, 16, 38, 6],
]

// Citrouilles au sol : { gauche % }.
const CITROUILLES = [12, 32, 68, 88]

export default function HalloweenDecor() {
  return (
    <div className="hdecor" aria-hidden="true">
      {/* Fond dégradé noir-violet + léger brouillard */}
      <div className="hdecor__sky" />
      <div className="hdecor__fog">
        <span className="hfog hfog--1" />
        <span className="hfog hfog--2" />
      </div>

      {/* Lune orange, en haut à droite */}
      <div className="hmoon"><Lune /></div>

      {/* Toiles d'araignée dans les coins, avec leur petite araignée */}
      {TOILES.map((t) => (
        <div key={t.cls} className={`hweb ${t.cls}`}>
          <ToileAraignee />
          <div className={`hweb__fil ${t.fil}`}>
            <span
              className="hweb__spider"
              style={{ animationDelay: `${t.spiderDelay}s` }}
            >
              <Araignee />
            </span>
          </div>
        </div>
      ))}

      {/* Chauves-souris qui traversent l'écran de temps en temps */}
      {CHAUVES_SOURIS.map(([top, delay, dur], i) => (
        <div
          key={i}
          className={`hbat hbat--${i}`}
          style={{ top: `${top}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
        >
          <ChauveSouris />
        </div>
      ))}

      {/* Fantômes mignons qui flottent lentement */}
      {FANTOMES.map(([l, t, s, d], i) => (
        <span
          key={i}
          className={`hghost hghost--${i}`}
          style={{ left: `${l}%`, top: `${t}%`, width: `${s}px`, height: `${s * 64 / 60}px`, animationDelay: `${d}s` }}
        >
          <Fantome />
        </span>
      ))}

      {/* Citrouilles souriantes, ancrées en bas de page */}
      <div className="hpumpkins">
        {CITROUILLES.map((l, i) => (
          <span key={i} className={`hpumpkin hpumpkin--${i}`} style={{ left: `${l}%` }}>
            <Citrouille />
          </span>
        ))}
      </div>
    </div>
  )
}
