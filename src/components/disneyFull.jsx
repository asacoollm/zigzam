// ============================================================
//  ✨ SKINS COMPLETS — Saison Disney
// ============================================================
//  MÉCANIQUE (nouvelle) : contrairement aux accessoires classiques
//  (chapeau, lunettes, cheveux…) qui se POSENT sur le bonhomme,
//  un « skin complet » REMPLACE le bonhomme en entier : jambes,
//  pieds, bras, corps en haricot, panneau visage, yeux, joues et
//  bouche. Le rendu ne dessine donc PLUS rien d'autre que ce <g>.
//
//  Repère (identique à FallGuy.jsx / avatarParts.jsx) :
//   - viewBox « 0 -24 120 192 », centre x = 60
//   - le bonhomme occupe y ≈ 16..160, pieds au sol vers y = 152
//   - crâne : demi-cercle de centre (60,58) et de rayon 42 (sommet y=16)
//   - corps « haricot » : capsule x 18..102, y 16..132
//   - bras : x 4..19 et x 101..116, y 58..104
//   - jambes : x 39..53 et x 67..81, y 118..152
//  Chaque skin DOIT respecter cet encombrement pour que la mise en
//  page (grilles, mini-avatars ~64px du sélecteur) ne bouge pas.
//
//  RÈGLES DE DESSIN
//   - Aplats + 2/3 nuances d'ombre et de reflet, contours sombres fins.
//   - Aucun <defs> ni gradient à `id` : plusieurs avatars cohabitent
//     sur la même page, les ids entreraient en collision.
//   - Ordre de superposition : ce qui est « derrière » (ailes, queue,
//     oreilles, piquants) d'abord, puis le corps, puis le visage et
//     les accessoires.
//   - Les `className` servent uniquement aux animations CSS (liste
//     complète en bas de fichier) — aucun style n'est défini ici.
// ============================================================

// Contour commun : un brun-violet sombre, plus doux qu'un noir pur.
const T = '#241c2a'

// ------------------------------------------------------------
//  🐭 fmickey — la souris en salopette rouge
// ------------------------------------------------------------
function mickey() {
  return (
    <g>
      {/* Oreilles rondes (DERRIÈRE la tête) */}
      <g className="d-mickey-ears">
        <circle cx="26" cy="4" r="21" fill="#1d1a24" stroke={T} strokeWidth="2.5" />
        <circle cx="94" cy="4" r="21" fill="#1d1a24" stroke={T} strokeWidth="2.5" />
        <circle cx="19" cy="-3" r="8.5" fill="#fff" opacity="0.12" />
        <circle cx="87" cy="-3" r="8.5" fill="#fff" opacity="0.12" />
      </g>

      {/* Jambes */}
      <rect x="39" y="116" width="14" height="36" rx="7" fill="#1d1a24" />
      <rect x="67" y="116" width="14" height="36" rx="7" fill="#1d1a24" />
      {/* Grandes chaussures jaunes ovales */}
      <ellipse cx="41" cy="151" rx="16" ry="9.5" fill="#f5c518" stroke={T} strokeWidth="2.2" />
      <ellipse cx="79" cy="151" rx="16" ry="9.5" fill="#f5c518" stroke={T} strokeWidth="2.2" />
      <path d="M28 150 q13 -6 26 0" stroke="#c78f0c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M66 150 q13 -6 26 0" stroke="#c78f0c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="36" cy="147" rx="5" ry="2.4" fill="#fff" opacity="0.5" />
      <ellipse cx="74" cy="147" rx="5" ry="2.4" fill="#fff" opacity="0.5" />

      {/* Bras */}
      <rect x="4" y="58" width="15" height="42" rx="7.5" fill="#1d1a24" />
      <rect x="101" y="58" width="15" height="42" rx="7.5" fill="#1d1a24" />

      {/* Corps noir + reflet */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill="#1d1a24" />
      <ellipse cx="46" cy="42" rx="24" ry="20" fill="#fff" opacity="0.10" />
      <path d="M96 60 q6 30 -8 56" stroke="#000" strokeWidth="6" opacity="0.20" fill="none" strokeLinecap="round" />

      {/* Short rouge : épouse la calotte basse du corps */}
      <path d="M18.6 96 A42 42 0 0 0 101.4 96 Z" fill="#e02b2b" />
      <path d="M18.6 96 A42 42 0 0 0 60 132 L60 96 Z" fill="#fff" opacity="0.10" />
      <path d="M60 132 A42 42 0 0 0 101.4 96 L60 96 Z" fill="#000" opacity="0.14" />
      {/* Plis du tissu */}
      <path d="M42 104 q4 12 2 22" stroke="#a81a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M78 104 q-4 12 -2 22" stroke="#a81a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M18.6 96 A42 42 0 0 0 101.4 96" stroke="#a81a1a" strokeWidth="2.4" fill="none" />
      {/* Les deux gros boutons blancs */}
      <circle cx="44" cy="106" r="7.5" fill="#fff" stroke={T} strokeWidth="2" />
      <circle cx="76" cy="106" r="7.5" fill="#fff" stroke={T} strokeWidth="2" />
      <circle cx="42" cy="104" r="2.6" fill="#dfe3ee" />
      <circle cx="74" cy="104" r="2.6" fill="#dfe3ee" />

      {/* Grands gants blancs à quatre doigts */}
      <g className="d-mickey-gloves">
        <circle cx="11" cy="104" r="11.5" fill="#fff" stroke={T} strokeWidth="2" />
        <path d="M11 96 v8 M5 100 l5 5 M17 100 l-5 5" stroke="#c9cede" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M3 108 q8 5 16 0" stroke="#c9cede" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="109" cy="104" r="11.5" fill="#fff" stroke={T} strokeWidth="2" />
        <path d="M109 96 v8 M103 100 l5 5 M115 100 l-5 5" stroke="#c9cede" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M101 108 q8 5 16 0" stroke="#c9cede" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>

      {/* Visage clair + museau */}
      <path d="M60 34 q26 0 26 26 q0 26 -26 26 q-26 0 -26 -26 q0 -26 26 -26 Z" fill="#ffe3c4" />
      <ellipse cx="60" cy="72" rx="21" ry="14" fill="#fff2e0" />
      <ellipse cx="48" cy="44" rx="11" ry="8" fill="#fff" opacity="0.45" />

      {/* Yeux (ovales verticaux façon cartoon) */}
      <ellipse cx="51" cy="52" rx="6.6" ry="9.2" fill="#fff" stroke={T} strokeWidth="1.6" />
      <ellipse cx="69" cy="52" rx="6.6" ry="9.2" fill="#fff" stroke={T} strokeWidth="1.6" />
      <ellipse cx="52.4" cy="53" rx="3.1" ry="6" fill="#241c2a" />
      <ellipse cx="70.4" cy="53" rx="3.1" ry="6" fill="#241c2a" />
      <circle cx="53.6" cy="49.6" r="1.5" fill="#fff" />
      <circle cx="71.6" cy="49.6" r="1.5" fill="#fff" />

      {/* Grand sourire ouvert + langue */}
      <path d="M43 68 Q60 92 77 68 Q60 76 43 68 Z" fill="#7d1b2b" stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="60" cy="79" rx="8.5" ry="3.8" fill="#ff7a8c" />
      {/* Nez noir ovale */}
      <ellipse cx="60" cy="64" rx="9" ry="7" fill="#1d1a24" />
      <ellipse cx="57" cy="61.6" rx="3" ry="2.2" fill="#fff" opacity="0.55" />
      {/* Joues */}
      <circle cx="36" cy="70" r="4.6" fill="#ff8fb0" opacity="0.6" />
      <circle cx="84" cy="70" r="4.6" fill="#ff8fb0" opacity="0.6" />
    </g>
  )
}

// ------------------------------------------------------------
//  🦆 fdonald — le canard marin coléreux
// ------------------------------------------------------------
function donald() {
  return (
    <g>
      {/* Petite queue de plumes relevée à l'arrière (derrière le corps) */}
      <g className="d-donald-tail">
        <path d="M92 116 q13 -9 15 -20 q7 12 0 22 q-6 8 -15 5 Z" fill="#f7f8fc" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M94 124 q14 -6 18 -15 q4 13 -4 22 q-7 7 -15 3 Z" fill="#e3e6f0" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M99 110 q3 8 1 14 M101 122 q3 7 1 12" stroke="#c9cede" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Jambes et pattes palmées orange (pas de pantalon) */}
      <rect x="41" y="118" width="12" height="30" rx="6" fill="#ff9a1f" stroke={T} strokeWidth="1.6" />
      <rect x="67" y="118" width="12" height="30" rx="6" fill="#ff9a1f" stroke={T} strokeWidth="1.6" />
      <path d="M47 140 L26 154 q21 8 42 0 Z" fill="#ffb03f" stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M73 140 L52 154 q21 8 42 0 Z" fill="#ffb03f" stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 149 l3 6 M54 150 l0 6" stroke="#d97706" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M66 149 l3 6 M80 150 l0 6" stroke="#d97706" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Bras plumeux blancs */}
      <rect x="4" y="58" width="15" height="46" rx="7.5" fill="#f7f8fc" stroke={T} strokeWidth="1.6" />
      <rect x="101" y="58" width="15" height="46" rx="7.5" fill="#f7f8fc" stroke={T} strokeWidth="1.6" />

      {/* Corps blanc plumeux */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill="#f7f8fc" stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="42" rx="24" ry="20" fill="#fff" opacity="0.9" />
      <path d="M97 56 q7 32 -9 60" stroke="#c9cede" strokeWidth="7" opacity="0.55" fill="none" strokeLinecap="round" />
      {/* Duvet : petites plumes suggérées */}
      <path d="M30 108 q6 -5 12 0 M46 114 q6 -5 12 0 M62 114 q6 -5 12 0 M78 108 q6 -5 12 0"
        stroke="#d7dbe8" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Grande vareuse de marin bleue */}
      <path d="M22 92 q38 -12 76 0 l0 14 A42 42 0 0 1 22 106 Z" fill="#2f6fb5" />
      <path d="M22 106 A42 42 0 0 0 60 132 L60 96 Z" fill="#fff" opacity="0.10" />
      <path d="M60 132 A42 42 0 0 0 98 106 L60 96 Z" fill="#0f3a68" opacity="0.22" />
      {/* Plis de la vareuse */}
      <path d="M40 100 q3 16 1 26 M60 100 v30 M80 100 q-3 16 -1 26"
        stroke="#1e4e88" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M25.5 114 A42 42 0 0 0 94.5 114" stroke="#1e4e88" strokeWidth="2" fill="none" opacity="0.6" />
      {/* Manches bleues sur les bras */}
      <path d="M4 84 h15 v14 a7.5 7.5 0 0 1 -15 0 Z" fill="#2f6fb5" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M101 84 h15 v14 a7.5 7.5 0 0 1 -15 0 Z" fill="#2f6fb5" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />

      {/* Col marin (rabat carré + trait blanc) */}
      <path d="M34 86 q26 -14 52 0 l-8 12 q-18 -8 -36 0 Z" fill="#2f6fb5" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M37 89 q23 -11 46 0" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.9" />
      <path d="M42 96 q18 -8 36 0" stroke="#fff" strokeWidth="1.8" fill="none" opacity="0.6" />
      {/* Nœud papillon rouge */}
      <path d="M60 94 l-11 -6 v13 Z" fill="#e02b2b" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M60 94 l11 -6 v13 Z" fill="#e02b2b" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="60" cy="94" r="3.6" fill="#b81c1c" stroke={T} strokeWidth="1.5" />

      {/* Yeux ovales + sourcils */}
      <ellipse cx="50" cy="50" rx="8" ry="10.5" fill="#fff" stroke={T} strokeWidth="1.6" />
      <ellipse cx="70" cy="50" rx="8" ry="10.5" fill="#fff" stroke={T} strokeWidth="1.6" />
      <ellipse cx="52" cy="52" rx="3.4" ry="5" fill="#241c2a" />
      <ellipse cx="72" cy="52" rx="3.4" ry="5" fill="#241c2a" />
      <circle cx="53.4" cy="49" r="1.4" fill="#fff" />
      <circle cx="73.4" cy="49" r="1.4" fill="#fff" />
      <path d="M42 38 q9 -4 16 2 M78 38 q-9 -4 -16 2" stroke="#241c2a" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Bec orange vif (deux mandibules) */}
      <path d="M38 66 q22 -10 44 0 q-2 12 -22 13 q-20 -1 -22 -13 Z" fill="#ff9a1f" stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 68 q20 -8 40 0" stroke="#ffc46b" strokeWidth="2.4" fill="none" opacity="0.8" />
      <path d="M42 78 q18 7 36 0 q-4 9 -18 9 q-14 0 -18 -9 Z" fill="#f57f0c" stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="52" cy="66" rx="1.7" ry="1.2" fill="#a3510a" />
      <ellipse cx="68" cy="66" rx="1.7" ry="1.2" fill="#a3510a" />

      {/* Calot bleu de marin */}
      <g className="d-donald-cap">
        {/* Ruban qui flotte à l'arrière */}
        <path d="M90 26 q14 4 16 16 q-11 -3 -16 -10 Z" fill="#1e4e88" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
        {/* Calotte */}
        <path d="M28 28 Q60 -14 92 28 Q60 12 28 28 Z" fill="#2f6fb5" stroke={T} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M44 8 Q60 -2 72 8 Q60 6 44 8 Z" fill="#fff" opacity="0.3" />
        <path d="M40 22 Q60 8 80 22" stroke="#1e4e88" strokeWidth="1.8" fill="none" opacity="0.6" />
        {/* Bord relevé blanc */}
        <path d="M23 28 Q60 48 97 28 Q60 16 23 28 Z" fill="#f5f6fb" stroke={T} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M28 30 Q60 43 92 30" stroke="#c9cede" strokeWidth="1.8" fill="none" />
      </g>
    </g>
  )
}

// ------------------------------------------------------------
//  💙 fstitch — l'expérience 626
// ------------------------------------------------------------
function stitch() {
  // Quatre griffes blanches alignées sur un bord (main ou pied).
  const griffes = (x, y, dx) => (
    <g>
      <path d={`M${x} ${y} l0 -5`} stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d={`M${x + dx} ${y + 1} l0 -5`} stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d={`M${x + dx * 2} ${y + 1} l0 -5`} stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d={`M${x + dx * 3} ${y} l0 -5`} stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )

  return (
    <g>
      {/* Trois petites pointes dorsales (derrière le corps, côté droit) */}
      <g className="d-stitch-spikes">
        <path d="M92 86 l22 -9 -15 18 Z" fill="#2f6aa8" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M92 100 l23 -4 -16 16 Z" fill="#2f6aa8" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M88 114 l21 2 -16 13 Z" fill="#2f6aa8" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      </g>

      {/* Immenses oreilles tombantes (derrière la tête, au-dessus des bras) */}
      <g className="d-stitch-ears">
        {/* Oreille gauche : large à la base, s'écarte puis retombe le long du corps */}
        <path d="M40 22 C 22 12 4 22 3 40 C 2 58 8 72 17 77 C 26 80 30 68 30 55 C 30 40 35 28 40 22 Z"
          fill="#3f7cbd" stroke={T} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M36 28 C 22 22 11 30 10 42 C 9 56 14 66 20 69 C 25 70 27 61 27 51 C 27 40 32 32 36 28 Z"
          fill="#7fb6e8" opacity="0.8" />
        {/* Oreille droite (avec l'encoche caractéristique sur le bord externe) */}
        <path d="M80 22 C 98 12 116 22 117 40 L 108 43 L 115 50 C 113 63 108 73 103 77 C 94 80 90 68 90 55 C 90 40 85 28 80 22 Z"
          fill="#3f7cbd" stroke={T} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M84 28 C 98 22 109 30 110 42 L 104 45 L 109 50 C 108 60 104 66 100 69 C 95 70 93 61 93 51 C 93 40 88 32 84 28 Z"
          fill="#7fb6e8" opacity="0.8" />
      </g>

      {/* Jambes et pieds */}
      <rect x="38" y="116" width="16" height="34" rx="8" fill="#4d8fd6" stroke={T} strokeWidth="1.8" />
      <rect x="66" y="116" width="16" height="34" rx="8" fill="#4d8fd6" stroke={T} strokeWidth="1.8" />
      <ellipse cx="42" cy="150" rx="15" ry="9" fill="#3f7cbd" stroke={T} strokeWidth="2" />
      <ellipse cx="78" cy="150" rx="15" ry="9" fill="#3f7cbd" stroke={T} strokeWidth="2" />
      <ellipse cx="42" cy="152" rx="9" ry="5" fill="#a9d4f5" opacity="0.8" />
      <ellipse cx="78" cy="152" rx="9" ry="5" fill="#a9d4f5" opacity="0.8" />
      {griffes(32, 145, 6.5)}
      {griffes(68, 145, 6.5)}

      {/* Bras + griffes */}
      <rect x="4" y="58" width="16" height="46" rx="8" fill="#4d8fd6" stroke={T} strokeWidth="1.8" />
      <rect x="100" y="58" width="16" height="46" rx="8" fill="#4d8fd6" stroke={T} strokeWidth="1.8" />
      <ellipse cx="12" cy="102" rx="9" ry="7" fill="#3f7cbd" stroke={T} strokeWidth="1.8" />
      <ellipse cx="108" cy="102" rx="9" ry="7" fill="#3f7cbd" stroke={T} strokeWidth="1.8" />
      {griffes(5, 99, 4.8)}
      {griffes(101, 99, 4.8)}

      {/* Corps koala bleu */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill="#4d8fd6" stroke={T} strokeWidth="2" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.16" />
      <path d="M96 58 q7 32 -10 60" stroke="#2a5b96" strokeWidth="7" opacity="0.45" fill="none" strokeLinecap="round" />
      {/* Ventre bleu très clair */}
      <ellipse cx="60" cy="110" rx="27" ry="22" fill="#a9d4f5" />
      <ellipse cx="52" cy="100" rx="12" ry="8" fill="#fff" opacity="0.45" />
      <path d="M60 94 v30" stroke="#7fb6e8" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Museau bleu très clair */}
      <ellipse cx="60" cy="73" rx="20" ry="12" fill="#a9d4f5" stroke="#7fb6e8" strokeWidth="1.4" />
      <ellipse cx="60" cy="71" rx="17" ry="9" fill="#c9e5fa" opacity="0.7" />

      {/* Gros yeux noirs ronds */}
      <circle cx="47" cy="55" r="10.5" fill="#141019" stroke={T} strokeWidth="1.8" />
      <circle cx="73" cy="55" r="10.5" fill="#141019" stroke={T} strokeWidth="1.8" />
      <circle cx="50.4" cy="51" r="3.4" fill="#fff" />
      <circle cx="76.4" cy="51" r="3.4" fill="#fff" />
      <circle cx="44.6" cy="59" r="1.6" fill="#fff" opacity="0.6" />
      <circle cx="70.6" cy="59" r="1.6" fill="#fff" opacity="0.6" />

      {/* Nez sombre + bouche large */}
      <path d="M52 66 q8 -6 16 0 q-4 8 -8 8 q-4 0 -8 -8 Z" fill="#1b2a38" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M60 74 v5" stroke="#5c7d99" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M46 79 q7 8 14 0 q7 8 14 0" stroke="#1b2a38" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  )
}

// ------------------------------------------------------------
//  🧞 fgenie — le Génie de la lampe (SANS jambes : queue de fumée)
// ------------------------------------------------------------
function genie() {
  return (
    <g>
      {/* Longue queue de fumée bleue à la place des jambes (y 118..160) */}
      <g className="d-genie-smoke">
        <path d="M34 116 C 26 134 40 142 50 148 C 58 153 55 160 44 162 C 62 165 74 154 68 144 C 62 134 76 128 86 116 Z"
          fill="#2f8fe0" opacity="0.9" />
        <path d="M40 118 C 34 133 48 140 56 146 C 62 150 60 156 52 158 C 66 159 72 150 66 142 C 60 134 72 128 80 118 Z"
          fill="#63b3f0" opacity="0.55" />
        <path d="M44 120 C 40 132 52 138 58 143" stroke="#a8dcff" strokeWidth="2.4" fill="none"
          strokeLinecap="round" opacity="0.8" />
        {/* Volutes qui s'effilent */}
        <path d="M40 152 q-10 4 -12 12 q10 -2 14 -8 Z" fill="#63b3f0" opacity="0.45" />
        <path d="M76 148 q10 5 11 13 q-9 -3 -13 -8 Z" fill="#63b3f0" opacity="0.45" />
        <circle cx="30" cy="158" r="3.4" fill="#8ccbf5" opacity="0.55" />
        <circle cx="88" cy="156" r="2.8" fill="#8ccbf5" opacity="0.5" />
        <circle cx="58" cy="166" r="2.2" fill="#8ccbf5" opacity="0.4" />
      </g>

      {/* Bras musclés */}
      <rect x="2" y="58" width="18" height="44" rx="9" fill="#2f8fe0" stroke={T} strokeWidth="1.8" />
      <rect x="100" y="58" width="18" height="44" rx="9" fill="#2f8fe0" stroke={T} strokeWidth="1.8" />
      <path d="M6 66 q5 10 3 22" stroke="#1a6cb5" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M114 66 q-5 10 -3 22" stroke="#1a6cb5" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Bracelets d'or aux poignets */}
      <rect x="0.5" y="90" width="21" height="10" rx="4" fill="#ffcf3f" stroke={T} strokeWidth="1.8" />
      <rect x="98.5" y="90" width="21" height="10" rx="4" fill="#ffcf3f" stroke={T} strokeWidth="1.8" />
      <path d="M2 93 h18 M100 93 h18" stroke="#fff3b0" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M2 98 h18 M100 98 h18" stroke="#c98a17" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Mains */}
      <ellipse cx="11" cy="106" rx="9.5" ry="7.5" fill="#2f8fe0" stroke={T} strokeWidth="1.8" />
      <ellipse cx="109" cy="106" rx="9.5" ry="7.5" fill="#2f8fe0" stroke={T} strokeWidth="1.8" />

      {/* Catogan noir (derrière la tête, part vers la droite) */}
      <path d="M92 34 q22 8 22 30 q-10 -4 -14 -14 q-4 -10 -8 -16 Z" fill="#1b1725" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />

      {/* Corps : buste bleu vif s'arrêtant à la taille (y ≈ 122) */}
      <path d="M18 58 A42 42 0 0 1 102 58 L102 108 q0 14 -42 14 q-42 0 -42 -14 Z" fill="#2f8fe0" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.18" />
      <path d="M96 56 q8 28 -4 52" stroke="#0f5a9c" strokeWidth="7" opacity="0.35" fill="none" strokeLinecap="round" />
      {/* Torse musclé : pectoraux + abdominaux */}
      <path d="M40 92 q10 10 20 4 q10 6 20 -4" stroke="#1a6cb5" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M60 96 v14" stroke="#1a6cb5" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M50 104 h8 M62 104 h8" stroke="#1a6cb5" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="47" cy="88" rx="10" ry="6" fill="#63b3f0" opacity="0.4" />
      <ellipse cx="73" cy="88" rx="10" ry="6" fill="#63b3f0" opacity="0.4" />
      {/* Ceinture rouge */}
      <path d="M18 108 q42 12 84 0 l0 8 q-42 12 -84 0 Z" fill="#e02b2b" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 111 q40 11 80 0" stroke="#ff7a7a" strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="60" cy="117" r="5.5" fill="#ffcf3f" stroke={T} strokeWidth="1.8" />

      {/* Petit chignon sur le crâne */}
      <path d="M52 18 q8 -12 16 0 q-8 4 -16 0 Z" fill="#1b1725" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="60" cy="8" r="6.5" fill="#1b1725" stroke={T} strokeWidth="1.8" />
      <path d="M34 30 q26 -14 52 0 q-26 -6 -52 0 Z" fill="#1b1725" opacity="0.9" />

      {/* Visage bleu : sourcils épais, yeux, sourire malicieux */}
      <path d="M40 40 q9 -6 18 1" stroke="#1b1725" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M80 40 q-9 -6 -18 1" stroke="#1b1725" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="54" rx="7.5" ry="8.5" fill="#fff" stroke={T} strokeWidth="1.5" />
      <ellipse cx="70" cy="54" rx="7.5" ry="8.5" fill="#fff" stroke={T} strokeWidth="1.5" />
      <circle cx="51.5" cy="55" r="4" fill="#241c2a" />
      <circle cx="71.5" cy="55" r="4" fill="#241c2a" />
      <circle cx="53" cy="52.6" r="1.5" fill="#fff" />
      <circle cx="73" cy="52.6" r="1.5" fill="#fff" />
      <ellipse cx="60" cy="66" rx="4.5" ry="3.4" fill="#1a6cb5" opacity="0.6" />
      <path d="M47 72 q13 12 26 0 q-4 9 -13 9 q-9 0 -13 -9 Z" fill="#5b1020" stroke="#1b1725" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 73 q10 3 20 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Barbiche (sous la bouche) */}
      <path d="M53 84 q7 4 14 0 q-2 14 -7 16 q-5 -2 -7 -16 Z" fill="#1b1725" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M57 88 q3 6 3 11" stroke="#443a58" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Boucle d'oreille dorée */}
      <circle cx="88" cy="62" r="4.5" fill="none" stroke="#ffcf3f" strokeWidth="2.6" />
      {/* Joues */}
      <circle cx="37" cy="66" r="4.2" fill="#7fd0ff" opacity="0.5" />
      <circle cx="83" cy="66" r="4.2" fill="#7fd0ff" opacity="0.5" />
    </g>
  )
}

// ------------------------------------------------------------
//  🧚 fclochette — la fée verte et sa poussière dorée
// ------------------------------------------------------------
function clochette() {
  return (
    <g>
      {/* Ailes translucides irisées (DERRIÈRE tout le reste) */}
      <g className="d-tink-wings">
        {/* Grande aile supérieure gauche : monte bien au-dessus des épaules */}
        <path d="M44 74 C 26 54 6 30 4 6 C 22 2 40 32 52 66 Z" fill="#eaf7ff" opacity="0.82" stroke="#9fd6f5" strokeWidth="1.8" />
        {/* Aile inférieure gauche */}
        <path d="M42 84 C 22 84 4 96 2 112 C 20 116 38 102 48 88 Z" fill="#dff1ff" opacity="0.75" stroke="#9fd6f5" strokeWidth="1.8" />
        {/* Ailes droites (miroir) */}
        <path d="M76 74 C 94 54 114 30 116 6 C 98 2 80 32 68 66 Z" fill="#eaf7ff" opacity="0.82" stroke="#9fd6f5" strokeWidth="1.8" />
        <path d="M78 84 C 98 84 116 96 118 112 C 100 116 82 102 72 88 Z" fill="#dff1ff" opacity="0.75" stroke="#9fd6f5" strokeWidth="1.8" />
        {/* Nervures irisées */}
        <path d="M12 12 q16 26 30 50 M10 104 q16 -6 30 -18" stroke="#a8dcff" strokeWidth="1.5" fill="none" opacity="0.85" />
        <path d="M108 12 q-16 26 -30 50 M110 104 q-16 -6 -30 -18" stroke="#a8dcff" strokeWidth="1.5" fill="none" opacity="0.85" />
        <path d="M20 18 q12 18 20 32" stroke="#ffd6f5" strokeWidth="1.3" fill="none" opacity="0.75" />
        <path d="M100 18 q-12 18 -20 32" stroke="#ffd6f5" strokeWidth="1.3" fill="none" opacity="0.75" />
        <path d="M16 100 q14 -4 24 -14" stroke="#ffd6f5" strokeWidth="1.3" fill="none" opacity="0.6" />
        <path d="M104 100 q-14 -4 -24 -14" stroke="#ffd6f5" strokeWidth="1.3" fill="none" opacity="0.6" />
      </g>

      {/* Jambes */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill="#ffd9b0" stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill="#ffd9b0" stroke={T} strokeWidth="1.5" />
      {/* Petits chaussons verts à pompon blanc */}
      <ellipse cx="44" cy="150" rx="13" ry="8" fill="#3f9e4d" stroke={T} strokeWidth="2" />
      <ellipse cx="76" cy="150" rx="13" ry="8" fill="#3f9e4d" stroke={T} strokeWidth="2" />
      <path d="M33 149 q11 -5 22 0" stroke="#2c7a38" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M65 149 q11 -5 22 0" stroke="#2c7a38" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="145" r="4.6" fill="#fff" stroke={T} strokeWidth="1.5" />
      <circle cx="86" cy="145" r="4.6" fill="#fff" stroke={T} strokeWidth="1.5" />

      {/* Bras nus */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill="#ffd9b0" stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill="#ffd9b0" stroke={T} strokeWidth="1.5" />
      <circle cx="12.5" cy="104" r="6.5" fill="#ffd9b0" stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill="#ffd9b0" stroke={T} strokeWidth="1.5" />

      {/* Corps + robe de fée verte */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill="#4caf50" stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.18" />
      <path d="M96 58 q7 30 -8 56" stroke="#2c7a38" strokeWidth="7" opacity="0.4" fill="none" strokeLinecap="round" />
      {/* Corsage (bustier plus clair) */}
      <path d="M30 82 q30 -12 60 0 l-4 20 q-26 -8 -52 0 Z" fill="#6ecb63" opacity="0.9" />
      <path d="M34 86 q26 -9 52 0" stroke="#2c7a38" strokeWidth="1.6" fill="none" opacity="0.6" />
      {/* Plis de la robe */}
      <path d="M42 96 q3 16 1 28 M60 96 v30 M78 96 q-3 16 -1 28"
        stroke="#2c7a38" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65" />
      {/* Bord en pétales de la jupe courte */}
      <path d="M20 112 q8 14 16 2 q8 14 16 2 q8 14 16 2 q8 14 16 2 q6 -6 8 -14 l0 -8 q-42 12 -72 0 Z"
        fill="#3f9e4d" stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M22 114 q7 12 15 1 q8 12 16 1 q8 12 16 1 q8 12 15 1" stroke="#7fd98a" strokeWidth="1.6" fill="none" opacity="0.7" />

      {/* Visage */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill="#ffd9b0" />
      <ellipse cx="47" cy="52" rx="11" ry="7" fill="#fff" opacity="0.35" />
      <circle cx="49" cy="60" r="6" fill="#241c2a" />
      <circle cx="71" cy="60" r="6" fill="#241c2a" />
      <circle cx="51.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="73.4" cy="57.6" r="2.1" fill="#fff" />
      <path d="M42 51 q7 -4 14 -1 M78 51 q-7 -4 -14 -1" stroke="#b3872f" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="70" r="4.6" fill="#ff8fb0" opacity="0.75" />
      <circle cx="82" cy="70" r="4.6" fill="#ff8fb0" opacity="0.75" />
      <path d="M52 71 q8 7 16 0" stroke="#c46a7a" strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {/* Chevelure blonde + chignon haut */}
      {/* Cheveux tirés en arrière : hairline haute pour dégager le visage */}
      <path d="M28 40 q4 -24 32 -24 q28 0 32 24 q-12 -12 -32 -12 q-20 0 -32 12 Z" fill="#dca94a" stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M33 34 q11 -10 27 -10 q16 0 27 10" stroke="#f4d585" strokeWidth="2.6" fill="none" opacity="0.9" />
      <path d="M31 40 q5 -10 13 -15 M89 40 q-5 -10 -13 -15" stroke="#b3872f" strokeWidth="1.8" fill="none" opacity="0.7" />
      {/* Mèches qui remontent vers le chignon */}
      <path d="M44 22 q10 -8 16 -12 M76 22 q-10 -8 -16 -12" stroke="#dca94a" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Chignon haut */}
      <ellipse cx="60" cy="4" rx="14" ry="12" fill="#dca94a" stroke={T} strokeWidth="1.8" />
      <ellipse cx="55" cy="0" rx="6.5" ry="4.5" fill="#f4d585" opacity="0.85" />
      <path d="M49 8 q11 7 22 0" stroke="#b3872f" strokeWidth="2" fill="none" opacity="0.8" />
      <path d="M48 15 q12 6 24 0" stroke="#3f9e4d" strokeWidth="3.4" fill="none" strokeLinecap="round" />

      {/* Traînée de poussière dorée scintillante */}
      <g className="d-tink-dust">
        <path d="M18 30 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8 Z" fill="#ffd93f" opacity="0.95" />
        <path d="M104 44 l1.5 3.4 3.4 1.5 -3.4 1.5 -1.5 3.4 -1.5 -3.4 -3.4 -1.5 3.4 -1.5 Z" fill="#ffd93f" opacity="0.9" />
        <path d="M14 104 l1.3 3 3 1.3 -3 1.3 -1.3 3 -1.3 -3 -3 -1.3 3 -1.3 Z" fill="#ffe98a" opacity="0.85" />
        <path d="M100 118 l1.5 3.4 3.4 1.5 -3.4 1.5 -1.5 3.4 -1.5 -3.4 -3.4 -1.5 3.4 -1.5 Z" fill="#ffd93f" opacity="0.85" />
        <path d="M60 -12 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6 Z" fill="#ffe98a" opacity="0.8" />
        <circle cx="30" cy="128" r="2.2" fill="#ffd93f" opacity="0.8" />
        <circle cx="92" cy="94" r="1.8" fill="#ffe98a" opacity="0.8" />
        <circle cx="26" cy="66" r="1.6" fill="#ffd93f" opacity="0.7" />
        <circle cx="110" cy="72" r="2" fill="#ffe98a" opacity="0.7" />
        <circle cx="50" cy="140" r="1.6" fill="#ffd93f" opacity="0.65" />
        <circle cx="82" cy="136" r="2.2" fill="#ffe98a" opacity="0.6" />
      </g>
    </g>
  )
}

// ------------------------------------------------------------
//  Registre des skins complets. Clé = id de l'item (lib/avatar.js).
//  Chaque valeur est une fonction qui renvoie LE BONHOMME ENTIER.
// ------------------------------------------------------------
export const DISNEY_FULL = {
  fmickey: () => mickey(),
  fdonald: () => donald(),
  fstitch: () => stitch(),
  fgenie: () => genie(),
  fclochette: () => clochette(),
}

// ------------------------------------------------------------
//  Classes d'animation utilisées (à définir dans une feuille CSS
//  existante — AUCUN fichier CSS n'est créé ici) :
//   - d-mickey-ears    : léger balancement des oreilles
//   - d-mickey-gloves   : petit rebond des gants
//   - d-donald-cap      : oscillation du calot de marin
//   - d-donald-tail     : frétillement de la queue de plumes
//   - d-stitch-ears     : oreilles qui tressautent
//   - d-stitch-spikes   : piquants dorsaux qui se hérissent
//   - d-genie-smoke     : ondulation continue de la queue de fumée
//   - d-tink-wings      : battement rapide des ailes
//   - d-tink-dust       : scintillement de la poussière dorée
// ------------------------------------------------------------
