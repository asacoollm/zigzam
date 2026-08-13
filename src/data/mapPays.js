// ============================================================
//  Catalogue des pays de la Map Zigzam 🗺️ (côté front).
//   Miroir de la table `zigzam_map_pays` en base : les 6 pays permanents
//   sont toujours affichés, les 2 pays saisonniers n'apparaissent que
//   quand leur saison est active (voir isSaisonActive dans lib/saison).
//   cx/cy : position du pays dans le viewBox 0 0 1000 700 de la carte SVG.
// ============================================================

// Positions calculées pour le viewBox 0 0 1100 920 de la carte SVG (voir
// Map.jsx) : 3 rangées espacées de 280 (halo r=98 + badge + étiquette
// tiennent dans ~240 de hauteur totale) pour qu'aucune île ne chevauche
// sa voisine, même dans une même colonne.
// `nomLignes` : le nom coupé en 1-2 lignes courtes pour l'étiquette SVG
// (évite qu'un nom long ne déborde sur l'île voisine).
export const PAYS_PERMANENTS = [
  { slug: 'royaume-glace', nom: 'Royaume Glacé', nomLignes: ['Royaume', 'Glacé'], emoji: '🧊', cx: 190, cy: 190, couleur: '#7fd8f5' },
  { slug: 'foret-mystique', nom: 'Forêt Mystique', nomLignes: ['Forêt', 'Mystique'], emoji: '🌿', cx: 910, cy: 190, couleur: '#3dd68c' },
  { slug: 'terre-de-lave', nom: 'Terre de Lave', nomLignes: ['Terre de', 'Lave'], emoji: '🌋', cx: 930, cy: 470, couleur: '#ff6a2b' },
  { slug: 'ile-doree', nom: 'Île Dorée', nomLignes: ['Île', 'Dorée'], emoji: '🏝️', cx: 170, cy: 750, couleur: '#ffd23f' },
  { slug: 'desert-de-sable', nom: 'Désert de Sable', nomLignes: ['Désert de', 'Sable'], emoji: '🌵', cx: 550, cy: 750, couleur: '#e8b04b' },
  { slug: 'cite-neon', nom: 'Cité Néon', nomLignes: ['Cité', 'Néon'], emoji: '🏙️', cx: 920, cy: 750, couleur: '#ff4d8d' },
]

// Pays saisonniers : `saisonSlug` pointe vers la saison correspondante
// dans lib/saison.js (SAISONS) — n'apparaissent que si elle est active.
export const PAYS_SAISONNIERS = [
  { slug: 'jurassic-web', nom: 'Jurassic Web', nomLignes: ['Jurassic', 'Web'], emoji: '🦕', cx: 360, cy: 470, couleur: '#3dd68c', saisonSlug: 'jurassic' },
  { slug: 'zigzamland-paris', nom: 'Zigzamland Paris', nomLignes: ['Zigzamland', 'Paris'], emoji: '🏰', cx: 650, cy: 470, couleur: '#ffd76a', saisonSlug: 'disney' },
]

export const TOUS_LES_PAYS = [...PAYS_PERMANENTS, ...PAYS_SAISONNIERS]

export function getPaysBySlug(slug) {
  return TOUS_LES_PAYS.find((p) => p.slug === slug) ?? null
}
