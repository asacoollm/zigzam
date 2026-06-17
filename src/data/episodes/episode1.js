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
//         expression,    // 'fier'|'gene'|'blase'|'moque'|'choque'|'triste'|'neutre'
//         blink,         // true = clignement lent des yeux
//         transitionTo,  // changement d'état pendant la scène :
//                        //   { when: 'speak'|'after', delay, expression, eyesClosed, anim }
//                        //   'speak' = quand le perso commence à parler
//                        //   'after' = `delay` ms après la fin de sa bulle
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
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'fier' },
      ],
      bubbles: [
        { from: 'hero', text: '20 gemmes... mais ça vaut LARGEMENT le coup. Je suis une légende.' },
      ],
    },

    // SCÈNE 2 — Fond neutre, le héros parade devant les deux autres (blasés)
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 26, anim: 'idle', expression: 'fier' },
        { id: 'pink', avatar: PINK, x: 64, flip: true, anim: 'idle', expression: 'blase' },
        { id: 'blue', avatar: BLUE, x: 84, flip: true, anim: 'idle', expression: 'blase' },
      ],
      bubbles: [
        { from: 'hero', text: 'Les gars, vous avez vu mon nouveau look ou pas ??' },
      ],
    },

    // SCÈNE 3 — Les deux bonhommes fixent le héros en silence (clignements lents)
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 26, anim: 'idle', expression: 'gene' },
        { id: 'pink', avatar: PINK, x: 64, flip: true, anim: 'idle', expression: 'blase', blink: true },
        { id: 'blue', avatar: BLUE, x: 84, flip: true, anim: 'idle', expression: 'blase', blink: true },
      ],
      bubbles: [
        { from: 'pink', text: '...' },
        { from: 'blue', text: '...' },
      ],
    },

    // SCÈNE 4 — Le héros se racle la gorge, gêné, puis reprend son air fier
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 26, anim: 'idle', expression: 'gene', transitionTo: { when: 'speak', expression: 'fier' } },
        { id: 'pink', avatar: PINK, x: 64, flip: true, anim: 'idle', expression: 'blase' },
        { id: 'blue', avatar: BLUE, x: 84, flip: true, anim: 'idle', expression: 'blase' },
      ],
      bubbles: [
        { from: 'hero', text: 'Bon... de toute façon je suis aussi le meilleur à Floor is Lava. Ça tout le monde le sait.' },
      ],
    },

    // SCÈNE 5 — Plateau Floor is Lava, le héros fier puis ferme les yeux
    {
      decor: 'lava',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'fier', transitionTo: { when: 'after', eyesClosed: true, delay: 350 } },
      ],
      bubbles: [
        { from: 'hero', text: 'La lave c\'est pour les débutants. Moi je ferme même les yeux.' },
      ],
    },

    // SCÈNE 6 — La lave a avancé, le héros choqué tombe puis devient triste
    {
      decor: 'lava',
      lavaAdvanced: true,
      effects: ['fire'],
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'fall', expression: 'choque', transitionTo: { when: 'after', expression: 'triste', delay: 150 } },
      ],
      bubbles: [
        { from: 'hero', text: '...ah.' },
      ],
    },

    // SCÈNE 7 — Écran de défaite, le héros tout noir de brûlé hausse les épaules
    {
      decor: 'lava-defeat',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'shrug', expression: 'gene', burnt: true },
      ],
      bubbles: [
        { from: 'hero', text: 'C\'est le skin qui m\'a distrait.' },
      ],
    },
  ],
}

export default episode1
