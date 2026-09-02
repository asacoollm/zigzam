// ============================================================
//  Dessins SVG de tous les accessoires de l'avatar.
//  Repère du bonhomme : viewBox 0 -24 120 192, centre x=60.
//  - Crâne ~ y 16, yeux à cx 49/71 cy 60, panneau visage y 42..78
//  - Bras droit ~ x 101..116 / main ~ (106,96), bouche ~ y 70
//  Chaque fonction renvoie un <g>. Clé = id de l'item (cf. lib/avatar.js).
//  Les cheveux sont rendus DERRIÈRE le visage et SOUS les chapeaux.
// ============================================================

import { DISNEY_HATS, DISNEY_HAIR, DISNEY_HAIR_BACK } from './disneyHats'
import { DISNEY_FACE, DISNEY_SPORT } from './disneyFaces'
import { DISNEY_ANIMAL, DISNEY_ANIMAL_PLACEMENT } from './disneyAnimals'
import { DISNEY_FULL } from './disneyFull'

const C = {
  rose: '#ff4d8d', orange: '#ff8c42', jaune: '#fbbf24', vert: '#3dd68c',
  bleu: '#00bfff', violet: '#7c3aff', rouge: '#ef4444', blanc: '#f5f5fb',
  noir: '#2b2350', brun: '#7a4a2a', brunF: '#5b3a29', gris: '#9aa3b2',
  grisF: '#6b7280', or: '#ffcf3f', orF: '#e0a92a', peau: '#ffd9b0',
}

// ----------------------------------------------------------------
//  CHEVEUX
//  Le crâne du bonhomme est un demi-cercle : centre (60,58), rayon ~42,
//  sommet à y=16. Les cheveux sont dessinés en DEUX couches :
//   - couche ARRIÈRE (renderHairBack) : longueurs qui tombent dans le dos,
//     rendues derrière le corps → seul ce qui dépasse la silhouette est visible.
//   - couche AVANT (renderHair) : la calotte qui épouse le crâne + la frange
//     sur le front, rendue par-dessus le corps et le visage (mais sous les yeux).
//  Teintes 100% naturelles (jamais rose/violet, réservés au premium « rainbow »).
// ----------------------------------------------------------------

// Palette cheveux : { base, ombre, reflet } par teinte naturelle.
const H = {
  noir:  { base: '#26222f', dark: '#15121d', light: '#46415a' },
  jet:   { base: '#1b1925', dark: '#0d0c13', light: '#3b3650' },
  brunF: { base: '#3b2a1c', dark: '#261910', light: '#5e4631' }, // brun foncé
  brun:  { base: '#5b3a24', dark: '#3d2716', light: '#7f5638' }, // brun moyen
  chat:  { base: '#714a28', dark: '#4d301a', light: '#9a6a39' }, // châtain
  blond: { base: '#dca94a', dark: '#b3842f', light: '#f4d585' },
  roux:  { base: '#b5532a', dark: '#8a3b1c', light: '#d77c46' }, // roux
}

// Calotte qui épouse le crâne (demi-cercle centre 60,58).
//  - midY    : niveau de la frange au centre du front (grand = plus bas, ~y58 frôle les yeux à y60)
//  - templeY : niveau de la naissance des cheveux sur les tempes
const skull = (midY = 48, templeY = 50) =>
  `M16 ${templeY} Q10 13 60 11 Q110 13 104 ${templeY} Q60 ${midY} 16 ${templeY} Z`

// Calotte texturée réutilisable (helper, pas un composant) :
// base + mèches + reflet + ombre de frange.
const cap = (c, midY = 48, templeY = 50, extra = null) => (
  <g>
    <path d={skull(midY, templeY)} fill={c.base} />
    {/* mèches (texture) : fines lignes partant du sommet */}
    <g stroke={c.dark} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round">
      <path d="M60 13 Q42 30 30 46" />
      <path d="M60 13 Q54 30 49 48" />
      <path d="M60 13 Q66 30 71 48" />
      <path d="M60 13 Q78 28 92 46" />
    </g>
    {/* reflet sur le haut-gauche */}
    <path d="M33 25 Q49 14 69 16 Q53 22 42 39 Z" fill={c.light} opacity="0.5" />
    {/* ombre le long de la naissance des cheveux */}
    <path d={`M16 ${templeY} Q60 ${midY} 104 ${templeY} Q60 ${midY - 6} 16 ${templeY} Z`} fill={c.dark} opacity="0.3" />
    {extra}
  </g>
)

const HAIR = {
  // — Courts : calotte nette, naissance haute, aucune longueur (châtain).
  short: () => cap(H.chat, 45, 48),

  // — Piquants : calotte + pics qui dépassent du sommet (noir).
  spiky: () => (
    <g>
      <path d={skull(44)} fill={H.noir.base} />
      <path d="M24 26 L30 2 L40 20 L49 -2 L60 18 L71 -2 L80 20 L90 2 L96 26 Q60 14 24 26 Z" fill={H.noir.base} />
      <g fill={H.noir.light} opacity="0.4">
        <path d="M49 0 l3 15 -6 0 Z" /><path d="M71 0 l3 15 -6 0 Z" />
      </g>
    </g>
  ),

  // — Mèche : raie sur le côté + mèche balayée vers la droite (blond).
  side: () => (
    <g>
      <path d={skull(46)} fill={H.blond.base} />
      <path d="M28 28 Q48 18 78 22 Q98 26 98 44 Q88 30 60 30 Q42 30 34 40 Q30 33 28 28 Z" fill={H.blond.dark} opacity="0.4" />
      <path d="M34 22 Q54 16 74 20 Q56 23 44 35 Z" fill={H.blond.light} opacity="0.6" />
    </g>
  ),

  // — Au bol : coupe lourde, naissance basse et bien ronde tout autour (brun foncé).
  bowl: () => (
    <g>
      <path d={skull(57, 55)} fill={H.brunF.base} />
      <path d="M18 54 Q60 64 102 54 Q60 60 18 54 Z" fill={H.brunF.dark} opacity="0.3" />
      <path d="M33 25 Q49 14 69 16 Q53 22 42 39 Z" fill={H.brunF.light} opacity="0.45" />
    </g>
  ),

  // — Frange : franges droites en pointes qui descendent sur le front (châtain).
  fringe: () => (
    <g>
      <path d={skull(52)} fill={H.chat.base} />
      <path d="M22 48 l5 11 4 -10 5 12 5 -11 5 12 5 -11 5 12 5 -11 5 12 5 -12 Q60 44 22 48 Z" fill={H.chat.base} />
      <path d="M30 47 q30 -7 60 0" stroke={H.chat.light} strokeWidth="2" fill="none" opacity="0.4" />
    </g>
  ),

  // — Rasés : très court, près du crâne, texture en grains (brun foncé).
  buzz: () => (
    <g>
      <path d={skull(42, 46)} fill={H.brunF.base} opacity="0.85" />
      <g fill={H.brunF.dark} opacity="0.5">
        {[[34, 24], [44, 18], [56, 15], [68, 16], [80, 20], [90, 28], [40, 34], [60, 30], [78, 34]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" />
        ))}
      </g>
    </g>
  ),

  // — Ondulés : calotte + mèches ondulées sur le front, mi-longueur (brun).
  wavy: () => (
    <g>
      <path d={skull(48)} fill={H.brun.base} />
      <path d="M20 46 q8 11 16 2 q8 11 16 2 q8 11 16 2 q8 11 16 2 q6 6 12 0 Q60 40 20 46 Z" fill={H.brun.base} />
      <g stroke={H.brun.light} strokeWidth="1.6" fill="none" opacity="0.45">
        <path d="M26 30 q8 8 16 0 q8 8 16 0 q8 8 16 0" />
      </g>
    </g>
  ),

  // — Bouclés : grappes de boucles donnant du volume et de la texture (noir).
  curly: () => (
    <g>
      <path d={skull(50)} fill={H.noir.base} />
      <g fill={H.noir.base}>
        {[[26, 30], [34, 18], [46, 12], [60, 10], [74, 12], [86, 18], [94, 30], [30, 44], [44, 41], [60, 41], [76, 41], [90, 44]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="9" />
        ))}
      </g>
      <g fill={H.noir.light} opacity="0.45">
        {[[34, 15], [60, 7], [86, 15]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" />)}
      </g>
    </g>
  ),

  // — Queue de cheval : calotte + élastique (la queue est dans la couche arrière) (blond).
  ponytail: () => (
    <g>
      <path d={skull(46)} fill={H.blond.base} />
      <ellipse cx="95" cy="30" rx="6" ry="5" fill={H.blond.dark} />
    </g>
  ),

  // — Couettes : calotte + 2 élastiques (les couettes sont dans la couche arrière) (châtain).
  pigtails: () => (
    <g>
      <path d={skull(46)} fill={H.chat.base} />
      <ellipse cx="22" cy="40" rx="5.5" ry="5" fill={H.chat.dark} />
      <ellipse cx="98" cy="40" rx="5.5" ry="5" fill={H.chat.dark} />
    </g>
  ),

  // — Chignon : calotte + chignon bien posé en haut/arrière (brun foncé).
  bun: () => (
    <g>
      <path d={skull(46)} fill={H.brunF.base} />
      <ellipse cx="60" cy="2" rx="14" ry="12" fill={H.brunF.base} />
      <g stroke={H.brunF.dark} strokeWidth="1.5" fill="none" opacity="0.55">
        <path d="M48 2 Q60 -6 72 2" /><path d="M50 6 Q60 0 70 6" /><path d="M52 -4 Q60 2 68 -4" />
      </g>
      <ellipse cx="55" cy="-2" rx="4" ry="3" fill={H.brunF.light} opacity="0.5" />
    </g>
  ),

  // — Mini afro : boule ronde et bombée, taille moyenne (noir).
  fro: () => (
    <g>
      <circle cx="60" cy="20" r="26" fill={H.noir.base} />
      <circle cx="34" cy="30" r="13" fill={H.noir.base} /><circle cx="86" cy="30" r="13" fill={H.noir.base} />
      <g fill={H.noir.dark} opacity="0.4">
        <circle cx="46" cy="16" r="6" /><circle cx="74" cy="18" r="6" /><circle cx="60" cy="30" r="6" />
      </g>
      <g fill={H.noir.light} opacity="0.4">
        <circle cx="48" cy="10" r="4" /><circle cx="70" cy="9" r="4" />
      </g>
    </g>
  ),

  // — Tresse : calotte + une tresse à droite, entrelacements visibles (brun).
  braid: () => (
    <g>
      <path d={skull(46)} fill={H.brun.base} />
      <g transform="translate(99 38)">
        <path d="M-7 0 Q-9 22 -4 44 Q0 52 4 44 Q9 22 7 0 Z" fill={H.brun.base} />
        <g fill={H.brun.light} opacity="0.5">
          <path d="M-7 2 Q-2 10 -7 16 Z" /><path d="M7 12 Q2 20 7 26 Z" /><path d="M-6 24 Q-1 31 -6 37 Z" />
        </g>
        <g stroke={H.brun.dark} strokeWidth="2" fill="none" opacity="0.7">
          <path d="M-7 6 Q0 12 7 6" /><path d="M-7 16 Q0 22 7 16" />
          <path d="M-6 26 Q0 32 6 26" /><path d="M-5 36 Q0 41 5 36" />
        </g>
        <path d="M-3 50 l3 9 3 -9 Z" fill={H.brun.dark} />
      </g>
    </g>
  ),

  // — Crête : INCHANGÉE (style premium coloré, exclu de la refonte).
  mohawk: () => (
    <g>
      <path d="M53 20 L56 -8 L60 20 Z" fill={C.rose} />
      <path d="M58 20 L62 -10 L66 20 Z" fill={C.violet} />
      <path d="M63 20 L67 -8 L71 20 Z" fill={C.bleu} />
      <path d="M40 26 Q60 18 80 26 Q60 22 40 26 Z" fill={C.violet} />
    </g>
  ),

  // — Macaron : calotte + petit chignon samouraï au sommet (noir).
  topknot: () => (
    <g>
      <path d={skull(44)} fill={H.noir.base} />
      <rect x="53" y="-9" width="14" height="15" rx="6" fill={H.noir.base} />
      <path d="M53 -2 q7 -5 14 0" stroke={H.noir.dark} strokeWidth="1.5" fill="none" opacity="0.6" />
      <ellipse cx="60" cy="-4" rx="4" ry="2.5" fill={H.noir.light} opacity="0.5" />
    </g>
  ),

  // — Emo : longue frange balayée couvrant le front gauche (noir de jais).
  emo: () => (
    <g>
      <path d={skull(50)} fill={H.jet.base} />
      <path d="M26 22 Q30 54 56 58 Q40 50 38 30 Q34 22 26 22 Z" fill={H.jet.base} />
      <path d="M30 25 Q34 48 52 55 Q40 47 38 31 Z" fill={H.jet.light} opacity="0.35" />
    </g>
  ),

  // — Dreads : locks segmentés qui tombent de chaque côté (brun foncé).
  dreads: () => (
    <g>
      <path d={skull(48)} fill={H.brunF.base} />
      {[16, 27, 93, 104].map((x, k) => (
        <g key={k}>
          <rect x={x - 4} y="44" width="8" height="56" rx="4" fill={H.brunF.dark} />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={x} cy={52 + i * 12} rx="5" ry="6.5" fill={H.brunF.base} />
          ))}
        </g>
      ))}
    </g>
  ),

  // — Macarons (spacebuns) : calotte + 2 chignons en haut sur les côtés (roux).
  spacebuns: () => (
    <g>
      <path d={skull(46)} fill={H.roux.base} />
      {[34, 86].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="-2" r="12" fill={H.roux.base} />
          <g stroke={H.roux.dark} strokeWidth="1.4" fill="none" opacity="0.6">
            <path d={`M${x - 9} -2 Q${x} -10 ${x + 9} -2`} /><path d={`M${x - 8} 2 Q${x} -5 ${x + 8} 2`} />
          </g>
          <circle cx={x - 3} cy="-6" r="3.5" fill={H.roux.light} opacity="0.5" />
        </g>
      ))}
    </g>
  ),

  // — Afro géant : grand demi-cercle bien rond autour de la tête (noir).
  afro: () => (
    <g>
      <circle cx="60" cy="22" r="40" fill={H.noir.base} />
      <g fill={H.noir.base}>
        <circle cx="22" cy="34" r="14" /><circle cx="98" cy="34" r="14" />
        <circle cx="34" cy="2" r="13" /><circle cx="86" cy="2" r="13" />
        <circle cx="60" cy="-16" r="14" />
      </g>
      <g fill={H.noir.dark} opacity="0.35">
        <circle cx="44" cy="14" r="7" /><circle cx="76" cy="16" r="7" /><circle cx="60" cy="36" r="8" />
      </g>
      <g fill={H.noir.light} opacity="0.4">
        <circle cx="46" cy="6" r="5" /><circle cx="74" cy="6" r="5" />
      </g>
    </g>
  ),

  // — Longs : calotte + mèches qui tombent devant les deux côtés (châtain).
  //   La masse arrière (dans le dos) est dans renderHairBack.
  long: () => (
    <g>
      <path d={skull(47)} fill={H.chat.base} />
      <g fill={H.chat.base}>
        <path d="M18 44 Q10 80 18 112 Q24 116 30 112 Q26 78 32 46 Z" />
        <path d="M102 44 Q110 80 102 112 Q96 116 90 112 Q94 78 88 46 Z" />
      </g>
      <g stroke={H.chat.dark} strokeWidth="1.4" fill="none" opacity="0.45">
        <path d="M24 50 Q20 80 24 108" /><path d="M96 50 Q100 80 96 108" />
      </g>
      <g stroke={H.chat.light} strokeWidth="1.4" fill="none" opacity="0.4">
        <path d="M28 52 Q26 80 28 104" /><path d="M92 52 Q94 80 92 104" />
      </g>
    </g>
  ),

  // — Arc-en-ciel : PREMIUM coloré (on garde le dégradé, mais il épouse le crâne).
  rainbow: () => (
    <g>
      <path d={skull(48)} fill="url(#fg-rainbow)" />
      <path d="M33 25 Q49 14 69 16 Q53 22 42 39 Z" fill="#fff" opacity="0.25" />
    </g>
  ),

  // ====== 🦕 JURASSIC WEB — coiffures exclusives de saison ======

  // Queue de Dino : calotte écailleuse (la longue queue est dans HAIR_BACK).
  jtail: () => (
    <g>
      <path d={skull(46)} fill="#3f8a4a" />
      <g stroke="#235e2b" strokeWidth="1.1" fill="none" opacity="0.55">
        <path d="M28 28 q6 4 12 0 q6 4 12 0 q6 4 12 0 q5 3 10 0" />
        <path d="M26 38 q6 4 12 0 q6 4 12 0 q6 4 12 0 q5 3 10 0" />
        <path d="M28 46 q6 3 12 0 q6 3 12 0 q6 3 12 0" />
      </g>
      <path d="M33 25 Q49 16 69 17 Q53 22 42 37 Z" fill="#7ed07e" opacity="0.35" />
    </g>
  ),

  // Crête de Dilophosaure : 2 crêtes colorées dressées (Jurassic Park).
  jdilo: () => (
    <g>
      <path d={skull(47)} fill="#5aa05a" />
      <path d="M44 17 Q39 -7 57 -5 Q52 8 52 19 Z" fill="#ff5a3c" stroke="#c43a1f" strokeWidth="1.5" />
      <path d="M76 17 Q81 -7 63 -5 Q68 8 68 19 Z" fill="#ff5a3c" stroke="#c43a1f" strokeWidth="1.5" />
      <path d="M46 14 Q44 -3 56 -3" stroke="#ffd23f" strokeWidth="2" fill="none" />
      <path d="M74 14 Q76 -3 64 -3" stroke="#ffd23f" strokeWidth="2" fill="none" />
      <g fill="#235e2b" opacity="0.4">
        <circle cx="40" cy="34" r="1.4" /><circle cx="60" cy="30" r="1.4" /><circle cx="80" cy="34" r="1.4" />
      </g>
    </g>
  ),

  // Dreadlocks Dino : locks verts avec une petite tête de dino au bout.
  jdreads: () => (
    <g>
      <path d={skull(48)} fill="#3b5a2a" />
      {[16, 27, 93, 104].map((x, k) => (
        <g key={k}>
          <rect x={x - 4} y="44" width="8" height="54" rx="4" fill="#2f4a22" />
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={x} cy={52 + i * 12} rx="5" ry="6.5" fill="#3f6e2c" />
          ))}
          <g transform={`translate(${x} 101)`}>
            <ellipse cx="0" cy="0" rx="5.5" ry="4.5" fill="#5aa05a" />
            <path d="M3 -1 q6 0 7 3 q-4 1 -7 1 Z" fill="#5aa05a" />
            <circle cx="1" cy="-1.5" r="1" fill="#000" />
            <path d="M-3 -4 l1 -3 1 3 M2 -4 l1 -3 1 3" fill="#2f6b3a" />
          </g>
        </g>
      ))}
    </g>
  ),
}

// Couche ARRIÈRE (derrière le corps) : longueurs qui tombent dans le dos / sur les côtés.
const HAIR_BACK = {
  long: () => (
    <g>
      {/* masse arrière, plus large que le corps → un liseré de cheveux dépasse dans le dos */}
      <path d="M20 34 Q60 22 100 34 Q104 60 100 92 Q60 80 20 92 Q16 60 20 34 Z" fill={H.chat.dark} />
      <path d="M12 44 Q4 86 14 118 L34 118 Q26 84 28 46 Z" fill={H.chat.dark} />
      <path d="M108 44 Q116 86 106 118 L86 118 Q94 84 92 46 Z" fill={H.chat.dark} />
    </g>
  ),
  ponytail: () => (
    <g fill={H.blond.base}>
      <path d="M96 26 Q120 40 112 84 Q108 100 98 104 Q108 84 100 56 Q96 40 90 34 Z" />
      <path d="M100 40 Q112 60 104 92" stroke={H.blond.dark} strokeWidth="1.5" fill="none" opacity="0.5" />
    </g>
  ),
  pigtails: () => (
    <g fill={H.chat.base}>
      <path d="M22 38 Q2 52 8 92 Q10 100 18 100 Q12 78 26 50 Z" />
      <path d="M98 38 Q118 52 112 92 Q110 100 102 100 Q108 78 94 50 Z" />
      <g stroke={H.chat.dark} strokeWidth="1.4" fill="none" opacity="0.45">
        <path d="M14 54 Q10 78 15 96" /><path d="M106 54 Q110 78 105 96" />
      </g>
    </g>
  ),

  // 🦕 Queue de Dino : longue queue écailleuse à épines, qui se balance.
  jtail: () => (
    <g className="dino-tail">
      <path d="M58 22 Q116 30 108 86 Q103 116 84 126 Q102 104 94 76 Q86 44 56 36 Z"
        fill="#3f8a4a" stroke="#235e2b" strokeWidth="2" />
      <path d="M60 30 Q104 38 98 80 Q94 104 82 116 Q94 96 88 72 Q80 46 58 40 Z"
        fill="#7ed07e" opacity="0.35" />
      <g fill="#2f6b3a" stroke="#235e2b" strokeWidth="0.8">
        <path d="M92 34 l9 -7 -1 9 Z" />
        <path d="M104 52 l10 -3 -4 9 Z" />
        <path d="M106 74 l9 2 -6 7 Z" />
        <path d="M98 96 l7 6 -8 4 Z" />
        <path d="M86 114 l3 9 -8 1 Z" />
      </g>
    </g>
  ),
}

// ----------------------------------------------------------------
//  LUNETTES  (devant les yeux : cx 49/71, cy 60)
// ----------------------------------------------------------------
const bridge = <line x1="58" y1="60" x2="62" y2="60" stroke={C.noir} strokeWidth="3" />

const GLASSES = {
  round: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.noir} strokeWidth="3">
      <circle cx="49" cy="60" r="9" /><circle cx="71" cy="60" r="9" />{bridge}
    </g>
  ),
  square: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.noir} strokeWidth="3">
      <rect x="40" y="52" width="18" height="16" rx="4" /><rect x="62" y="52" width="18" height="16" rx="4" />{bridge}
    </g>
  ),
  sun: () => (
    <g fill={C.noir}>
      <rect x="40" y="52" width="18" height="16" rx="7" /><rect x="62" y="52" width="18" height="16" rx="7" />
      <rect x="57" y="58" width="6" height="3" />
    </g>
  ),
  nerd: () => (
    <g>
      <g fill="rgba(255,255,255,0.3)" stroke={C.noir} strokeWidth="4">
        <circle cx="49" cy="60" r="9" /><circle cx="71" cy="60" r="9" />
      </g>
      <rect x="57" y="58" width="6" height="4" fill={C.blanc} stroke={C.noir} strokeWidth="1" />
    </g>
  ),
  eyemask: () => (
    <path d="M34 54 Q60 48 86 54 Q86 70 71 70 Q63 70 60 64 Q57 70 49 70 Q34 70 34 54 Z" fill={C.noir} />
  ),
  sportband: () => (
    <g>
      <path d="M34 56 Q60 50 86 56 L86 64 Q60 60 34 64 Z" fill={C.bleu} />
      <path d="M40 58 Q60 54 80 58" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  ),
  halfmoon: () => (
    <g fill="none" stroke={C.brunF} strokeWidth="3">
      <path d="M40 62 a9 9 0 0 0 18 0" /><path d="M62 62 a9 9 0 0 0 18 0" />
      <line x1="58" y1="62" x2="62" y2="62" />
    </g>
  ),
  star: () => (
    <g>
      <rect x="40" y="52" width="18" height="16" rx="4" fill={C.noir} /><rect x="62" y="52" width="18" height="16" rx="4" fill={C.noir} />{bridge}
      <path d="M49 54 l2 4 4 .3 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.3 Z" fill={C.jaune} />
      <path d="M71 54 l2 4 4 .3 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.3 Z" fill={C.jaune} />
    </g>
  ),
  heart: () => (
    <g fill={C.rose}>
      <path d="M49 56 q3 -4 6 0 q2 3 -6 9 q-8 -6 -6 -9 q3 -4 6 0 Z" />
      <path d="M71 56 q3 -4 6 0 q2 3 -6 9 q-8 -6 -6 -9 q3 -4 6 0 Z" />
      <rect x="57" y="58" width="6" height="2.5" />
    </g>
  ),
  aviator: () => (
    <g fill="rgba(120,200,255,0.5)" stroke={C.grisF} strokeWidth="2.5">
      <path d="M40 53 h18 v6 q0 9 -9 9 q-9 0 -9 -9 Z" /><path d="M62 53 h18 v6 q0 9 -9 9 q-9 0 -9 -9 Z" />
      <line x1="58" y1="55" x2="62" y2="55" />
    </g>
  ),
  swim: () => (
    <g stroke="#0090c8" strokeWidth="2.5">
      <circle cx="49" cy="60" r="9" fill="rgba(0,191,255,0.45)" /><circle cx="71" cy="60" r="9" fill="rgba(0,191,255,0.45)" />
      <path d="M40 58 Q34 56 30 58 M80 58 Q86 56 90 58" fill="none" /><line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  cateye: () => (
    <g fill="rgba(255,255,255,0.25)" stroke={C.rose} strokeWidth="3">
      <path d="M39 56 q4 -6 19 -2 q-2 12 -11 12 q-9 0 -8 -10 Z" /><path d="M81 56 q-4 -6 -19 -2 q2 12 11 12 q9 0 8 -10 Z" />
    </g>
  ),
  cyber: () => (
    <g stroke={C.noir} strokeWidth="2.5">
      <rect x="40" y="52" width="18" height="16" rx="4" fill="rgba(239,68,68,0.6)" /><rect x="62" y="52" width="18" height="16" rx="4" fill="rgba(0,191,255,0.6)" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  pixel: () => (
    <g>
      <rect x="40" y="52" width="18" height="16" fill={C.noir} /><rect x="62" y="52" width="18" height="16" fill={C.noir} />
      <rect x="44" y="56" width="10" height="8" fill={C.bleu} /><rect x="66" y="56" width="10" height="8" fill={C.vert} />
      <rect x="58" y="58" width="4" height="3" fill={C.noir} />
    </g>
  ),
  monocle: () => (
    <g>
      <circle cx="71" cy="60" r="10" fill="rgba(255,255,255,0.3)" stroke={C.or} strokeWidth="3" />
      <path d="M71 70 Q74 82 80 86" stroke={C.or} strokeWidth="1.5" fill="none" />
    </g>
  ),
  ski: () => (
    <g>
      <rect x="36" y="50" width="48" height="20" rx="10" fill="rgba(0,191,255,0.5)" stroke={C.noir} strokeWidth="3" />
      <rect x="33" y="57" width="6" height="6" rx="2" fill={C.noir} /><rect x="81" y="57" width="6" height="6" rx="2" fill={C.noir} />
    </g>
  ),
  rainbow: () => (
    <g stroke={C.noir} strokeWidth="2">
      <rect x="40" y="52" width="18" height="16" rx="7" fill="url(#fg-rainbow)" /><rect x="62" y="52" width="18" height="16" rx="7" fill="url(#fg-rainbow)" />
      <line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  gold: () => (
    <g fill="rgba(255,255,255,0.2)" stroke={C.or} strokeWidth="3.5">
      <circle cx="49" cy="60" r="9" /><circle cx="71" cy="60" r="9" />{bridge}
    </g>
  ),
  led: () => (
    <g>
      <rect x="38" y="54" width="44" height="12" rx="3" fill={C.noir} />
      {[44, 50, 56, 64, 70, 76].map((x, i) => (
        <rect key={i} x={x} y="57" width="3" height="6" fill={[C.rose, C.bleu, C.vert, C.jaune, C.bleu, C.rose][i]} />
      ))}
    </g>
  ),
  diamond: () => (
    <g stroke={C.bleu} strokeWidth="2.5" fill="rgba(0,191,255,0.2)">
      <rect x="40" y="52" width="18" height="16" rx="3" /><rect x="62" y="52" width="18" height="16" rx="3" />
      <path d="M55 48 l3 4 -3 4 -3 -4 Z" fill={C.bleu} stroke="none" /><line x1="58" y1="60" x2="62" y2="60" />
    </g>
  ),
  stargiant: () => (
    <g>
      <path d="M49 48 l4 8 9 1 -6 6 2 9 -9 -5 -9 5 2 -9 -6 -6 9 -1 Z" fill={C.jaune} stroke={C.orange} strokeWidth="1.5" />
      <path d="M73 48 l4 8 9 1 -6 6 2 9 -9 -5 -9 5 2 -9 -6 -6 9 -1 Z" fill={C.rose} stroke={C.violet} strokeWidth="1.5" />
    </g>
  ),
  laser: () => (
    <g>
      <rect x="36" y="55" width="48" height="9" rx="4" fill={C.noir} />
      <rect x="39" y="57" width="42" height="5" rx="2.5" fill={C.rouge} />
      <circle cx="84" cy="59" r="2.5" fill={C.rose} /><circle cx="36" cy="59" r="2.5" fill={C.rose} />
    </g>
  ),
}

// ----------------------------------------------------------------
//  VISAGES / bouches  (sous les yeux, ~ y 70, centre x 60)
// ----------------------------------------------------------------
const FACE = {
  smile: () => <path d="M52 69 q8 8 16 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />,
  grin: () => (
    <g>
      <path d="M50 68 q10 11 20 0 Z" fill={C.noir} />
      <path d="M53 69 q7 6 14 0 Z" fill="#fff" />
    </g>
  ),
  tongue: () => (
    <g>
      <path d="M51 68 q9 9 18 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M56 72 q4 9 9 1 q-1 -3 -9 -1 Z" fill={C.rose} />
    </g>
  ),
  surprised: () => <ellipse cx="60" cy="71" rx="4.5" ry="6" fill={C.noir} />,
  kiss: () => (
    <g>
      <path d="M56 70 q4 -4 8 0 q-4 5 -8 0 Z" fill={C.rose} />
      <path d="M68 64 q6 -2 9 2" stroke={C.rose} strokeWidth="2" fill="none" />
    </g>
  ),
  tooth: () => (
    <g>
      <path d="M52 69 q8 7 16 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="58" y="69" width="5" height="6" rx="1.5" fill="#fff" stroke={C.noir} strokeWidth="0.8" />
    </g>
  ),
  buckteeth: () => (
    <g>
      <path d="M52 68 q8 4 16 0" stroke={C.noir} strokeWidth="2.5" fill="none" />
      <rect x="55" y="69" width="5" height="8" rx="1.5" fill="#fff" stroke={C.noir} strokeWidth="0.8" />
      <rect x="60" y="69" width="5" height="8" rx="1.5" fill="#fff" stroke={C.noir} strokeWidth="0.8" />
    </g>
  ),
  moustache: () => (
    <g fill={C.brunF}>
      <path d="M48 66 Q60 62 72 66 Q66 72 60 68 Q54 72 48 66 Z" />
      <path d="M53 71 q7 6 14 0" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  moustachecurly: () => (
    <g>
      <path d="M60 67 Q50 64 44 68 Q40 72 46 72 Q44 67 52 68 Q57 69 60 70 Q63 69 68 68 Q76 67 74 72 Q80 72 76 68 Q70 64 60 67 Z" fill={C.noir} />
    </g>
  ),
  clown: () => (
    <g>
      <path d="M49 68 q11 12 22 0 Z" fill={C.rouge} />
      <circle cx="60" cy="62" r="5" fill={C.rouge} />
    </g>
  ),
  ninja: () => (
    <g>
      <rect x="33" y="64" width="54" height="14" fill={C.noir} />
      <rect x="33" y="64" width="54" height="3" fill="#1a1530" />
    </g>
  ),
  vampire: () => (
    <g>
      <path d="M52 68 q8 7 16 0" stroke={C.noir} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M55 70 l2 5 2 -5 Z" fill="#fff" /><path d="M63 70 l2 5 2 -5 Z" fill="#fff" />
    </g>
  ),
  beard: () => (
    <g>
      <path d="M40 64 Q42 92 60 92 Q78 92 80 64 Q70 76 60 76 Q50 76 40 64 Z" fill="#3a2a1a" />
      <path d="M52 70 q8 6 16 0" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  goldteeth: () => (
    <g>
      <path d="M50 68 q10 11 20 0 Z" fill={C.noir} />
      <rect x="54" y="69" width="4" height="5" fill={C.or} /><rect x="58" y="70" width="4" height="5" fill={C.or} />
      <rect x="62" y="69" width="4" height="5" fill={C.or} />
    </g>
  ),

  // ====== 🦕 JURASSIC WEB — visages exclusifs de saison ======

  // Yeux de Raptor : pupilles verticales reptiliennes, regard perçant.
  //  (rendu après les yeux par défaut → les recouvre.)
  jraptoreyes: () => (
    <g>
      <ellipse cx="49" cy="60" rx="7" ry="7.6" fill="#f5c400" stroke="#b88a00" strokeWidth="1" />
      <ellipse cx="71" cy="60" rx="7" ry="7.6" fill="#f5c400" stroke="#b88a00" strokeWidth="1" />
      <ellipse cx="49" cy="60" rx="1.9" ry="6.6" fill="#0a0a0a" />
      <ellipse cx="71" cy="60" rx="1.9" ry="6.6" fill="#0a0a0a" />
      <circle cx="51" cy="56.5" r="1.2" fill="#fff" /><circle cx="73" cy="56.5" r="1.2" fill="#fff" />
      <path d="M41 52 q8 -3 15 1" stroke="#235e2b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M64 53 q7 -4 15 -1" stroke="#235e2b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M53 72 q7 3 14 0" stroke={C.noir} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Sourire de T-Rex : énorme mâchoire pleine de dents.
  jtrexjaw: () => (
    <g>
      <path d="M44 65 Q60 86 76 65 Q60 73 44 65 Z" fill="#7a1f1f" stroke={C.noir} strokeWidth="2" />
      <g fill="#fff" stroke="#d8d8d8" strokeWidth="0.5">
        {[46, 51, 56, 61, 66, 71].map((x, i) => (
          <path key={i} d={`M${x} 66 l2.4 ${5 - (i === 2 || i === 3 ? -1 : 0)} l2.4 -5 Z`} />
        ))}
        {[49, 55, 61, 67].map((x, i) => (
          <path key={`b${i}`} d={`M${x} 75 l2.2 -5 l2.2 5 Z`} />
        ))}
      </g>
      <path d="M44 65 Q60 60 76 65" stroke={C.noir} strokeWidth="1.5" fill="none" />
    </g>
  ),

  // Écailles : le visage recouvert d'écailles vertes (regard reptilien conservé).
  jscalesface: () => (
    <g>
      <g fill="#3f8a4a" stroke="#235e2b" strokeWidth="0.6">
        {[48, 56, 64, 72].map((y, r) =>
          [38, 48, 58, 68, 78].map((x, c) => (
            <path key={`${r}-${c}`} d={`M${x + (r % 2 ? 4 : 0)} ${y} a5 4.5 0 0 1 10 0 Z`} />
          )),
        )}
      </g>
      {/* zone des yeux dégagée + yeux reptiliens */}
      <ellipse cx="49" cy="60" rx="6" ry="5.5" fill="#9bd99b" />
      <ellipse cx="71" cy="60" rx="6" ry="5.5" fill="#9bd99b" />
      <ellipse cx="49" cy="60" rx="1.6" ry="5" fill="#0a0a0a" />
      <ellipse cx="71" cy="60" rx="1.6" ry="5" fill="#0a0a0a" />
      <path d="M53 72 q7 3 14 0" stroke="#1c4a26" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  SPORT  (tenu / posé — surtout à droite près de la main ~ (106,96))
// ----------------------------------------------------------------
const ball = (color, extra) => (
  <g>
    <circle cx="106" cy="96" r="12" fill={color} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
    {extra}
  </g>
)

const SPORT = {
  foot: () => ball('#ffffff', (
    <g fill={C.noir}>
      <path d="M106 90 l4 3 -1.5 5 h-5 l-1.5 -5 Z" />
      <circle cx="99" cy="99" r="2" /><circle cx="113" cy="99" r="2" /><circle cx="106" cy="106" r="2" />
    </g>
  )),
  basket: () => ball(C.orange, (
    <g stroke="#9a4d12" strokeWidth="1.4" fill="none">
      <line x1="94" y1="96" x2="118" y2="96" /><line x1="106" y1="84" x2="106" y2="108" />
      <path d="M97 87 Q106 96 97 105 M115 87 Q106 96 115 105" />
    </g>
  )),
  tennis: () => ball('#d4f02a', (
    <path d="M98 88 Q108 96 98 104 M114 88 Q104 96 114 104" stroke="#fff" strokeWidth="1.5" fill="none" />
  )),
  pingpong: () => (
    <g>
      <circle cx="98" cy="92" r="9" fill={C.rouge} />
      <rect x="95" y="100" width="6" height="10" rx="2" fill={C.brun} />
      <circle cx="112" cy="100" r="5" fill="#fff" stroke="rgba(0,0,0,0.1)" />
    </g>
  ),
  volley: () => ball('#ffffff', (
    <path d="M106 84 v24 M95 90 Q106 96 95 104 M117 90 Q106 96 117 104" stroke={C.bleu} strokeWidth="1.5" fill="none" />
  )),
  baseball: () => ball('#ffffff', (
    <path d="M98 88 Q104 96 98 104 M114 88 Q108 96 114 104" stroke={C.rouge} strokeWidth="1.5" fill="none" />
  )),
  rugby: () => (
    <g>
      <ellipse cx="106" cy="96" rx="9" ry="13" fill={C.brun} transform="rotate(28 106 96)" />
      <line x1="101" y1="91" x2="111" y2="101" stroke="#fff" strokeWidth="1.5" />
    </g>
  ),
  golf: () => (
    <g>
      <circle cx="98" cy="86" r="6" fill="#fff" stroke="rgba(0,0,0,0.12)" />
      <path d="M104 90 L114 112" stroke={C.grisF} strokeWidth="3" /><path d="M114 112 q5 0 6 4" stroke={C.grisF} strokeWidth="3" fill="none" />
    </g>
  ),
  bowling: () => ball(C.violet, (
    <g fill={C.noir}><circle cx="103" cy="92" r="1.6" /><circle cx="109" cy="92" r="1.6" /><circle cx="106" cy="97" r="1.6" /></g>
  )),
  dumbbell: () => (
    <g fill={C.grisF}>
      <rect x="92" y="93" width="28" height="6" rx="3" />
      <rect x="90" y="87" width="7" height="18" rx="2" fill={C.noir} /><rect x="115" y="87" width="7" height="18" rx="2" fill={C.noir} />
    </g>
  ),
  boxe: () => (
    <g fill={C.rouge}>
      <path d="M98 92 q-8 0 -8 8 q0 8 9 9 l9 0 0 -16 q-4 -1 -10 -1 Z" />
      <rect x="106" y="98" width="6" height="9" rx="2" fill="#c81e1e" />
    </g>
  ),
  hockey: () => (
    <g>
      <path d="M96 78 L108 104 L120 104" stroke={C.brun} strokeWidth="4" fill="none" />
      <ellipse cx="92" cy="118" rx="7" ry="3.5" fill={C.noir} />
    </g>
  ),
  medal: () => (
    <g>
      <path d="M54 40 L60 70 M66 40 L60 70" stroke={C.rouge} strokeWidth="5" />
      <circle cx="60" cy="78" r="9" fill={C.or} stroke={C.orF} strokeWidth="2" />
      <path d="M60 73 l1.6 3.4 3.6 .4 -2.7 2.5 .7 3.6 -3.2 -1.8 -3.2 1.8 .7 -3.6 -2.7 -2.5 3.6 -.4 Z" fill={C.orF} />
    </g>
  ),
  skate: () => (
    <g>
      <rect x="24" y="150" width="72" height="8" rx="4" fill={C.rouge} />
      <path d="M24 154 q-6 0 -8 6 M96 154 q6 0 8 6" stroke="#c81e1e" strokeWidth="3" fill="none" />
      <circle cx="38" cy="162" r="4" fill={C.noir} /><circle cx="82" cy="162" r="4" fill={C.noir} />
    </g>
  ),
  ski: () => (
    <g>
      <rect x="34" y="118" width="6" height="44" rx="3" fill={C.bleu} transform="rotate(-8 37 140)" />
      <rect x="78" y="118" width="6" height="44" rx="3" fill={C.rose} transform="rotate(8 81 140)" />
      <path d="M30 118 v40 M92 118 v40" stroke={C.grisF} strokeWidth="2" />
    </g>
  ),
  shield: () => (
    <g transform="translate(104 92)">
      <path d="M0 -14 L14 -8 Q14 12 0 18 Q-14 12 -14 -8 Z" fill={C.bleu} stroke={C.violet} strokeWidth="2" />
      <path d="M0 -10 L0 14 M-11 -3 L11 -3" stroke="#fff" strokeWidth="2" />
      <circle cx="0" cy="-3" r="3" fill={C.jaune} />
    </g>
  ),
  surf: () => (
    <g>
      <path d="M104 52 Q120 96 104 150 Q92 96 104 52 Z" fill={C.vert} />
      <line x1="104" y1="60" x2="104" y2="142" stroke="#fff" strokeWidth="2" />
      <path d="M104 52 Q110 80 104 100" stroke={C.rose} strokeWidth="3" fill="none" />
    </g>
  ),
  scooter: () => (
    <g stroke={C.violet} strokeWidth="3" fill="none">
      <path d="M100 96 L100 150 L84 150 M100 150 L116 150" /><path d="M100 96 L112 96" />
      <circle cx="84" cy="154" r="5" fill={C.noir} stroke="none" /><circle cx="116" cy="154" r="5" fill={C.noir} stroke="none" />
    </g>
  ),
  bike: () => (
    <g stroke={C.bleu} strokeWidth="2.5" fill="none">
      <circle cx="86" cy="146" r="11" /><circle cx="112" cy="146" r="11" />
      <path d="M86 146 L99 130 L112 146 M99 130 L104 130 M99 130 L94 122" /><line x1="112" y1="146" x2="106" y2="130" />
    </g>
  ),
  guitar: () => (
    <g transform="rotate(28 104 100)">
      <ellipse cx="104" cy="108" rx="13" ry="16" fill={C.rouge} />
      <circle cx="104" cy="108" r="4" fill={C.noir} />
      <rect x="101" y="68" width="6" height="34" rx="2" fill={C.brunF} />
      <rect x="99" y="62" width="10" height="8" rx="2" fill={C.noir} />
    </g>
  ),
  lightsaber: () => (
    <g transform="rotate(20 104 100)">
      <rect x="100" y="58" width="8" height="52" rx="4" fill={C.vert} opacity="0.9" />
      <rect x="102" y="58" width="4" height="52" fill="#eafff2" />
      <rect x="99" y="108" width="10" height="18" rx="2" fill={C.grisF} />
      <rect x="99" y="113" width="10" height="3" fill={C.noir} />
    </g>
  ),
  trophy: () => (
    <g>
      <path d="M96 86 h20 v6 q0 9 -10 9 q-10 0 -10 -9 Z" fill={C.or} />
      <path d="M96 88 q-7 0 -7 6 q0 5 7 5 M116 88 q7 0 7 6 q0 5 -7 5" stroke={C.or} strokeWidth="2.5" fill="none" />
      <rect x="102" y="101" width="8" height="7" fill={C.orF} /><rect x="98" y="108" width="16" height="4" rx="1" fill={C.orF} />
      <path d="M106 88 l1.4 3 3.2 .3 -2.4 2.3 .6 3.2 -2.8 -1.6 -2.8 1.6 .6 -3.2 -2.4 -2.3 3.2 -.3 Z" fill="#fff7cf" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  ANIMAUX  (compagnons — TOUJOURS à CÔTÉ du bonhomme, à sa droite :
//  terrestres au sol (hauteur des pieds), volants/aquatiques un peu au-dessus.
//  Aucun animal n'est posé SUR le bonhomme.)
// ----------------------------------------------------------------
// Les dessins d'animaux sont centrés sur l'origine ; la taille et la position
// finales sont appliquées par ANIMAL_PLACEMENT (cf. renderAnimal).
// `ground` / `shoulder` ne sont plus que de simples enveloppes <g> : la
// position réelle vient de ANIMAL_PLACEMENT (tout est désormais à droite).
const ground = (children) => <g>{children}</g>
const shoulder = (children) => <g>{children}</g>

const ANIMAL = {
  cat: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={C.grisF} />
      <circle cx="0" cy="2" r="9" fill={C.grisF} />
      <path d="M-8 -5 l-3 -8 6 4 Z M8 -5 l3 -8 -6 4 Z" fill={C.grisF} />
      <circle cx="-3.5" cy="1" r="1.6" fill={C.noir} /><circle cx="3.5" cy="1" r="1.6" fill={C.noir} />
      <path d="M-9 3 h-6 M9 3 h6" stroke={C.noir} strokeWidth="0.8" />
      <path d="M11 18 q9 -2 7 -12" stroke={C.grisF} strokeWidth="4" fill="none" />
    </g>
  ),
  dog: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={C.brun} />
      <circle cx="0" cy="2" r="9" fill="#a06a3a" />
      <ellipse cx="-9" cy="2" rx="3.5" ry="7" fill={C.brun} /><ellipse cx="9" cy="2" rx="3.5" ry="7" fill={C.brun} />
      <circle cx="-3.5" cy="0" r="1.6" fill={C.noir} /><circle cx="3.5" cy="0" r="1.6" fill={C.noir} />
      <ellipse cx="0" cy="5" rx="2.4" ry="1.8" fill={C.noir} />
    </g>
  ),
  bird: () => ground(
    <g>
      <ellipse cx="0" cy="12" rx="9" ry="10" fill={C.bleu} />
      <circle cx="0" cy="0" r="7" fill={C.bleu} />
      <path d="M7 0 l7 2 -7 2 Z" fill={C.orange} /><circle cx="2" cy="-1" r="1.5" fill={C.noir} />
      <path d="M-2 12 q-9 -2 -9 5 q7 0 9 -1 Z" fill="#0090c8" />
    </g>
  ),
  fish: () => <g>
    <ellipse cx="0" cy="0" rx="13" ry="9" fill={C.orange} />
    <path d="M11 0 l9 -7 0 14 Z" fill={C.orange} />
    <circle cx="-5" cy="-1" r="2" fill={C.noir} /><path d="M-2 -5 q5 -3 9 0" stroke="#d96c1e" strokeWidth="1.4" fill="none" />
  </g>,
  rabbit: () => ground(
    <g fill="#e9e3f0">
      <ellipse cx="0" cy="16" rx="10" ry="10" /><circle cx="0" cy="3" r="8" />
      <ellipse cx="-4" cy="-9" rx="3" ry="9" /><ellipse cx="4" cy="-9" rx="3" ry="9" />
      <circle cx="-3" cy="2" r="1.4" fill={C.noir} /><circle cx="3" cy="2" r="1.4" fill={C.noir} />
      <circle cx="0" cy="6" r="1.6" fill={C.rose} />
    </g>
  ),
  frog: () => ground(
    <g fill={C.vert}>
      <ellipse cx="0" cy="14" rx="13" ry="11" />
      <circle cx="-6" cy="2" r="5" /><circle cx="6" cy="2" r="5" />
      <circle cx="-6" cy="2" r="2.4" fill="#fff" /><circle cx="6" cy="2" r="2.4" fill="#fff" />
      <circle cx="-6" cy="2" r="1.2" fill={C.noir} /><circle cx="6" cy="2" r="1.2" fill={C.noir} />
      <path d="M-7 16 q7 5 14 0" stroke="#1f9d68" strokeWidth="1.8" fill="none" />
    </g>
  ),
  turtle: () => ground(
    <g>
      <path d="M-14 18 q14 -18 28 0 Z" fill={C.vert} />
      <path d="M-14 18 q14 -18 28 0" fill="none" stroke="#1f9d68" strokeWidth="1.8" />
      <circle cx="16" cy="15" r="4.5" fill="#8fd64a" />
      <ellipse cx="-13" cy="19" rx="3.5" ry="2.4" fill="#8fd64a" /><ellipse cx="13" cy="19" rx="3.5" ry="2.4" fill="#8fd64a" />
    </g>
  ),
  hamster: () => ground(
    <g fill="#e0b97a">
      <ellipse cx="0" cy="14" rx="12" ry="11" />
      <circle cx="-8" cy="4" r="3.5" /><circle cx="8" cy="4" r="3.5" />
      <circle cx="-3.5" cy="10" r="1.5" fill={C.noir} /><circle cx="3.5" cy="10" r="1.5" fill={C.noir} />
      <ellipse cx="0" cy="15" rx="7" ry="5" fill="#f0d4a0" /><circle cx="0" cy="12" r="1.2" fill={C.rose} />
    </g>
  ),
  fox: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={C.orange} />
      <circle cx="0" cy="3" r="9" fill={C.orange} />
      <path d="M-8 -4 l-4 -10 7 5 Z M8 -4 l4 -10 -7 5 Z" fill={C.orange} />
      <path d="M0 3 q-6 5 0 9 q6 -4 0 -9 Z" fill="#fff" />
      <circle cx="-3.5" cy="1" r="1.4" fill={C.noir} /><circle cx="3.5" cy="1" r="1.4" fill={C.noir} />
    </g>
  ),
  bee: () => <g>
    <ellipse cx="0" cy="0" rx="11" ry="8" fill={C.jaune} />
    <path d="M-4 -7 v14 M4 -7 v14" stroke={C.noir} strokeWidth="3" />
    <ellipse cx="-5" cy="-8" rx="5" ry="4" fill="#fff" opacity="0.8" /><ellipse cx="5" cy="-8" rx="5" ry="4" fill="#fff" opacity="0.8" />
    <circle cx="11" cy="-1" r="1.4" fill={C.noir} />
  </g>,
  ladybug: () => ground(
    <g>
      <ellipse cx="0" cy="12" rx="12" ry="11" fill={C.rouge} />
      <circle cx="0" cy="1" r="4.5" fill={C.noir} />
      <line x1="0" y1="4" x2="0" y2="22" stroke={C.noir} strokeWidth="1.8" />
      <circle cx="-6" cy="11" r="2" fill={C.noir} /><circle cx="6" cy="11" r="2" fill={C.noir} />
      <circle cx="-5" cy="18" r="2" fill={C.noir} /><circle cx="5" cy="18" r="2" fill={C.noir} />
    </g>
  ),
  butterfly: () => <g>
    <ellipse cx="-5" cy="-4" rx="6" ry="7" fill={C.rose} /><ellipse cx="5" cy="-4" rx="6" ry="7" fill={C.violet} />
    <ellipse cx="-5" cy="6" rx="5" ry="5" fill={C.bleu} /><ellipse cx="5" cy="6" rx="5" ry="5" fill={C.vert} />
    <rect x="-1" y="-8" width="2" height="17" rx="1" fill={C.noir} />
  </g>,
  panda: () => ground(
    <g>
      <ellipse cx="0" cy="16" rx="11" ry="10" fill="#fff" /><circle cx="0" cy="2" r="9" fill="#fff" />
      <circle cx="-7" cy="-6" r="3.5" fill={C.noir} /><circle cx="7" cy="-6" r="3.5" fill={C.noir} />
      <ellipse cx="-3.5" cy="2" rx="3" ry="3.5" fill={C.noir} /><ellipse cx="3.5" cy="2" rx="3" ry="3.5" fill={C.noir} />
      <circle cx="0" cy="7" r="1.5" fill={C.noir} />
    </g>
  ),
  penguin: () => ground(
    <g>
      <ellipse cx="0" cy="8" rx="10" ry="15" fill={C.noir} />
      <ellipse cx="0" cy="11" rx="6" ry="10" fill="#fff" />
      <circle cx="-3" cy="0" r="1.5" fill={C.noir} /><circle cx="3" cy="0" r="1.5" fill={C.noir} />
      <path d="M-2 3 l4 0 -2 4 Z" fill={C.orange} />
      <ellipse cx="-5" cy="23" rx="3.5" ry="2" fill={C.orange} /><ellipse cx="5" cy="23" rx="3.5" ry="2" fill={C.orange} />
    </g>
  ),
  owl: () => shoulder(
    <g>
      <ellipse cx="0" cy="8" rx="11" ry="13" fill={C.brun} />
      <path d="M-9 -4 l-2 -7 6 4 Z M9 -4 l2 -7 -6 4 Z" fill={C.brun} />
      <circle cx="-4" cy="2" r="4.5" fill="#fff" /><circle cx="4" cy="2" r="4.5" fill="#fff" />
      <circle cx="-4" cy="2" r="2" fill={C.noir} /><circle cx="4" cy="2" r="2" fill={C.noir} />
      <path d="M-2 5 l2 3 2 -3 Z" fill={C.orange} />
    </g>
  ),
  cow: () => ground(
    <g>
      {/* corps + tête */}
      <ellipse cx="0" cy="16" rx="13" ry="11" fill="#fff" />
      <circle cx="0" cy="2" r="9.5" fill="#fff" />
      {/* cornes */}
      <path d="M-8 -7 q-6 -2 -9 2 q5 0 7 3 Z M8 -7 q6 -2 9 2 q-5 0 -7 3 Z" fill="#d9c08a" />
      {/* oreilles */}
      <ellipse cx="-10" cy="0" rx="3.5" ry="2.5" fill="#fff" /><ellipse cx="10" cy="0" rx="3.5" ry="2.5" fill="#fff" />
      {/* taches noires */}
      <ellipse cx="-8" cy="17" rx="5.5" ry="4.5" fill={C.noir} />
      <ellipse cx="7" cy="13" rx="4.5" ry="4" fill={C.noir} />
      <circle cx="6" cy="-3" r="3.2" fill={C.noir} />
      {/* museau */}
      <ellipse cx="0" cy="7" rx="6.5" ry="5" fill={C.rose} />
      <circle cx="-2.5" cy="7" r="1.1" fill="#c2628a" /><circle cx="2.5" cy="7" r="1.1" fill="#c2628a" />
      {/* yeux */}
      <circle cx="-4" cy="1" r="1.4" fill={C.noir} /><circle cx="4" cy="1" r="1.4" fill={C.noir} />
      {/* pis */}
      <path d="M-3 25 l-1 4 M0 26 l0 4 M3 25 l1 4" stroke={C.rose} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  ghost: () => ground(
    <g>
      <path d="M-11 18 V2 Q-11 -10 0 -10 Q11 -10 11 2 V18 Q7 12 4 18 Q1 12 -2 18 Q-5 12 -8 18 Z" fill="#eef0ff" opacity="0.92" stroke={C.gris} strokeWidth="1" />
      <circle cx="-4" cy="2" r="2" fill={C.noir} /><circle cx="4" cy="2" r="2" fill={C.noir} />
      <ellipse cx="0" cy="8" rx="2.5" ry="3" fill={C.noir} />
    </g>
  ),
  snake: () => (
    <g>
      <path d="M-9 10 q-5 -7 3 -8 q9 -1 4 8 q-3 6 4 6 q9 0 5 -9"
        fill="none" stroke={C.vert} strokeWidth="5" strokeLinecap="round" />
      <circle cx="12" cy="-4" r="4" fill={C.vert} />
      <circle cx="13.5" cy="-5" r="1" fill={C.noir} />
      <path d="M15 -2 l5 1 -5 1.5" stroke={C.rouge} strokeWidth="1.2" fill="none" />
    </g>
  ),
  parrot: () => shoulder(
    <g>
      <ellipse cx="0" cy="8" rx="8" ry="13" fill={C.vert} />
      <circle cx="0" cy="-5" r="7" fill={C.rouge} />
      <path d="M6 -6 q7 1 5 7 q-4 -2 -6 -2 Z" fill={C.jaune} /><circle cx="-1" cy="-6" r="1.5" fill={C.noir} />
      <path d="M-6 8 q-8 5 -7 14 q6 -3 8 -7 Z" fill={C.bleu} />
    </g>
  ),
  shark: () => ground(
    <g>
      <path d="M-14 12 Q-2 0 14 8 Q4 14 14 18 Q0 22 -14 12 Z" fill={C.gris} />
      <path d="M0 0 L4 -10 L9 2 Z" fill={C.grisF} />
      <circle cx="-7" cy="9" r="1.6" fill={C.noir} />
      <path d="M-4 12 l4 0 -2 3 Z" fill="#fff" />
    </g>
  ),
  dino: () => ground(
    <g>
      {/* silhouette T-Rex : queue, corps, grosse tête, pattes */}
      <path d="M-17 10 Q-12 6 -7 8 Q-12 -2 0 -3 Q2 -13 11 -11 Q19 -9 18 -1
               Q18 7 11 8 Q12 15 5 17 L7 24 L1 24 L-1 18
               Q-9 19 -10 11 L-9 24 L-15 24 L-15 12 Z"
        fill={C.vert} stroke="#1f9d68" strokeWidth="1" />
      {/* plaques dorsales */}
      <path d="M-7 -2 l2 -5 2 5 2 -4 2 4 2 -4 2 4" fill="#2f8a5a" />
      {/* dents */}
      <path d="M6 5 l2 0 0 2 -2 0 M9 5 l2 0 0 2 -2 0 M12 5 l2 0 0 2 -2 0" fill="#fff" />
      {/* oeil */}
      <circle cx="12" cy="-3" r="1.7" fill={C.noir} />
    </g>
  ),
  alien: () => ground(
    <g>
      {/* corps fin */}
      <ellipse cx="0" cy="18" rx="6" ry="8" fill="#7ee787" />
      <path d="M-6 18 l-7 5 M6 18 l7 5" stroke="#7ee787" strokeWidth="2.5" strokeLinecap="round" />
      {/* grand crâne */}
      <ellipse cx="0" cy="2" rx="12" ry="14" fill="#7ee787" />
      <ellipse cx="0" cy="-3" rx="12" ry="9" fill="#8ff196" />
      {/* yeux immenses en amande */}
      <ellipse cx="-5" cy="3" rx="4.2" ry="6.5" fill={C.noir} transform="rotate(-16 -5 3)" />
      <ellipse cx="5" cy="3" rx="4.2" ry="6.5" fill={C.noir} transform="rotate(16 5 3)" />
      <circle cx="-6" cy="0" r="1.3" fill="#fff" /><circle cx="4" cy="0" r="1.3" fill="#fff" />
      {/* petite bouche */}
      <path d="M-2 13 q2 2 4 0" stroke="#3a7a4a" strokeWidth="1.2" fill="none" />
      {/* antennes */}
      <line x1="-5" y1="-13" x2="-8" y2="-21" stroke="#5bbf63" strokeWidth="1.6" />
      <line x1="5" y1="-13" x2="8" y2="-21" stroke="#5bbf63" strokeWidth="1.6" />
      <circle cx="-8" cy="-22" r="2.4" fill={C.vert} /><circle cx="8" cy="-22" r="2.4" fill={C.vert} />
    </g>
  ),
  dragon: () => ground(
    <g>
      {/* aile membranée */}
      <path d="M2 2 Q20 -12 24 4 Q16 1 13 7 Q11 0 2 2 Z" fill="#5a1fd4" />
      <path d="M24 4 L18 3 M24 4 L15 7" stroke="#3b1499" strokeWidth="1" />
      {/* queue */}
      <path d="M-9 14 Q-18 16 -18 8 Q-14 12 -10 10 Z" fill={C.vert} />
      {/* corps + tête */}
      <ellipse cx="0" cy="12" rx="11" ry="10" fill={C.vert} />
      <circle cx="-3" cy="0" r="8.5" fill={C.vert} />
      <ellipse cx="0" cy="14" rx="6" ry="6" fill="#bff0c8" />
      {/* écailles dorsales */}
      <path d="M-9 3 l2 -4 2 4 2 -4 2 4 2 -4 2 4" fill="#2f8a5a" />
      {/* cornes */}
      <path d="M-7 -7 l-1 -6 4 4 Z M-1 -8 l1 -6 3 5 Z" fill="#2f8a5a" />
      {/* yeux + naseaux */}
      <circle cx="-6" cy="-1" r="1.6" fill={C.jaune} /><circle cx="0" cy="-2" r="1.6" fill={C.jaune} />
      <circle cx="-9" cy="2" r="0.9" fill={C.noir} />
      {/* feu */}
      <path d="M-11 2 Q-20 0 -25 3 Q-20 4 -22 6 Q-16 5 -18 8 Q-12 6 -11 2 Z" fill={C.orange} />
      <path d="M-13 3 Q-19 2 -22 4 Q-17 4 -16 5 Z" fill={C.jaune} />
    </g>
  ),
  unicorn: () => ground(
    <g>
      {/* aile (licorne ailée) */}
      <path d="M6 8 Q20 -6 24 8 Q17 4 12 12 Q9 7 6 8 Z" fill="#dff1ff" stroke={C.bleu} strokeWidth="0.8" />
      {/* crinière colorée (derrière) */}
      <path d="M-4 -8 q-12 3 -11 18 q5 -6 10 -10 q-4 8 -2 14 q4 -7 5 -16 Z" fill={C.rose} />
      <path d="M-2 -7 q-8 5 -6 16 q4 -5 7 -12 Z" fill={C.violet} />
      {/* corps + tête */}
      <ellipse cx="0" cy="16" rx="11" ry="10" fill="#fff" />
      <circle cx="0" cy="3" r="9.5" fill="#fff" />
      <path d="M-8 -4 l-2 -7 5 4 Z" fill="#fff" />
      {/* corne arc-en-ciel segmentée */}
      <path d="M4 -6 l3 -14 4 4 Z" fill="#ffd23f" />
      <path d="M5.2 -9 l3.5 0" stroke={C.orange} strokeWidth="1.6" />
      <path d="M5.9 -12 l3 0" stroke={C.rose} strokeWidth="1.6" />
      <path d="M6.6 -15 l2.4 0" stroke={C.bleu} strokeWidth="1.6" />
      {/* queue colorée */}
      <path d="M10 14 q10 0 10 13 q-5 -4 -11 -6 Z" fill={C.bleu} />
      <path d="M10 16 q7 2 8 11 q-4 -4 -9 -7 Z" fill={C.vert} />
      {/* visage */}
      <circle cx="-2" cy="3" r="1.5" fill={C.noir} /><circle cx="4" cy="3" r="1.5" fill={C.noir} />
      <ellipse cx="1" cy="9" rx="4" ry="3" fill="#ffe3ef" />
      <circle cx="0" cy="9" r="1" fill={C.rose} />
    </g>
  ),

  // ====== 🦕 JURASSIC WEB — compagnons exclusifs de saison ======

  // Meute de Raptors : 3 vélociraptors qui courent (animation de course).
  jraptors: () => ground(
    <g>
      {[
        { t: 'translate(2 8) scale(1.05)', d: '0s' },
        { t: 'translate(-6 -8) scale(0.8)', d: '0.18s' },
        { t: 'translate(10 0) scale(0.92)', d: '0.36s' },
      ].map((r, i) => (
        <g key={i} className="dino-raptor" style={{ animationDelay: r.d }} transform={r.t}>
          <path d="M9 0 Q19 -3 22 3" stroke="#6a8a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="2" cy="2" rx="8" ry="5" fill="#7caa4a" />
          <path d="M-5 0 Q-13 -4 -16 2 Q-11 4 -5 4 Z" fill="#7caa4a" />
          <path d="M-4 -2 q6 -3 12 0" stroke="#4a6a2a" strokeWidth="1.5" fill="none" />
          <circle cx="-13" cy="0.5" r="1" fill="#000" />
          <path d="M-16 2 l-3 0.5" stroke="#5a7a3a" strokeWidth="1" />
          <path d="M0 6 l-2 7 M4 6 l1 7" stroke="#5a7a3a" strokeWidth="2" strokeLinecap="round" />
          <path d="M-2 13 l-3 1 M5 13 l3 1" stroke="#5a7a3a" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </g>,
  ),

  // Bébé Brachiosaure : immense, son long cou dépasse au-dessus de l'avatar.
  jbrachio: () => ground(
    <g>
      <rect x="-14" y="6" width="6" height="22" rx="3" fill="#5a7a90" />
      <rect x="-2" y="8" width="6" height="20" rx="3" fill="#6a8aa0" />
      <rect x="10" y="6" width="6" height="22" rx="3" fill="#5a7a90" />
      <path d="M16 0 Q34 0 40 12" stroke="#7a9ab0" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy="2" rx="20" ry="13" fill="#7a9ab0" />
      <ellipse cx="-2" cy="6" rx="14" ry="7" fill="#bcd0de" opacity="0.55" />
      <g className="dino-brachio">
        <path d="M-12 -6 Q-28 -38 -22 -68 Q-20 -77 -13 -76 Q-17 -44 -3 -10 Z"
          fill="#7a9ab0" stroke="#5a7a90" strokeWidth="1.5" />
        <ellipse cx="-16" cy="-76" rx="7.5" ry="5.5" fill="#8aa6bc" />
        <path d="M-22 -77 q-5 -1 -7 1 q4 2 7 1 Z" fill="#8aa6bc" />
        <circle cx="-20" cy="-78" r="1.2" fill="#000" />
        <path d="M-14 -82 l1 -4 1 4 M-18 -82 l1 -4 1 4" fill="#6a8aa0" />
      </g>
    </g>,
  ),

  // T-Rex Compagnon : aussi grand que l'avatar, à côté, qui rugit.
  jtrexbuddy: () => ground(
    <g>
      <path d="M14 4 Q40 0 50 16" stroke="#3f8a4a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M0 14 L-4 40 L7 40 L7 16 Z" fill="#2f6b3a" />
      <path d="M10 14 L8 40 L19 40 L17 14 Z" fill="#3f8a4a" />
      <path d="M-18 -2 Q-22 18 0 22 Q20 22 18 0 Q14 -16 -4 -14 Q-16 -12 -18 -2 Z"
        fill="#3f8a4a" stroke="#235e2b" strokeWidth="2" />
      <path d="M-10 8 Q2 18 14 10 Q4 14 -8 12 Z" fill="#7ed07e" opacity="0.7" />
      <path d="M-12 -10 l3 -6 3 6 3 -6 3 6 3 -6 3 6" fill="#235e2b" />
      <path d="M-6 4 q-6 2 -8 7" stroke="#235e2b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g transform="translate(-18 -10)">
        <path d="M0 0 Q-22 -2 -26 8 Q-24 13 -10 12 Q2 12 4 4 Z" fill="#3f8a4a" stroke="#235e2b" strokeWidth="2" />
        <path d="M-20 9 Q-8 13 0 7 Q-10 11 -18 10 Z" fill="#7a1f1f" />
        <path d="M-22 7 l1 4 2 -3 M-16 7 l1 4 2 -3 M-10 6 l1 4 2 -3" fill="#fff" />
        <g className="dino-roar-jaw">
          <path d="M-24 10 Q-12 20 2 12 Q-10 16 -22 14 Z" fill="#2f6b3a" stroke="#235e2b" strokeWidth="1.5" />
          <path d="M-18 13 l1 -3 2 3 M-10 14 l1 -3 2 3" fill="#fff" />
        </g>
        <circle cx="-6" cy="0" r="2.4" fill="#f5d000" /><circle cx="-6" cy="0" r="1.1" fill="#000" />
        <circle cx="-22" cy="6" r="0.9" fill="#235e2b" />
      </g>
    </g>,
  ),

  // Ptérosaure Volant : tourne en cercle au-dessus de la tête (ailes qui battent).
  jpterofly: () => (
    <g className="dino-ptero-orbit">
      <g className="dino-ptero-wingL"><path d="M0 0 Q-26 -10 -36 2 Q-20 -2 -4 4 Z" fill="#7a6a9a" stroke="#5a4a7a" strokeWidth="1" /></g>
      <g className="dino-ptero-wingR"><path d="M0 0 Q26 -10 36 2 Q20 -2 4 4 Z" fill="#7a6a9a" stroke="#5a4a7a" strokeWidth="1" /></g>
      <ellipse cx="0" cy="3" rx="4" ry="7" fill="#8a6aaa" />
      <path d="M0 -4 Q2 -12 10 -12 Q4 -8 6 -2 Z" fill="#8a6aaa" />
      <path d="M2 -3 l15 -2 -13 4 Z" fill="#9a7aba" />
      <circle cx="3" cy="-3" r="1" fill="#000" />
    </g>
  ),
}

// Position + échelle finales de chaque animal : TOUJOURS à droite du bonhomme,
// jamais posé dessus. Le bonhomme occupe x≈18..102, pieds ≈ y152.
//  - terrestres : centrés ~x150, posés au sol (bas de l'animal ≈ y150)
//  - volants    : centrés ~x150, un peu plus haut (au-dessus des pieds)
//  - aquatiques : centrés ~x150, flottent à mi-hauteur
//  Les petits animaux sont nettement agrandis pour rester visibles à droite.
const ANIMAL_MED = 'translate(150 90) scale(2.4)'
const ANIMAL_PLACEMENT = {
  // --- Terrestres : au sol, à droite, à hauteur des pieds ---
  dino: 'translate(154 80) scale(2.9)',
  cow: 'translate(150 75) scale(2.6)',
  dog: 'translate(152 77) scale(2.8)',
  panda: 'translate(152 77) scale(2.8)',
  fox: 'translate(150 85) scale(2.5)',
  cat: 'translate(150 88) scale(2.4)',
  rabbit: 'translate(150 88) scale(2.4)',
  frog: 'translate(150 90) scale(2.4)',
  turtle: 'translate(150 98) scale(2.5)',
  hamster: 'translate(150 90) scale(2.4)',
  penguin: 'translate(150 90) scale(2.4)',
  ladybug: 'translate(150 97) scale(2.3)',
  snake: 'translate(148 110) scale(2.5)',
  // --- Volants : à droite, légèrement au-dessus ---
  dragon: 'translate(152 52) scale(1.9)',
  unicorn: 'translate(150 52) scale(1.9)',
  ghost: 'translate(150 48) scale(2.3)',
  owl: 'translate(150 46) scale(2.3)',
  parrot: 'translate(150 46) scale(2.3)',
  bird: 'translate(150 50) scale(2.3)',
  bee: 'translate(150 54) scale(2.1)',
  butterfly: 'translate(150 52) scale(2.1)',
  alien: 'translate(150 70) scale(2.2)',
  // --- Aquatiques : à droite, flottent à mi-hauteur ---
  fish: 'translate(150 96) scale(2.3)',
  shark: 'translate(152 96) scale(2.5)',
  // --- 🦕 Jurassic Web ---
  jraptors: 'translate(150 86) scale(2.2)',   // meute au sol, à droite
  jbrachio: 'translate(152 118) scale(1.85)', // immense, cou qui dépasse au-dessus
  jtrexbuddy: 'translate(152 80) scale(1.85)', // aussi grand que l'avatar
  jpterofly: 'translate(60 0) scale(1.5)',     // tourne au-dessus de la tête
}

// Tous les animaux étant désormais placés à DROITE du bonhomme, ils
// nécessitent tous le viewBox élargi pour ne pas être coupés.
export function animalWide() { return true }

// ============================================================
//  ⭐ SKIN SUR MESURE — skins complets créés à la demande pour un
//  membre précis (cf. table public.skins_sur_mesure). Même patron que
//  les skins complets de saison (DISNEY_FULL) : chaque fonction
//  renvoie LE BONHOMME ENTIER (repère identique, cf. disneyFull.jsx).
//  Visibilité gérée côté serveur (RPC), pas ici : cette fonction est
//  toujours exportée, mais n'est utilisée que si le skin est équipé.
// ============================================================

// 🎎 penpenkimono — corps beige/crème, kimono vert/rouge/noir à
// bandes verticales, col en V, obi et manches larges.
function penpenKimono() {
  const CREAM = '#F5DEB3'
  const FACE_CREAM = '#fbe8c8'
  const GREEN = '#2d5016'
  const RED = '#cc2200'
  const BLACK = '#1a1a1a'
  const T = '#241c2a'
  return (
    <g>
      {/* Jambes + sandales noires */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill={CREAM} stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill={CREAM} stroke={T} strokeWidth="1.5" />
      <ellipse cx="44" cy="150" rx="12" ry="7" fill={BLACK} stroke={T} strokeWidth="1.5" />
      <ellipse cx="76" cy="150" rx="12" ry="7" fill={BLACK} stroke={T} strokeWidth="1.5" />

      {/* Bras (peau) */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill={CREAM} stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill={CREAM} stroke={T} strokeWidth="1.5" />
      <circle cx="12.5" cy="104" r="6.5" fill={CREAM} stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill={CREAM} stroke={T} strokeWidth="1.5" />

      {/* Manches larges du kimono, par-dessus les bras — dépassent légèrement */}
      <path d="M4 64 Q-3 82 5 100 Q15 96 17 84 Q17 71 10 62 Z" fill={GREEN} stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M116 64 Q123 82 115 100 Q105 96 103 84 Q103 71 110 62 Z" fill={GREEN} stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 70 Q1 84 8 96" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M115 70 Q119 84 112 96" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" />

      {/* Corps « haricot » crème */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={CREAM} stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.16" />

      {/* Bandes verticales du kimono (motif japonais simple) — SOUS le visage,
          uniquement sur le buste (le panneau visage occupe déjà y42-78). */}
      <rect x="25" y="84" width="9" height="30" rx="3" fill={GREEN} stroke={T} strokeWidth="1" />
      <rect x="36" y="84" width="7" height="30" rx="3" fill={RED} stroke={T} strokeWidth="1" />
      <rect x="45" y="84" width="30" height="30" rx="3" fill={BLACK} stroke={T} strokeWidth="1" />
      <rect x="77" y="84" width="7" height="30" rx="3" fill={RED} stroke={T} strokeWidth="1" />
      <rect x="86" y="84" width="9" height="30" rx="3" fill={GREEN} stroke={T} strokeWidth="1" />
      {/* Petit accent façon croix japonaise sur la bande centrale */}
      <path d="M56 98 h8 M60 94 v8" stroke="#fff" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />

      {/* Obi (ceinture) avec nœud rouge central */}
      <rect x="25" y="100" width="70" height="13" rx="3" fill={BLACK} stroke={T} strokeWidth="1.5" />
      <rect x="53" y="97" width="14" height="19" rx="2.5" fill={RED} stroke={T} strokeWidth="1.3" />
      <path d="M53 106 h14" stroke={BLACK} strokeWidth="1.6" opacity="0.6" />

      {/* Col en V — patch crème exposé sous le menton + bandes noires bordées
          de rouge (dessiné APRÈS les bandes/l'obi, mais AVANT le visage qui
          doit rester par-dessus le col, pas l'inverse). */}
      <path d="M38 78 L82 78 L60 94 Z" fill={CREAM} />
      <path d="M26 77 L60 92" stroke={BLACK} strokeWidth="7" strokeLinecap="round" />
      <path d="M94 77 L60 92" stroke={BLACK} strokeWidth="7" strokeLinecap="round" />
      <path d="M30 78 L60 89" stroke={RED} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <path d="M90 78 L60 89" stroke={RED} strokeWidth="2" strokeLinecap="round" opacity="0.9" />

      {/* Visage (par-dessus le col, comme sur le bonhomme par défaut) */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill={FACE_CREAM} />
      <circle cx="49" cy="60" r="6" fill="#241c2a" />
      <circle cx="71" cy="60" r="6" fill="#241c2a" />
      <circle cx="51.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="73.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="38" cy="70" r="4.6" fill="#ff8fb0" opacity="0.75" />
      <circle cx="82" cy="70" r="4.6" fill="#ff8fb0" opacity="0.75" />
      <path d="M52 71 q8 7 16 0" stroke="#c46a7a" strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {/* Cheveux courts, noirs */}
      <path d="M31 38 q3 -19 29 -19 q26 0 29 19 q-10 -9 -29 -9 q-19 0 -29 9 Z"
        fill={BLACK} stroke={T} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  )
}

// ⚓ penpenmarin — uniforme de marin/glacier vintage : chemise et col
// marin bleu marine à liseré blanc, casquette blanche à étoile, short
// crème et badge rond « Glaces Zigzam » (cornet stylisé) sur la poitrine.
function penpenMarin() {
  const NAVY = '#1e3a5f'
  const WHITE = '#f5f5fb'
  const CREAM = '#f3e6c8'
  const SKIN = '#ffd9b0'
  const GOLD = '#ffcf3f'
  const RED = '#cc2200'
  const T = '#241c2a'
  return (
    <g>
      {/* Jambes (peau) + chaussures blanches à semelle marine */}
      <rect x="41" y="118" width="13" height="32" rx="6.5" fill={SKIN} stroke={T} strokeWidth="1.5" />
      <rect x="66" y="118" width="13" height="32" rx="6.5" fill={SKIN} stroke={T} strokeWidth="1.5" />
      <ellipse cx="44" cy="153" rx="12" ry="6.5" fill={NAVY} stroke={T} strokeWidth="1.5" />
      <ellipse cx="76" cy="153" rx="12" ry="6.5" fill={NAVY} stroke={T} strokeWidth="1.5" />
      <ellipse cx="44" cy="149" rx="11.5" ry="7" fill={WHITE} stroke={T} strokeWidth="1.5" />
      <ellipse cx="76" cy="149" rx="11.5" ry="7" fill={WHITE} stroke={T} strokeWidth="1.5" />

      {/* Bras : manches marine, poignets blancs, mains (peau) */}
      <rect x="6" y="58" width="13" height="44" rx="6.5" fill={NAVY} stroke={T} strokeWidth="1.5" />
      <rect x="101" y="58" width="13" height="44" rx="6.5" fill={NAVY} stroke={T} strokeWidth="1.5" />
      <rect x="5" y="92" width="15" height="7" rx="3" fill={WHITE} stroke={T} strokeWidth="1.2" />
      <rect x="100" y="92" width="15" height="7" rx="3" fill={WHITE} stroke={T} strokeWidth="1.2" />
      <circle cx="12.5" cy="104" r="6.5" fill={SKIN} stroke={T} strokeWidth="1.5" />
      <circle cx="107.5" cy="104" r="6.5" fill={SKIN} stroke={T} strokeWidth="1.5" />

      {/* Corps « haricot » : chemise bleu marine + reflet */}
      <rect x="18" y="16" width="84" height="116" rx="42" fill={NAVY} stroke={T} strokeWidth="1.8" />
      <ellipse cx="46" cy="40" rx="23" ry="18" fill="#fff" opacity="0.12" />

      {/* Short crème (épouse la calotte basse du corps) */}
      <path d="M18.6 96 A42 42 0 0 0 101.4 96 Z" fill={CREAM} stroke={T} strokeWidth="1.5" />
      <path d="M60 96 L60 130" stroke={T} strokeWidth="1.3" opacity="0.4" />
      <path d="M22 101 Q60 118 98 101" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.3" />

      {/* Col marin : rabat sur la nuque + pointes en V devant, liseré
          blanc et mouchoir rouge — dessiné AVANT le visage (le panneau
          visage recouvre le milieu, ne laissant voir que le bord). */}
      <path d="M30 54 Q60 46 90 54 L84 66 Q60 58 36 66 Z" fill={NAVY} stroke={T} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M36 63 L52 66 L60 88 Z" fill={NAVY} stroke={T} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M84 63 L68 66 L60 88 Z" fill={NAVY} stroke={T} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M34 57 Q60 49 86 57" stroke={WHITE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M39 63 L60 85 L81 63" stroke={WHITE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 82 L64 82 L62 93 L58 93 Z" fill={RED} stroke={T} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M56 82 Q60 85 64 82" stroke={T} strokeWidth="1" fill="none" opacity="0.4" />

      {/* Badge rond « Glaces Zigzam » : cornet + boule menthe + cerise */}
      <circle cx="43" cy="88" r="8" fill={WHITE} stroke={NAVY} strokeWidth="2" />
      <circle cx="43" cy="88" r="8" fill="none" stroke={T} strokeWidth="0.8" />
      <path d="M39.5 87 L46.5 87 L43 94 Z" fill="#e0b063" stroke={T} strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M39.5 87 a3.5 3.5 0 0 1 7 0 Z" fill="#7ad0c0" stroke={T} strokeWidth="0.7" />
      <circle cx="43" cy="83.6" r="1.1" fill={RED} />

      {/* Panneau visage + yeux + joues + sourire */}
      <rect x="33" y="42" width="54" height="36" rx="18" fill="#fff" opacity="0.96" />
      <circle cx="49" cy="60" r="6" fill="#241c2a" />
      <circle cx="71" cy="60" r="6" fill="#241c2a" />
      <circle cx="51.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="73.4" cy="57.6" r="2.1" fill="#fff" />
      <circle cx="38" cy="70" r="4.6" fill="#ff8fb0" opacity="0.75" />
      <circle cx="82" cy="70" r="4.6" fill="#ff8fb0" opacity="0.75" />
      <path d="M52 71 q8 7 16 0" stroke="#c46a7a" strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {/* Casquette blanche de marin : calotte + bord retroussé + bandeau
          marine, liseré blanc et petite étoile dorée devant. */}
      <path d="M31 38 Q31 13 60 11 Q89 13 89 38 Z" fill={WHITE} stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M29 38 Q60 27 91 38 Q60 49 29 38 Z" fill={WHITE} stroke={T} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M34 36 Q60 28 86 36 Q60 43 34 36 Z" fill={NAVY} />
      <path d="M35 33 Q60 26 85 33" stroke={WHITE} strokeWidth="1.6" fill="none" />
      <path d="M60 30 l1.4 2.9 3.2 .3 -2.4 2.1 .7 3.1 -2.9 -1.7 -2.9 1.7 .7 -3.1 -2.4 -2.1 3.2 -.3 Z" fill={GOLD} stroke={T} strokeWidth="0.5" strokeLinejoin="round" />
      <path d="M38 20 Q48 13 60 13" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M34 40 Q60 47 86 40" stroke={T} strokeWidth="1" fill="none" opacity="0.22" />
    </g>
  )
}

// Registre des skins sur mesure. Clé = item_id (public.skins_sur_mesure).
export const CUSTOM_FULL = {
  penpenkimono: () => penpenKimono(),
  penpenmarin: () => penpenMarin(),
}

// ---- Sélecteurs exportés ----
//  Les skins exclusifs de la saison « Zigzamland Paris » vivent dans leurs
//  propres fichiers (disneyHats / disneyFaces / disneyAnimals / disneyFull)
//  pour ne pas doubler la taille de celui-ci : chaque sélecteur consulte
//  d'abord le catalogue de base, puis celui de la saison.
export function renderHat(id) { return HATS[id]?.() ?? DISNEY_HATS[id]?.() ?? null }
export function renderGlasses(id) { return GLASSES[id]?.() ?? null }
export function renderHair(id) { return HAIR[id]?.() ?? DISNEY_HAIR[id]?.() ?? null }
export function renderHairBack(id) { return HAIR_BACK[id]?.() ?? DISNEY_HAIR_BACK[id]?.() ?? null }
export function renderSport(id) { return SPORT[id]?.() ?? DISNEY_SPORT[id]?.() ?? null }
export function renderFace(id) { return FACE[id]?.() ?? DISNEY_FACE[id]?.() ?? null }
export function renderAnimal(id) {
  const draw = ANIMAL[id]?.() ?? DISNEY_ANIMAL[id]?.()
  if (!draw) return null
  const placement = ANIMAL_PLACEMENT[id] ?? DISNEY_ANIMAL_PLACEMENT[id] ?? ANIMAL_MED
  return <g transform={placement}>{draw}</g>
}
// Skin « complet » : remplace tout le bonhomme (cf. FallGuy).
export function renderFull(id) { return DISNEY_FULL[id]?.() ?? CUSTOM_FULL[id]?.() ?? null }

// ----------------------------------------------------------------
//  CHAPEAUX  (posés sur le crâne, centrés x=60 ; couvrent le haut des cheveux)
// ----------------------------------------------------------------
const HATS = {
  cap: () => (
    <g>
      <path d="M30 23 Q60 -5 90 23 Z" fill={C.bleu} />
      <path d="M60 23 q24 0 33 8 q-16 -1 -33 -2 Z" fill={C.bleu} />
      <circle cx="60" cy="-2" r="3" fill={C.violet} />
    </g>
  ),
  beanie: () => (
    <g>
      <path d="M30 24 Q60 -8 90 24 Z" fill={C.rose} />
      <rect x="28" y="20" width="64" height="9" rx="4.5" fill={C.violet} />
      <circle cx="60" cy="-4" r="6" fill={C.blanc} />
    </g>
  ),
  beret: () => (
    <g>
      <ellipse cx="60" cy="16" rx="34" ry="13" fill={C.rouge} />
      <ellipse cx="60" cy="20" rx="30" ry="7" fill="#c81e1e" />
      <circle cx="60" cy="2" r="3" fill="#c81e1e" />
    </g>
  ),
  bandana: () => (
    <g>
      <path d="M24 22 Q60 4 96 22 L94 30 Q60 18 26 30 Z" fill={C.vert} />
      <path d="M90 24 l14 -6 -4 12 Z" fill={C.vert} />
      <circle cx="44" cy="22" r="2" fill={C.blanc} /><circle cx="60" cy="19" r="2" fill={C.blanc} /><circle cx="76" cy="22" r="2" fill={C.blanc} />
    </g>
  ),
  party: () => (
    <g>
      <path d="M60 -18 L44 24 L76 24 Z" fill={C.rose} />
      <path d="M52 4 L68 4 M48 14 L72 14" stroke={C.jaune} strokeWidth="3" />
      <circle cx="60" cy="-18" r="4" fill={C.bleu} />
    </g>
  ),
  grad: () => (
    <g>
      <rect x="48" y="14" width="24" height="14" rx="3" fill={C.noir} />
      <path d="M34 14 L60 6 L86 14 L60 22 Z" fill={C.noir} />
      <circle cx="60" cy="14" r="2" fill={C.or} />
      <path d="M60 14 L84 14 L84 28" stroke={C.or} strokeWidth="2" fill="none" /><circle cx="84" cy="30" r="3" fill={C.or} />
    </g>
  ),
  straw: () => (
    <g>
      <ellipse cx="60" cy="24" rx="42" ry="9" fill={C.jaune} />
      <path d="M38 24 Q60 -2 82 24 Z" fill="#f0b41e" /><rect x="40" y="18" width="40" height="6" rx="3" fill={C.orange} />
    </g>
  ),
  chef: () => (
    <g>
      <rect x="40" y="16" width="40" height="12" rx="3" fill={C.blanc} />
      <circle cx="46" cy="10" r="11" fill={C.blanc} /><circle cx="60" cy="6" r="13" fill={C.blanc} /><circle cx="74" cy="10" r="11" fill={C.blanc} />
    </g>
  ),
  helmet: () => (
    <g>
      <path d="M26 26 Q60 -6 94 26 Q60 16 26 26 Z" fill={C.bleu} />
      <path d="M50 4 L54 24 M62 1 L62 23 M74 5 L70 24" stroke="#0090c8" strokeWidth="3" />
      <path d="M26 26 q-4 4 0 8" stroke={C.noir} strokeWidth="2" fill="none" />
    </g>
  ),
  police: () => (
    <g>
      <path d="M34 18 Q60 6 86 18 L86 22 L34 22 Z" fill="#1f3a8a" />
      <path d="M34 22 q26 6 52 0 l0 4 q-26 5 -52 0 Z" fill="#16285e" />
      <rect x="52" y="9" width="16" height="9" rx="2" fill={C.or} />
    </g>
  ),
  santa: () => (
    <g>
      <path d="M30 24 Q52 -14 86 -8 Q70 6 78 24 Z" fill={C.rouge} />
      <rect x="28" y="20" width="56" height="9" rx="4.5" fill={C.blanc} /><circle cx="86" cy="-8" r="6" fill={C.blanc} />
    </g>
  ),
  flower: () => (
    <g>
      <path d="M26 22 Q60 10 94 22" stroke={C.vert} strokeWidth="4" fill="none" />
      {[30, 45, 60, 75, 90].map((x, i) => (
        <g key={i} transform={`translate(${x} ${18 - (i === 2 ? 4 : 0)})`}>
          {[[0, -3], [-3, 1], [3, 1]].map(([dx, dy], j) => (
            <circle key={j} cx={dx} cy={dy} r="2.4" fill={[C.rose, C.jaune, C.bleu, C.rose, C.violet][i]} />
          ))}
          <circle cx="0" cy="0" r="1.6" fill={C.or} />
        </g>
      ))}
    </g>
  ),
  cowboy: () => (
    <g>
      <path d="M10 26 Q60 42 110 26 Q86 16 60 16 Q34 16 10 26 Z" fill={C.brun} />
      <path d="M36 24 Q60 -8 84 24 Q60 16 36 24 Z" fill={C.brunF} />
      <rect x="36" y="18" width="48" height="6" rx="3" fill={C.noir} />
      <circle cx="60" cy="21" r="2.5" fill={C.or} />
    </g>
  ),
  sombrero: () => (
    <g>
      <ellipse cx="60" cy="26" rx="52" ry="12" fill={C.orange} />
      <ellipse cx="60" cy="26" rx="52" ry="12" fill="none" stroke={C.rouge} strokeWidth="2" />
      <path d="M38 26 Q60 -12 82 26 Z" fill="#e07a2a" /><rect x="40" y="20" width="40" height="6" rx="3" fill={C.rouge} />
    </g>
  ),
  cactus: () => (
    <g>
      <rect x="52" y="-12" width="16" height="36" rx="8" fill={C.vert} />
      <path d="M52 4 q-12 0 -12 -10 q0 -6 5 -6 q5 0 5 6 l0 4 q0 2 2 2 Z" fill={C.vert} />
      <path d="M68 8 q12 0 12 -10 q0 -6 -5 -6 q-5 0 -5 6 l0 4 q0 2 -2 2 Z" fill={C.vert} />
      <circle cx="60" cy="-6" r="3" fill={C.rose} />
      <path d="M56 2 v6 M60 -2 v8 M64 4 v6" stroke="#2fae74" strokeWidth="1.2" />
    </g>
  ),
  pizza: () => (
    <g>
      <path d="M60 -16 L34 24 L86 24 Z" fill={C.jaune} stroke="#e6a52a" strokeWidth="2" />
      <path d="M34 24 L86 24 L82 18 Q60 22 38 18 Z" fill="#d6722a" />
      <circle cx="56" cy="6" r="3.5" fill={C.rouge} /><circle cx="66" cy="14" r="3.5" fill={C.rouge} /><circle cx="52" cy="16" r="3" fill={C.rouge} />
      <circle cx="62" cy="-2" r="2.5" fill="#3aa55a" />
    </g>
  ),
  witch: () => (
    <g>
      <ellipse cx="60" cy="24" rx="40" ry="8" fill={C.violet} />
      <path d="M44 24 Q56 -18 84 -6 Q70 8 76 24 Z" fill="#5a1fd4" />
      <rect x="46" y="18" width="28" height="7" rx="2" fill={C.noir} /><rect x="56" y="18" width="9" height="7" fill={C.or} />
    </g>
  ),
  pirate: () => (
    <g>
      <path d="M22 24 Q60 30 98 24 Q88 10 60 10 Q32 10 22 24 Z" fill={C.noir} />
      <path d="M30 18 Q60 26 90 18 Q60 22 30 18 Z" fill={C.noir} />
      <circle cx="60" cy="15" r="5" fill={C.blanc} /><circle cx="58" cy="14" r="1" fill={C.noir} /><circle cx="62" cy="14" r="1" fill={C.noir} />
    </g>
  ),
  viking: () => (
    <g>
      <path d="M30 24 Q60 0 90 24 Z" fill={C.gris} />
      <rect x="30" y="20" width="60" height="6" rx="3" fill={C.grisF} />
      <path d="M30 22 Q14 14 16 0 Q26 10 34 18 Z" fill="#f3ead0" /><path d="M90 22 Q106 14 104 0 Q94 10 86 18 Z" fill="#f3ead0" />
    </g>
  ),
  tophat: () => (
    <g>
      <ellipse cx="60" cy="24" rx="40" ry="8" fill={C.noir} />
      <rect x="40" y="-8" width="40" height="32" rx="3" fill={C.noir} /><rect x="40" y="14" width="40" height="6" fill={C.rouge} />
    </g>
  ),
  astronaut: () => (
    <g>
      <path d="M30 22 Q30 -14 60 -14 Q90 -14 90 22 Q60 30 30 22 Z" fill="#eef2f8" stroke={C.gris} strokeWidth="2" />
      <rect x="40" y="2" width="40" height="20" rx="9" fill="#1a2438" />
      <ellipse cx="52" cy="9" rx="7" ry="5" fill="#5aa0ff" opacity="0.8" />
      <rect x="26" y="14" width="6" height="10" rx="2" fill={C.gris} /><rect x="88" y="14" width="6" height="10" rx="2" fill={C.gris} />
    </g>
  ),
  crown: () => (
    <g>
      <path d="M28 26 L30 -2 L44 16 L60 -8 L76 16 L90 -2 L92 26 Z" fill={C.or} stroke={C.orF} strokeWidth="1.5" />
      <rect x="28" y="22" width="64" height="8" rx="2" fill={C.orF} />
      <circle cx="60" cy="12" r="4" fill={C.rose} /><circle cx="38" cy="18" r="3" fill={C.bleu} /><circle cx="82" cy="18" r="3" fill={C.bleu} />
      <circle cx="60" cy="-8" r="3" fill={C.rouge} />
    </g>
  ),
  halo: () => (
    <g>
      <ellipse cx="60" cy="0" rx="28" ry="9" fill="none" stroke={C.or} strokeWidth="5" />
      <ellipse cx="60" cy="0" rx="28" ry="9" fill="none" stroke="#fff3b0" strokeWidth="1.5" />
    </g>
  ),

  // ====== 🦕 JURASSIC WEB — chapeaux exclusifs de saison ======

  // Capuche T-Rex : capuche verte + tête de T-Rex rugissante au-dessus,
  // mâchoires ouvertes et dents visibles. La mâchoire inférieure s'anime.
  jtrex: () => (
    <g>
      <path d="M24 26 Q26 -4 60 -6 Q94 -4 96 26 Q60 16 24 26 Z" fill="#2f6b3a" />
      <path d="M24 26 Q60 16 96 26" stroke="#1c4a26" strokeWidth="2" fill="none" />
      <path d="M30 22 Q60 14 90 22" stroke="#3f8a4a" strokeWidth="2" fill="none" opacity="0.7" />
      <g transform="translate(60 -12)">
        <path d="M-20 6 Q-24 -10 -6 -12 Q14 -14 22 -2 Q26 4 20 8 Z" fill="#3f8a4a" stroke="#235e2b" strokeWidth="2" />
        <path d="M-12 -10 l3 -5 3 5 3 -5 3 5 3 -5 3 5" fill="#235e2b" />
        <g className="dino-roar-jaw">
          <path d="M-18 8 Q-4 18 16 11 Q4 15 -10 12 Z" fill="#2f6b3a" stroke="#235e2b" strokeWidth="1.5" />
          <path d="M-8 11 l1 -3 2 3 M0 12 l1 -3 2 3" fill="#fff" />
        </g>
        <path d="M-14 8 Q0 13 14 9 Q2 12 -10 10 Z" fill="#7a1f1f" />
        <path d="M-12 7 l1.5 4 2 -4 M-5 7 l1.5 4 2 -4 M2 6 l1.5 4 2 -4 M9 6 l1.5 4 2 -4" fill="#fff" />
        <circle cx="7" cy="-4" r="2.4" fill="#f5d000" /><circle cx="7" cy="-4" r="1.1" fill="#000" />
        <circle cx="18" cy="0" r="1" fill="#235e2b" />
      </g>
    </g>
  ),

  // Casque Tricératops : collerette à pointes + 3 cornes.
  jtrike: () => (
    <g>
      <path d="M28 18 Q60 -18 92 18 Q86 26 60 24 Q34 26 28 18 Z" fill="#8a9a5a" stroke="#5f6e3a" strokeWidth="2" />
      <g fill="#6f7e44">
        <path d="M30 14 l-8 -5 8 -1 Z" /><path d="M48 -6 l-3 -9 6 4 Z" />
        <path d="M60 -10 l0 -10 5 7 Z" /><path d="M72 -6 l3 -9 -6 4 Z" /><path d="M90 14 l8 -5 -8 -1 Z" />
      </g>
      <path d="M30 24 Q60 8 90 24 Q60 30 30 24 Z" fill="#a7b56a" />
      <path d="M58 18 l2 -11 2 11 Z" fill="#eee3c8" stroke="#c9bd9c" strokeWidth="1" />
      <path d="M42 14 Q34 -4 46 -7 Q43 8 50 14 Z" fill="#eee3c8" stroke="#c9bd9c" strokeWidth="1" />
      <path d="M78 14 Q86 -4 74 -7 Q77 8 70 14 Z" fill="#eee3c8" stroke="#c9bd9c" strokeWidth="1" />
    </g>
  ),

  // Couronne Stégosaure : plaques dorsales en éventail.
  jstego: () => (
    <g>
      <path d="M28 25 Q60 15 92 25 L90 31 Q60 23 30 31 Z" fill="#5a7a3a" />
      <g stroke="#3f5a28" strokeWidth="1.5">
        <path d="M34 23 Q28 4 46 16 Z" fill="#7caa4a" />
        <path d="M47 17 Q44 -6 60 10 Z" fill="#86b855" />
        <path d="M60 12 Q60 -14 72 11 Z" fill="#7caa4a" />
        <path d="M74 17 Q80 -6 87 19 Z" fill="#86b855" />
      </g>
      <g fill="#ff8c42">
        <circle cx="38" cy="11" r="2" /><circle cx="52" cy="2" r="2" />
        <circle cx="66" cy="0" r="2" /><circle cx="81" cy="4" r="2" />
      </g>
    </g>
  ),

  // Chapeau Ptérosaure : ailes membranées de part et d'autre + crête + bec.
  jptero: () => (
    <g>
      <path d="M40 18 Q8 6 2 22 Q18 18 38 26 Z" fill="#6a5a8a" stroke="#4a3a6a" strokeWidth="1.5" className="dino-ptero-wingL" />
      <path d="M80 18 Q112 6 118 22 Q102 18 82 26 Z" fill="#6a5a8a" stroke="#4a3a6a" strokeWidth="1.5" className="dino-ptero-wingR" />
      <path d="M36 22 L8 16 M36 24 L12 22" stroke="#4a3a6a" strokeWidth="1" />
      <path d="M84 22 L112 16 M84 24 L108 22" stroke="#4a3a6a" strokeWidth="1" />
      <path d="M40 24 Q60 8 80 24 Q60 28 40 24 Z" fill="#7a6a9a" />
      <path d="M60 10 Q44 2 40 12 Q54 10 60 17 Z" fill="#8a6aaa" stroke="#5a4a7a" strokeWidth="1" />
      <path d="M60 15 Q80 11 98 7 Q82 17 64 21 Z" fill="#7a6a9a" />
      <circle cx="82" cy="13" r="1.6" fill="#000" />
    </g>
  ),
}
