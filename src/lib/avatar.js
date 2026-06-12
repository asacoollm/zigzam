// ============================================================
//  Catalogue de personnalisation de l'avatar (bonhomme Fall Guys)
//  Source de vérité partagée par la page Avatar et le composant FallGuy.
// ============================================================

// 8 couleurs de corps (palette Zigzam + rouge/jaune/blanc)
export const BODY_COLORS = [
  { id: 'rose', value: '#ff4d8d', label: 'Rose' },
  { id: 'orange', value: '#ff8c42', label: 'Orange' },
  { id: 'jaune', value: '#fbbf24', label: 'Jaune' },
  { id: 'vert', value: '#3dd68c', label: 'Vert' },
  { id: 'bleu', value: '#00bfff', label: 'Bleu' },
  { id: 'violet', value: '#7c3aff', label: 'Violet' },
  { id: 'rouge', value: '#ef4444', label: 'Rouge' },
  { id: 'blanc', value: '#f1f1f7', label: 'Blanc' },
]

// 4 catégories d'accessoires. Chacune : 3 gratuits (price 0) + 4 payants (gemmes).
// `glyph` sert d'icône dans le sélecteur ; le rendu sur le bonhomme est géré par FallGuy.
export const CATEGORIES = [
  {
    id: 'hat',
    label: 'Chapeau',
    emoji: '🎩',
    items: [
      { id: 'cap', label: 'Casquette', glyph: '🧢', price: 0 },
      { id: 'party', label: 'Cotillon', glyph: '🎉', price: 0 },
      { id: 'grad', label: 'Diplôme', glyph: '🎓', price: 0 },
      { id: 'tophat', label: 'Haut-de-forme', glyph: '🎩', price: 10 },
      { id: 'straw', label: 'Chapeau de paille', glyph: '👒', price: 12 },
      { id: 'crown', label: 'Couronne', glyph: '👑', price: 15 },
      { id: 'halo', label: 'Auréole', glyph: '😇', price: 20 },
    ],
  },
  {
    id: 'glasses',
    label: 'Lunettes',
    emoji: '🕶️',
    items: [
      { id: 'round', label: 'Rondes', glyph: '👓', price: 0 },
      { id: 'square', label: 'Carrées', glyph: '🔲', price: 0 },
      { id: 'sun', label: 'Soleil', glyph: '🕶️', price: 0 },
      { id: 'star', label: 'Étoiles', glyph: '⭐', price: 10 },
      { id: 'heart', label: 'Cœurs', glyph: '❤️', price: 12 },
      { id: 'ski', label: 'Masque de ski', glyph: '🥽', price: 15 },
      { id: 'cyber', label: 'Lunettes 3D', glyph: '🎬', price: 18 },
    ],
  },
  {
    id: 'hair',
    label: 'Cheveux',
    emoji: '💇',
    items: [
      { id: 'spiky', label: 'Piquants', glyph: '🦔', price: 0 },
      { id: 'side', label: 'Mèche', glyph: '💇', price: 0 },
      { id: 'bowl', label: 'Au bol', glyph: '🍄', price: 0 },
      { id: 'mohawk', label: 'Crête', glyph: '🔥', price: 12 },
      { id: 'afro', label: 'Afro', glyph: '☁️', price: 15 },
      { id: 'long', label: 'Cheveux longs', glyph: '🌾', price: 18 },
      { id: 'rainbow', label: 'Arc-en-ciel', glyph: '🌈', price: 25 },
    ],
  },
  {
    id: 'sport',
    label: 'Sport',
    emoji: '⚽',
    items: [
      { id: 'foot', label: 'Football', glyph: '⚽', price: 0 },
      { id: 'basket', label: 'Basket', glyph: '🏀', price: 0 },
      { id: 'tennis', label: 'Tennis', glyph: '🎾', price: 0 },
      { id: 'pingpong', label: 'Ping-pong', glyph: '🏓', price: 8 },
      { id: 'skate', label: 'Skate', glyph: '🛹', price: 10 },
      { id: 'boxe', label: 'Boxe', glyph: '🥊', price: 12 },
      { id: 'medal', label: 'Médaille', glyph: '🏅', price: 20 },
    ],
  },
]

// Avatar par défaut (corps violet, aucun accessoire).
export const DEFAULT_AVATAR = {
  color: '#7c3aff',
  hat: null,
  glasses: null,
  hair: null,
  sport: null,
  owned: [],
}

// Clé d'un accessoire payant dans la liste `owned`, ex : "hat:crown".
export function accKey(categoryId, itemId) {
  return `${categoryId}:${itemId}`
}

// Fusionne un avatar brut (depuis Supabase / localStorage) avec les défauts.
export function normalizeAvatar(raw) {
  return { ...DEFAULT_AVATAR, ...(raw || {}), owned: raw?.owned ?? [] }
}

// Retrouve un item du catalogue par catégorie + id.
export function getItem(categoryId, itemId) {
  if (!itemId) return null
  const cat = CATEGORIES.find((c) => c.id === categoryId)
  return cat?.items.find((i) => i.id === itemId) ?? null
}

// Un accessoire est-il débloqué ? (gratuit ou déjà acheté)
export function isUnlocked(avatar, categoryId, item) {
  return item.price === 0 || (avatar.owned ?? []).includes(accKey(categoryId, item.id))
}
