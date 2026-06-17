// ============================================================
//  Série Zigzam — Épisode 2 : « Le Million de Donuts »
// ============================================================
//  Même format que episode1.js (voir la doc en tête de ce fichier).
//  Décors utilisés ici : 'dashboard' (avec `counter`), 'actus' (avec
//  `views`), 'lava'. Champs de scène spéciaux :
//   - counter : nombre de 🍩 affiché sur le décor dashboard
//   - views   : nombre de vues affiché sur le décor actus
//   - notif   : texte d'une notification qui tombe du ciel
//   - effects : ['fire'] | ['confetti']
// ============================================================

const episode2 = {
  id: 'episode2',
  number: 2,
  title: 'Le Million de Donuts',
  emoji: '🍩',
  duration: '~2 min',
  // Publié : visible par tout le monde.
  publie: true,
  synopsis: 'Notre héros n\'a que 10 donuts et décide qu\'il lui faut, sans plus attendre, un million.',
  accent: 'var(--vert)',
  thumbnailDecor: 'avatar',

  scenes: [
    // SCÈNE 1 — Dashboard, le héros regarde son maigre compteur
    {
      decor: 'dashboard',
      counter: 10,
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'choque' },
      ],
      bubbles: [
        { from: 'hero', text: '10 donuts... c\'est une honte. Il me faut UN MILLION.' },
      ],
    },

    // SCÈNE 2 — Page Actualités, le héros poste frénétiquement
    {
      decor: 'actus',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'fier' },
      ],
      bubbles: [
        { from: 'hero', text: 'Mon actu va faire des milliers de vues. Je vais être riche.' },
      ],
    },

    // SCÈNE 3 — Même décor, 0 vue, le héros attend, blasé
    {
      decor: 'actus',
      views: 0,
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'blase' },
      ],
      bubbles: [
        { from: 'hero', text: '...' },
      ],
    },

    // SCÈNE 4 — Plateau Floor is Lava, le héros très confiant
    {
      decor: 'lava',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'fier' },
      ],
      bubbles: [
        { from: 'hero', text: 'OK plan B. Floor is Lava. Je suis imbattable.' },
      ],
    },

    // SCÈNE 5 — La lave arrive, le héros tombe immédiatement
    {
      decor: 'lava',
      lavaAdvanced: true,
      effects: ['fire'],
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'fall', expression: 'choque' },
      ],
      bubbles: [
        { from: 'hero', text: '...' },
      ],
    },

    // SCÈNE 6 — Dashboard, 1 donut, le héros s'effondre
    {
      decor: 'dashboard',
      counter: 1,
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'collapse', expression: 'triste' },
      ],
      bubbles: [
        { from: 'hero', text: 'Je suis ruiné.' },
      ],
    },

    // SCÈNE 7 — Une énorme notification tombe du ciel
    {
      decor: 'dashboard',
      counter: 1,
      notif: '+1 000 000 🍩 — Cadeau d\'Asacool !',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: null, expression: 'choque' },
      ],
      bubbles: [
        { from: 'hero', text: '...' },
      ],
    },

    // SCÈNE 8 — Dashboard, 1 000 010 donuts, le héros saute de joie
    {
      decor: 'dashboard',
      counter: 1000010,
      effects: ['confetti'],
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'jumploop', expression: 'fier' },
      ],
      bubbles: [
        { from: 'hero', text: 'JE SUIS RICHE !!!' },
      ],
    },
  ],
}

export default episode2
