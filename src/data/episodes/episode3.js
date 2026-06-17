// ============================================================
//  Série Zigzam — Épisode 3 : « Six Seven »
// ============================================================
//  Même format que episode1.js (voir la doc en tête de ce fichier).
//  Nouveautés de scène/cast utilisées ici :
//   - cast[].scale : facteur de taille (LE PETIT est ~4x plus petit)
//   - cast[].pose  : 'lean' | 'crouch' → le héros se penche vers le bas
//   - cast[].anim  : 'wave' → petit signe de la main
//   - scene.sign   : { x, text } → une pancarte bien lisible posée dans la scène
//   - bubbles[].size : 'small' | 'big' ; bubbles[].bold : true
// ============================================================

// LE PETIT : un minuscule bonhomme Fall Guys jaune, sans aucun accessoire.
const PETIT = { color: 'jaune', hat: null, glasses: null, hair: null, sport: null, animal: null, face: null }

// Taille du petit bonhomme : vraiment tout petit (~4x plus petit que le héros).
const TINY = 0.24

const episode3 = {
  id: 'episode3',
  number: 3,
  title: 'Six Seven',
  emoji: '6️⃣',
  duration: '~2 min',
  // Brouillon par défaut : visible uniquement par le superadmin.
  publie: false,
  synopsis: 'Un minuscule bonhomme tout jaune apparaît aux pieds du héros et tente, coûte que coûte, de lui faire passer un message...',
  accent: 'var(--orange)',
  thumbnailDecor: 'neutral',

  scenes: [
    // SCÈNE 1 — Le héros se balade tranquillement sur Zigzam, fier.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'fier' },
      ],
      bubbles: [
        { from: 'hero', text: 'Belle journée sur Zigzam.' },
      ],
    },

    // SCÈNE 2 — Un minuscule bonhomme apparaît à ses pieds, le héros baisse les yeux.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'idle', expression: 'choque' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'idle' },
      ],
      bubbles: [
        { from: 'hero', text: '...?' },
      ],
    },

    // SCÈNE 3 — Le petit parle (bulle minuscule), le héros se penche légèrement.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'idle', expression: 'choque', pose: 'lean' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'idle' },
      ],
      bubbles: [
        { from: 'petit', text: 'Skksrzz frmbl zzt !!', size: 'small' },
      ],
    },

    // SCÈNE 4 — Le héros se penche encore plus, presque à quatre pattes, gêné.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'idle', expression: 'gene', pose: 'crouch' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'idle' },
      ],
      bubbles: [
        { from: 'hero', text: 'Euh... pardon ?' },
      ],
    },

    // SCÈNE 5 — Le petit répète encore plus fort (bulle plus grande, en gras),
    // le héros se redresse, blasé et fatigué.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'idle', expression: 'blase' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'idle' },
      ],
      bubbles: [
        { from: 'petit', text: 'SKKSRZZ FRMBL ZZT !!', size: 'big', bold: true },
      ],
    },

    // SCÈNE 6 — Le héros hausse les épaules, triste de ne rien comprendre.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'shrug', expression: 'triste' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'idle' },
      ],
      bubbles: [
        { from: 'hero', text: 'Je comprends rien...' },
      ],
    },

    // SCÈNE 7 — Le petit sort une toute petite pancarte « 6️⃣7️⃣ », le héros la fixe.
    {
      decor: 'neutral',
      sign: { x: 60, text: '6️⃣7️⃣' },
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'idle', expression: 'choque' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'idle' },
      ],
      bubbles: [],
    },

    // SCÈNE 8 — Le héros regarde droit vers la caméra, le petit fait un signe de la main.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 44, anim: 'idle', expression: 'choque' },
        { id: 'petit', avatar: PETIT, x: 60, scale: TINY, anim: 'wave' },
      ],
      bubbles: [
        { from: 'hero', text: '...ah.' },
      ],
    },
  ],
}

export default episode3
