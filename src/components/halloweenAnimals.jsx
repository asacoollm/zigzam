// ============================================================
//  SAISON HALLOWEEN — animaux de compagnie exclusifs de l'avatar.
//  Même repère que avatarParts.jsx : chaque dessin est centré sur son
//  origine locale (0,0), positionné/dimensionné par un transform dans
//  HALLOWEEN_ANIMAL_PLACEMENT (lu par renderAnimal, cf. avatarParts.jsx).
//  Aucun <defs>/gradient : uniquement des aplats et des opacités.
//  Mignon et rigolo, jamais effrayant.
// ============================================================

const H = {
  corps: '#4a3a74', corpsF: '#241d3d', aile: '#3a2d5c',
  blanc: '#fff', encre: '#241d3d',
  // — vague 2 —
  chat: '#1c1824', chatF: '#0d0b12', chatC: '#3a2d5c', jaune: '#ffe14d',
}

export const HALLOWEEN_ANIMAL = {
  // Petite chauve-souris mignonne : grandes oreilles, grands yeux ronds,
  // ailes bien déployées. Compagnon, pas une farce : jamais d'yeux rouges
  // ni d'air menaçant.
  hchauvesouris: () => (
    <g>
      {/* ailes déployées */}
      <path
        d="M-3 -1 Q-16 -13 -23 -2 Q-19 2 -13 1 Q-15 6 -21 8 Q-11 12 -3 4 Z"
        fill={H.aile} stroke={H.corpsF} strokeWidth="1.3" strokeLinejoin="round"
      />
      <path
        d="M3 -1 Q16 -13 23 -2 Q19 2 13 1 Q15 6 21 8 Q11 12 3 4 Z"
        fill={H.aile} stroke={H.corpsF} strokeWidth="1.3" strokeLinejoin="round"
      />
      {/* oreilles */}
      <path d="M-7 -8 L-11 -17 L-3 -10 Z" fill={H.corps} stroke={H.corpsF} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M7 -8 L11 -17 L3 -10 Z" fill={H.corps} stroke={H.corpsF} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M-6.5 -9 L-8.5 -14 L-5 -10.5 Z" fill="#8f7ac4" opacity="0.6" />
      <path d="M6.5 -9 L8.5 -14 L5 -10.5 Z" fill="#8f7ac4" opacity="0.6" />
      {/* corps + tête */}
      <ellipse cx="0" cy="4" rx="9" ry="8" fill={H.corps} stroke={H.corpsF} strokeWidth="1.3" />
      {/* grands yeux ronds, mignons */}
      <circle cx="-3.6" cy="2" r="3.1" fill={H.blanc} />
      <circle cx="3.6" cy="2" r="3.1" fill={H.blanc} />
      <circle cx="-3.3" cy="2.4" r="1.7" fill={H.encre} />
      <circle cx="3.9" cy="2.4" r="1.7" fill={H.encre} />
      <circle cx="-2.7" cy="1.7" r="0.6" fill="#fff" />
      <circle cx="4.5" cy="1.7" r="0.6" fill="#fff" />
      {/* petit sourire + crocs mignons */}
      <path d="M-3 7.6 Q0 10.4 3 7.6" stroke={H.encre} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M-1.6 8 l-0.8 2 l1 -0.9 Z" fill="#fff" />
      <path d="M1.6 8 l0.8 2 l-1 -0.9 Z" fill="#fff" />
    </g>
  ),

  // Petit chat noir assis, yeux ronds jaunes, queue en point d'interrogation.
  // Mignon et rigolo : jamais d'air menaçant.
  hchatnoir: () => (
    <g>
      {/* corps assis + tête */}
      <ellipse cx="0" cy="16" rx="11" ry="10" fill={H.chat} />
      <circle cx="0" cy="2" r="9" fill={H.chat} />
      {/* oreilles */}
      <path d="M-8 -5 l-3 -8 6 4 Z M8 -5 l3 -8 -6 4 Z" fill={H.chat} />
      <path d="M-7 -5 l-1.5 -4 3 2 Z M7 -5 l1.5 -4 -3 2 Z" fill={H.chatC} opacity="0.6" />
      {/* grands yeux ronds jaunes */}
      <circle cx="-3.5" cy="1" r="2.8" fill={H.jaune} />
      <circle cx="3.5" cy="1" r="2.8" fill={H.jaune} />
      <circle cx="-3.5" cy="1.3" r="1.3" fill={H.chatF} />
      <circle cx="3.5" cy="1.3" r="1.3" fill={H.chatF} />
      {/* moustaches */}
      <path d="M-9 3 h-6 M9 3 h6" stroke="#fff" strokeWidth="0.8" opacity="0.7" />
      {/* petit nez + sourire */}
      <path d="M-1.2 5 L1.2 5 L0 6.6 Z" fill="#ff9fb0" />
      <path d="M0 6.6 Q-2.4 9 -5 8 M0 6.6 Q2.4 9 5 8" stroke={H.chatF} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {/* queue en point d'interrogation */}
      <path d="M11 18 Q21 16 21 7 Q21 1 15 1.4" stroke={H.chat} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="14.5" cy="2" r="2.3" fill={H.chat} />
    </g>
  ),
}

export const HALLOWEEN_ANIMAL_PLACEMENT = {
  // Volante, comme les autres compagnons ailés (owl, parrot, ddumbo).
  hchauvesouris: 'translate(150 48) scale(2.3)',
  // Assis au sol, comme les autres petits compagnons terrestres (cat, dog).
  hchatnoir: 'translate(150 88) scale(2.4)',
}
