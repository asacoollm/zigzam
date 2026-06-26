// ============================================================
//  Série Zigzam — Épisode 4 : « Patator »
// ============================================================
//  Même format que episode1.js (voir la doc en tête de ce fichier).
//  Nouveautés utilisées ici :
//   - cast[].kind: 'patator' → rend la patate (composant Patator) au lieu d'un
//     bonhomme. Expressions : 'sparkle' (yeux qui brillent ✨), blink, anim 'wave'.
//   - cast[].bottom : remonte un perso (ex : Patator « tenue contre le ventre »).
//   - expression 'vexe' (contrarié/boudeur), ajoutée à FallGuy.
// ============================================================

// Bonhommes sans aucun accessoire (juste une couleur).
const ROSE = { color: 'rose', hat: null, glasses: null, hair: null, sport: null, animal: null, face: null }
const BLEU = { color: 'bleu', hat: null, glasses: null, hair: null, sport: null, animal: null, face: null }

const episode4 = {
  id: 'episode4',
  number: 4,
  title: 'Patator',
  emoji: '🥔',
  duration: '~2 min',
  // Publié : visible par tout le monde.
  publie: true,
  synopsis: 'Une mystérieuse patate aux grands yeux mignons apparaît sur Zigzam. Le héros l\'adopte aussitôt... et compte bien la protéger de tout le monde.',
  accent: 'var(--orange)',
  thumbnailDecor: 'neutral',

  scenes: [
    // SCÈNE 1 — Le héros se balade tranquillement, blasé. Journée normale.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'walk', expression: 'blase' },
      ],
      bubbles: [
        { from: 'hero', text: 'Encore une journée normale sur Zigzam...' },
      ],
    },

    // SCÈNE 2 — Une patate apparaît par terre. Le héros s'arrête, se penche, choqué.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 42, anim: 'idle', expression: 'choque', pose: 'lean' },
        { id: 'patator', kind: 'patator', x: 62, scale: 0.42 },
      ],
      bubbles: [
        { from: 'hero', text: '...c\'est quoi ça ?' },
      ],
    },

    // SCÈNE 3 — Gros plan sur Patator (héros hors champ). Elle cligne lentement
    // des yeux, l'air innocent. Pas de bulle.
    {
      decor: 'neutral',
      cast: [
        { id: 'patator', kind: 'patator', x: 50, scale: 0.95, blink: true },
      ],
      bubbles: [],
    },

    // SCÈNE 4 — Le héros prend Patator dans ses bras (contre son ventre), fier.
    // Patator a les yeux qui brillent de bonheur ✨.
    {
      decor: 'neutral',
      cast: [
        { id: 'hero', hero: true, x: 50, anim: 'idle', expression: 'fier' },
        { id: 'patator', kind: 'patator', x: 54, scale: 0.36, bottom: 30, expression: 'sparkle' },
      ],
      bubbles: [
        { from: 'hero', text: 'Je t\'adopte. Tu t\'appelles Patator.' },
      ],
    },

    // SCÈNE 5 — Rose et Bleu arrivent et regardent Patator, choqués. Le héros,
    // vexé, défend sa patate.
    {
      decor: 'neutral',
      cast: [
        { id: 'rose', avatar: ROSE, x: 24, anim: 'idle', expression: 'choque' },
        { id: 'bleu', avatar: BLEU, x: 38, anim: 'idle', expression: 'choque' },
        { id: 'hero', hero: true, x: 68, anim: 'idle', expression: 'vexe' },
        { id: 'patator', kind: 'patator', x: 73, scale: 0.34, bottom: 30 },
      ],
      bubbles: [
        { from: 'rose', text: 'C\'est quoi ce truc ?' },
        { from: 'hero', text: 'C\'est MA patate.' },
      ],
    },

    // SCÈNE 6 — Rose et Bleu se rapprochent et chuchotent, l'air moqueur. Le
    // héros les surveille en serrant Patator.
    {
      decor: 'neutral',
      cast: [
        { id: 'rose', avatar: ROSE, x: 30, anim: 'idle', expression: 'moque', flip: true },
        { id: 'bleu', avatar: BLEU, x: 42, anim: 'idle', expression: 'moque' },
        { id: 'hero', hero: true, x: 70, anim: 'idle', expression: 'blase' },
        { id: 'patator', kind: 'patator', x: 75, scale: 0.34, bottom: 30 },
      ],
      bubbles: [
        { from: 'rose', text: '...psst psst psst...' },
      ],
    },

    // SCÈNE 7 — Rose et Bleu tendent les bras vers Patator, le héros les
    // intercepte du regard, blasé. Les deux bonhommes sont gênés.
    {
      decor: 'neutral',
      cast: [
        { id: 'rose', avatar: ROSE, x: 30, anim: 'idle', expression: 'gene' },
        { id: 'bleu', avatar: BLEU, x: 44, anim: 'idle', expression: 'gene' },
        { id: 'hero', hero: true, x: 70, anim: 'idle', expression: 'blase' },
        { id: 'patator', kind: 'patator', x: 75, scale: 0.34, bottom: 30 },
      ],
      bubbles: [
        { from: 'rose', text: 'On voulait juste... dire bonjour à la patate.' },
      ],
    },

    // SCÈNE 8 — Le héros tourne le dos aux deux bonhommes en serrant très fort
    // Patator, fier. Patator leur fait un petit coucou derrière le dos du héros 😂.
    {
      decor: 'neutral',
      cast: [
        { id: 'rose', avatar: ROSE, x: 20, anim: 'idle', expression: 'gene' },
        { id: 'bleu', avatar: BLEU, x: 33, anim: 'idle', expression: 'gene' },
        { id: 'patator', kind: 'patator', x: 50, scale: 0.34, bottom: 28, anim: 'wave' },
        { id: 'hero', hero: true, x: 62, anim: 'idle', expression: 'fier', flip: true },
      ],
      bubbles: [
        { from: 'hero', text: 'Personne ne touchera à Patator.' },
      ],
    },
  ],
}

export default episode4
