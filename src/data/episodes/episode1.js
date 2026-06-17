// ============================================================
//  Série Zigzam — Épisode 1 : « Le Skin de la Honte »
// ============================================================
//  Données 100 % déclaratives lues par le lecteur universel
//  (src/pages/EpisodePlayer.jsx). Pour créer un nouvel épisode,
//  copier ce format dans un nouveau fichier et l'ajouter à
//  src/data/episodes/index.js — aucun code à toucher.
//
//  FORMAT D'UNE SCÈNE :
//   {
//     decor: 'avatar' | 'neutral' | 'lava' | 'lava-defeat',
//     cast: [
//       {
//         id,            // identifiant unique dans la scène
//         hero: true,    // ← remplacé par l'avatar de l'utilisateur connecté
//         avatar: {...}, // sinon, avatar fixe ({ color, hat, ... })
//         x,             // position horizontale en % (0 = gauche, 100 = droite)
//         anim,          // 'idle' | 'jump' | 'walk' | 'fall' | 'shrug'
//         flip,          // true = miroir (regarde vers la gauche)
//         scale,         // facteur de taille (défaut 1)
//         eyesClosed,    // true = yeux fermés
//         burnt,         // true = tout noir de brûlé
//       },
//     ],
//     effects: ['fire'], // effets décoratifs optionnels
//     bubbles: [         // apparaissent une par une, avec un « bloop »
//       { from: 'hero', text: '...' },
//     ],
//   }
// ============================================================

// Bonhommes secondaires : rose et bleu, sans aucun accessoire.
const PINK = { color: 'rose', hat: null, glasses: null, hair: null, sport: null, animal: null, face: null }
const BLUE = { color: 'bleu', hat: null, glasses: null, hair: null, sport: null, animal: null, face: null }

const episode1 = {
  id: 'episode1',
  number: 1,
  title: 'Le Skin de la Honte',
  emoji: '🎬',
  duration: '~2 min',
  synopsis: 'Notre héros vient de claquer 20 gemmes pour un nouveau skin... et tient absolument à ce que tout le monde le remarque.',
  // Habillage de la vignette sur la page /serie
  accent: 'var(--rose)',
  thumbnailDecor: 'lava',

  scenes: [
    // SCÈNE 1 — Interface Avatar, le héros se regarde fièrement
    {
      decor: 'avatar',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle' },
      ],
      bubbles: [
        { from: 'hero', text: '20 gemmes... mais ça vaut LARGEMENT le coup. Je suis une légende.' },
      ],
    },

    // SCÈNE 2 — Fond neutre, le héros parade devant les deux autres
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 26, anim: 'idle' },
        { id: 'pink', avatar: PINK, x: 64, flip: true, anim: 'idle' },
        { id: 'blue', avatar: BLUE, x: 84, flip: true, anim: 'idle' },
      ],
      bubbles: [
        { from: 'hero', text: 'Les gars, vous avez vu mon nouveau look ou pas ??' },
      ],
    },

    // SCÈNE 3 — Les deux bonhommes fixent le héros en silence
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 26, anim: 'idle' },
        { id: 'pink', avatar: PINK, x: 64, flip: true, anim: 'idle' },
        { id: 'blue', avatar: BLUE, x: 84, flip: true, anim: 'idle' },
      ],
      bubbles: [
        { from: 'pink', text: '...' },
        { from: 'blue', text: '...' },
      ],
    },

    // SCÈNE 4 — Le héros se racle la gorge, légèrement gêné
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 26, anim: 'idle' },
        { id: 'pink', avatar: PINK, x: 64, flip: true, anim: 'idle' },
        { id: 'blue', avatar: BLUE, x: 84, flip: true, anim: 'idle' },
      ],
      bubbles: [
        { from: 'hero', text: 'Bon... de toute façon je suis aussi le meilleur à Floor is Lava. Ça tout le monde le sait.' },
      ],
    },

    // SCÈNE 5 — Plateau Floor is Lava, le héros très confiant ferme les yeux
    {
      decor: 'lava',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', eyesClosed: true },
      ],
      bubbles: [
        { from: 'hero', text: 'La lave c\'est pour les débutants. Moi je ferme même les yeux.' },
      ],
    },

    // SCÈNE 6 — La lave a avancé, le héros tombe dedans
    {
      decor: 'lava',
      lavaAdvanced: true,
      effects: ['fire'],
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'fall', eyesClosed: true },
      ],
      bubbles: [
        { from: 'hero', text: '...ah.' },
      ],
    },

    // SCÈNE 7 — Écran de défaite, le héros tout noir de brûlé hausse les épaules
    {
      decor: 'lava-defeat',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'shrug', burnt: true },
      ],
      bubbles: [
        { from: 'hero', text: 'C\'est le skin qui m\'a distrait.' },
      ],
    },
  ],
}

export default episode1
