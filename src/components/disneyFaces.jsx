// ============================================================
//  🏰 DISNEY MAGIC — visages, accessoires et couleurs de saison
//  Repère du bonhomme : viewBox 0 -24 120 192, centre x=60.
//  - Yeux par défaut : cx 49 / 71, cy 60, r 6.5 (dessinés AVANT ces couches)
//  - Panneau visage blanc : rect x33 y42 w54 h36 rx18
//  - Bras droit x101..116 / y58..104, main ~ (106,96)
//  Trois exports :
//    • DISNEY_FACE       → fonctions sans argument renvoyant un <g> (bouches / visages)
//    • DISNEY_SPORT      → fonctions sans argument renvoyant un <g> (objets tenus à droite)
//    • DisneyColorDefs   → composant de <defs> (dégradés / motifs de couleur de corps)
//  ⚠ Aucun gradient avec id dans DISNEY_FACE / DISNEY_SPORT (risque de collision) :
//    uniquement des aplats et des opacités.
// ============================================================

// Palette locale de la saison Disney.
const D = {
  noir: '#2b2350', encre: '#1b1533', blanc: '#ffffff', creme: '#fff6e6',
  rose: '#ff8fc4', roseF: '#e04f96', rouge: '#e01b3c', rougeF: '#a3102a',
  mauve: '#a05bd6', mauveF: '#6b2fa0', or: '#ffcf3f', orF: '#c98a17',
  argent: '#e8edf5', argentF: '#98a4b8', bois: '#8a5a2b', boisF: '#5b3a1c',
  pierre: '#9aa3b2', pierreF: '#6b7280', brun: '#4a3220', peau: '#ffd9b0',
}

// ----------------------------------------------------------------
//  VISAGES DISNEY
//  Rendus APRÈS les yeux par défaut : on peut donc les recouvrir.
// ----------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const DISNEY_FACE = {
  // Yeux Bambi : grands yeux de biche, longs cils recourbés, reflets doux.
  dbambi: () => (
    <g>
      {/* grands yeux sombres par-dessus les yeux par défaut */}
      <ellipse cx="49" cy="60" rx="8.5" ry="9.2" fill="#3b2a1c" stroke={D.encre} strokeWidth="1.2" />
      <ellipse cx="71" cy="60" rx="8.5" ry="9.2" fill="#3b2a1c" stroke={D.encre} strokeWidth="1.2" />
      {/* iris chaud + reflets */}
      <ellipse cx="49" cy="61" rx="5.4" ry="6" fill="#6b4526" />
      <ellipse cx="71" cy="61" rx="5.4" ry="6" fill="#6b4526" />
      <circle cx="46.6" cy="56.8" r="2.6" fill={D.blanc} />
      <circle cx="68.6" cy="56.8" r="2.6" fill={D.blanc} />
      <circle cx="51.6" cy="63.4" r="1.3" fill={D.blanc} opacity="0.75" />
      <circle cx="73.6" cy="63.4" r="1.3" fill={D.blanc} opacity="0.75" />
      {/* paupières + longs cils recourbés */}
      <g stroke={D.encre} strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d="M40.5 55 q8.5 -6 17 -1" />
        <path d="M62.5 54 q8.5 -5 17 1" />
        <path d="M40.6 54.6 q-3.4 -1.6 -4.6 -4.6" />
        <path d="M44.6 51.8 q-2 -2.6 -2.4 -5.4" />
        <path d="M49.4 50.6 q-0.6 -2.8 0.4 -5.2" />
        <path d="M79.4 55.6 q3.4 -1.6 4.6 -4.6" />
        <path d="M75.4 52.4 q2 -2.6 2.4 -5.4" />
        <path d="M70.6 50.8 q0.6 -2.8 -0.4 -5.2" />
      </g>
      {/* petite bouche timide */}
      <path d="M56 73 q4 3.5 8 0" stroke={D.encre} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="41" cy="70" rx="4.5" ry="3" fill={D.rose} opacity="0.5" />
      <ellipse cx="79" cy="70" rx="4.5" ry="3" fill={D.rose} opacity="0.5" />
    </g>
  ),

  // Sourire Cheshire : un sourire immense d'un coin à l'autre du visage.
  dcheshire: () => (
    <g>
      {/* lèvres roses/mauves */}
      <path d="M35 66 Q60 92 85 66 Q60 76 35 66 Z" fill={D.mauveF} stroke={D.encre} strokeWidth="1.6" />
      <path d="M35 66 Q60 90 85 66 Q60 74 35 66 Z" fill="#c94fa8" />
      {/* rangée de dents du haut */}
      <g fill={D.blanc} stroke="#d9d3ea" strokeWidth="0.5">
        {[36, 43, 50, 57, 64, 71, 78].map((x, i) => (
          <path key={`h${i}`} d={`M${x} 67 l3.4 0 l-0.4 ${5.5 - Math.abs(i - 3) * 0.7} l-2.6 0 Z`} />
        ))}
      </g>
      {/* rangée de dents du bas */}
      <g fill={D.blanc} stroke="#d9d3ea" strokeWidth="0.5">
        {[40, 47, 54, 61, 68, 75].map((x, i) => (
          <path key={`b${i}`} d={`M${x} ${80 - Math.abs(i - 2.5) * 2.4} l3.2 ${-Math.abs(i - 2.5) * 0.4} l-0.4 -5 l-2.4 0 Z`} />
        ))}
      </g>
      {/* commissures + brillant des lèvres */}
      <path d="M35 66 q25 26 50 0" stroke={D.encre} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M44 84 q7 4 14 2" stroke={D.rose} strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round" />
    </g>
  ),

  // Taches Dalmatien : taches noires irrégulières + museau et bouche de chiot.
  ddalmatien: () => (
    <g>
      <g fill={D.encre}>
        <path d="M36 46 q5 -3 8 1 q2 4 -2 6 q-6 2 -7 -3 Z" />
        <path d="M78 44 q6 -2 8 3 q1 5 -4 5 q-6 0 -5 -5 Z" />
        <path d="M35 68 q6 -3 8 2 q1 6 -5 6 q-5 -1 -4 -6 Z" />
        <path d="M80 70 q6 -1 6 4 q0 5 -5 4 q-5 -1 -4 -6 Z" />
        {/* Pas de tache entre les deux yeux : de la même encre que les
            pupilles, elle brouillait complètement la lecture du visage.
            Les taches restent cantonnées aux coins du panneau. */}
        <ellipse cx="45" cy="79" rx="3" ry="2.2" />
        <ellipse cx="76" cy="80" rx="2.6" ry="2" />
      </g>
      {/* museau de chiot */}
      <ellipse cx="60" cy="70" rx="7" ry="5" fill={D.creme} opacity="0.9" />
      <path d="M55.5 67.5 q4.5 -3.4 9 0 q-1 4 -4.5 4 q-3.5 0 -4.5 -4 Z" fill={D.encre} />
      <circle cx="57.6" cy="68.4" r="1" fill={D.blanc} opacity="0.6" />
      {/* bouche de chiot + petite langue */}
      <path d="M60 71.5 v3" stroke={D.encre} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M53 74.5 q7 6 7 0 q0 6 7 -0.5" stroke={D.encre} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M57 78 q3 6 6 0 q-3 -1.6 -6 0 Z" fill={D.rose} />
    </g>
  ),

  // Maquillage Cruella : lèvres rouge vif, fards sombres angulaires, sourcils fins.
  dcruellamaq: () => (
    <g>
      {/* fards à paupières sombres et angulaires */}
      <path d="M40 56 L50 49 L58 55 L56 58 L48 54 L42 59 Z" fill={D.mauveF} opacity="0.95" />
      <path d="M80 56 L70 49 L62 55 L64 58 L72 54 L78 59 Z" fill={D.mauveF} opacity="0.95" />
      <path d="M41 57 L49 51 L56 56" stroke={D.encre} strokeWidth="1.4" fill="none" />
      <path d="M79 57 L71 51 L64 56" stroke={D.encre} strokeWidth="1.4" fill="none" />
      {/* trait d'eye-liner relevé */}
      <path d="M42.5 63.5 q6 4 13 -2 l4 -3" stroke={D.encre} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M77.5 63.5 q-6 4 -13 -2 l-4 -3" stroke={D.encre} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* sourcils fins et arqués */}
      <path d="M39 48 Q48 41 58 46" stroke={D.encre} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M81 48 Q72 41 62 46" stroke={D.encre} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* lèvres rouges pulpeuses */}
      <path d="M49 72 Q54 66 60 70 Q66 66 71 72 Q66 81 60 81 Q54 81 49 72 Z" fill={D.rouge} stroke={D.rougeF} strokeWidth="1.2" />
      <path d="M49 72 Q60 76 71 72" stroke={D.rougeF} strokeWidth="1.2" fill="none" />
      <ellipse cx="55" cy="70.5" rx="2.4" ry="1.1" fill={D.blanc} opacity="0.5" />
      {/* grain de beauté */}
      <circle cx="74" cy="76" r="1.3" fill={D.encre} />
    </g>
  ),

  // Moustache Gepetto : moustache blanche touffue + sourire chaleureux de vieux monsieur.
  dgepetto: () => (
    <g>
      {/* rides bienveillantes au coin des yeux */}
      <g stroke={D.encre} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55">
        <path d="M38 58 l-3 -2 M38 62 l-3 1" />
        <path d="M82 58 l3 -2 M82 62 l3 1" />
      </g>
      {/* sourcils blancs broussailleux */}
      <path d="M39 50 Q48 44 57 49 Q48 48 39 50 Z" fill={D.creme} stroke="#d9cfbb" strokeWidth="0.8" />
      <path d="M81 50 Q72 44 63 49 Q72 48 81 50 Z" fill={D.creme} stroke="#d9cfbb" strokeWidth="0.8" />
      {/* nez rond de grand-père */}
      <ellipse cx="60" cy="66" rx="4.6" ry="3.6" fill="#ffbf9a" stroke="#e09a75" strokeWidth="0.8" />
      <ellipse cx="58.4" cy="65" rx="1.5" ry="1" fill={D.blanc} opacity="0.55" />
      {/* moustache blanche touffue */}
      <path d="M60 70 Q50 66 43 70 Q38 74 44 76 Q40 71 50 72 Q56 73 60 74 Q64 73 70 72 Q80 71 76 76 Q82 74 77 70 Q70 66 60 70 Z"
        fill={D.blanc} stroke="#cfc7bb" strokeWidth="0.9" />
      <path d="M52 71.5 q8 2 16 0" stroke="#e6ded2" strokeWidth="1" fill="none" />
      {/* sourire chaleureux sous la moustache */}
      <path d="M53 78 q7 6 14 0" stroke={D.encre} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Blush Minnie : joues roses à pois blancs, longs cils, sourire coquet rouge.
  dblushminnie: () => (
    <g>
      {/* joues roses très marquées */}
      <ellipse cx="40" cy="68" rx="7.5" ry="5.5" fill={D.roseF} opacity="0.55" />
      <ellipse cx="80" cy="68" rx="7.5" ry="5.5" fill={D.roseF} opacity="0.55" />
      <ellipse cx="40" cy="68" rx="5.5" ry="3.8" fill={D.rose} opacity="0.75" />
      <ellipse cx="80" cy="68" rx="5.5" ry="3.8" fill={D.rose} opacity="0.75" />
      {/* petits pois blancs sur les joues */}
      <g fill={D.blanc} opacity="0.95">
        <circle cx="37.4" cy="66.4" r="1.2" /><circle cx="41.8" cy="65.6" r="0.9" />
        <circle cx="39.4" cy="70.2" r="1" /><circle cx="43.4" cy="69.4" r="0.8" />
        <circle cx="77.4" cy="66.4" r="1.2" /><circle cx="81.8" cy="65.6" r="0.9" />
        <circle cx="79.4" cy="70.2" r="1" /><circle cx="83.4" cy="69.4" r="0.8" />
      </g>
      {/* longs cils au-dessus des yeux */}
      <g stroke={D.encre} strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M42 55.5 q7 -5 14 -1" />
        <path d="M64 54.5 q7 -4 14 1" />
        <path d="M42.4 55 q-3 -1.4 -4.4 -4" />
        <path d="M46.6 52 q-1.6 -2.4 -1.8 -5" />
        <path d="M51.4 50.8 q-0.2 -2.6 1 -4.6" />
        <path d="M77.6 55.6 q3 -1.4 4.4 -4" />
        <path d="M73.4 52.6 q1.6 -2.4 1.8 -5" />
        <path d="M68.6 51.4 q0.2 -2.6 -1 -4.6" />
      </g>
      {/* sourire coquet rouge */}
      <path d="M52 73 Q56 70 60 72 Q64 70 68 73 Q64 80 60 80 Q56 80 52 73 Z" fill={D.rouge} stroke={D.rougeF} strokeWidth="1.1" />
      <path d="M52 73 Q60 76.5 68 73" stroke={D.rougeF} strokeWidth="1" fill="none" />
      <ellipse cx="57" cy="72" rx="2" ry="0.9" fill={D.blanc} opacity="0.5" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  ACCESSOIRES DISNEY  (tenus près de la main droite ~ (106,96))
// ----------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const DISNEY_SPORT = {
  // Balai Sorcier : le balai de l'apprenti sorcier, avec des étoiles scintillantes.
  dbalai: () => (
    <g>
      <g transform="rotate(14 106 96)">
        {/* manche en bois */}
        <rect x="103" y="58" width="6" height="48" rx="3" fill={D.bois} stroke={D.boisF} strokeWidth="1" />
        <rect x="104.4" y="60" width="1.6" height="44" fill="#a97a45" opacity="0.7" />
        {/* liens de la brosse */}
        <rect x="101" y="104" width="10" height="5" rx="2" fill={D.or} stroke={D.orF} strokeWidth="1" />
        {/* brindilles liées */}
        <path d="M101 108 Q97 122 93 132 L100 133 Q102 120 104 109 Z" fill="#c78c3f" stroke={D.boisF} strokeWidth="0.9" />
        <path d="M104 108 L102 134 L110 134 L108 108 Z" fill="#dda75a" stroke={D.boisF} strokeWidth="0.9" />
        <path d="M111 108 Q115 122 119 132 L112 133 Q110 120 108 109 Z" fill="#c78c3f" stroke={D.boisF} strokeWidth="0.9" />
        <g stroke={D.boisF} strokeWidth="0.7" opacity="0.6">
          <path d="M99 114 l-2 16 M106 112 l0 20 M113 114 l2 16" fill="none" />
        </g>
      </g>
      {/* étoiles scintillantes */}
      <g className="disney-scintille" fill={D.or}>
        <path d="M96 70 l1.3 2.8 3 .3 -2.3 2 .7 3 -2.7 -1.6 -2.7 1.6 .7 -3 -2.3 -2 3 -.3 Z" />
        <path d="M118 86 l1 2.2 2.4 .2 -1.8 1.6 .6 2.4 -2.2 -1.3 -2.2 1.3 .6 -2.4 -1.8 -1.6 2.4 -.2 Z" opacity="0.9" />
        <path d="M92 100 l.9 1.9 2.1 .2 -1.6 1.4 .5 2.1 -1.9 -1.1 -1.9 1.1 .5 -2.1 -1.6 -1.4 2.1 -.2 Z" opacity="0.8" />
      </g>
    </g>
  ),

  // Trident Ariel : trident doré à trois dents, manche long, avec un éclat.
  dtrident: () => (
    <g transform="rotate(10 106 96)">
      {/* manche */}
      <rect x="103.5" y="70" width="5" height="56" rx="2.5" fill={D.or} stroke={D.orF} strokeWidth="1" />
      <rect x="104.6" y="72" width="1.4" height="52" fill="#fff3b0" opacity="0.8" />
      {/* embase des dents */}
      <rect x="98" y="66" width="16" height="5" rx="2.5" fill={D.orF} />
      {/* trois dents */}
      <g fill={D.or} stroke={D.orF} strokeWidth="1" strokeLinejoin="round">
        <path d="M96 66 L96 52 L99.5 48 L103 52 L103 66 Z" />
        <path d="M108.5 66 L108.5 52 L112 48 L115.5 52 L115.5 66 Z" />
        <path d="M103.4 66 L103.4 46 L106 40 L108.6 46 L108.6 66 Z" />
      </g>
      <path d="M99.5 50 l0 14 M112 50 l0 14 M106 44 l0 20" stroke="#fff3b0" strokeWidth="1" opacity="0.75" />
      {/* éclat */}
      <g className="disney-eclat" fill={D.blanc}>
        <path d="M106 34 l1.4 3.2 3.4 .4 -2.6 2.3 .7 3.4 -2.9 -1.8 -2.9 1.8 .7 -3.4 -2.6 -2.3 3.4 -.4 Z" opacity="0.95" />
      </g>
    </g>
  ),

  // Épée Excalibur : lame argentée, garde dorée ouvragée, plantée dans la pierre.
  dexcalibur: () => (
    <g>
      {/* bloc de pierre grise */}
      <path d="M90 112 L122 112 L124 132 L88 132 Z" fill={D.pierre} stroke={D.pierreF} strokeWidth="1.4" />
      <path d="M90 112 L122 112 L121 116 L91 116 Z" fill="#c3cad6" />
      <g stroke={D.pierreF} strokeWidth="0.9" opacity="0.6" fill="none">
        <path d="M96 118 l-2 12 M110 117 l3 13 M118 120 l1 10" />
      </g>
      {/* lame argentée plantée dans la pierre */}
      <path d="M102 46 L106 40 L110 46 L110 112 L102 112 Z" fill={D.argent} stroke={D.argentF} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M106 42 L106 110" stroke={D.blanc} strokeWidth="1.6" opacity="0.9" />
      <path d="M103.5 48 L103.5 108" stroke={D.argentF} strokeWidth="0.8" opacity="0.6" />
      {/* garde dorée ouvragée */}
      <path d="M92 84 Q98 78 104 82 L108 82 Q114 78 120 84 Q114 90 108 87 L104 87 Q98 90 92 84 Z"
        fill={D.or} stroke={D.orF} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="95" cy="84" r="2" fill={D.orF} /><circle cx="117" cy="84" r="2" fill={D.orF} />
      {/* poignée + pommeau */}
      <rect x="102.5" y="87" width="7" height="16" rx="2.5" fill={D.brun} stroke={D.boisF} strokeWidth="1" />
      <path d="M102.5 90 l7 3 M102.5 95 l7 3 M102.5 100 l7 3" stroke={D.boisF} strokeWidth="0.8" opacity="0.7" />
      <circle cx="106" cy="106" r="4.4" fill={D.or} stroke={D.orF} strokeWidth="1.2" />
      <circle cx="106" cy="106" r="1.8" fill="#4fc3ff" />
      {/* éclat de la lame */}
      <g className="disney-eclat" fill={D.blanc}>
        <path d="M114 54 l1.2 2.6 2.8 .3 -2.1 1.9 .6 2.8 -2.5 -1.5 -2.5 1.5 .6 -2.8 -2.1 -1.9 2.8 -.3 Z" opacity="0.9" />
      </g>
    </g>
  ),
}

// ----------------------------------------------------------------
//  COULEURS DE CORPS DISNEY
//  Dégradés / motifs exclusifs — rendus une fois par SVG, comme ColorDefs.
//  Les id doivent rester stables : ils sont référencés par lib/avatar.js.
// ----------------------------------------------------------------
export function DisneyColorDefs() {
  return (
    <>
      {/* Bleu Génie : bleu électrique brillant et lumineux. */}
      <linearGradient id="body-dbleugenie" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#a8f0ff" /><stop offset="0.45" stopColor="#2ea8ff" />
        <stop offset="1" stopColor="#0a53c8" />
      </linearGradient>

      {/* Or Picsou : or éclatant façon pièces d'or. */}
      <linearGradient id="body-dorpicsou" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor="#fffbe0" /><stop offset="0.3" stopColor="#ffe066" />
        <stop offset="0.65" stopColor="#ffbe0b" /><stop offset="1" stopColor="#b87a06" />
      </linearGradient>

      {/* Rouge Donald : rouge vif franc, dégradé subtil clair → foncé. */}
      <linearGradient id="body-drougedonald" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff5a5a" /><stop offset="0.5" stopColor="#e01b2d" />
        <stop offset="1" stopColor="#9b0f1e" />
      </linearGradient>

      {/* Mauve Ursula : violet foncé majestueux et profond. */}
      <linearGradient id="body-dmauveursula" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#b06fe0" /><stop offset="0.5" stopColor="#6b2fa0" />
        <stop offset="1" stopColor="#2e0f52" />
      </linearGradient>

      {/* Rose Aurore : rose pastel doux. */}
      <linearGradient id="body-droseaurore" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe3f0" /><stop offset="0.5" stopColor="#ffb3d4" />
        <stop offset="1" stopColor="#f086b6" />
      </linearGradient>

      {/* Vert Peter Pan : vert forêt. */}
      <linearGradient id="body-dvertpeter" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#6fc45a" /><stop offset="0.5" stopColor="#2f8b3a" />
        <stop offset="1" stopColor="#14501f" />
      </linearGradient>

      {/* Fantasia : bleu nuit très foncé, ciel étoilé d'or. */}
      <pattern id="body-dfantasia" width="26" height="26" patternUnits="userSpaceOnUse">
        <rect width="26" height="26" fill="#101a4d" />
        <path d="M7 5 l1.5 3.2 3.5 .3 -2.7 2.4 .8 3.5 -3.1 -1.9 -3.1 1.9 .8 -3.5 -2.7 -2.4 3.5 -.3 Z" fill="#ffd93f" />
        <path d="M19 16 l1 2.2 2.4 .2 -1.8 1.6 .5 2.3 -2.1 -1.3 -2.1 1.3 .5 -2.3 -1.8 -1.6 2.4 -.2 Z" fill="#ffe98a" />
        <circle cx="21" cy="6" r="0.9" fill="#fff3b0" />
        <circle cx="4" cy="20" r="0.8" fill="#cfe4ff" />
        <circle cx="13" cy="23" r="0.6" fill="#ffd93f" />
      </pattern>

      {/* Arc-en-ciel : dégradé vif façon feu d'artifice. */}
      <linearGradient id="body-darcenciel" x1="0" y1="0" x2="0.5" y2="1">
        <stop offset="0" stopColor="#ff2d7a" /><stop offset="0.2" stopColor="#ff8c42" />
        <stop offset="0.4" stopColor="#ffd93f" /><stop offset="0.6" stopColor="#3dd68c" />
        <stop offset="0.8" stopColor="#00bfff" /><stop offset="1" stopColor="#8b2dff" />
      </linearGradient>

      {/* Dalmatien : taches noires irrégulières sur fond blanc. */}
      <pattern id="body-ddalmatiencolor" width="44" height="44" patternUnits="userSpaceOnUse">
        <rect width="44" height="44" fill="#fbfbff" />
        <path d="M8 8 q7 -4 10 2 q3 7 -4 8 q-8 1 -6 -10 Z" fill="#1b1533" />
        <path d="M30 14 q6 -2 7 4 q1 6 -5 5 q-5 -1 -2 -9 Z" fill="#1b1533" />
        <path d="M16 28 q6 -3 8 3 q1 7 -6 6 q-6 -2 -2 -9 Z" fill="#1b1533" />
        <ellipse cx="37" cy="33" rx="4.5" ry="3.4" fill="#1b1533" />
        <ellipse cx="3" cy="22" rx="3" ry="2.4" fill="#1b1533" />
        <ellipse cx="26" cy="41" rx="3.4" ry="2.4" fill="#1b1533" />
      </pattern>

      {/* Roux Ariel : roux vif éclatant. */}
      <linearGradient id="body-drouxariel" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#ffb45a" /><stop offset="0.4" stopColor="#ff6a1f" />
        <stop offset="1" stopColor="#b52d05" />
      </linearGradient>
    </>
  )
}

// ------------------------------------------------------------------
//  Classes d'animation utilisées ici (le CSS est à définir ailleurs) :
//   • .disney-scintille — étoiles du balai sorcier (dbalai) : scintillement
//     en opacité / légère mise à l'échelle, en boucle.
//   • .disney-eclat     — éclat du trident (dtrident) et de la lame
//     d'Excalibur (dexcalibur) : flash lumineux périodique.
//  Aucune règle CSS n'est créée dans ce fichier.
// ------------------------------------------------------------------
