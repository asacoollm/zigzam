import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ICE_SERVERS, callChannel, sendSignal, getAppel, endAppel } from '../lib/appels'
import FallGuy from './FallGuy'
import './CallView.css'

// Lecteur média (srcObject n'est pas un attribut React → on le pose via ref).
function Video({ stream, muted, className }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null }, [stream])
  return <video ref={ref} className={className} autoPlay playsInline muted={muted} />
}
function Audio({ stream }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null }, [stream])
  return <audio ref={ref} autoPlay />
}

function fmtDuration(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

// Compare deux maps booléennes (pour ne re-rendre que sur changement réel).
function sameBoolMap(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) if (a[k] !== b[k]) return false
  return true
}

export default function CallView({ appel, onEnded }) {
  const { user } = useAuth()
  const isVideo = appel.type === 'video'

  const [error, setError] = useState(null)      // null | 'perm' | 'media'
  const [attempt, setAttempt] = useState(0)     // pour réessayer getUserMedia
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({}) // userId -> MediaStream
  const [presentIds, setPresentIds] = useState([user.id])
  const [info, setInfo] = useState({})          // userId -> { pseudo, avatar, role }
  const [speaking, setSpeaking] = useState({})  // userId -> bool
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  const localStreamRef = useRef(null)
  const channelRef = useRef(null)
  const endedRef = useRef(false)

  // Chrono de l'appel.
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Infos des participants (pseudo / avatar).
  useEffect(() => {
    let on = true
    getAppel(appel.appelId).then((a) => {
      if (!on || !a) return
      const m = {}
      ;(a.participants || []).forEach((p) => {
        m[p.user_id] = { pseudo: p.pseudo, avatar: p.avatar, role: p.role }
      })
      setInfo(m)
    })
    return () => { on = false }
  }, [appel.appelId])

  // ---- Cœur WebRTC : média + signalisation + mesh ----
  useEffect(() => {
    let cancelled = false
    const meId = user.id
    const pcs = {}        // userId -> RTCPeerConnection
    const pending = {}    // userId -> [candidates en attente]
    const analysers = {}  // userId -> { an, data }
    let channel = null
    let stream = null
    let audioCtx = null
    let rafId = null

    const send = (payload) => { if (channel) sendSignal(channel, payload) }

    const attachAnalyser = (id, ms) => {
      try {
        if (!ms.getAudioTracks().length) return
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const src = audioCtx.createMediaStreamSource(ms)
        const an = audioCtx.createAnalyser()
        an.fftSize = 512
        src.connect(an)
        analysers[id] = { an, data: new Uint8Array(an.frequencyBinCount) }
      } catch { /* ignore */ }
    }

    const loop = () => {
      const next = {}
      for (const id in analysers) {
        const { an, data } = analysers[id]
        an.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        next[id] = (sum / data.length) > 16
      }
      setSpeaking((prev) => (sameBoolMap(prev, next) ? prev : next))
      rafId = requestAnimationFrame(loop)
    }

    const flush = (id, pc) => {
      const list = pending[id]
      if (!list) return
      list.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}))
      pending[id] = []
    }

    const createPeer = (peerId, initiator) => {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      pcs[peerId] = pc
      stream.getTracks().forEach((t) => pc.addTrack(t, stream))
      pc.onicecandidate = (e) => {
        if (e.candidate) send({ kind: 'ice', from: meId, target: peerId, candidate: e.candidate.toJSON() })
      }
      pc.ontrack = (e) => {
        const rs = e.streams[0]
        setRemoteStreams((p) => ({ ...p, [peerId]: rs }))
        attachAnalyser(peerId, rs)
      }
      if (initiator) {
        pc.createOffer()
          .then((o) => pc.setLocalDescription(o))
          .then(() => send({ kind: 'offer', from: meId, target: peerId, sdp: pc.localDescription }))
          .catch(() => {})
      }
      return pc
    }

    const handleSignal = (p) => {
      if (!p || p.target !== meId) return
      const from = p.from
      if (p.kind === 'offer') {
        const pc = pcs[from] || createPeer(from, false)
        pc.setRemoteDescription(new RTCSessionDescription(p.sdp))
          .then(() => { flush(from, pc); return pc.createAnswer() })
          .then((a) => pc.setLocalDescription(a))
          .then(() => send({ kind: 'answer', from: meId, target: from, sdp: pc.localDescription }))
          .catch(() => {})
      } else if (p.kind === 'answer') {
        const pc = pcs[from]
        if (pc) pc.setRemoteDescription(new RTCSessionDescription(p.sdp)).then(() => flush(from, pc)).catch(() => {})
      } else if (p.kind === 'ice') {
        const pc = pcs[from]
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          pc.addIceCandidate(new RTCIceCandidate(p.candidate)).catch(() => {})
        } else {
          (pending[from] = pending[from] || []).push(p.candidate)
        }
      }
    }

    const handleSync = () => {
      const state = channel.presenceState()
      const ids = Object.keys(state)
      setPresentIds(ids.includes(meId) ? ids : [...ids, meId])
      ids.forEach((id) => {
        if (id === meId || pcs[id]) return
        // Règle anti-glare : l'id le plus petit crée l'offre.
        createPeer(id, meId < id)
      })
    }

    const handleLeave = (key) => {
      if (pcs[key]) { try { pcs[key].close() } catch { /* ignore */ } delete pcs[key] }
      delete analysers[key]
      setRemoteStreams((p) => { const n = { ...p }; delete n[key]; return n })
      setPresentIds((prev) => prev.filter((x) => x !== key))
    }

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo })
      } catch (e) {
        if (!cancelled) setError(e?.name === 'NotAllowedError' ? 'perm' : 'media')
        return
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
      localStreamRef.current = stream
      setLocalStream(stream)
      setError(null)
      attachAnalyser(meId, stream)
      rafId = requestAnimationFrame(loop)

      channel = callChannel(appel.appelId, meId)
      channel.on('broadcast', { event: 'signal' }, ({ payload }) => { if (!cancelled) handleSignal(payload) })
      channel.on('presence', { event: 'sync' }, () => { if (!cancelled) handleSync() })
      channel.on('presence', { event: 'leave' }, ({ key }) => { if (!cancelled) handleLeave(key) })
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ user_id: meId })
      })
      channelRef.current = channel
    }
    init()

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      Object.values(pcs).forEach((pc) => { try { pc.close() } catch { /* ignore */ } })
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (audioCtx) { try { audioCtx.close() } catch { /* ignore */ } }
      if (channel) { try { channel.untrack() } catch { /* ignore */ } try { channel.unsubscribe() } catch { /* ignore */ } }
    }
  }, [appel.appelId, isVideo, user.id, attempt])

  const toggleMic = useCallback(() => {
    const s = localStreamRef.current
    if (!s) return
    const on = !micOn
    s.getAudioTracks().forEach((t) => { t.enabled = on })
    setMicOn(on)
  }, [micOn])

  const toggleCam = useCallback(() => {
    const s = localStreamRef.current
    if (!s) return
    const on = !camOn
    s.getVideoTracks().forEach((t) => { t.enabled = on })
    setCamOn(on)
  }, [camOn])

  const hangUp = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    const res = await endAppel(appel.appelId, user.id)
    onEnded(res || {})
  }, [appel.appelId, user.id, onEnded])

  // --- Écran de permission / erreur ---
  if (error) {
    return (
      <div className="call call--msg">
        <div className="call__msg-card">
          <span className="call__msg-emoji">🎤</span>
          <h2 className="call__msg-title">
            {error === 'perm'
              ? `Zigzam a besoin de ton micro${isVideo ? ' et de ta caméra' : ''} pour l'appel 🎤`
              : "Impossible d'accéder au micro/caméra 😕"}
          </h2>
          <p className="call__msg-text">
            {error === 'perm'
              ? "Autorise l'accès dans ton navigateur, puis réessaie !"
              : 'Vérifie qu\'un autre programme n\'utilise pas déjà ton micro ou ta caméra.'}
          </p>
          <div className="call__msg-actions">
            <button className="call__btn-pill" onClick={() => setAttempt((a) => a + 1)}>🔄 Réessayer</button>
            <button className="call__btn-pill call__btn-pill--danger" onClick={hangUp}>📵 Raccrocher</button>
          </div>
        </div>
      </div>
    )
  }

  const tiles = presentIds
  const single = tiles.length <= 1

  return (
    <div className="call">
      {/* En-tête : type + durée */}
      <header className="call__head">
        <span className="call__type">{isVideo ? '📹 Appel vidéo' : '📞 Appel audio'}</span>
        <span className="call__timer">{fmtDuration(elapsed)}</span>
        <span className="call__people">👥 {tiles.length}</span>
      </header>

      {/* Lecture audio des flux distants (toujours, même en appel vidéo) */}
      <div className="call__audio-sink" aria-hidden="true">
        {Object.entries(remoteStreams).map(([id, s]) => <Audio key={id} stream={s} />)}
      </div>

      {/* Grille des participants */}
      <div className={`call__grid ${single ? 'call__grid--solo' : ''}`}>
        {tiles.map((id) => {
          const me = id === user.id
          const stream = me ? localStream : remoteStreams[id]
          const meta = me
            ? { pseudo: 'Toi', avatar: user.avatar, role: user.role }
            : (info[id] || { pseudo: '…', avatar: null, role: null })
          const hasVideo = isVideo && stream && stream.getVideoTracks && stream.getVideoTracks().length > 0
          const showVideo = hasVideo && (me ? camOn : true)
          const isSpeaking = !!speaking[id]
          return (
            <div key={id} className={`call__tile ${isSpeaking ? 'call__tile--speaking' : ''}`}>
              <div className="call__bubble">
                {showVideo ? (
                  <Video stream={stream} muted className="call__video" />
                ) : (
                  <div className="call__avatar-wrap">
                    <FallGuy avatar={meta.avatar ?? null} role={meta.role} anim="idle" className="call__avatar" />
                  </div>
                )}
                <span className="call__wave" aria-hidden="true">
                  <i /><i /><i /><i /><i />
                </span>
              </div>
              <span className="call__name">
                {meta.pseudo}{me && !micOn ? ' 🔇' : ''}
              </span>
            </div>
          )
        })}
        {single && (
          <p className="call__waiting">En attente que les autres rejoignent l'appel… ⏳</p>
        )}
      </div>

      {/* Barre de contrôles */}
      <div className="call__controls">
        <button
          className={`call__ctrl ${!micOn ? 'call__ctrl--off' : ''}`}
          onClick={toggleMic}
          aria-label={micOn ? 'Couper le micro' : 'Activer le micro'}
        >
          {micOn ? '🎤' : '🔇'}
          <span className="call__ctrl-label">{micOn ? 'Micro' : 'Coupé'}</span>
        </button>

        {isVideo && (
          <button
            className={`call__ctrl ${!camOn ? 'call__ctrl--off' : ''}`}
            onClick={toggleCam}
            aria-label={camOn ? 'Couper la caméra' : 'Activer la caméra'}
          >
            {camOn ? '📹' : '🚫'}
            <span className="call__ctrl-label">{camOn ? 'Caméra' : 'Coupée'}</span>
          </button>
        )}

        <button className="call__ctrl call__ctrl--hangup" onClick={hangUp} aria-label="Raccrocher">
          📵
          <span className="call__ctrl-label">Raccrocher</span>
        </button>
      </div>
    </div>
  )
}
