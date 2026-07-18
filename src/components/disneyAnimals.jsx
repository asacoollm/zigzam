// ============================================================
//  🏰 SAISON DISNEY — compagnons exclusifs
//  Dessins SVG des 20 animaux/compagnons de la saison Disney.
//  Même convention que avatarParts.jsx :
//   - chaque dessin est fait dans un repère LOCAL, autour de l'origine
//     (~20-30 unités de large), avec le sol local vers y ≈ 25 ;
//   - la position et l'échelle finales viennent de DISNEY_ANIMAL_PLACEMENT ;
//   - le bonhomme occupe x 0..120 (pieds ≈ y152, sommet du crâne ≈ y16),
//     le viewBox élargi étant « 0 -24 214 192 » : les compagnons se placent
//     donc à DROITE (x ≈ 150), sur l'épaule (x ≈ 96), ou sur la tête (x = 60).
//  Aucun <defs>/gradient (les id entreraient en collision entre avatars) :
//  uniquement des aplats, des opacités et des contours sombres fins.
// ============================================================

// Palette de la saison (aplats + teintes d'ombre et de reflet).
const D = {
  noir: '#241f33', nuit: '#141024', blanc: '#fdfbff', creme: '#fff3dd',
  rouge: '#e03535', rougeF: '#a81f1f', or: '#ffc93c', orF: '#d99b18',
  vert: '#3fbf6a', vertF: '#217f45', vertC: '#8fe08a',
  bleu: '#3aa8f0', bleuF: '#1f6fae', bleuC: '#bfe6ff',
  violet: '#7c5ad6', rose: '#ff9dc0', roseF: '#e0688f',
  brun: '#8a5a33', brunF: '#5c3a20', brunC: '#c99a68',
  gris: '#9aa3b2', grisF: '#5f6878',
}

// Enveloppes de commodité (identiques à celles d'avatarParts) : la position
// réelle est appliquée par DISNEY_ANIMAL_PLACEMENT.
const ground = (children) => <g>{children}</g>
const shoulder = (children) => <g>{children}</g>

export const DISNEY_ANIMAL = {

  // ---------------------------------------------------------------
  //  AU SOL — à droite du bonhomme
  // ---------------------------------------------------------------

  // Pluto : chien jaune-orangé, longues oreilles brunes tombantes,
  // collier vert, queue relevée qui remue.
  dpluto: () => ground(
    <g>
      {/* queue relevée (elle remue) */}
      <g className="d-pluto-tail" style={{ transformOrigin: '11px 10px' }}>
        <path d="M11 10 Q21 6 20 -6" stroke="#e8a33a" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M20 -6 q1 -4 4 -5" stroke={D.nuit} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      {/* pattes arrière + avant */}
      <path d="M-6 16 l-2 9 M2 17 l0 8 M8 16 l3 9" stroke="#d98f2c" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="-8" cy="25" rx="3.6" ry="2.2" fill="#e8a33a" />
      <ellipse cx="2" cy="25" rx="3.4" ry="2.2" fill="#e8a33a" />
      <ellipse cx="11" cy="25" rx="3.6" ry="2.2" fill="#e8a33a" />
      {/* corps */}
      <ellipse cx="2" cy="11" rx="12" ry="9" fill="#f0ad3e" stroke={D.brunF} strokeWidth="1.5" />
      <ellipse cx="1" cy="15" rx="8" ry="5" fill="#ffd58a" opacity="0.75" />
      {/* collier vert */}
      <path d="M-9 5 q3 6 8 6" stroke={D.vert} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="-5" cy="10" r="1.8" fill={D.or} stroke={D.orF} strokeWidth="0.8" />
      {/* tête */}
      <ellipse cx="-9" cy="-2" rx="9" ry="8" fill="#f0ad3e" stroke={D.brunF} strokeWidth="1.5" />
      {/* museau allongé */}
      <ellipse cx="-16" cy="2" rx="7" ry="4.5" fill="#ffc862" stroke={D.brunF} strokeWidth="1.2" />
      <ellipse cx="-22" cy="1" rx="2.4" ry="2" fill={D.nuit} />
      <path d="M-20 4 q3 2 5 0" stroke={D.brunF} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* longues oreilles brunes tombantes */}
      <path d="M-11 -7 Q-19 -8 -20 2 Q-21 12 -14 12 Q-9 11 -9 2 Z" fill={D.brun} stroke={D.brunF} strokeWidth="1.4" />
      <path d="M-4 -7 Q1 -9 3 0 Q5 11 -2 12 Q-6 11 -6 2 Z" fill={D.brun} stroke={D.brunF} strokeWidth="1.4" />
      <path d="M-2 -2 q4 4 2 10" stroke="#6d452a" strokeWidth="1" fill="none" />
      {/* yeux joyeux */}
      <ellipse cx="-11" cy="-5" rx="2.6" ry="3" fill={D.blanc} stroke={D.brunF} strokeWidth="0.8" />
      <ellipse cx="-6" cy="-5.5" rx="2.6" ry="3" fill={D.blanc} stroke={D.brunF} strokeWidth="0.8" />
      <circle cx="-10.4" cy="-4.6" r="1.3" fill={D.nuit} />
      <circle cx="-5.4" cy="-5" r="1.3" fill={D.nuit} />
      <circle cx="-10" cy="-5.4" r="0.5" fill={D.blanc} />
      <circle cx="-5" cy="-5.8" r="0.5" fill={D.blanc} />
    </g>
  ),

  // Stitch : petite créature bleue, immenses oreilles, gros yeux noirs,
  // ventre clair, quatre pattes.
  dstitchpet: () => ground(
    <g>
      {/* pattes arrière */}
      <ellipse cx="-8" cy="23" rx="4.5" ry="3" fill="#2f8fd8" stroke={D.bleuF} strokeWidth="1.2" />
      <ellipse cx="8" cy="23" rx="4.5" ry="3" fill="#2f8fd8" stroke={D.bleuF} strokeWidth="1.2" />
      {/* corps rond */}
      <ellipse cx="0" cy="12" rx="11" ry="11" fill={D.bleu} stroke={D.bleuF} strokeWidth="1.8" />
      <ellipse cx="0" cy="14" rx="7" ry="8" fill={D.bleuC} opacity="0.9" />
      {/* petits bras */}
      <path d="M-10 9 q-6 3 -6 8" stroke={D.bleu} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M10 9 q6 3 6 8" stroke={D.bleu} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="-16" cy="18" r="2.6" fill="#2f8fd8" stroke={D.bleuF} strokeWidth="1" />
      <circle cx="16" cy="18" r="2.6" fill="#2f8fd8" stroke={D.bleuF} strokeWidth="1" />
      {/* immenses oreilles */}
      <path d="M-7 -4 Q-20 -12 -19 -22 Q-13 -21 -8 -12 Z" fill={D.bleu} stroke={D.bleuF} strokeWidth="1.6" />
      <path d="M7 -4 Q21 -13 21 -23 Q14 -21 8 -12 Z" fill={D.bleu} stroke={D.bleuF} strokeWidth="1.6" />
      <path d="M-9 -7 q-6 -5 -7 -11" stroke={D.nuit} strokeWidth="1.4" fill="none" opacity="0.5" />
      <path d="M9 -7 q7 -6 8 -12" stroke={D.nuit} strokeWidth="1.4" fill="none" opacity="0.5" />
      {/* tête large */}
      <ellipse cx="0" cy="-3" rx="11" ry="9.5" fill={D.bleu} stroke={D.bleuF} strokeWidth="1.8" />
      {/* gros yeux noirs */}
      <ellipse cx="-4.4" cy="-4" rx="4" ry="4.6" fill={D.nuit} />
      <ellipse cx="4.4" cy="-4" rx="4" ry="4.6" fill={D.nuit} />
      <circle cx="-5.6" cy="-5.6" r="1.4" fill={D.blanc} />
      <circle cx="3.2" cy="-5.6" r="1.4" fill={D.blanc} />
      {/* museau + grande bouche */}
      <ellipse cx="0" cy="2" rx="5" ry="3.4" fill={D.bleuC} opacity="0.8" />
      <path d="M0 0.5 l-1.8 1.6 h3.6 Z" fill={D.nuit} />
      <path d="M-4 4 Q0 8 4 4" stroke={D.nuit} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Simba : lionceau ambré avec une petite touffe de crinière rousse.
  dsimba: () => ground(
    <g>
      {/* queue à pinceau */}
      <path d="M11 14 Q20 12 19 3" stroke="#e2a94a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M19 3 q-2 -4 1 -6 q3 3 1 6 Z" fill={D.brun} />
      {/* pattes */}
      <ellipse cx="-7" cy="24" rx="4" ry="2.6" fill="#f0c268" stroke="#b3812f" strokeWidth="1" />
      <ellipse cx="1" cy="24" rx="4" ry="2.6" fill="#f0c268" stroke="#b3812f" strokeWidth="1" />
      <ellipse cx="9" cy="24" rx="4" ry="2.6" fill="#f0c268" stroke="#b3812f" strokeWidth="1" />
      {/* corps */}
      <ellipse cx="1" cy="14" rx="11" ry="9" fill="#e8b455" stroke="#b3812f" strokeWidth="1.6" />
      <ellipse cx="0" cy="17" rx="7" ry="5" fill={D.creme} opacity="0.7" />
      {/* oreilles rondes */}
      <circle cx="-9" cy="-6" r="3.6" fill="#e8b455" stroke="#b3812f" strokeWidth="1.3" />
      <circle cx="4" cy="-8" r="3.6" fill="#e8b455" stroke="#b3812f" strokeWidth="1.3" />
      <circle cx="-9" cy="-6" r="1.8" fill={D.brun} opacity="0.7" />
      <circle cx="4" cy="-8" r="1.8" fill={D.brun} opacity="0.7" />
      {/* tête */}
      <ellipse cx="-3" cy="-1" rx="9.5" ry="8.5" fill="#f0c268" stroke="#b3812f" strokeWidth="1.6" />
      {/* touffe de crinière rousse */}
      <path d="M-9 -8 q1 -6 5 -6 q-1 3 1 4 q2 -5 6 -4 q-3 3 -2 6 Z" fill="#c2532a" stroke="#8f3a1c" strokeWidth="1.2" />
      <path d="M-5 -10 q1 2 0 4" stroke="#8f3a1c" strokeWidth="0.9" fill="none" />
      {/* museau clair */}
      <ellipse cx="-4" cy="3" rx="6" ry="4.2" fill={D.creme} />
      <path d="M-4 1 l-2 1.8 h4 Z" fill="#7a4028" />
      <path d="M-4 3 v2 M-4 5 q-2.5 2 -4.5 0 M-4 5 q2.5 2 4.5 0" stroke="#7a4028" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* yeux */}
      <ellipse cx="-8" cy="-2.5" rx="2.2" ry="2.6" fill={D.blanc} stroke="#b3812f" strokeWidth="0.7" />
      <ellipse cx="-0.5" cy="-3" rx="2.2" ry="2.6" fill={D.blanc} stroke="#b3812f" strokeWidth="0.7" />
      <circle cx="-7.6" cy="-2.2" r="1.2" fill={D.nuit} />
      <circle cx="-0.1" cy="-2.7" r="1.2" fill={D.nuit} />
      <path d="M-10.5 -6 q2.5 -1.5 5 -0.5 M-3 -6.5 q2.5 -1 4.5 0.5" stroke="#8f3a1c" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Bambi : faon brun clair tacheté de blanc, pattes fines, grands yeux doux.
  dbambipet: () => ground(
    <g>
      {/* pattes fines */}
      <path d="M-7 16 l-2 10 M-2 17 l-1 9 M5 17 l1 9 M10 16 l2 10" stroke="#b07a44" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-9 26 h3 M-3 26 h3 M6 26 h3 M12 26 h3" stroke={D.brunF} strokeWidth="2.4" strokeLinecap="round" />
      {/* petite queue */}
      <path d="M12 8 q5 -1 5 -5 q-4 1 -6 3 Z" fill={D.blanc} stroke="#b07a44" strokeWidth="1" />
      {/* corps */}
      <ellipse cx="2" cy="10" rx="11" ry="8" fill="#d3a066" stroke="#8f6231" strokeWidth="1.6" />
      <ellipse cx="1" cy="13" rx="7" ry="4.5" fill={D.creme} opacity="0.7" />
      {/* taches blanches */}
      <circle cx="-2" cy="6" r="1.7" fill={D.blanc} opacity="0.95" />
      <circle cx="4" cy="5" r="1.5" fill={D.blanc} opacity="0.95" />
      <circle cx="9" cy="8" r="1.5" fill={D.blanc} opacity="0.95" />
      <circle cx="1" cy="10" r="1.3" fill={D.blanc} opacity="0.9" />
      <circle cx="7" cy="12" r="1.2" fill={D.blanc} opacity="0.9" />
      {/* cou + tête */}
      <path d="M-6 6 Q-11 -2 -9 -8 l6 2 Q-4 2 -1 5 Z" fill="#d3a066" stroke="#8f6231" strokeWidth="1.4" />
      <ellipse cx="-11" cy="-10" rx="7.5" ry="6.5" fill="#dcac74" stroke="#8f6231" strokeWidth="1.5" />
      <ellipse cx="-16" cy="-7" rx="4" ry="3" fill="#e8c396" />
      <ellipse cx="-18.5" cy="-8" rx="1.6" ry="1.3" fill={D.nuit} />
      {/* grandes oreilles */}
      <path d="M-14 -15 Q-22 -20 -23 -14 Q-19 -11 -14 -12 Z" fill="#c8934f" stroke="#8f6231" strokeWidth="1.2" />
      <path d="M-7 -15 Q-3 -21 0 -16 Q-3 -12 -7 -12 Z" fill="#c8934f" stroke="#8f6231" strokeWidth="1.2" />
      {/* grands yeux doux */}
      <ellipse cx="-12" cy="-11" rx="3" ry="3.4" fill={D.nuit} />
      <ellipse cx="-6" cy="-11.5" rx="2.6" ry="3" fill={D.nuit} />
      <circle cx="-13" cy="-12.2" r="1.1" fill={D.blanc} />
      <circle cx="-6.9" cy="-12.6" r="1" fill={D.blanc} />
      <path d="M-15 -15 q3 -2 6 -1" stroke="#8f6231" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Heimlich : grosse chenille verte très ronde et segmentée, bouille joviale.
  dheimlich: () => ground(
    <g>
      {/* segments arrière → avant */}
      <ellipse cx="14" cy="14" rx="7" ry="7" fill="#5fae3c" stroke={D.vertF} strokeWidth="1.6" />
      <ellipse cx="6" cy="14" rx="8" ry="8" fill="#6dbd45" stroke={D.vertF} strokeWidth="1.6" />
      <ellipse cx="-3" cy="13" rx="8.6" ry="8.6" fill="#78c94e" stroke={D.vertF} strokeWidth="1.6" />
      {/* reflets sur les segments */}
      <ellipse cx="14" cy="10" rx="4" ry="2.4" fill={D.vertC} opacity="0.6" />
      <ellipse cx="6" cy="9" rx="4.6" ry="2.6" fill={D.vertC} opacity="0.6" />
      <ellipse cx="-3" cy="8" rx="5" ry="2.8" fill={D.vertC} opacity="0.6" />
      {/* petites pattes */}
      <path d="M14 21 l1 4 M8 22 l0 4 M2 22 l-1 4 M-5 21 l-1 4" stroke={D.vertF} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 20 l3 3 M11 21 l2 4" stroke={D.vertF} strokeWidth="1.6" strokeLinecap="round" />
      {/* tête */}
      <circle cx="-13" cy="10" r="9.5" fill="#84d456" stroke={D.vertF} strokeWidth="1.8" />
      <ellipse cx="-14" cy="5" rx="5" ry="2.8" fill={D.vertC} opacity="0.6" />
      {/* antennes à boules */}
      <path d="M-16 1 q-3 -6 -6 -8 M-10 1 q1 -7 4 -9" stroke={D.vertF} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="-23" cy="-8" r="2.4" fill={D.rouge} stroke={D.rougeF} strokeWidth="1" />
      <circle cx="-5.5" cy="-9" r="2.4" fill={D.rouge} stroke={D.rougeF} strokeWidth="1" />
      {/* gros yeux joviaux */}
      <ellipse cx="-17" cy="8" rx="3.4" ry="3.8" fill={D.blanc} stroke={D.vertF} strokeWidth="0.9" />
      <ellipse cx="-9.5" cy="8" rx="3.4" ry="3.8" fill={D.blanc} stroke={D.vertF} strokeWidth="0.9" />
      <circle cx="-16.2" cy="8.6" r="1.7" fill={D.nuit} />
      <circle cx="-8.7" cy="8.6" r="1.7" fill={D.nuit} />
      <circle cx="-16.8" cy="7.8" r="0.6" fill={D.blanc} />
      <circle cx="-9.3" cy="7.8" r="0.6" fill={D.blanc} />
      {/* grand sourire + joues */}
      <path d="M-18 14 Q-13 19 -8 14 Z" fill="#8a2f3f" stroke={D.vertF} strokeWidth="1.2" />
      <circle cx="-20" cy="12.5" r="2" fill={D.rose} opacity="0.75" />
      <circle cx="-6.5" cy="12.5" r="2" fill={D.rose} opacity="0.75" />
    </g>
  ),

  // Petit cochon rose : nœud sur la tête, groin, queue en tire-bouchon.
  dcochon: () => ground(
    <g>
      {/* queue en tire-bouchon */}
      <path d="M11 12 q5 -2 3 -5 q-2 -3 -5 -1 q-2 2 1 3" stroke="#e8809f" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* pattes */}
      <ellipse cx="-6" cy="24" rx="3.4" ry="2.6" fill="#e8809f" stroke="#c05a79" strokeWidth="1" />
      <ellipse cx="2" cy="24" rx="3.4" ry="2.6" fill="#e8809f" stroke="#c05a79" strokeWidth="1" />
      <ellipse cx="9" cy="24" rx="3.4" ry="2.6" fill="#e8809f" stroke="#c05a79" strokeWidth="1" />
      {/* corps */}
      <ellipse cx="2" cy="14" rx="11" ry="9" fill="#ffb0c6" stroke="#c05a79" strokeWidth="1.6" />
      <ellipse cx="1" cy="17" rx="7" ry="4.6" fill="#ffd3e0" opacity="0.8" />
      {/* tête */}
      <circle cx="-7" cy="1" r="9" fill="#ffbcd0" stroke="#c05a79" strokeWidth="1.6" />
      {/* oreilles */}
      <path d="M-13 -6 q-3 -6 1 -6 q3 1 3 5 Z" fill="#ff9dbb" stroke="#c05a79" strokeWidth="1.2" />
      <path d="M-2 -7 q2 -6 5 -4 q1 3 -2 6 Z" fill="#ff9dbb" stroke="#c05a79" strokeWidth="1.2" />
      {/* groin */}
      <ellipse cx="-11" cy="4" rx="5" ry="4" fill="#ff8fb2" stroke="#c05a79" strokeWidth="1.2" />
      <ellipse cx="-12.5" cy="4" rx="1" ry="1.5" fill="#a34363" />
      <ellipse cx="-9.5" cy="4" rx="1" ry="1.5" fill="#a34363" />
      {/* yeux */}
      <ellipse cx="-9" cy="-2" rx="2" ry="2.4" fill={D.blanc} stroke="#c05a79" strokeWidth="0.7" />
      <ellipse cx="-2.5" cy="-2.5" rx="2" ry="2.4" fill={D.blanc} stroke="#c05a79" strokeWidth="0.7" />
      <circle cx="-8.6" cy="-1.8" r="1.1" fill={D.nuit} />
      <circle cx="-2.1" cy="-2.3" r="1.1" fill={D.nuit} />
      {/* nœud sur la tête */}
      <path d="M-7 -11 q-6 -4 -7 0 q1 4 7 1 Z" fill={D.rouge} stroke={D.rougeF} strokeWidth="1.1" />
      <path d="M-6 -11 q6 -4 7 0 q-1 4 -7 1 Z" fill={D.rouge} stroke={D.rougeF} strokeWidth="1.1" />
      <circle cx="-6.5" cy="-10" r="1.7" fill="#ff6b6b" stroke={D.rougeF} strokeWidth="1" />
    </g>
  ),

  // Tigrou : tigre orange rayé, sur son ressort de queue, en plein bond.
  dtigroupet: () => ground(
    <g className="d-tigrou-bounce">
      {/* ressort de queue */}
      <path d="M2 22 q7 3 4 -3 q-3 -5 3 -5 q6 0 3 -6"
        stroke="#f0842a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M4 21 q4 1 3 -2 M7 15 q4 0 3 -3" stroke={D.nuit} strokeWidth="1.6" fill="none" />
      {/* bras levés */}
      <path d="M-9 6 q-8 -3 -10 -9" stroke="#ff9a3c" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      <path d="M9 6 q8 -3 10 -9" stroke="#ff9a3c" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      {/* jambes repliées */}
      <path d="M-5 17 q-5 4 -8 3 M5 17 q5 4 8 3" stroke="#ff9a3c" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      {/* corps */}
      <ellipse cx="0" cy="10" rx="9.5" ry="10" fill="#ff9a3c" stroke="#b3591a" strokeWidth="1.7" />
      <ellipse cx="0" cy="13" rx="6" ry="6.5" fill={D.creme} opacity="0.85" />
      {/* rayures du corps */}
      <path d="M-9 5 q4 2 8 0 M-9.5 10 q4 2 8 0 M-8 15 q3 2 6 0" stroke={D.nuit} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      {/* tête */}
      <circle cx="0" cy="-5" r="9" fill="#ffab52" stroke="#b3591a" strokeWidth="1.7" />
      <circle cx="-7" cy="-12" r="3.2" fill="#ff9a3c" stroke="#b3591a" strokeWidth="1.2" />
      <circle cx="7" cy="-12" r="3.2" fill="#ff9a3c" stroke="#b3591a" strokeWidth="1.2" />
      {/* rayures du front */}
      <path d="M-4 -12 l-1 -3 M0 -13 l0 -3 M4 -12 l1 -3" stroke={D.nuit} strokeWidth="1.6" strokeLinecap="round" />
      {/* museau */}
      <ellipse cx="0" cy="-2" rx="6" ry="4" fill={D.creme} />
      <path d="M0 -4.5 l-2 1.8 h4 Z" fill="#8a3a1c" />
      <path d="M0 -2.7 v2 M0 -0.7 q-2.6 2 -4.6 0 M0 -0.7 q2.6 2 4.6 0" stroke="#8a3a1c" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* yeux ravis */}
      <path d="M-6 -7 q2.5 -3 5 0" stroke={D.nuit} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M1 -7 q2.5 -3 5 0" stroke={D.nuit} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* moustaches */}
      <path d="M-6 -1 l-6 -1 M-6 1 l-6 2 M6 -1 l6 -1 M6 1 l6 2" stroke={D.nuit} strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ),

  // Baloo : grand ours gris-bleu débonnaire, presque aussi haut que l'avatar.
  dbaloo: () => ground(
    <g>
      {/* jambes */}
      <ellipse cx="-9" cy="32" rx="7" ry="6" fill="#6b7f9a" stroke="#41506b" strokeWidth="1.8" />
      <ellipse cx="10" cy="32" rx="7" ry="6" fill="#6b7f9a" stroke="#41506b" strokeWidth="1.8" />
      <ellipse cx="-9" cy="33" rx="4" ry="3" fill="#c6b28e" />
      <ellipse cx="10" cy="33" rx="4" ry="3" fill="#c6b28e" />
      {/* corps très rond */}
      <ellipse cx="0" cy="14" rx="18" ry="18" fill="#76899f" stroke="#41506b" strokeWidth="2.2" />
      <ellipse cx="0" cy="17" rx="12" ry="13" fill="#b9c4cf" opacity="0.85" />
      {/* bras */}
      <path d="M-16 8 q-9 6 -8 15" stroke="#6b7f9a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M16 8 q9 6 8 15" stroke="#6b7f9a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="-24" cy="24" r="4.4" fill="#6b7f9a" stroke="#41506b" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="4.4" fill="#6b7f9a" stroke="#41506b" strokeWidth="1.4" />
      {/* tête */}
      <ellipse cx="0" cy="-11" rx="13.5" ry="12" fill="#7d90a7" stroke="#41506b" strokeWidth="2" />
      {/* oreilles rondes */}
      <circle cx="-11" cy="-21" r="4.6" fill="#6b7f9a" stroke="#41506b" strokeWidth="1.5" />
      <circle cx="11" cy="-21" r="4.6" fill="#6b7f9a" stroke="#41506b" strokeWidth="1.5" />
      <circle cx="-11" cy="-21" r="2.3" fill="#a8b6c6" />
      <circle cx="11" cy="-21" r="2.3" fill="#a8b6c6" />
      {/* museau clair */}
      <ellipse cx="0" cy="-6" rx="8.5" ry="6" fill="#cbb995" stroke="#41506b" strokeWidth="1.3" />
      <ellipse cx="0" cy="-9.5" rx="3" ry="2.2" fill={D.nuit} />
      <path d="M0 -7.3 v2.4 M0 -4.9 q-3.4 2.6 -6 0 M0 -4.9 q3.4 2.6 6 0" stroke="#4a3a2a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* yeux mi-clos, air débonnaire */}
      <ellipse cx="-5.5" cy="-14" rx="3" ry="3.2" fill={D.blanc} stroke="#41506b" strokeWidth="0.8" />
      <ellipse cx="5.5" cy="-14" rx="3" ry="3.2" fill={D.blanc} stroke="#41506b" strokeWidth="0.8" />
      <circle cx="-5" cy="-13" r="1.6" fill={D.nuit} />
      <circle cx="6" cy="-13" r="1.6" fill={D.nuit} />
      <path d="M-9 -17 q3.5 -2 7 -0.5 M2 -17.5 q3.5 -1.5 7 0.5" stroke="#41506b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Trois chiots dalmatiens en groupe, colliers rouges, petite course.
  ddalmatiens: () => ground(
    <g>
      {[
        { t: 'translate(-13 4) scale(0.9)', d: '0s' },
        { t: 'translate(3 0) scale(1.05)', d: '0.2s' },
        { t: 'translate(17 5) scale(0.85)', d: '0.4s' },
      ].map((p, i) => (
        <g key={i} className="d-dalmatien-run" style={{ animationDelay: p.d }} transform={p.t}>
          {/* pattes */}
          <path d="M-4 12 l-2 7 M3 13 l1 6 M7 11 l3 7" stroke="#d8d8e2" strokeWidth="3" strokeLinecap="round" />
          {/* queue */}
          <path d="M8 6 q6 -2 6 -7" stroke={D.blanc} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* corps */}
          <ellipse cx="2" cy="8" rx="9" ry="6.5" fill={D.blanc} stroke={D.grisF} strokeWidth="1.4" />
          {/* taches */}
          <circle cx="0" cy="6" r="2" fill={D.nuit} />
          <circle cx="6" cy="9" r="1.6" fill={D.nuit} />
          <circle cx="-3" cy="10" r="1.3" fill={D.nuit} />
          {/* collier rouge */}
          <path d="M-6 3 q1 4 4 5" stroke={D.rouge} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* tête */}
          <circle cx="-7" cy="-1" r="6.4" fill={D.blanc} stroke={D.grisF} strokeWidth="1.4" />
          <circle cx="-9" cy="-4" r="1.9" fill={D.nuit} />
          {/* oreilles tombantes */}
          <path d="M-12 -4 q-4 0 -4 5 q3 1 4 -3 Z" fill={D.nuit} stroke={D.grisF} strokeWidth="0.9" />
          <path d="M-3 -5 q4 0 4 5 q-3 1 -4 -3 Z" fill={D.nuit} stroke={D.grisF} strokeWidth="0.9" />
          {/* museau + yeux */}
          <ellipse cx="-11" cy="2" rx="3.4" ry="2.4" fill={D.blanc} stroke={D.grisF} strokeWidth="0.8" />
          <ellipse cx="-13.4" cy="1.4" rx="1.4" ry="1.1" fill={D.nuit} />
          <circle cx="-9.5" cy="-0.5" r="1" fill={D.nuit} />
          <circle cx="-5.5" cy="-1" r="1" fill={D.nuit} />
        </g>
      ))}
    </g>
  ),

  // Tristesse : petit personnage bleu rond, pull blanc, grosses lunettes
  // rondes, cheveux courts noirs, air abattu.
  dtristesse: () => ground(
    <g>
      {/* jambes courtes */}
      <rect x="-7" y="20" width="5.5" height="6" rx="2.4" fill="#4c8fc9" />
      <rect x="1.5" y="20" width="5.5" height="6" rx="2.4" fill="#4c8fc9" />
      <ellipse cx="-4.2" cy="26" rx="3.6" ry="2" fill={D.bleuF} />
      <ellipse cx="4.2" cy="26" rx="3.6" ry="2" fill={D.bleuF} />
      {/* corps en pull blanc, col roulé */}
      <path d="M-10 22 Q-12 6 0 6 Q12 6 10 22 Z" fill={D.blanc} stroke="#b9c2d4" strokeWidth="1.6" />
      <path d="M-9 12 h18" stroke="#dfe4ef" strokeWidth="1.4" />
      <path d="M-5 6 q5 3 10 0" stroke="#c9d2e0" strokeWidth="2" fill="none" />
      {/* bras qui pendent */}
      <path d="M-9 11 q-6 4 -5 10" stroke={D.blanc} strokeWidth="4.6" fill="none" strokeLinecap="round" />
      <path d="M9 11 q6 4 5 10" stroke={D.blanc} strokeWidth="4.6" fill="none" strokeLinecap="round" />
      <circle cx="-14" cy="22" r="2.6" fill="#5fa3da" />
      <circle cx="14" cy="22" r="2.6" fill="#5fa3da" />
      {/* grosse tête bleue */}
      <ellipse cx="0" cy="-4" rx="12" ry="11" fill="#5fa3da" stroke="#3273ab" strokeWidth="1.8" />
      {/* cheveux courts noirs */}
      <path d="M-12 -6 Q-12 -18 0 -18 Q12 -18 12 -6 Q8 -13 0 -12 Q-8 -13 -12 -6 Z"
        fill={D.nuit} stroke="#0d0a18" strokeWidth="1.2" />
      <path d="M-9 -12 q4 -4 9 -3" stroke="#3b3550" strokeWidth="1.2" fill="none" />
      {/* grosses lunettes rondes */}
      <circle cx="-5" cy="-4" r="5.2" fill="#eef6ff" opacity="0.75" stroke={D.nuit} strokeWidth="1.6" />
      <circle cx="5" cy="-4" r="5.2" fill="#eef6ff" opacity="0.75" stroke={D.nuit} strokeWidth="1.6" />
      <path d="M-0.2 -4.6 h0.4" stroke={D.nuit} strokeWidth="1.6" />
      <path d="M-10.2 -4.6 h-1.8 M10.2 -4.6 h1.8" stroke={D.nuit} strokeWidth="1.4" />
      {/* yeux tristes derrière les verres */}
      <circle cx="-5" cy="-3" r="1.9" fill={D.nuit} />
      <circle cx="5" cy="-3" r="1.9" fill={D.nuit} />
      <circle cx="-5.7" cy="-3.8" r="0.7" fill={D.blanc} />
      <circle cx="4.3" cy="-3.8" r="0.7" fill={D.blanc} />
      <path d="M-8 -8 q3 -1.5 6 0.5 M2 -7.5 q3 -2 6 -0.5" stroke="#2a5f8f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* bouche abattue + petite larme */}
      <path d="M-4 4 Q0 1 4 4" stroke="#2a5f8f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M-9 1 q-1.6 3 0 4 q1.6 -1 0 -4 Z" fill="#bfe6ff" stroke="#7fc4ee" strokeWidth="0.7" />
    </g>
  ),

  // Meeko : raton laveur gris, masque noir, queue rayée touffue.
  dmeeko: () => ground(
    <g>
      {/* queue rayée touffue */}
      <path d="M11 14 Q23 12 22 0 Q21 -6 16 -6" stroke="#8f98a8" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M22 8 q-6 1 -9 -1 M22.5 2 q-6 1 -9 -1 M19 -4 q-5 2 -7 0"
        stroke={D.nuit} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* pattes */}
      <ellipse cx="-6" cy="24" rx="3.6" ry="2.4" fill={D.nuit} />
      <ellipse cx="2" cy="24" rx="3.6" ry="2.4" fill={D.nuit} />
      <ellipse cx="9" cy="24" rx="3.6" ry="2.4" fill={D.nuit} />
      {/* corps */}
      <ellipse cx="2" cy="14" rx="10.5" ry="9" fill="#9aa3b2" stroke="#5a6172" strokeWidth="1.6" />
      <ellipse cx="1" cy="17" rx="6.5" ry="4.6" fill="#d7dce4" opacity="0.85" />
      {/* tête */}
      <circle cx="-7" cy="0" r="9" fill="#aab3c1" stroke="#5a6172" strokeWidth="1.6" />
      {/* oreilles */}
      <path d="M-14 -6 q-2 -6 3 -5 q2 2 1 5 Z" fill="#9aa3b2" stroke="#5a6172" strokeWidth="1.2" />
      <path d="M-1 -7 q2 -6 5 -3 q0 3 -3 5 Z" fill="#9aa3b2" stroke="#5a6172" strokeWidth="1.2" />
      {/* masque noir */}
      <path d="M-15 -3 Q-11 -6 -7 -3 Q-3 -6 0 -2 Q-1 3 -6 2 Q-11 4 -15 -3 Z" fill={D.nuit} />
      {/* museau pointu */}
      <path d="M-9 3 Q-16 4 -17 7 Q-13 9 -9 7 Z" fill="#d7dce4" stroke="#5a6172" strokeWidth="1" />
      <ellipse cx="-17" cy="6.5" rx="1.6" ry="1.3" fill={D.nuit} />
      {/* yeux malicieux dans le masque */}
      <circle cx="-11" cy="-1.5" r="2.2" fill={D.blanc} />
      <circle cx="-4" cy="-1.5" r="2.2" fill={D.blanc} />
      <circle cx="-10.6" cy="-1" r="1.2" fill={D.nuit} />
      <circle cx="-3.6" cy="-1" r="1.2" fill={D.nuit} />
      {/* bande blanche du front */}
      <path d="M-11 -7 q4 -2 8 -0.5" stroke={D.blanc} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),

  // Génie miniature : lampe magique dorée d'où sort un mini génie bleu
  // en volute de fumée.
  dgeniemini: () => ground(
    <g>
      {/* lampe dorée */}
      <ellipse cx="0" cy="24" rx="12" ry="2.4" fill={D.nuit} opacity="0.18" />
      <path d="M-11 22 Q-13 12 0 12 Q13 12 11 22 Q0 25 -11 22 Z" fill={D.or} stroke={D.orF} strokeWidth="1.8" />
      <ellipse cx="0" cy="12" rx="13" ry="3.4" fill="#ffd96a" stroke={D.orF} strokeWidth="1.4" />
      <path d="M-9 16 q6 -2 12 0" stroke="#fff0b8" strokeWidth="1.6" fill="none" opacity="0.9" />
      {/* bec de la lampe */}
      <path d="M-11 15 Q-20 14 -22 9 L-19 8 Q-16 12 -10 12 Z" fill={D.or} stroke={D.orF} strokeWidth="1.4" />
      {/* anse */}
      <path d="M11 15 Q19 15 17 21 Q15 23 12 21" stroke={D.orF} strokeWidth="2.2" fill="none" />
      {/* volute de fumée */}
      <path d="M0 12 Q-6 4 0 -1 Q7 -5 3 -10" stroke={D.bleuC} strokeWidth="5" fill="none"
        strokeLinecap="round" opacity="0.55" />
      {/* mini génie */}
      <g className="d-genie-float">
        <path d="M3 -8 Q-2 -12 1 -16 Q4 -19 8 -16 Q11 -13 7 -8 Z" fill="#4bb8e8" opacity="0.85" />
        <ellipse cx="5" cy="-19" rx="6" ry="5.5" fill="#5cc6f2" stroke="#2a86b8" strokeWidth="1.3" />
        {/* bandeau + toupet */}
        <path d="M-1 -21 q6 -3 12 0" stroke={D.or} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M5 -24 q1 -5 5 -5 q-3 3 -2 5 Z" fill={D.nuit} />
        {/* visage */}
        <circle cx="3" cy="-19.5" r="1.1" fill={D.nuit} />
        <circle cx="7.5" cy="-19.5" r="1.1" fill={D.nuit} />
        <path d="M2.5 -16.5 q2.5 2 5 0" stroke={D.nuit} strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* petits bras croisés */}
        <path d="M-1 -11 q6 3 11 -1" stroke="#4bb8e8" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      {/* étincelles */}
      <path d="M-9 2 l1 -3 1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 Z" fill={D.or} opacity="0.9" />
      <circle cx="12" cy="-3" r="1.3" fill={D.or} opacity="0.85" />
    </g>
  ),

  // ---------------------------------------------------------------
  //  VOLANTS — au-dessus
  // ---------------------------------------------------------------

  // Dumbo : éléphanteau bleu-gris aux énormes oreilles déployées, en vol.
  ddumbo: () => (
    <g>
      {/* oreilles immenses qui battent */}
      <g className="d-dumbo-ear-l" style={{ transformOrigin: '-7px -4px' }}>
        <path d="M-7 -6 Q-30 -14 -32 4 Q-30 18 -14 12 Q-8 8 -7 0 Z"
          fill="#8fa3c0" stroke="#4f6285" strokeWidth="1.8" />
        <path d="M-11 -2 Q-24 0 -25 8" stroke="#ffc4d6" strokeWidth="1.6" fill="none" opacity="0.75" />
      </g>
      <g className="d-dumbo-ear-r" style={{ transformOrigin: '7px -4px' }}>
        <path d="M7 -6 Q30 -14 32 4 Q30 18 14 12 Q8 8 7 0 Z"
          fill="#8fa3c0" stroke="#4f6285" strokeWidth="1.8" />
        <path d="M11 -2 Q24 0 25 8" stroke="#ffc4d6" strokeWidth="1.6" fill="none" opacity="0.75" />
      </g>
      {/* petit corps + pattes */}
      <ellipse cx="0" cy="13" rx="8.5" ry="8" fill="#9db1cc" stroke="#4f6285" strokeWidth="1.6" />
      <ellipse cx="0" cy="16" rx="5.5" ry="4.6" fill="#c9d6e8" opacity="0.8" />
      <ellipse cx="-4.5" cy="20" rx="3.4" ry="2.6" fill="#8fa3c0" stroke="#4f6285" strokeWidth="1.1" />
      <ellipse cx="4.5" cy="20" rx="3.4" ry="2.6" fill="#8fa3c0" stroke="#4f6285" strokeWidth="1.1" />
      {/* petite queue */}
      <path d="M8 12 q5 2 4 6" stroke="#8fa3c0" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* tête */}
      <ellipse cx="0" cy="-1" rx="9" ry="8.5" fill="#a6b9d3" stroke="#4f6285" strokeWidth="1.7" />
      {/* trompe */}
      <path d="M0 5 Q1 12 -3 15 Q-7 17 -6 12" stroke="#a6b9d3" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      <path d="M0 5 Q1 12 -3 15 Q-7 17 -6 12" stroke="#4f6285" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* bonnet jaune */}
      <path d="M-7 -7 Q0 -14 7 -7 Z" fill={D.or} stroke={D.orF} strokeWidth="1.3" />
      <path d="M-8 -6 h16" stroke={D.orF} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="0" cy="-13" r="1.7" fill={D.rouge} />
      {/* grands yeux bleus */}
      <ellipse cx="-3.6" cy="-1" rx="2.8" ry="3.2" fill={D.blanc} stroke="#4f6285" strokeWidth="0.8" />
      <ellipse cx="3.6" cy="-1" rx="2.8" ry="3.2" fill={D.blanc} stroke="#4f6285" strokeWidth="0.8" />
      <circle cx="-3.4" cy="-0.4" r="1.6" fill="#2d6fa8" />
      <circle cx="3.8" cy="-0.4" r="1.6" fill="#2d6fa8" />
      <circle cx="-3.9" cy="-1.2" r="0.6" fill={D.blanc} />
      <circle cx="3.3" cy="-1.2" r="0.6" fill={D.blanc} />
      {/* plume magique */}
      <path d="M-6 12 Q-14 10 -18 3 Q-12 6 -6 9 Z" fill="#9be8a8" stroke="#4b9c62" strokeWidth="0.9" opacity="0.95" />
    </g>
  ),

  // Clochette : petite fée en robe verte, ailes translucides, traînée dorée.
  dclochettepet: () => (
    <g className="d-clochette-fly">
      {/* traînée de poussière dorée */}
      <g opacity="0.9">
        <circle cx="-13" cy="10" r="1.8" fill={D.or} opacity="0.85" />
        <circle cx="-18" cy="14" r="1.3" fill="#ffe58a" opacity="0.7" />
        <circle cx="-23" cy="17" r="1" fill={D.or} opacity="0.55" />
        <circle cx="-9" cy="16" r="1.2" fill="#ffe58a" opacity="0.6" />
        <path d="M-16 6 l0.7 -2.4 0.7 2.4 2.4 0.7 -2.4 0.7 -0.7 2.4 -0.7 -2.4 -2.4 -0.7 Z" fill={D.or} opacity="0.9" />
      </g>
      {/* ailes translucides */}
      <g className="d-clochette-wings" style={{ transformOrigin: '0px 0px' }}>
        <path d="M-2 -2 Q-16 -14 -13 0 Q-11 8 -3 3 Z" fill="#dff6ff" opacity="0.62" stroke="#9fd8f0" strokeWidth="0.9" />
        <path d="M2 -2 Q16 -14 13 0 Q11 8 3 3 Z" fill="#dff6ff" opacity="0.62" stroke="#9fd8f0" strokeWidth="0.9" />
        <path d="M-4 0 q-6 -4 -7 -6 M4 0 q6 -4 7 -6" stroke="#b6e4f7" strokeWidth="0.7" fill="none" />
      </g>
      {/* jambes + ballerines */}
      <path d="M-2 12 l-1 6 M2 12 l1 6" stroke="#ffd9b0" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="-3.5" cy="19" rx="2.4" ry="1.5" fill={D.blanc} />
      <ellipse cx="3.5" cy="19" rx="2.4" ry="1.5" fill={D.blanc} />
      {/* robe verte */}
      <path d="M-6 1 Q0 -2 6 1 L8 13 Q0 16 -8 13 Z" fill="#5fc46b" stroke="#2f8a45" strokeWidth="1.4" />
      <path d="M-8 13 q4 -3 8 0 q4 3 8 0" stroke="#2f8a45" strokeWidth="1.2" fill="none" />
      <path d="M-5 4 q5 2 10 0" stroke="#8fe08a" strokeWidth="1.2" fill="none" opacity="0.8" />
      {/* bras */}
      <path d="M-5 2 q-5 3 -5 7" stroke="#ffd9b0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M5 2 q5 3 5 7" stroke="#ffd9b0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* tête + chignon blond */}
      <circle cx="0" cy="-6" r="6" fill="#ffdcb6" stroke="#d8a878" strokeWidth="1.2" />
      <path d="M-6 -7 Q-6 -14 0 -14 Q6 -14 6 -7 Q3 -11 0 -10 Q-3 -11 -6 -7 Z" fill="#ffd24d" stroke="#dba91f" strokeWidth="1.1" />
      <circle cx="0" cy="-15" r="3.6" fill="#ffd24d" stroke="#dba91f" strokeWidth="1.1" />
      <circle cx="-2.2" cy="-6" r="1.1" fill={D.nuit} />
      <circle cx="2.2" cy="-6" r="1.1" fill={D.nuit} />
      <path d="M-1.6 -3 q1.6 1.6 3.2 0" stroke="#c2627e" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="-4" cy="-3.6" r="1.2" fill={D.rose} opacity="0.7" />
      <circle cx="4" cy="-3.6" r="1.2" fill={D.rose} opacity="0.7" />
    </g>
  ),

  // ---------------------------------------------------------------
  //  SUR L'ÉPAULE / LA TÊTE — petits compagnons
  // ---------------------------------------------------------------

  // Pascal : petit caméléon vert, queue enroulée, yeux globuleux indépendants.
  dpascal: () => shoulder(
    <g>
      {/* queue enroulée */}
      <path d="M8 6 Q16 6 16 12 Q16 17 11 16 Q7 15 9 11"
        stroke="#5fc46b" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* pattes agrippantes */}
      <path d="M-3 8 l-2 4 M4 8 l2 4" stroke="#4aa858" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-5 12 l-2 1 M6 12 l2 1" stroke="#4aa858" strokeWidth="1.6" strokeLinecap="round" />
      {/* corps */}
      <ellipse cx="1" cy="4" rx="8" ry="6" fill="#6fd07a" stroke="#2f8a45" strokeWidth="1.4" />
      <ellipse cx="1" cy="6" rx="5" ry="3" fill="#c6f0bd" opacity="0.7" />
      {/* crête dorsale */}
      <path d="M-4 -1 l1.5 -3 1.5 3 1.5 -3 1.5 3 1.5 -2.5 1.5 2.5" fill="#3fa85a" />
      {/* tête */}
      <ellipse cx="-7" cy="0" rx="7" ry="6" fill="#7ad884" stroke="#2f8a45" strokeWidth="1.4" />
      <path d="M-11 4 q4 2 7 0" stroke="#2f8a45" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* yeux globuleux indépendants */}
      <circle cx="-9" cy="-3.5" r="3.4" fill="#6fd07a" stroke="#2f8a45" strokeWidth="1.2" />
      <circle cx="-2.5" cy="-4.5" r="3.4" fill="#6fd07a" stroke="#2f8a45" strokeWidth="1.2" />
      <circle cx="-10.2" cy="-4.2" r="1.7" fill={D.blanc} />
      <circle cx="-1.4" cy="-5.4" r="1.7" fill={D.blanc} />
      <circle cx="-10.5" cy="-4.4" r="0.95" fill={D.nuit} />
      <circle cx="-1.1" cy="-5.6" r="0.95" fill={D.nuit} />
      {/* petits reflets d'écailles */}
      <circle cx="3" cy="2" r="0.9" fill="#a9e8a2" opacity="0.9" />
      <circle cx="6" cy="4" r="0.7" fill="#a9e8a2" opacity="0.9" />
    </g>
  ),

  // Kakamora : minuscule guerrier noix de coco, masque peint blanc et rouge.
  dkakamora: () => shoulder(
    <g>
      {/* petites jambes */}
      <path d="M-3 8 l-1 4 M3 8 l1 4" stroke="#3a2a1c" strokeWidth="2" strokeLinecap="round" />
      <path d="M-5 12 h3 M3 12 h3" stroke="#3a2a1c" strokeWidth="2" strokeLinecap="round" />
      {/* petit corps sombre */}
      <ellipse cx="0" cy="4" rx="6" ry="5" fill="#3a2a1c" stroke="#221609" strokeWidth="1.2" />
      {/* bras + minuscule lance */}
      <path d="M-6 2 l-4 3" stroke="#3a2a1c" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 2 l4 -1" stroke="#3a2a1c" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 -8 l1 12" stroke={D.brun} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 -8 l-2 3 4 0 Z" fill="#d9d2c2" stroke="#221609" strokeWidth="0.7" />
      {/* casque de noix de coco */}
      <circle cx="0" cy="-4" r="8" fill="#4a3524" stroke="#221609" strokeWidth="1.5" />
      <path d="M-8 -5 q8 -4 16 0" stroke="#2b1c0e" strokeWidth="1.1" fill="none" />
      {/* motifs peints blancs */}
      <path d="M-6 -9 q6 -3 12 0" stroke={D.blanc} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M-5 1 q5 3 10 0" stroke={D.blanc} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* motif rouge central */}
      <path d="M0 -8 l2 4 -2 4 -2 -4 Z" fill={D.rouge} />
      {/* yeux fendus dans le masque */}
      <path d="M-6 -4 l4 0" stroke={D.blanc} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M2 -4 l4 0" stroke={D.blanc} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="-4.4" cy="-4" r="0.9" fill={D.nuit} />
      <circle cx="4.4" cy="-4" r="0.9" fill={D.nuit} />
      {/* fibres de la noix */}
      <path d="M-7 -1 q2 -2 1 -5 M7 -1 q-2 -2 -1 -5" stroke="#2b1c0e" strokeWidth="0.8" fill="none" />
    </g>
  ),

  // Jiminy : petit criquet vert en habit noir, haut-de-forme, col blanc,
  // parapluie.
  djiminy: () => shoulder(
    <g>
      {/* parapluie fermé, en canne */}
      <path d="M8 -2 l3 12" stroke={D.nuit} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 -2 q-3 -5 -6 -3 q3 -6 8 -3 Z" fill="#3a3550" stroke={D.nuit} strokeWidth="0.9" />
      <path d="M11 10 q3 1 2 3" stroke={D.nuit} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* pattes de criquet */}
      <path d="M-3 8 q-3 2 -2 5 M3 8 q3 2 2 5" stroke="#3fa85a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M-6 13 h3 M3 13 h3" stroke="#3fa85a" strokeWidth="1.6" strokeLinecap="round" />
      {/* habit noir (queue-de-pie) */}
      <path d="M-6 -1 Q0 -3 6 -1 L7 9 Q0 11 -7 9 Z" fill="#2a2540" stroke={D.nuit} strokeWidth="1.2" />
      <path d="M-7 9 l-2 4 3 -1 M7 9 l2 4 -3 -1" fill="#2a2540" />
      {/* col blanc + nœud */}
      <path d="M-3.5 -2 L0 2 L3.5 -2 Z" fill={D.blanc} stroke="#c9d2e0" strokeWidth="0.7" />
      <path d="M-2 -1 l2 2 2 -2" stroke={D.rouge} strokeWidth="1.4" fill="none" />
      {/* bras */}
      <path d="M-6 1 q-4 3 -3 6" stroke="#2a2540" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M6 1 q3 -1 3 -3" stroke="#2a2540" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* tête verte */}
      <ellipse cx="0" cy="-7" rx="6" ry="5.5" fill="#6fd07a" stroke="#2f8a45" strokeWidth="1.3" />
      <circle cx="-2.2" cy="-8" r="1.3" fill={D.nuit} />
      <circle cx="2.2" cy="-8" r="1.3" fill={D.nuit} />
      <circle cx="-2.6" cy="-8.5" r="0.5" fill={D.blanc} />
      <circle cx="1.8" cy="-8.5" r="0.5" fill={D.blanc} />
      <path d="M-2 -4.5 q2 2 4 0" stroke="#2f8a45" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* antennes */}
      <path d="M-3 -12 q-2 -4 -5 -5 M3 -12 q2 -4 5 -5" stroke="#3fa85a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* haut-de-forme */}
      <rect x="-4.5" y="-21" width="9" height="8" rx="1" fill={D.nuit} />
      <ellipse cx="0" cy="-13" rx="8" ry="1.8" fill={D.nuit} />
      <path d="M-4.5 -15 h9" stroke={D.rougeF} strokeWidth="1.8" />
    </g>
  ),

  // Riri : caneton bleu clair à casquette rouge, posé sur la tête de l'avatar.
  driripet: () => shoulder(
    <g>
      {/* pattes palmées */}
      <path d="M-3 8 l-1 3 M3 8 l1 3" stroke={D.or} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-6 11 h4 M2 11 h4" stroke={D.or} strokeWidth="2.4" strokeLinecap="round" />
      {/* corps + aile */}
      <ellipse cx="0" cy="3" rx="7.5" ry="6.5" fill="#7fc9f0" stroke="#2f7fae" strokeWidth="1.4" />
      <path d="M5 1 q5 2 3 7 q-4 -1 -5 -4 Z" fill="#5fb3e0" stroke="#2f7fae" strokeWidth="1" />
      <ellipse cx="-1" cy="5" rx="4" ry="3" fill={D.bleuC} opacity="0.8" />
      {/* tête */}
      <circle cx="-1" cy="-6" r="6.4" fill="#8fd2f5" stroke="#2f7fae" strokeWidth="1.4" />
      {/* bec orange */}
      <path d="M-6 -5 q-6 0 -6 2.4 q0 2.4 6 1.6 Z" fill={D.or} stroke={D.orF} strokeWidth="1" />
      <path d="M-11 -3.2 q3 0.6 5 0.2" stroke={D.orF} strokeWidth="0.8" fill="none" />
      {/* yeux */}
      <circle cx="-3.4" cy="-8" r="1.9" fill={D.blanc} stroke="#2f7fae" strokeWidth="0.7" />
      <circle cx="1.6" cy="-8" r="1.9" fill={D.blanc} stroke="#2f7fae" strokeWidth="0.7" />
      <circle cx="-3.8" cy="-7.6" r="1" fill={D.nuit} />
      <circle cx="1.2" cy="-7.6" r="1" fill={D.nuit} />
      {/* casquette rouge */}
      <path d="M-7.5 -10 Q-1 -18 5.5 -10 Z" fill={D.rouge} stroke={D.rougeF} strokeWidth="1.2" />
      <path d="M-7.5 -10 q-6 0 -8 2 q5 1 8 0.6 Z" fill={D.rouge} stroke={D.rougeF} strokeWidth="1" />
      <circle cx="-1" cy="-17" r="1.5" fill={D.rougeF} />
    </g>
  ),

  // Flik : petite fourmi bleu-violet debout sur deux pattes, antennes.
  dflik: () => shoulder(
    <g>
      {/* pattes */}
      <path d="M-2 8 q-3 3 -3 5 M2 8 q3 3 3 5" stroke="#4a3f8a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M-7 13 h3 M4 13 h3" stroke="#4a3f8a" strokeWidth="1.8" strokeLinecap="round" />
      {/* abdomen */}
      <ellipse cx="0" cy="6" rx="6" ry="5" fill="#6d5fc4" stroke="#3a2f7a" strokeWidth="1.3" />
      <ellipse cx="-1" cy="7" rx="3.4" ry="2.6" fill="#a89bef" opacity="0.7" />
      {/* thorax */}
      <ellipse cx="0" cy="-0.5" rx="4.4" ry="3.6" fill="#7b6cd4" stroke="#3a2f7a" strokeWidth="1.2" />
      {/* bras sympathiques, un levé */}
      <path d="M-4 -1 q-5 1 -6 -3" stroke="#7b6cd4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M4 -1 q5 2 5 5" stroke="#7b6cd4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="-10.5" cy="-4.5" r="1.5" fill="#6d5fc4" />
      <circle cx="9.5" cy="4.5" r="1.5" fill="#6d5fc4" />
      {/* tête */}
      <ellipse cx="0" cy="-7" rx="5.6" ry="5" fill="#8b7ce0" stroke="#3a2f7a" strokeWidth="1.3" />
      {/* antennes */}
      <path d="M-2.5 -11.5 q-2 -4 -5 -5 M2.5 -11.5 q2 -4 5 -5" stroke="#3a2f7a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <circle cx="-7.8" cy="-16.8" r="1.3" fill="#8b7ce0" />
      <circle cx="7.8" cy="-16.8" r="1.3" fill="#8b7ce0" />
      {/* grands yeux */}
      <ellipse cx="-2.2" cy="-8" rx="2.2" ry="2.6" fill={D.blanc} stroke="#3a2f7a" strokeWidth="0.7" />
      <ellipse cx="2.2" cy="-8" rx="2.2" ry="2.6" fill={D.blanc} stroke="#3a2f7a" strokeWidth="0.7" />
      <circle cx="-2" cy="-7.6" r="1.2" fill={D.nuit} />
      <circle cx="2.4" cy="-7.6" r="1.2" fill={D.nuit} />
      <circle cx="-2.5" cy="-8.2" r="0.45" fill={D.blanc} />
      <circle cx="1.9" cy="-8.2" r="0.45" fill={D.blanc} />
      {/* sourire */}
      <path d="M-2 -4 q2 2 4 0" stroke="#3a2f7a" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  ),

  // ---------------------------------------------------------------
  //  AQUATIQUE — flotte à mi-hauteur
  // ---------------------------------------------------------------

  // Polochon : petit poisson jaune vif rayé de bleu, nageoires bleues.
  dflounder: () => (
    <g>
      {/* nageoire caudale */}
      <path d="M10 0 Q19 -8 21 1 Q19 9 10 3 Z" fill="#3f8fd8" stroke="#22578f" strokeWidth="1.3" />
      <path d="M13 -1 l6 -3 M13 2 l6 3" stroke="#22578f" strokeWidth="0.8" />
      {/* nageoire dorsale */}
      <path d="M-1 -7 Q2 -14 8 -8 Q4 -8 1 -6 Z" fill="#3f8fd8" stroke="#22578f" strokeWidth="1.1" />
      {/* corps jaune */}
      <ellipse cx="-1" cy="0" rx="12" ry="8.5" fill="#ffd83d" stroke="#c99a12" strokeWidth="1.6" />
      <ellipse cx="-2" cy="3" rx="7" ry="4" fill="#fff0a8" opacity="0.8" />
      {/* rayures bleues */}
      <path d="M0 -8 Q-2 0 0 8" stroke="#3f8fd8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M6 -6.5 Q4 0 6 6.5" stroke="#3f8fd8" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* nageoire pectorale */}
      <path d="M-3 3 Q-4 10 3 8 Q-1 6 -1 3 Z" fill="#5fa8e8" stroke="#22578f" strokeWidth="1" />
      {/* grands yeux */}
      <circle cx="-8" cy="-2.5" r="3.6" fill={D.blanc} stroke="#c99a12" strokeWidth="0.9" />
      <circle cx="-8.4" cy="-2" r="1.9" fill={D.nuit} />
      <circle cx="-9.2" cy="-2.9" r="0.8" fill={D.blanc} />
      {/* bouche + branchie */}
      <path d="M-13 2 q-2 1 0 2.4" stroke="#c99a12" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M-6 1 q-1 3 0 5" stroke="#c99a12" strokeWidth="1" fill="none" />
      {/* petites bulles */}
      <circle cx="-16" cy="-7" r="1.5" fill={D.bleuC} opacity="0.75" />
      <circle cx="-20" cy="-11" r="1" fill={D.bleuC} opacity="0.6" />
    </g>
  ),
}

// ----------------------------------------------------------------
//  Position + échelle finales de chaque compagnon Disney.
//  Mêmes repères que ANIMAL_PLACEMENT (avatarParts.jsx) :
//   - terrestres : centrés ~x150, posés au sol (bas de l'animal ≈ y150)
//   - volants    : centrés ~x150, nettement au-dessus
//   - aquatiques : centrés ~x150, flottent à mi-hauteur
//   - épaule     : ~ (96, 45) ; driripet est posé sur la TÊTE (x60)
// ----------------------------------------------------------------
export const DISNEY_ANIMAL_PLACEMENT = {
  // --- Au sol, à droite ---
  dpluto: 'translate(152 78) scale(2.6)',
  dstitchpet: 'translate(150 86) scale(2.4)',
  dsimba: 'translate(150 88) scale(2.4)',
  dbambipet: 'translate(151 82) scale(2.5)',
  dheimlich: 'translate(150 92) scale(2.3)',
  dcochon: 'translate(150 88) scale(2.4)',
  dtigroupet: 'translate(152 76) scale(2.3)',
  dbaloo: 'translate(152 78) scale(1.85)',   // presque aussi grand que l'avatar
  ddalmatiens: 'translate(150 96) scale(2.2)',
  dtristesse: 'translate(150 88) scale(2.3)',
  dmeeko: 'translate(150 88) scale(2.4)',
  dgeniemini: 'translate(150 90) scale(2.4)',
  // --- Volants : au-dessus ---
  ddumbo: 'translate(152 34) scale(1.9)',
  dclochettepet: 'translate(152 40) scale(2.0)',
  // --- Aquatique : flotte à mi-hauteur ---
  dflounder: 'translate(150 94) scale(2.4)',
  // --- Sur l'épaule (petits) ---
  dpascal: 'translate(96 46) scale(1.5)',
  dkakamora: 'translate(96 44) scale(1.5)',
  djiminy: 'translate(97 46) scale(1.4)',
  dflik: 'translate(96 45) scale(1.5)',
  // --- Sur la tête de l'avatar ---
  // Assis SUR le crâne (sommet à y=16) : les pattes, à y=11 en repère local,
  // retombent à 11*1.5+7 ≈ 23 — le caneton est posé, pas en lévitation.
  driripet: 'translate(60 7) scale(1.5)',
}

// ----------------------------------------------------------------
//  CLASSES D'ANIMATION UTILISÉES (CSS à écrire ailleurs) :
//   .d-pluto-tail        → queue de Pluto qui remue (rotation ±25° en boucle)
//   .d-tigrou-bounce     → bond de Tigrou (translation verticale rebondissante)
//   .d-dalmatien-run     → petite course des chiots (translation + léger
//                          sautillement ; animationDelay décalé par chiot)
//   .d-genie-float       → mini génie qui ondule au-dessus de sa lampe
//   .d-dumbo-ear-l       → battement de l'oreille gauche de Dumbo
//   .d-dumbo-ear-r       → battement de l'oreille droite de Dumbo
//   .d-clochette-fly     → vol flottant de Clochette (translation douce)
//   .d-clochette-wings   → battement rapide des ailes de Clochette
// ----------------------------------------------------------------
