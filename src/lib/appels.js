import { supabase } from './supabase'

// ============================================================
//  Appels audio/vidéo — WebRTC natif + Supabase Realtime (signalisation).
//  Aucun service externe : STUN public de Google, pas de TURN, pas de clé.
// ============================================================

const ERR = 'Oups, une erreur est survenue. Réessaie !'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { error: ERR, _raw: error }
  return { data }
}

// Serveurs STUN publics gratuits de Google (traversée de NAT).
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

// ---------------- RPC ----------------
export async function createAppel(discussionId, initiateurId, type) {
  const r = await rpc('appel_create', {
    p_discussion: discussionId, p_initiateur: initiateurId, p_type: type,
  })
  return r.error ? r : { appel: r.data }
}
export async function joinAppel(appelId, userId) {
  const r = await rpc('appel_join', { p_appel: appelId, p_user: userId })
  return r.error ? r : { appel: r.data }
}
export async function refuseAppel(appelId, userId) {
  const r = await rpc('appel_refuse', { p_appel: appelId, p_user: userId })
  return r.error ? r : r.data
}
export async function endAppel(appelId, userId) {
  const r = await rpc('appel_end', { p_appel: appelId, p_user: userId })
  return r.error ? r : r.data
}
export async function getAppel(appelId) {
  const r = await rpc('appel_get', { p_appel: appelId })
  return r.error ? null : r.data
}

// ---------------- Realtime : invitations ----------------
// Canal global d'invitations. Chaque utilisateur connecté s'y abonne ; on filtre
// par `targets` côté client (la diffusion est partagée).
export function invitesChannel() {
  return supabase.channel('appel:invites', { config: { broadcast: { self: false } } })
}
export function sendInvite(channel, payload) {
  channel.send({ type: 'broadcast', event: 'invite', payload })
}
export function sendInviteCancel(channel, payload) {
  channel.send({ type: 'broadcast', event: 'cancel', payload })
}

// ---------------- Realtime : signalisation d'une salle d'appel ----------------
// Canal dédié par salle : appel:{appel_id}. Présence = qui est dans l'appel.
export function callChannel(appelId, userId) {
  return supabase.channel(`appel:${appelId}`, {
    config: { presence: { key: userId }, broadcast: { self: false } },
  })
}
export function sendSignal(channel, payload) {
  channel.send({ type: 'broadcast', event: 'signal', payload })
}

// ---------------- Sonnerie (WebAudio, pas de fichier) ----------------
export function createRingtone() {
  let ctx = null
  let timer = null
  let running = false

  const beep = (freq, when, dur) => {
    if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    o.connect(g)
    g.connect(ctx.destination)
    const t = ctx.currentTime + when
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  const ring = () => {
    // Deux petites notes « dring-dring ».
    beep(660, 0, 0.32)
    beep(560, 0.36, 0.34)
  }

  return {
    start() {
      if (running) return
      running = true
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        running = false
        return
      }
      ring()
      timer = setInterval(ring, 1700)
    },
    stop() {
      running = false
      if (timer) { clearInterval(timer); timer = null }
      if (ctx) { try { ctx.close() } catch { /* ignore */ } ctx = null }
    },
  }
}
