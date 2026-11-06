// ============================================================
//  Traitement client d'une photo avant envoi dans Discuter.
//   • redimensionne à 1280 px max sur le plus grand côté
//   • ré-encode en JPEG qualité ~0.8 via <canvas> — le canvas ne
//     recopie jamais les métadonnées d'origine (EXIF/GPS disparaissent
//     de fait, sans traitement dédié)
//   • vise 300-500 Ko en réduisant la qualité si besoin
// ============================================================

const MAX_SIDE = 1280
const TARGET_MAX_BYTES = 500 * 1024
const HARD_MAX_OUTPUT_BYTES = 2 * 1024 * 1024 // refusé même après compression
const MAX_INPUT_BYTES = 25 * 1024 * 1024 // refusé avant même de tenter le traitement

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function hasAcceptedExtension(name) {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(name || '')
}

function isHeic(file) {
  return /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name || '')
}

// Décode le fichier en image bitmap. Le HEIC se décode nativement sur
// Safari/iOS ; ailleurs (Chrome/Android) ça échoue — message dédié dans
// preparePhoto() pour ce cas précis.
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    const loaded = new Promise((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = reject
    })
    img.src = url
    return await loaded
  } finally {
    URL.revokeObjectURL(url)
  }
}

function drawToCanvas(bitmap, maxSide) {
  const w = bitmap.width ?? bitmap.naturalWidth
  const h = bitmap.height ?? bitmap.naturalHeight
  const scale = Math.min(1, maxSide / Math.max(w, h))
  const outW = Math.max(1, Math.round(w * scale))
  const outH = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  canvas.getContext('2d').drawImage(bitmap, 0, 0, outW, outH)
  return canvas
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode_failed'))), 'image/jpeg', quality)
  })
}

// Renvoie { blob } prêt à uploader, ou { error } (message déjà en français,
// affichable directement dans l'UI).
export async function preparePhoto(file) {
  if (!file) return { error: 'Aucune photo sélectionnée.' }

  const typeOk = ACCEPTED_TYPES.includes(file.type) || hasAcceptedExtension(file.name)
  if (!typeOk) {
    return { error: 'Format non supporté. Choisis une photo JPG, PNG, WEBP ou HEIC 📷' }
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { error: 'Cette photo est trop lourde, choisis-en une autre 📷' }
  }

  let bitmap
  try {
    bitmap = await decode(file)
  } catch {
    return {
      error: isHeic(file)
        ? "Cette photo HEIC ne peut pas être lue sur cet appareil. Essaie en JPG ou PNG 📷"
        : "Impossible de lire cette photo, réessaie 📷",
    }
  }

  let blob
  try {
    const canvas = drawToCanvas(bitmap, MAX_SIDE)
    if (bitmap.close) bitmap.close()

    let quality = 0.8
    blob = await canvasToBlob(canvas, quality)
    while (blob.size > TARGET_MAX_BYTES && quality > 0.5) {
      quality -= 0.1
      blob = await canvasToBlob(canvas, quality)
    }
  } catch {
    return { error: "Impossible de préparer cette photo, réessaie 📷" }
  }

  if (blob.size > HARD_MAX_OUTPUT_BYTES) {
    return { error: 'Cette photo reste trop lourde même compressée, choisis-en une autre 📷' }
  }

  return { blob }
}
