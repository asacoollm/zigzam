// ============================================================
//  Validation client d'une vidéo avant envoi dans Discuter.
//   • types acceptés : MP4, WEBM, MOV (quicktime) — AUCUNE conversion,
//     le fichier original est envoyé tel quel.
//   • taille max 15 Mo, durée max 30 s (lue via un élément <video> et
//     ses métadonnées — jamais transférée au serveur telle quelle,
//     voir la RPC send_video_message qui relit la taille réelle).
// ============================================================

const MAX_BYTES = 15 * 1024 * 1024
const MAX_DURATION_S = 30

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

function hasAcceptedExtension(name) {
  return /\.(mp4|webm|mov)$/i.test(name || '')
}

function readDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => {
      const d = video.duration
      URL.revokeObjectURL(url)
      if (Number.isFinite(d)) resolve(d)
      else reject(new Error('duree_illisible'))
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('lecture_impossible'))
    }
    video.src = url
  })
}

// Renvoie { file, duree } prêt à uploader (fichier INCHANGÉ), ou { error }
// (message déjà en français, affichable directement dans l'UI).
export async function prepareVideo(file) {
  if (!file) return { error: 'Aucune vidéo sélectionnée.' }

  const typeOk = ACCEPTED_TYPES.includes(file.type) || hasAcceptedExtension(file.name)
  if (!typeOk) {
    return { error: 'Format non supporté. Choisis une vidéo MP4, WEBM ou MOV 🎥' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'Ta vidéo est trop lourde, maximum 15 Mo 🎥' }
  }

  let duree
  try {
    duree = await readDuration(file)
  } catch {
    return { error: 'Impossible de lire cette vidéo, réessaie 🎥' }
  }

  if (duree > MAX_DURATION_S) {
    return { error: 'Ta vidéo fait plus de 30 secondes 🎥' }
  }

  return { file, duree }
}
