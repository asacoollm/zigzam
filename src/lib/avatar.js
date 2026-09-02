// ============================================================
//  Catalogue de personnalisation de l'avatar (bonhomme Fall Guys)
//  Source de vérité partagée par la page Avatar et FallGuy / avatarParts.
//  Tout est dessiné en SVG. Prix entre 1 et 5 gemmes.
// ============================================================

// Couleurs de corps "unies" : id -> hex
export const SOLID_COLORS = {
  rose: '#ff4d8d', violet: '#7c3aff', bleu: '#00bfff', vert: '#3dd68c',
  orange: '#ff8c42', jaune: '#fbbf24', rouge: '#ef4444', blanc: '#f1f1f7',
  noir: '#3a3357', turquoise: '#22d3ee',
}
// Couleurs "spéciales" (dégradés / motifs / effets) rendues via un <def> dans FallGuy.
export const SPECIAL_COLORS = [
  'rainbow', 'sunset', 'galaxy', 'ocean',
  'stars', 'dots', 'stripes', 'camo', 'flames',
  'gold', 'silver', 'holo',
  // 🦕 Jurassic Web (exclusifs de saison)
  'jcamo', 'jtrexskin', 'jdinogold', 'jraptorblue',
  // 🏰 Zigzamland Paris (exclusifs de saison)
  'dbleugenie', 'dorpicsou', 'drougedonald', 'dmauveursula', 'droseaurore',
  'dvertpeter', 'dfantasia', 'darcenciel', 'ddalmatiencolor', 'drouxariel',
]

// Résout une couleur (id ou hex legacy) en remplissage SVG.
export function resolveColor(colorId) {
  if (typeof colorId === 'string' && colorId.startsWith('#')) return { fill: colorId }
  if (SOLID_COLORS[colorId]) return { fill: SOLID_COLORS[colorId] }
  if (SPECIAL_COLORS.includes(colorId)) return { fill: `url(#body-${colorId})`, special: true }
  return { fill: SOLID_COLORS.violet }
}

export const CATEGORIES = [
  {
    id: 'color', label: 'Couleur', emoji: '🎨',
    items: [
      { id: 'rose', label: 'Rose', price: 0 },
      { id: 'violet', label: 'Violet', price: 0 },
      { id: 'bleu', label: 'Bleu', price: 0 },
      { id: 'vert', label: 'Vert', price: 0 },
      { id: 'orange', label: 'Orange', price: 1 },
      { id: 'jaune', label: 'Jaune', price: 1 },
      { id: 'rouge', label: 'Rouge', price: 1 },
      { id: 'blanc', label: 'Blanc', price: 1 },
      { id: 'noir', label: 'Noir', price: 1 },
      { id: 'turquoise', label: 'Turquoise', price: 2 },
      { id: 'ocean', label: 'Océan', price: 3 },
      { id: 'sunset', label: 'Coucher de soleil', price: 3 },
      { id: 'dots', label: 'Pois', price: 3 },
      { id: 'stripes', label: 'Rayures', price: 3 },
      { id: 'rainbow', label: 'Arc-en-ciel', price: 4 },
      { id: 'galaxy', label: 'Galaxie', price: 4 },
      { id: 'stars', label: 'Étoiles', price: 4 },
      { id: 'camo', label: 'Camouflage', price: 4 },
      { id: 'flames', label: 'Flammes', price: 4 },
      { id: 'silver', label: 'Argenté', price: 4 },
      { id: 'gold', label: 'Doré brillant', price: 5 },
      { id: 'holo', label: 'Holographique', price: 5 },
      { id: 'jcamo', label: 'Camouflage Jungle', price: 10, saison: 'jurassic' },
      { id: 'jtrexskin', label: 'Écailles T-Rex', price: 12, saison: 'jurassic' },
      { id: 'jdinogold', label: 'Dino Doré', price: 12, saison: 'jurassic' },
      { id: 'jraptorblue', label: 'Raptor Bleu', price: 13, saison: 'jurassic' },
      { id: 'drougedonald', label: 'Rouge Donald', price: 10, saison: 'disney' },
      { id: 'droseaurore', label: 'Rose Aurore', price: 10, saison: 'disney' },
      { id: 'dvertpeter', label: 'Vert Peter Pan', price: 10, saison: 'disney' },
      { id: 'drouxariel', label: 'Roux Ariel', price: 11, saison: 'disney' },
      { id: 'dbleugenie', label: 'Bleu Génie', price: 12, saison: 'disney' },
      { id: 'dmauveursula', label: 'Mauve Ursula', price: 12, saison: 'disney' },
      { id: 'ddalmatiencolor', label: 'Noir & Blanc Dalmatien', price: 13, saison: 'disney' },
      { id: 'dorpicsou', label: 'Or Picsou', price: 14, saison: 'disney' },
      { id: 'dfantasia', label: 'Bleu Nuit Fantasia', price: 14, saison: 'disney' },
      { id: 'darcenciel', label: 'Arc-en-ciel Magique', price: 15, saison: 'disney' },
    ],
  },
  {
    id: 'hat', label: 'Chapeau', emoji: '🎩',
    items: [
      { id: 'cap', label: 'Casquette', price: 0 },
      { id: 'beanie', label: 'Bonnet', price: 0 },
      { id: 'beret', label: 'Béret', price: 0 },
      { id: 'bandana', label: 'Bandana', price: 0 },
      { id: 'party', label: 'Chapeau de fête', price: 0 },
      { id: 'grad', label: 'Diplôme', price: 1 },
      { id: 'straw', label: 'Paille', price: 1 },
      { id: 'chef', label: 'Chef', price: 2 },
      { id: 'helmet', label: 'Casque vélo', price: 2 },
      { id: 'police', label: 'Képi', price: 2 },
      { id: 'santa', label: 'Bonnet de Noël', price: 2 },
      { id: 'flower', label: 'Fleurs', price: 2 },
      { id: 'cowboy', label: 'Cowboy géant', price: 3 },
      { id: 'sombrero', label: 'Sombrero', price: 3 },
      { id: 'cactus', label: 'Cactus', price: 3 },
      { id: 'pizza', label: 'Pizza', price: 3 },
      { id: 'witch', label: 'Sorcière', price: 4 },
      { id: 'pirate', label: 'Pirate', price: 4 },
      { id: 'viking', label: 'Viking', price: 4 },
      { id: 'tophat', label: 'Haut-de-forme', price: 4 },
      { id: 'astronaut', label: 'Astronaute', price: 5 },
      { id: 'crown', label: 'Couronne royale', price: 5 },
      { id: 'halo', label: 'Auréole', price: 5 },
      { id: 'jtrex', label: 'Capuche T-Rex', price: 10, saison: 'jurassic' },
      { id: 'jtrike', label: 'Casque Tricératops', price: 9, saison: 'jurassic' },
      { id: 'jstego', label: 'Couronne Stégosaure', price: 10, saison: 'jurassic' },
      { id: 'jptero', label: 'Chapeau Ptérosaure', price: 11, saison: 'jurassic' },
      { id: 'dnoeud', label: 'Nœud Papillon Picsou', price: 8, saison: 'disney' },
      { id: 'driri', label: 'Casquette Riri', price: 9, saison: 'disney' },
      { id: 'dminnie', label: 'Bandana Minnie', price: 10, saison: 'disney' },
      { id: 'ddonald', label: 'Casque de Donald', price: 10, saison: 'disney' },
      { id: 'dpicsou', label: 'Chapeau Picsou', price: 11, saison: 'disney' },
      { id: 'dtigrou', label: 'Bonnet Tigrou', price: 11, saison: 'disney' },
      { id: 'dclochette', label: 'Chignon Clochette', price: 11, saison: 'disney' },
      { id: 'dears', label: 'Oreilles Mickey', price: 12, saison: 'disney' },
      { id: 'dcendrillon', label: 'Couronne Cendrillon', price: 12, saison: 'disney' },
      { id: 'dgenie', label: 'Turban Génie', price: 12, saison: 'disney' },
      { id: 'dsorcier', label: 'Chapeau Sorcier', price: 13, saison: 'disney' },
      { id: 'dstitch', label: 'Bob Stitch', price: 13, saison: 'disney' },
      { id: 'dlionking', label: 'Couronne Roi Lion', price: 14, saison: 'disney' },
    ],
  },
  {
    id: 'glasses', label: 'Lunettes', emoji: '🕶️',
    items: [
      { id: 'round', label: 'Rondes', price: 0 },
      { id: 'square', label: 'Carrées', price: 0 },
      { id: 'sun', label: 'Soleil', price: 0 },
      { id: 'nerd', label: 'Nerd', price: 0 },
      { id: 'eyemask', label: 'Loup', price: 0 },
      { id: 'sportband', label: 'Bandeau', price: 1 },
      { id: 'halfmoon', label: 'Demi-lune', price: 1 },
      { id: 'star', label: 'Étoiles', price: 2 },
      { id: 'heart', label: 'Cœurs roses', price: 2 },
      { id: 'aviator', label: 'Aviateur', price: 2 },
      { id: 'swim', label: 'Plongée', price: 2 },
      { id: 'cateye', label: 'Œil de chat', price: 3 },
      { id: 'cyber', label: 'Lunettes 3D', price: 3 },
      { id: 'pixel', label: 'Pixel', price: 3 },
      { id: 'monocle', label: 'Monocle', price: 3 },
      { id: 'ski', label: 'Masque de ski', price: 3 },
      { id: 'rainbow', label: 'Arc-en-ciel', price: 4 },
      { id: 'gold', label: 'Dorées', price: 4 },
      { id: 'led', label: 'LED', price: 4 },
      { id: 'diamond', label: 'Diamant', price: 5 },
      { id: 'stargiant', label: 'Étoiles géantes', price: 5 },
      { id: 'laser', label: 'Laser', price: 5 },
    ],
  },
  {
    id: 'hair', label: 'Cheveux', emoji: '💇',
    items: [
      { id: 'short', label: 'Courts', price: 0 },
      { id: 'spiky', label: 'Piquants', price: 0 },
      { id: 'side', label: 'Mèche', price: 0 },
      { id: 'bowl', label: 'Au bol', price: 0 },
      { id: 'fringe', label: 'Frange', price: 0 },
      { id: 'buzz', label: 'Rasés', price: 1 },
      { id: 'wavy', label: 'Ondulés', price: 1 },
      { id: 'curly', label: 'Bouclés', price: 2 },
      { id: 'ponytail', label: 'Queue de cheval', price: 2 },
      { id: 'pigtails', label: 'Couettes', price: 2 },
      { id: 'bun', label: 'Chignon', price: 2 },
      { id: 'fro', label: 'Mini afro', price: 2 },
      { id: 'braid', label: 'Tresse', price: 3 },
      { id: 'mohawk', label: 'Crête', price: 3 },
      { id: 'topknot', label: 'Macaron', price: 3 },
      { id: 'emo', label: 'Emo', price: 3 },
      { id: 'dreads', label: 'Dreads', price: 4 },
      { id: 'spacebuns', label: 'Macarons', price: 4 },
      { id: 'afro', label: 'Afro géant', price: 4 },
      { id: 'long', label: 'Longs', price: 4 },
      { id: 'rainbow', label: 'Arc-en-ciel', price: 5 },
      { id: 'jtail', label: 'Queue de Dino', price: 9, saison: 'jurassic' },
      { id: 'jdilo', label: 'Crête de Dilophosaure', price: 8, saison: 'jurassic' },
      { id: 'jdreads', label: 'Dreadlocks Dino', price: 10, saison: 'jurassic' },
      { id: 'dmulan', label: 'Coupe Mulan', price: 9, saison: 'disney' },
      { id: 'dbelle', label: 'Frange Belle', price: 9, saison: 'disney' },
      { id: 'dvaiana', label: 'Cheveux Vaiana', price: 10, saison: 'disney' },
      { id: 'dtiana', label: 'Chignon Tiana', price: 10, saison: 'disney' },
      { id: 'delsa', label: 'Tresse Elsa', price: 11, saison: 'disney' },
      { id: 'dariel', label: 'Cheveux Ariel', price: 11, saison: 'disney' },
      { id: 'dmirabel', label: 'Afro Encanto', price: 11, saison: 'disney' },
      { id: 'draiponce', label: 'Tresses Raiponce', price: 12, saison: 'disney' },
      { id: 'dcruella', label: 'Perruque Cruella', price: 12, saison: 'disney' },
    ],
  },
  {
    id: 'sport', label: 'Sport', emoji: '⚽',
    items: [
      { id: 'foot', label: 'Football', price: 0 },
      { id: 'basket', label: 'Basket', price: 0 },
      { id: 'tennis', label: 'Tennis', price: 0 },
      { id: 'pingpong', label: 'Ping-pong', price: 0 },
      { id: 'volley', label: 'Volley', price: 0 },
      { id: 'baseball', label: 'Baseball', price: 1 },
      { id: 'rugby', label: 'Rugby', price: 1 },
      { id: 'golf', label: 'Golf', price: 2 },
      { id: 'bowling', label: 'Bowling', price: 2 },
      { id: 'dumbbell', label: 'Haltère', price: 2 },
      { id: 'boxe', label: 'Boxe', price: 2 },
      { id: 'hockey', label: 'Hockey', price: 3 },
      { id: 'medal', label: 'Médaille', price: 3 },
      { id: 'skate', label: 'Skateboard', price: 3 },
      { id: 'ski', label: 'Ski', price: 3 },
      { id: 'shield', label: 'Bouclier', price: 4 },
      { id: 'surf', label: 'Planche de surf', price: 4 },
      { id: 'scooter', label: 'Trottinette', price: 4 },
      { id: 'bike', label: 'Vélo', price: 4 },
      { id: 'guitar', label: 'Guitare', price: 5 },
      { id: 'lightsaber', label: 'Épée laser', price: 5 },
      { id: 'trophy', label: 'Trophée', price: 5 },
      { id: 'dbalai', label: 'Balai Sorcier', price: 12, saison: 'disney' },
      { id: 'dtrident', label: 'Trident Ariel', price: 14, saison: 'disney' },
      { id: 'dexcalibur', label: 'Épée Excalibur', price: 15, saison: 'disney' },
    ],
  },
  {
    id: 'animal', label: 'Animaux', emoji: '🐾',
    items: [
      { id: 'cat', label: 'Chat', price: 0 },
      { id: 'dog', label: 'Chien', price: 0 },
      { id: 'bird', label: 'Oiseau', price: 0 },
      { id: 'fish', label: 'Poisson', price: 0 },
      { id: 'rabbit', label: 'Lapin', price: 0 },
      { id: 'frog', label: 'Grenouille', price: 1 },
      { id: 'turtle', label: 'Tortue', price: 1 },
      { id: 'hamster', label: 'Hamster', price: 2 },
      { id: 'fox', label: 'Renard', price: 2 },
      { id: 'bee', label: 'Abeille', price: 2 },
      { id: 'ladybug', label: 'Coccinelle', price: 2 },
      { id: 'butterfly', label: 'Papillon', price: 2 },
      { id: 'panda', label: 'Panda', price: 3 },
      { id: 'penguin', label: 'Pingouin', price: 3 },
      { id: 'owl', label: 'Hibou', price: 3 },
      { id: 'cow', label: 'Vache', price: 3 },
      { id: 'ghost', label: 'Fantôme', price: 3 },
      { id: 'snake', label: 'Serpent', price: 3 },
      { id: 'parrot', label: 'Perroquet', price: 4 },
      { id: 'shark', label: 'Requin', price: 4 },
      { id: 'dino', label: 'Dino', price: 4 },
      { id: 'alien', label: 'Alien', price: 4 },
      { id: 'dragon', label: 'Dragon', price: 5 },
      { id: 'unicorn', label: 'Licorne', price: 5 },
      { id: 'jraptors', label: 'Meute de Raptors', price: 14, saison: 'jurassic' },
      { id: 'jbrachio', label: 'Bébé Brachiosaure', price: 15, saison: 'jurassic' },
      { id: 'jtrexbuddy', label: 'T-Rex Compagnon', price: 15, saison: 'jurassic' },
      { id: 'jpterofly', label: 'Ptérosaure Volant', price: 12, saison: 'jurassic' },
      { id: 'dheimlich', label: 'Heimlich', price: 12, saison: 'disney' },
      { id: 'dpascal', label: 'Pascal', price: 12, saison: 'disney' },
      { id: 'dflounder', label: 'Flounder', price: 12, saison: 'disney' },
      { id: 'dflik', label: 'Flik', price: 12, saison: 'disney' },
      { id: 'dcochon', label: 'Petit Cochon', price: 12, saison: 'disney' },
      { id: 'dbambipet', label: 'Bambi', price: 13, saison: 'disney' },
      { id: 'dmeeko', label: 'Meeko', price: 13, saison: 'disney' },
      { id: 'driripet', label: 'Riri', price: 13, saison: 'disney' },
      { id: 'dkakamora', label: 'Kakamora', price: 13, saison: 'disney' },
      { id: 'djiminy', label: 'Jiminy Cricket', price: 13, saison: 'disney' },
      { id: 'dpluto', label: 'Pluto', price: 14, saison: 'disney' },
      { id: 'dsimba', label: 'Simba Bébé', price: 14, saison: 'disney' },
      { id: 'dtristesse', label: 'Tristesse', price: 14, saison: 'disney' },
      { id: 'dstitchpet', label: 'Stitch', price: 15, saison: 'disney' },
      { id: 'ddumbo', label: 'Dumbo', price: 15, saison: 'disney' },
      { id: 'dtigroupet', label: 'Tigrou', price: 15, saison: 'disney' },
      { id: 'dbaloo', label: 'Baloo', price: 15, saison: 'disney' },
      { id: 'ddalmatiens', label: 'Trois Dalmatiens', price: 15, saison: 'disney' },
      { id: 'dgeniemini', label: 'Génie Miniature', price: 15, saison: 'disney' },
      { id: 'dclochettepet', label: 'Fée Clochette', price: 15, saison: 'disney' },
    ],
  },
  {
    id: 'face', label: 'Visage', emoji: '👄',
    items: [
      { id: 'smile', label: 'Sourire', price: 0 },
      { id: 'grin', label: 'Grand sourire', price: 0 },
      { id: 'tongue', label: 'Langue tirée', price: 0 },
      { id: 'surprised', label: 'Surpris', price: 1 },
      { id: 'kiss', label: 'Bisou', price: 1 },
      { id: 'tooth', label: 'Petite dent', price: 1 },
      { id: 'buckteeth', label: 'Dents de lapin', price: 2 },
      { id: 'moustache', label: 'Moustache', price: 2 },
      { id: 'moustachecurly', label: 'Moustache chic', price: 3 },
      { id: 'clown', label: 'Clown', price: 3 },
      { id: 'ninja', label: 'Ninja', price: 3 },
      { id: 'vampire', label: 'Dents de vampire', price: 4 },
      { id: 'beard', label: 'Barbe de pirate', price: 4 },
      { id: 'goldteeth', label: 'Dents en or', price: 5 },
      { id: 'jraptoreyes', label: 'Yeux de Raptor', price: 8, saison: 'jurassic' },
      { id: 'jtrexjaw', label: 'Sourire de T-Rex', price: 10, saison: 'jurassic' },
      { id: 'jscalesface', label: 'Écailles', price: 9, saison: 'jurassic' },
      { id: 'ddalmatien', label: 'Taches Dalmatien', price: 8, saison: 'disney' },
      { id: 'dgepetto', label: 'Moustache Gepetto', price: 8, saison: 'disney' },
      { id: 'dblushminnie', label: 'Blush Minnie', price: 8, saison: 'disney' },
      { id: 'dbambi', label: 'Yeux Bambi', price: 9, saison: 'disney' },
      { id: 'dcruellamaq', label: 'Maquillage Cruella', price: 9, saison: 'disney' },
      { id: 'dcheshire', label: 'Sourire Cheshire', price: 10, saison: 'disney' },
    ],
  },
  {
    // Skins « complets » : remplacent TOUT le bonhomme (corps, tête, membres)
    // au lieu de se poser dessus. Rendus par renderFull() dans avatarParts.
    id: 'full', label: 'Skins complets', emoji: '✨',
    items: [
      { id: 'fclochette', label: 'Clochette Complète', price: 23, saison: 'disney' },
      { id: 'fdonald', label: 'Donald Complet', price: 23, saison: 'disney' },
      { id: 'fstitch', label: 'Stitch Complet', price: 24, saison: 'disney' },
      { id: 'fmickey', label: 'Mickey Complet', price: 25, saison: 'disney' },
      { id: 'fgenie', label: 'Génie Complet', price: 25, saison: 'disney' },
    ],
  },
  {
    id: 'special', label: 'Spécial', emoji: '⭐',
    items: [
      {
        id: 'skin',
        label: '🎨 Skin sur mesure',
        price: 20,
        desc: 'Fais créer un skin EXCLUSIVEMENT pour toi par Asacool !',
      },
    ],
  },
]

// Avatar par défaut (corps violet, aucun accessoire).
export const DEFAULT_AVATAR = {
  color: 'violet',
  hat: null, glasses: null, hair: null,
  sport: null, animal: null, face: null,
  full: null, // skin complet (remplace tout le bonhomme) — null = bonhomme normal
  owned: [],
}

export function accKey(categoryId, itemId) {
  return `${categoryId}:${itemId}`
}

export function normalizeAvatar(raw) {
  const a = { ...DEFAULT_AVATAR, ...(raw || {}), owned: raw?.owned ?? [] }
  // compat : ancienne couleur stockée en hex -> on la garde telle quelle (resolveColor gère)
  return a
}

export function getItem(categoryId, itemId) {
  if (!itemId) return null
  const cat = CATEGORIES.find((c) => c.id === categoryId)
  return cat?.items.find((i) => i.id === itemId) ?? null
}

export function isUnlocked(avatar, categoryId, item) {
  return item.price === 0 || (avatar.owned ?? []).includes(accKey(categoryId, item.id))
}

// ============================================================
//  Skins exclusifs de saison (ex. « Jurassic Web 🦕 »).
//  Ils vivent dans leurs catégories natives (pour un rendu SVG correct dans
//  la bonne couche), mais portent un drapeau `saison`. On les agrège dans
//  un onglet virtuel dédié et on les masque des onglets normaux.
// ============================================================

export const SAISON_LABELS = {
  jurassic: '🦕 Jurassic Web — Exclusif',
  disney: '🏰 Zigzamland — Exclusif',
}

// Emoji de l'onglet virtuel par saison.
export const SAISON_EMOJIS = {
  jurassic: '🦕',
  disney: '🏰',
}

// True si l'item appartient à une (la) saison donnée.
export function isSaisonItem(item, saisonId) {
  return saisonId ? item?.saison === saisonId : !!item?.saison
}

// Tous les items d'une saison, à plat, enrichis de `_cat` (leur catégorie
// native) pour que l'achat / l'équipement sachent à quelle catégorie écrire.
export function getSaisonItems(saisonId) {
  if (!saisonId) return []
  const out = []
  for (const cat of CATEGORIES) {
    for (const item of cat.items) {
      if (item.saison === saisonId) out.push({ ...item, _cat: cat.id })
    }
  }
  return out
}

// ============================================================
//  Tenues sauvegardées 👗 — reconstruire un avatar équipable à
//  partir d'un snapshot enregistré.
// ============================================================

// Clés de catégorie réellement portées par l'objet avatar (pas « special »).
const LOADOUT_KEYS = Object.keys(DEFAULT_AVATAR).filter((k) => k !== 'owned')

// Construit un avatar équipable depuis une tenue sauvegardée : on repart de
// l'avatar courant (donc de son `owned`), et pour chaque catégorie on ne
// reprend la valeur de la tenue QUE si l'élève la possède encore (gratuite,
// ou présente dans `owned`). Les skins sur mesure retirés, les skins de
// saison non acquis, etc. sont donc silencieusement ignorés — ré-équiper une
// tenue n'ajoute jamais rien à `owned`.
export function loadoutToAvatar(saved, current) {
  const cur = normalizeAvatar(current)
  const src = normalizeAvatar(saved)
  const owned = new Set(cur.owned ?? [])

  const canEquip = (categoryId, itemId) => {
    if (!itemId) return false
    // Couleur legacy stockée en hex : toujours autorisée (aucun coût).
    if (categoryId === 'color' && typeof itemId === 'string' && itemId.startsWith('#')) return true
    const item = getItem(categoryId, itemId)
    if (item) return item.price === 0 || owned.has(accKey(categoryId, itemId))
    // Hors catalogue (skin sur mesure) : uniquement si explicitement possédé.
    return owned.has(accKey(categoryId, itemId))
  }

  const next = { ...cur }
  for (const key of LOADOUT_KEYS) {
    const val = src[key]
    if (key === 'color') next.color = canEquip('color', val) ? val : cur.color
    else next[key] = canEquip(key, val) ? val : null
  }
  return next
}

// Slugs des saisons dont l'élève possède au moins un skin — sert à garder
// leur onglet visible à vie, même une fois la saison terminée.
export function getSaisonsPossedees(avatar) {
  const owned = new Set(avatar?.owned ?? [])
  const slugs = new Set()
  for (const cat of CATEGORIES) {
    for (const item of cat.items) {
      if (item.saison && owned.has(accKey(cat.id, item.id))) slugs.add(item.saison)
    }
  }
  return [...slugs]
}

