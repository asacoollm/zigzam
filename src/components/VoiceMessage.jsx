import { useEffect, useRef, useState } from 'react'

const MAX_MS = 120000 // durée max d'un vocal = 2 minutes

// Choisit un format supporté par le navigateur (webm ou mp4) + l'extension.
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return { mime: '', ext: 'webm' }
  if (MediaRecorder.isTypeSupported('audio/webm')) return { mime: 'audio/webm', ext: 'webm' }
  if (MediaRecorder.isTypeSupported('audio/mp4')) return { mime: 'audio/mp4', ext: 'm4a' }
  return { mime: '', ext: 'webm' }
}

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ─── Enregistreur (bouton micro + aperçu) ────────────────────────────────────
// Props : onSend(blob, ext), onActiveChange(bool), disabled
export function VoiceRecorder({ onSend, onActiveChange, disabled }) {
  const [mode, setMode] = useState('idle') // 'idle' | 'recording' | 'preview'
  const [elapsed, setElapsed] = useState(0) // secondes
  const [preview, setPreview] = useState(null) // { url, blob, ext }
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)

  const recRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const tickRef = useRef(null)
  const maxRef = useRef(null)
  const startRef = useRef(0)
  const extRef = useRef('webm')

  useEffect(() => { onActiveChange?.(mode !== 'idle') }, [mode, onActiveChange])

  // Nettoyage au démontage.
  useEffect(() => () => {
    clearInterval(tickRef.current)
    clearTimeout(maxRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (preview?.url) URL.revokeObjectURL(preview.url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function startRecording() {
    setNotice('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const { mime, ext } = pickMime()
      extRef.current = ext
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        stopTracks()
        const url = URL.createObjectURL(blob)
        setPreview({ url, blob, ext: extRef.current })
        setMode('preview')
      }
      recRef.current = rec
      rec.start()
      startRef.current = Date.now()
      setElapsed(0)
      setMode('recording')
      tickRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000)
      }, 200)
      // Arrêt automatique à 2 minutes.
      maxRef.current = setTimeout(() => {
        setNotice('Durée max atteinte (2 min)')
        stopRecording()
      }, MAX_MS)
    } catch {
      setNotice("Micro indisponible. Autorise l'accès au micro 🎤")
      setMode('idle')
    }
  }

  function stopRecording() {
    clearInterval(tickRef.current)
    clearTimeout(maxRef.current)
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
  }

  function cancelPreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setMode('idle')
    setNotice('')
  }

  async function handleSend() {
    if (!preview) return
    setSending(true)
    await onSend(preview.blob, preview.ext)
    setSending(false)
    if (preview.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setMode('idle')
  }

  if (mode === 'idle') {
    return (
      <button
        type="button"
        className="disc__btn disc__btn--mic"
        onClick={startRecording}
        disabled={disabled}
        aria-label="Enregistrer un message vocal"
        title="Message vocal"
      >
        🎤
      </button>
    )
  }

  if (mode === 'recording') {
    return (
      <div className="disc__rec">
        <span className="disc__rec-dot" aria-hidden="true" />
        <span className="disc__rec-time">{fmt(elapsed)}</span>
        <span className="disc__rec-label">Enregistrement…</span>
        <button type="button" className="disc__btn disc__btn--stop" onClick={stopRecording}>
          ⏹️ Stop
        </button>
        {notice && <span className="disc__rec-notice">{notice}</span>}
      </div>
    )
  }

  // preview
  return (
    <div className="disc__rec disc__rec--preview">
      <audio className="disc__rec-audio" src={preview?.url} controls />
      <button type="button" className="disc__btn disc__btn--ghost disc__btn--sm" onClick={cancelPreview} disabled={sending}>
        ✖ Annuler
      </button>
      <button type="button" className="disc__btn disc__btn--send" onClick={handleSend} disabled={sending}>
        {sending ? '…' : '➤ Envoyer'}
      </button>
      {notice && <span className="disc__rec-notice">{notice}</span>}
    </div>
  )
}

// ─── Bulle d'un message vocal (forme d'onde + lecture) ───────────────────────
// Hauteurs de barres déterministes à partir de l'id (forme d'onde « stylisée »).
function bars(id) {
  const out = []
  let seed = 0
  const str = String(id)
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0
  for (let i = 0; i < 26; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0
    out.push(30 + (seed % 70)) // hauteur 30..100 %
  }
  return out
}

// Props : msg, isMine, onPlay (appelé une fois, à la première lecture)
export function VocalBubble({ msg, isMine, onPlay }) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0) // position de lecture (s)
  const audioRef = useRef(null)
  const markedRef = useRef(false)

  const url = msg.audio_url
  const waveform = bars(msg.id)

  useEffect(() => {
    if (!url) return undefined

    // Élément de LECTURE : on ne le manipule jamais pour mesurer la durée,
    // sinon la lecture casse (les blobs MediaRecorder réagissent mal au seek).
    const a = new Audio()
    a.preload = 'metadata'
    a.src = url
    audioRef.current = a

    const onMeta = () => { if (Number.isFinite(a.duration)) setDuration(a.duration) }
    const onTime = () => setCurrent(a.currentTime || 0)
    const onEnd = () => { setPlaying(false); setCurrent(0); a.currentTime = 0 }
    const onPlayEvt = () => setPlaying(true)
    const onPauseEvt = () => setPlaying(false)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('durationchange', onMeta)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    a.addEventListener('play', onPlayEvt)
    a.addEventListener('pause', onPauseEvt)

    // Mesure de la durée sur un élément SÉPARÉ (les blobs MediaRecorder webm
    // rapportent souvent une durée « Infinity »). Le seek destructif reste donc
    // confiné à cet élément jetable → la lecture n'est jamais perturbée.
    const probe = new Audio()
    probe.preload = 'metadata'
    probe.src = url
    const cleanProbe = () => {
      probe.ontimeupdate = null
      probe.removeEventListener('loadedmetadata', onProbe)
      probe.removeAttribute('src')
    }
    function onProbe() {
      if (Number.isFinite(probe.duration)) { setDuration((d) => d || probe.duration); cleanProbe() }
      else {
        probe.currentTime = 1e101
        probe.ontimeupdate = () => {
          if (Number.isFinite(probe.duration)) { setDuration((d) => d || probe.duration); cleanProbe() }
        }
      }
    }
    probe.addEventListener('loadedmetadata', onProbe)

    return () => {
      a.pause()
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('durationchange', onMeta)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('play', onPlayEvt)
      a.removeEventListener('pause', onPauseEvt)
      a.removeAttribute('src')
      audioRef.current = null
      cleanProbe()
    }
  }, [url])

  if (!url) {
    return <span className="disc__vocal-expired">🎤 Vocal expiré</span>
  }

  // On se base sur l'état réel de l'élément (a.paused) plutôt que sur le state
  // React, et on capture le rejet éventuel de play().
  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      if (!markedRef.current) {
        markedRef.current = true
        onPlay?.()
      }
      const p = a.play()
      if (p && p.catch) p.catch(() => {})
    } else {
      a.pause()
    }
  }

  const progress = duration > 0 ? Math.min(1, current / duration) : 0
  const display = duration > 0 ? duration : current

  return (
    <div className={`disc__vocal ${isMine ? 'disc__vocal--mine' : ''}`}>
      <button type="button" className="disc__vocal-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Lecture'}>
        {playing ? '⏸' : '▶'}
      </button>
      <div className="disc__vocal-wave" aria-hidden="true">
        {waveform.map((h, i) => (
          <span
            key={i}
            className={`disc__vocal-bar ${i / waveform.length <= progress ? 'disc__vocal-bar--on' : ''}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <span className="disc__vocal-dur">{fmt(display)}</span>
    </div>
  )
}
