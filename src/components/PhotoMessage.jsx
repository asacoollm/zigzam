import { useEffect, useRef, useState } from 'react'
import { preparePhoto } from '../lib/photoMedia'

// ─── Bouton 📷 + aperçu avant envoi ──────────────────────────────────────────
// Props : onSend(blob) → doit renvoyer { ok: true } ou { error }, onActiveChange(bool), disabled
export function PhotoPicker({ onSend, onActiveChange, disabled }) {
  const [mode, setMode] = useState('idle') // 'idle' | 'processing' | 'preview' | 'sending'
  const [preview, setPreview] = useState(null) // { url, blob }
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)

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
    setMode('processing')
    const res = await preparePhoto(file)
    if (res.error) {
      setNotice(res.error)
      setMode('idle')
      return
    }
    const url = URL.createObjectURL(res.blob)
    setPreview({ url, blob: res.blob })
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
    setMode('sending')
    const res = await onSend(preview.blob)
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
          className="disc__btn disc__btn--photo"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Envoyer une photo"
          title="Photo"
        >
          📷
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleChoisir} />
        {notice && <span className="disc__rec-notice">{notice}</span>}
      </>
    )
  }

  if (mode === 'processing') {
    return (
      <div className="disc__rec">
        <span className="disc__rec-label">Préparation de la photo…</span>
      </div>
    )
  }

  // preview + sending
  return (
    <div className="disc__rec disc__rec--preview">
      <img className="disc__photo-preview" src={preview?.url} alt="Aperçu" />
      <button
        type="button"
        className="disc__btn disc__btn--ghost disc__btn--sm"
        onClick={cancelPreview}
        disabled={mode === 'sending'}
      >
        ✖ Annuler
      </button>
      <button type="button" className="disc__btn disc__btn--send" onClick={handleSend} disabled={mode === 'sending'}>
        {mode === 'sending' ? '…' : '➤ Envoyer'}
      </button>
      {notice && <span className="disc__rec-notice">{notice}</span>}
    </div>
  )
}

// ─── Bulle d'un message photo (miniature + agrandissement) ──────────────────
// Props : msg, isMine
export function PhotoBubble({ msg, isMine }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [lightbox, setLightbox] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const url = msg.media_url

  if (!url) {
    return <span className="disc__vocal-expired">📷 Photo indisponible</span>
  }

  return (
    <>
      <div className={`disc__photo-bubble ${isMine ? 'disc__photo-bubble--mine' : ''}`}>
        {status === 'loading' && <div className="disc__photo-spinner" aria-hidden="true" />}
        {status === 'error' ? (
          <button
            type="button"
            className="disc__photo-retry"
            onClick={() => { setStatus('loading'); setRetryKey((k) => k + 1) }}
          >
            ⚠️ Photo indisponible, réessayer
          </button>
        ) : (
          <img
            key={retryKey}
            className={`disc__photo-thumb${status === 'ready' ? ' disc__photo-thumb--ready' : ''}`}
            src={url}
            alt="Photo envoyée"
            loading="lazy"
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            onClick={() => status === 'ready' && setLightbox(true)}
          />
        )}
      </div>
      {lightbox && (
        <div className="disc__lightbox" onClick={() => setLightbox(false)}>
          <img className="disc__lightbox-img" src={url} alt="Photo en grand" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="disc__lightbox-close" onClick={() => setLightbox(false)} aria-label="Fermer">
            ✖
          </button>
        </div>
      )}
    </>
  )
}
