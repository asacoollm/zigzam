import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import {
  createAppel, joinAppel, refuseAppel,
  invitesChannel, sendInvite, sendInviteCancel, createRingtone,
} from '../lib/appels'
import IncomingCallModal from '../components/IncomingCallModal'
import CallView from '../components/CallView'

const CallContext = createContext(null)

// Diffuse un message « système » (appel manqué / terminé) dans la discussion
// pour une mise à jour en temps réel des conversations ouvertes.
function broadcastToDiscussion(discId, message) {
  const ch = supabase.channel(`discussion:${discId}`, { config: { broadcast: { self: false } } })
  ch.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      ch.send({ type: 'broadcast', event: 'message', payload: message })
      setTimeout(() => { try { ch.unsubscribe() } catch { /* ignore */ } }, 600)
    }
  })
}

export function CallProvider({ children }) {
  const { user } = useAuth()
  const [incoming, setIncoming] = useState(null) // { appelId, type, discussionId, fromPseudo, fromAvatar, fromRole }
  const [active, setActive] = useState(null)      // { appelId, type, discussionId }

  const incomingRef = useRef(null)
  const activeRef = useRef(null)
  const inviteChRef = useRef(null)
  // Sonnerie : instance stable créée une seule fois.
  const [ringtone] = useState(() => createRingtone())
  useEffect(() => { incomingRef.current = incoming }, [incoming])
  useEffect(() => { activeRef.current = active }, [active])

  const ready = user && !user.premiere_connexion

  // Abonnement global au canal d'invitations.
  useEffect(() => {
    if (!ready) return
    const ch = invitesChannel()
    ch.on('broadcast', { event: 'invite' }, ({ payload }) => {
      if (!payload?.targets?.includes(user.id)) return
      if (payload.fromId === user.id) return
      // Déjà en appel ou déjà une invitation en cours → on ignore (occupé).
      if (activeRef.current || incomingRef.current) return
      setIncoming({
        appelId: payload.appelId, type: payload.type, discussionId: payload.discussionId,
        fromPseudo: payload.fromPseudo, fromAvatar: payload.fromAvatar, fromRole: payload.fromRole,
      })
      ringtone.start()
    })
    ch.on('broadcast', { event: 'cancel' }, ({ payload }) => {
      if (incomingRef.current?.appelId === payload?.appelId) {
        ringtone.stop()
        setIncoming(null)
      }
    })
    ch.subscribe()
    inviteChRef.current = ch
    return () => {
      ringtone.stop()
      try { ch.unsubscribe() } catch { /* ignore */ }
      inviteChRef.current = null
    }
  }, [ready, user?.id])

  // Démarrer un appel (depuis Discuter).
  const startCall = useCallback(async (disc, type) => {
    if (!user || activeRef.current) return
    const res = await createAppel(disc.id, user.id, type)
    if (res.error || !res.appel) return
    const appel = res.appel
    const targets = (appel.participants || [])
      .map((p) => p.user_id)
      .filter((id) => id !== user.id)
    if (inviteChRef.current && targets.length) {
      sendInvite(inviteChRef.current, {
        appelId: appel.id, type, discussionId: disc.id,
        fromId: user.id, fromPseudo: user.pseudo, fromAvatar: user.avatar, fromRole: user.role,
        targets,
      })
    }
    setActive({ appelId: appel.id, type, discussionId: disc.id })
  }, [user])

  const acceptIncoming = useCallback(async () => {
    const inc = incomingRef.current
    if (!inc) return
    ringtone.stop()
    setIncoming(null)
    await joinAppel(inc.appelId, user.id)
    setActive({ appelId: inc.appelId, type: inc.type, discussionId: inc.discussionId })
  }, [user, ringtone])

  const refuseIncoming = useCallback(async () => {
    const inc = incomingRef.current
    if (!inc) return
    ringtone.stop()
    setIncoming(null)
    const r = await refuseAppel(inc.appelId, user.id)
    if (r?.message && r?.discussion_id) broadcastToDiscussion(r.discussion_id, r.message)
  }, [user, ringtone])

  // Fin d'appel : CallView a déjà appelé appel_end et nous transmet le résultat.
  const handleEnded = useCallback((result) => {
    const a = activeRef.current
    setActive(null)
    if (result?.message && result?.discussion_id) broadcastToDiscussion(result.discussion_id, result.message)
    // Stoppe la sonnerie chez les invités qui n'avaient pas encore répondu.
    if (a && inviteChRef.current) sendInviteCancel(inviteChRef.current, { appelId: a.appelId })
  }, [])

  return (
    <CallContext.Provider value={{ startCall, active }}>
      {children}
      {incoming && !active && (
        <IncomingCallModal incoming={incoming} onAccept={acceptIncoming} onRefuse={refuseIncoming} />
      )}
      {active && <CallView appel={active} onEnded={handleEnded} />}
    </CallContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall doit être utilisé dans <CallProvider>')
  return ctx
}
