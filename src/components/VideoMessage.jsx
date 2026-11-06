import { useEffect, useRef, useState } from 'react'
import { prepareVideo } from '../lib/videoMedia'
import { uploadMediaVideo } from '../lib/modules'

// ─── Bouton 🎥 + aperçu + progression d'envoi ────────────────────────────────
// Props : onSend(url, duree) → RPC d'enregistrement (l'upload, avec progression
// et annulation, est géré ici) ; doit renvoyer { ok: true } ou { error }.
// onActiveChange(bool), disabled.
export function VideoPicker({ onSend, onActiveChange, disabled }) {
  const [mode, setMode] = useState('idle') // 'idle' | 'checking' | 'preview' | 'uploading'
  const [preview, setPreview] = useState(null) // { url, file, duree }
  const [progress, setProgress] = useState(0)
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)
  const cancelRef = useRef(null)

  useEffect(() => { onActiveChange?.(mode !== 'idle') }, [mode, onActiveChange])

  // Nettoyage au démontage.
  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleChoisir(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-choisir le même fichier juste après
    if (!file) return
    setNotice('')
    setMode('checking')
    const res = await prepareVideo(file)
    if (res.error) {
      setNotice(res.error)
      setMode('idle')
      return
    }
    const url = URL.createObjectURL(res.file)
    setPreview({ url, file: res.file, duree: res.duree })
    setMode('preview')
  }

  function cancelPreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setMode('idle')
    setNotice('')
  }

  async function handleSend() {
    if (!preview) return
    setMode('uploading')
    setProgress(0)
    const { promise, cancel } = uploadMediaVideo(preview.file, setProgress)
    cancelRef.current = cancel
    const up = await promise
    cancelRef.current = null
    if (up.error) {
      if (up.error !== 'annule') setNotice(up.error)
      setMode('preview')
      return
    }
    const res = await onSend(up.url, preview.duree)
    if (res?.error) {
      setNotice(res.error)
      setMode('preview')
      return
    }
    if (preview.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setMode('idle')
  }

  if (mode === 'idle') {
    return (
      <>
        <button
          type="button"
          className="disc__btn disc__btn--video"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Envoyer une vidéo"
          title="Vidéo"
        >
          🎥
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          onChange={handleChoisir}
        />
        {notice && <span className="disc__rec-notice">{notice}</span>}
      </>
    )
  }

  if (mode === 'checking') {
    return (
      <div className="disc__rec">
        <span className="disc__rec-label">Vérification de la vidéo…</span>
      </div>
    )
  }

  if (mode === 'uploading') {
    return (
      <div className="disc__rec disc__rec--preview">
        <div className="disc__video-progress">
          <div className="disc__video-progress-bar" style={{ width: `${progress}%` }} />
          <span className="disc__video-progress-label">{progress}%</span>
        </div>
        <button type="button" className="disc__btn disc__btn--ghost disc__btn--sm" onClick={() => cancelRef.current?.()}>
          ✖ Annuler
        </button>
      </div>
    )
  }

  // preview
  return (
    <div className="disc__rec disc__rec--preview">
      <video className="disc__video-preview" src={preview?.url} muted playsInline />
      <button type="button" className="disc__btn disc__btn--ghost disc__btn--sm" onClick={cancelPreview}>
        ✖ Annuler
      </button>
      <button type="button" className="disc__btn disc__btn--send" onClick={handleSend}>
        ➤ Envoyer
      </button>
      {notice && <span className="disc__rec-notice">{notice}</span>}
    </div>
  )
}

// ─── Bulle d'un message vidéo (couverture + lecteur) ─────────────────────────
// Props : msg
export function VideoBubble({ msg }) {
  const [poster, setPoster] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [retryKey, setRetryKey] = useState(0)

  const url = msg.media_url

  // Image de couverture générée côté navigateur via <canvas>, à partir de la
  // 1re frame — best-effort : si la lecture des pixels échoue (CORS, décodage),
  // on se contente de l'absence de poster (le lecteur garde son rendu par défaut).
  useEffect(() => {
    if (!url) return undefined
    let cancelled = false
    const probe = document.createElement('video')
    probe.crossOrigin = 'anonymous'
    probe.preload = 'metadata'
    probe.muted = true
    probe.src = url
    function onSeeked() {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = probe.videoWidth
        canvas.height = probe.videoHeight
        canvas.getContext('2d').drawImage(probe, 0, 0)
        if (!cancelled) setPoster(canvas.toDataURL('image/jpeg', 0.7))
      } catch {
        /* cross-origin ou décodage impossible : pas de poster, tant pis */
      }
    }
    probe.onloadedmetadata = () => { probe.currentTime = Math.min(0.1, probe.duration || 0) }
    probe.onseeked = onSeeked
    return () => { cancelled = true }
  }, [url])

  if (!url) {
    return <span className="disc__vocal-expired">🎥 Vidéo indisponible</span>
  }

  return (
    <div className="disc__video-bubble">
      {status === 'loading' && <div className="disc__photo-spinner" aria-hidden="true" />}
      {status === 'error' ? (
        <button
          type="button"
          className="disc__photo-retry"
          onClick={() => { setStatus('loading'); setRetryKey((k) => k + 1) }}
        >
          ⚠️ Vidéo indisponible, réessayer
        </button>
      ) : (
        <video
          key={retryKey}
          className={`disc__video-player${status === 'ready' ? ' disc__video-player--ready' : ''}`}
          src={url}
          poster={poster || undefined}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  )
}
