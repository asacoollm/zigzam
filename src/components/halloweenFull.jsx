// ============================================================
//  ✨ SKINS COMPLETS — Saison Halloween
// ============================================================
//  Même mécanique que les skins complets Disney (disneyFull.jsx) :
//  un skin complet REMPLACE le bonhomme en entier (jambes, pieds,
//  bras, corps en haricot, panneau visage, yeux, joues, bouche,
//  cheveux). FallGuy.jsx ne rend alors QUE ce <g> (+ l'animal de
//  compagnie éventuel, qui vit à côté, + le badge de rôle) : chapeau,
//  lunettes, cheveux et objet de sport posés par ailleurs n'ont plus
//  d'effet visuel tant que le skin complet est équipé — comme pour
//  n'importe quel skin complet déjà présent dans le jeu.
//
//  Repère (identique à FallGuy.jsx / avatarParts.jsx / disneyFull.jsx) :
//   - viewBox « 0 -24 120 192 », centre x = 60
//   - le bonhomme occupe y ≈ 16..160, pieds au sol vers y = 152
//   - crâne : demi-cercle de centre (60,58) et de rayon 42 (sommet y=16)
//   - corps « haricot » : capsule x 18..102, y 16..132
//   - bras : x 4..19 et x 101..116, y 58..104
//   - jambes : x 39..53 et x 67..81, y 118..152
//  Chaque skin respecte cet encombrement pour que la mise en page
//  (grilles, mini-avatars du sélecteur) ne bouge pas.
//
//  RÈGLES DE DESSIN
//   - Personnages 100% ORIGINAUX, mignons et rigolos — aucune
//     ressemblance avec un personnage de film/série/jeu connu.
//   - Aplats + 2/3 nuances d'ombre et de reflet, contours sombres fins.
//   - Aucun <defs> ni gradient à `id` : plusieurs avatars cohabitent
//     sur la même page, les ids entreraient en collision.
//   - Pas de sang, pas de gore, rien de réellement effrayant.
// ============================================================

// Contour commun : un brun-violet sombre, plus doux qu'un noir pur.
const T = '#241c2a'

// Petite étoile à 5 branches (centrée sur 0,0, rayon ~5) — via <g transform>.
const ETOILE = 'M0 -5 L1.5 -1.6 L5 -1.4 L2.2 0.8 L3.2 4.4 L0 2.4 L-3.2 4.4 L-2.2 0.8 L-5 -1.4 L-1.5 -1.6 Z'

// ------------------------------------------------------------
//  🧛 hfullvampire — « Petit Vampire » : grande cape noire doublée
//  de rouge, col haut dressé, peau pâle, petits crocs rigolos,
//  nœud papillon rouge, cheveux noirs gominés.
// ------------------------------------------------------------
function vampire() {
  const peau = '#ffe6da'
  const peauF = '#e8b89e'
  const noir = '#18121f'
  const noirC = '#2a2135'
  const rouge = '#d41f1f'
  const rougeF = '#9e1515'

  return (
    <g>
      {/* Grande cape noire doublée de rouge (DERRIÈRE tout le reste) */}
      <path d="M10 30 Q60 4 110 30 L118 138 Q60 158 2 138 Z" fill={noir} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 34 Q60 10 106 34 L110 60 Q60 42 10 60 Z" fill={rouge} opacity="0.88" />
      <path d="M8 90 Q60 110 112 90 L110 132 Q60 150 10 132 Z" fill={rouge} opacity="0.2" />
      {/* col haut dressé de chaque côté du visage, doublé de rouge */}
      <path d="M30 40 Q20 10 44 0 Q36 26 42 44 Z" fill={noir} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 38 Q27 16 42 6 Q37 26 41 40 Z" fill={rouge} opacity="0.85" />
      <path d="M90 40 Q100 10 76 0 Q84 26 78 44 Z" fill={noir} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M87 38 Q93 16 78 6 Q83 26 79 40 Z" fill={rouge} opacity="0.85" />

      {/* Jambes */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      {/* petites chaussures noires */}
      <ellipse cx="44" cy="150" rx="13" ry="8" fill={noirC} stroke={T} strokeWidth="2" />
      <ellipse cx="76" cy="150" rx="13" ry="8" fill={noirC} stroke={T} strokeWidth="2" />
      <ellipse cx="40" cy="147" rx="4.5" ry="2.2" fill="#fff" opacity="0.3" />
      <ellipse cx="72" cy="147" rx="4.5" ry="2.2" fill="#fff" opacity="0.3" />

      {/* Bras noirs, mains pâles */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <circle cx="12.5" cy="104" r="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill={peau} stroke={T} strokeWidth="1.5" />

      {/* Corps (costume noir) + reflet */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={noir} stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.08" />
      {/* plastron blanc + nœud papillon rouge */}
      <path d="M44 48 L60 72 L76 48 Z" fill="#fff" opacity="0.92" />
      <ellipse cx="51" cy="56" rx="7" ry="4.6" fill={rouge} stroke={rougeF} strokeWidth="1.2" transform="rotate(-18 51 56)" />
      <ellipse cx="69" cy="56" rx="7" ry="4.6" fill={rouge} stroke={rougeF} strokeWidth="1.2" transform="rotate(18 69 56)" />
      <circle cx="60" cy="56" r="3" fill={rougeF} />

      {/* Visage pâle */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill={peau} />
      <ellipse cx="47" cy="52" rx="11" ry="7" fill="#fff" opacity="0.3" />
      <circle cx="49" cy="60" r="6" fill={T} />
      <circle cx="71" cy="60" r="6" fill={T} />
      <circle cx="51.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="73.4" cy="57.6" r="2.1" fill="#fff" />
      {/* petites joues roses, pour rester mignon malgré la pâleur */}
      <circle cx="40" cy="70" r="4.2" fill="#ff9fb0" opacity="0.55" />
      <circle cx="80" cy="70" r="4.2" fill="#ff9fb0" opacity="0.55" />
      {/* sourire avec deux petits crocs rigolos (jamais de sang) */}
      <path d="M50 71 Q60 78 70 71" stroke={T} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M54.5 72.2 l-1.6 4 l3 -1.5 Z" fill="#fff" stroke={peauF} strokeWidth="0.4" />
      <path d="M65.5 72.2 l1.6 4 l-3 -1.5 Z" fill="#fff" stroke={peauF} strokeWidth="0.4" />

      {/* Cheveux noirs gominés en arrière, pointe sur le front */}
      <path d="M16 46 Q10 12 60 10 Q110 12 104 46 Q60 38 16 46 Z" fill={noir} />
      <path d="M50 40 Q60 52 70 40 Q60 44 50 40 Z" fill={noir} />
      <path d="M30 22 Q48 12 68 14 Q52 20 40 34 Z" fill={noirC} opacity="0.5" />
      <g stroke="#0d0a12" strokeWidth="1" fill="none" opacity="0.45" strokeLinecap="round">
        <path d="M60 11 Q46 24 36 38" />
        <path d="M60 11 Q74 24 84 38" />
      </g>
    </g>
  )
}

// ------------------------------------------------------------
//  🧙 hfullsorciere — « Petite Sorcière » : robe violette à étoiles
//  dorées, chapeau pointu violet à boucle jaune, cheveux orange en
//  tresses, petites bottines.
// ------------------------------------------------------------
function sorciere() {
  const peau = '#ffd9b0'
  const violet = '#4c1f96'
  const violetF = '#2e0f66'
  const violetC = '#6b3fc4'
  const jaune = '#ffe14d'
  const jauneF = '#c98a17'
  const roux = '#d4690a'
  const rouxF = '#9a4a08'

  return (
    <g>
      {/* Jambes + petites bottines violettes */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <path d="M33 150 Q33 134 44 134 Q55 134 55 150 Z" fill={violetF} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <path d="M65 150 Q65 134 76 134 Q87 134 87 150 Z" fill={violetF} stroke={T} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="44" cy="150" rx="12" ry="5" fill={violet} />
      <ellipse cx="76" cy="150" rx="12" ry="5" fill={violet} />
      <circle cx="40" cy="138" r="2.4" fill={jaune} stroke={jauneF} strokeWidth="0.8" />
      <circle cx="80" cy="138" r="2.4" fill={jaune} stroke={jauneF} strokeWidth="0.8" />

      {/* Bras nus */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <circle cx="12.5" cy="104" r="6.5" fill={peau} stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill={peau} stroke={T} strokeWidth="1.5" />

      {/* Corps + robe violette évasée */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={violet} stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.14" />
      <path d="M18.6 96 A42 42 0 0 0 101.4 96 L108 132 Q60 146 12 132 Z" fill={violetF} stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M22 110 Q60 122 98 110" stroke={violetC} strokeWidth="1.6" fill="none" opacity="0.6" />
      {/* étoiles dorées scintillantes sur la robe */}
      <g className="d-stars-twinkle" fill={jaune} stroke={jauneF} strokeWidth="0.7">
        <path d={ETOILE} transform="translate(34 60) scale(0.5)" />
        <path d={ETOILE} transform="translate(86 70) scale(0.6)" />
        <path d={ETOILE} transform="translate(50 108) scale(0.55)" />
        <path d={ETOILE} transform="translate(76 118) scale(0.45)" />
      </g>

      {/* Visage */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill={peau} />
      <ellipse cx="47" cy="52" rx="11" ry="7" fill="#fff" opacity="0.35" />
      <circle cx="49" cy="60" r="6" fill={T} />
      <circle cx="71" cy="60" r="6" fill={T} />
      <circle cx="51.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="73.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="38" cy="70" r="4.6" fill="#ff9fb0" opacity="0.7" />
      <circle cx="82" cy="70" r="4.6" fill="#ff9fb0" opacity="0.7" />
      <path d="M50 71 Q60 78 70 71" stroke="#c46a7a" strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {/* Cheveux orange + deux tresses nouées de jaune */}
      <path d="M28 40 Q32 12 60 10 Q88 12 92 40 Q76 22 60 22 Q44 22 28 40 Z" fill={roux} stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M28 36 Q19 50 24 68 Q29 86 22 100" stroke={roux} strokeWidth="9" fill="none" strokeLinecap="round" />
      <g stroke={rouxF} strokeWidth="1.3" fill="none" opacity="0.6">
        <path d="M22 46 l8 3 M19 58 l9 3 M23 70 l8 3 M20 84 l8 3" />
      </g>
      <path d="M92 36 Q101 50 96 68 Q91 86 98 100" stroke={roux} strokeWidth="9" fill="none" strokeLinecap="round" />
      <g stroke={rouxF} strokeWidth="1.3" fill="none" opacity="0.6">
        <path d="M98 46 l-8 3 M101 58 l-9 3 M97 70 l-8 3 M100 84 l-8 3" />
      </g>
      <circle cx="22" cy="100" r="4" fill={jaune} stroke={jauneF} strokeWidth="1" />
      <circle cx="98" cy="100" r="4" fill={jaune} stroke={jauneF} strokeWidth="1" />

      {/* Chapeau pointu violet, bord ondulé, boucle jaune, étoiles */}
      <path d="M32 18 Q27 -10 50 -34 Q66 -13 92 18 Q60 27 32 18 Z" fill={violet} stroke={violetF} strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 -30 Q59 -10 80 16 L66 18 Q53 -1 49 -17 Z" fill={violetC} opacity="0.55" />
      <ellipse cx="60" cy="18" rx="34" ry="7" fill={violetF} stroke={T} strokeWidth="1.8" />
      <ellipse cx="60" cy="16.5" rx="30" ry="5" fill={violet} opacity="0.8" />
      <rect x="50" y="13" width="18" height="11" rx="2" fill={jaune} stroke={jauneF} strokeWidth="1.2" />
      <rect x="57" y="15.5" width="4" height="6" rx="1" fill={violetF} />
      <g className="d-stars-twinkle" fill={jaune} stroke={jauneF} strokeWidth="0.7">
        <path d={ETOILE} transform="translate(49 -12) scale(0.55)" />
        <path d={ETOILE} transform="translate(70 6) scale(0.45)" />
      </g>
    </g>
  )
}

// ------------------------------------------------------------
//  💀 hfullsquelette — « Squelette Rigolo » : combinaison noire avec
//  des os blancs dessinés (côtes, bras, jambes), tête de squelette
//  mignonne à grand sourire et grands yeux ronds, petit nœud rose.
// ------------------------------------------------------------
function squelette() {
  const noir = '#17141f'
  const noirF = '#0d0b12'
  const blanc = '#fff4e0'
  const rose = '#ff8fc4'
  const roseF = '#d1478d'

  return (
    <g>
      {/* Jambes combinaison noire + os dessinés en blanc */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <g stroke={blanc} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.92">
        <path d="M47.5 122 v9 M47.5 135 v9" />
        <path d="M72.5 122 v9 M72.5 135 v9" />
      </g>
      {/* petites chaussures noires */}
      <ellipse cx="44" cy="150" rx="13" ry="8" fill={noirF} stroke={T} strokeWidth="2" />
      <ellipse cx="76" cy="150" rx="13" ry="8" fill={noirF} stroke={T} strokeWidth="2" />

      {/* Bras combinaison + os */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <g stroke={blanc} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.92">
        <path d="M12.5 64 v11 M12.5 83 v11" />
        <path d="M107.5 64 v11 M107.5 83 v11" />
      </g>
      <circle cx="12.5" cy="104" r="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill={noir} stroke={T} strokeWidth="1.5" />
      <g stroke={blanc} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M9 102 l3.5 4 3.5 -4" />
        <path d="M104 102 l3.5 4 3.5 -4" />
      </g>

      {/* Corps + cage thoracique blanche façon dessin animé */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={noir} stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.06" />
      <line x1="60" y1="50" x2="60" y2="96" stroke={blanc} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
      <g stroke={blanc} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.92">
        <path d="M60 58 Q44 60 38 68" />
        <path d="M60 58 Q76 60 82 68" />
        <path d="M60 70 Q42 72 36 82" />
        <path d="M60 70 Q78 72 84 82" />
        <path d="M60 82 Q44 84 40 92" />
        <path d="M60 82 Q76 84 80 92" />
      </g>

      {/* Visage squelette mignon : panneau crâne clair, grands yeux ronds */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill={blanc} stroke={T} strokeWidth="1.6" />
      <circle cx="49" cy="60" r="7.6" fill={noirF} />
      <circle cx="71" cy="60" r="7.6" fill={noirF} />
      <circle cx="51.6" cy="57.4" r="2.3" fill="#fff" />
      <circle cx="73.6" cy="57.4" r="2.3" fill="#fff" />
      {/* petit nez façon cœur */}
      <path d="M60 64 Q57 61 60 59 Q63 61 60 64 Z" fill={noirF} />
      {/* grand sourire façon squelette, bien rigolo */}
      <path d="M43 72 Q60 86 77 72 Q72 82 60 82 Q48 82 43 72 Z" fill={noirF} />
      <g stroke={blanc} strokeWidth="1.1" opacity="0.9">
        <line x1="50" y1="75" x2="50" y2="80" />
        <line x1="60" y1="76" x2="60" y2="82.5" />
        <line x1="70" y1="75" x2="70" y2="80" />
      </g>

      {/* Petit nœud rose sur le crâne */}
      <g transform="translate(60 17)">
        <ellipse cx="-8" cy="0" rx="8" ry="5.5" fill={rose} stroke={roseF} strokeWidth="1.3" transform="rotate(-15)" />
        <ellipse cx="8" cy="0" rx="8" ry="5.5" fill={rose} stroke={roseF} strokeWidth="1.3" transform="rotate(15)" />
        <circle cx="0" cy="0" r="3.4" fill={roseF} />
      </g>
    </g>
  )
}

// ------------------------------------------------------------
//  Registre des skins complets. Clé = id de l'item (lib/avatar.js).
//  Chaque valeur est une fonction qui renvoie LE BONHOMME ENTIER.
// ------------------------------------------------------------
export const HALLOWEEN_FULL = {
  hfullvampire: () => vampire(),
  hfullsorciere: () => sorciere(),
  hfullsquelette: () => squelette(),
}
