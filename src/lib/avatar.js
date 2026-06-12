// ============================================================
//  Catalogue de personnalisation de l'avatar (bonhomme Fall Guys)
//  Source de vérité partagée par la page Avatar et le composant FallGuy.
//  Tous les accessoires sont DESSINÉS en SVG (voir components/avatarParts.jsx).
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

// 5 catégories, 20 accessoires chacune (5 gratuits + 15 payants).
// Chaque item = { id, label, price }. Le rendu visuel est dans avatarParts.jsx
// (la clé = l'id de l'item).
export const CATEGORIES = [
  {
    id: 'hat',
    label: 'Chapeau',
    emoji: '🎩',
    items: [
      { id: 'cap', label: 'Casquette', price: 0 },
      { id: 'beanie', label: 'Bonnet', price: 0 },
      { id: 'beret', label: 'Béret', price: 0 },
      { id: 'bandana', label: 'Bandana', price: 0 },
      { id: 'party', label: 'Cotillon', price: 0 },
      { id: 'grad', label: 'Diplôme', price: 5 },
      { id: 'straw', label: 'Paille', price: 6 },
      { id: 'cowboy', label: 'Cowboy', price: 8 },
      { id: 'chef', label: 'Chef', price: 8 },
      { id: 'helmet', label: 'Casque vélo', price: 10 },
      { id: 'sombrero', label: 'Sombrero', price: 12 },
      { id: 'witch', label: 'Sorcière', price: 14 },
      { id: 'crown', label: 'Couronne', price: 15 },
      { id: 'tophat', label: 'Haut-de-forme', price: 15 },
      { id: 'pirate', label: 'Pirate', price: 16 },
      { id: 'flower', label: 'Fleurs', price: 18 },
      { id: 'santa', label: 'Bonnet de Noël', price: 18 },
      { id: 'police', label: 'Képi', price: 20 },
      { id: 'viking', label: 'Viking', price: 22 },
      { id: 'halo', label: 'Auréole', price: 25 },
    ],
  },
  {
    id: 'glasses',
    label: 'Lunettes',
    emoji: '🕶️',
    items: [
      { id: 'round', label: 'Rondes', price: 0 },
      { id: 'square', label: 'Carrées', price: 0 },
      { id: 'sun', label: 'Soleil', price: 0 },
      { id: 'nerd', label: 'Nerd', price: 0 },
      { id: 'eyemask', label: 'Loup', price: 0 },
      { id: 'star', label: 'Étoiles', price: 6 },
      { id: 'heart', label: 'Cœurs', price: 8 },
      { id: 'aviator', label: 'Aviateur', price: 8 },
      { id: 'cateye', label: 'Œil de chat', price: 10 },
      { id: 'cyber', label: 'Lunettes 3D', price: 10 },
      { id: 'sportband', label: 'Bandeau sport', price: 10 },
      { id: 'pixel', label: 'Pixel', price: 12 },
      { id: 'rainbow', label: 'Arc-en-ciel', price: 12 },
      { id: 'monocle', label: 'Monocle', price: 12 },
      { id: 'swim', label: 'Natation', price: 12 },
      { id: 'ski', label: 'Masque de ski', price: 14 },
      { id: 'halfmoon', label: 'Demi-lune', price: 14 },
      { id: 'led', label: 'LED', price: 18 },
      { id: 'diamond', label: 'Diamant', price: 20 },
      { id: 'gold', label: 'Dorées', price: 22 },
    ],
  },
  {
    id: 'hair',
    label: 'Cheveux',
    emoji: '💇',
    items: [
      { id: 'short', label: 'Courts', price: 0 },
      { id: 'spiky', label: 'Piquants', price: 0 },
      { id: 'side', label: 'Mèche', price: 0 },
      { id: 'bowl', label: 'Au bol', price: 0 },
      { id: 'fringe', label: 'Frange', price: 0 },
      { id: 'buzz', label: 'Rasés', price: 5 },
      { id: 'wavy', label: 'Ondulés', price: 6 },
      { id: 'curly', label: 'Bouclés', price: 8 },
      { id: 'ponytail', label: 'Queue de cheval', price: 8 },
      { id: 'pigtails', label: 'Couettes', price: 10 },
      { id: 'bun', label: 'Chignon', price: 10 },
      { id: 'braid', label: 'Tresse', price: 12 },
      { id: 'mohawk', label: 'Crête', price: 12 },
      { id: 'afro', label: 'Afro', price: 14 },
      { id: 'topknot', label: 'Macaron', price: 14 },
      { id: 'dreads', label: 'Dreads', price: 16 },
      { id: 'emo', label: 'Emo', price: 16 },
      { id: 'spacebuns', label: 'Macarons', price: 18 },
      { id: 'long', label: 'Longs', price: 18 },
      { id: 'rainbow', label: 'Arc-en-ciel', price: 25 },
    ],
  },
  {
    id: 'sport',
    label: 'Sport',
    emoji: '⚽',
    items: [
      { id: 'foot', label: 'Football', price: 0 },
      { id: 'basket', label: 'Basket', price: 0 },
      { id: 'tennis', label: 'Tennis', price: 0 },
      { id: 'pingpong', label: 'Ping-pong', price: 0 },
      { id: 'volley', label: 'Volley', price: 0 },
      { id: 'baseball', label: 'Baseball', price: 6 },
      { id: 'rugby', label: 'Rugby', price: 8 },
      { id: 'golf', label: 'Golf', price: 8 },
      { id: 'bowling', label: 'Bowling', price: 10 },
      { id: 'dumbbell', label: 'Haltère', price: 10 },
      { id: 'boxe', label: 'Boxe', price: 12 },
      { id: 'hockey', label: 'Hockey', price: 12 },
      { id: 'medal', label: 'Médaille', price: 14 },
      { id: 'skate', label: 'Skateboard', price: 15 },
      { id: 'surf', label: 'Surf', price: 16 },
      { id: 'ski', label: 'Ski', price: 16 },
      { id: 'scooter', label: 'Trottinette', price: 18 },
      { id: 'bike', label: 'Vélo', price: 20 },
      { id: 'cup', label: 'Coupe', price: 22 },
      { id: 'trophy', label: 'Trophée', price: 25 },
    ],
  },
  {
    id: 'animal',
    label: 'Animaux',
    emoji: '🐾',
    items: [
      { id: 'cat', label: 'Chat', price: 0 },
      { id: 'dog', label: 'Chien', price: 0 },
      { id: 'bird', label: 'Oiseau', price: 0 },
      { id: 'fish', label: 'Poisson', price: 0 },
      { id: 'rabbit', label: 'Lapin', price: 0 },
      { id: 'frog', label: 'Grenouille', price: 6 },
      { id: 'turtle', label: 'Tortue', price: 8 },
      { id: 'fox', label: 'Renard', price: 8 },
      { id: 'panda', label: 'Panda', price: 10 },
      { id: 'penguin', label: 'Pingouin', price: 10 },
      { id: 'hamster', label: 'Hamster', price: 10 },
      { id: 'bee', label: 'Abeille', price: 12 },
      { id: 'butterfly', label: 'Papillon', price: 12 },
      { id: 'ladybug', label: 'Coccinelle', price: 12 },
      { id: 'owl', label: 'Hibou', price: 14 },
      { id: 'parrot', label: 'Perroquet', price: 15 },
      { id: 'snake', label: 'Serpent', price: 15 },
      { id: 'dino', label: 'Dino', price: 18 },
      { id: 'dragon', label: 'Dragon', price: 22 },
      { id: 'unicorn', label: 'Licorne', price: 25 },
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
  animal: null,
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
