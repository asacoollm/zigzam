import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  pokerJoin, pokerStart, pokerSave, pokerFinish, pokerState, pokerLeave,
  pokerAddBot, pokerRemoveBot, subscribePoker, broadcastPoker,
  normPlayers, place, startBid, raise, pass, flipCard, nextRound, botAction,
  flowersLeft, skullLeft, totalPlaced, playerCardCount,
} from '../lib/poker'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './PokerDonuts.css'

export default function PokerDonuts() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [bidInput, setBidInput] = useState(1)
  const [busy, setBusy] = useState(false)
  const channelRef = useRef(null)
  const sessionRef = useRef(null)
  const finishedRef = useRef(false)
  const rewardedRef = useRef(false)

  const session = data?.session || null
  const joueurs = data?.joueurs || []
  const etat = data?.etat && data.etat.players ? normPlayers(data.etat) : null

  const sync = useCallback((st) => {
    if (!st || st.error) return
    setData(st)
    sessionRef.current = st.session
  }, [])

  // Rejoint une salle au montage.
  useEffect(() => {
    let on = true
    pokerJoin(user.id).then((st) => {
      if (!on) return
      sync(st)
      if (st?.session) {
        channelRef.current = subscribePoker(st.session.id, () => {
          pokerState(st.session.id).then((s) => on && sync(s))
        })
      }
    })
    return () => {
      on = false
      const sid = sessionRef.current?.id
      if (sid) pokerLeave(sid, user.id)
      if (channelRef.current) channelRef.current.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // Rafraîchissement périodique (filet de sécurité).
  useEffect(() => {
    if (!session) return
    const id = setInterval(() => {
      const sid = sessionRef.current?.id
      if (sid) pokerState(sid).then((s) => sync(s))
    }, 2500)
    return () => clearInterval(id)
  }, [session?.id, sync]) // eslint-disable-line react-hooks/exhaustive-deps

  // Crédite les donuts à la fin (une seule fois) côté serveur.
  useEffect(() => {
    if (etat?.phase === 'game_over' && etat.winner && !finishedRef.current) {
      finishedRef.current = true
      const sid = sessionRef.current?.id
      pokerFinish(sid, etat.winner).then(() => {
        if (channelRef.current) broadcastPoker(channelRef.current)
        if (!rewardedRef.current) {
          rewardedRef.current = true
          const win = etat.winner === user.id
          updateUser({ donuts: Math.max(0, user.donuts + (win ? 8 : -3)) })
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat?.phase, etat?.winner])

  const push = async (newEtat, statut = '') => {
    setBusy(true)
    setData((d) => ({ ...d, etat: newEtat }))
    const sid = sessionRef.current?.id
    const st = await pokerSave(sid, user.id, newEtat, statut)
    sync(st)
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }

  // Pilote des bots : seul l'hôte (1er joueur humain) joue les coups des bots.
  const botTimer = useRef(null)
  useEffect(() => {
    const e = data?.etat && data.etat.players ? normPlayers(data.etat) : null
    if (!e || data?.session?.statut !== 'playing') return
    const host = e.players.find((p) => !p.is_bot)
    if (!host || host.user_id !== user.id) return
    let actorIdx = -1
    if (e.phase === 'placing' || e.phase === 'bidding' || e.phase === 'round_end') actorIdx = e.turn
    else if (e.phase === 'flipping' && e.flip) actorIdx = e.flip.flipper
    if (actorIdx < 0) return
    const actor = e.players[actorIdx]
    if (!actor || !actor.is_bot || (actor.out && e.phase !== 'round_end')) return
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      const next = botAction(e, actorIdx)
      if (next !== e) push(next)
    }, 1000)
    return () => clearTimeout(botTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user.id])

  const addBot = async () => {
    setBusy(true)
    const st = await pokerAddBot(sessionRef.current?.id)
    sync(st)
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }
  const removeBot = async () => {
    setBusy(true)
    const st = await pokerRemoveBot(sessionRef.current?.id)
    sync(st)
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }

  const start = async () => {
    setBusy(true)
    const sid = sessionRef.current?.id
    const st = await pokerStart(sid, user.id)
    sync(st)
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }

  const leave = () => {
    const sid = sessionRef.current?.id
    if (sid) pokerLeave(sid, user.id)
    navigate('/dashboard')
  }

  if (!session) {
    return (
      <div className="poker">
        <Backdrop />
        <div className="poker__loading">🃏 Connexion à la table…</div>
      </div>
    )
  }

  // ----- Salle d'attente -----
  if (session.statut === 'waiting') {
    return (
      <div className="poker">
        <Backdrop />
        <header className="poker__top">
          <button className="poker__back" onClick={leave}>⬅️ Quitter</button>
          <ZigzamLogo size="sm" />
          <span />
        </header>
        <h1 className="poker__title">Poker Donuts 🃏</h1>
        <p className="poker__hint">Salle d'attente — il faut 3 à 6 joueurs.</p>
        <div className="poker__lobby">
          {joueurs.map((j) => (
            <div key={j.user_id} className="poker__lobby-player">
              <FallGuy avatar={j.avatar} role={j.role} className="poker__lobby-av" anim="idle" />
              <span className="poker__lobby-name">{j.pseudo}{j.user_id === user.id ? ' (toi)' : ''}</span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - joueurs.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="poker__lobby-player poker__lobby-player--empty">
              <span className="poker__lobby-q">?</span>
              <span className="poker__lobby-name">En attente…</span>
            </div>
          ))}
        </div>
        <p className="poker__count">{joueurs.length}/6 joueurs</p>
        <div className="poker__bot-btns">
          <button className="poker__btn poker__btn--sm" disabled={joueurs.length >= 6 || busy} onClick={addBot}>
            🤖 Ajouter un bot
          </button>
          {joueurs.some((j) => j.is_bot) && (
            <button className="poker__btn poker__btn--sm poker__btn--ghost" disabled={busy} onClick={removeBot}>
              ❌ Retirer un bot
            </button>
          )}
        </div>
        <button className="poker__btn" disabled={joueurs.length < 3 || busy} onClick={start}>
          {joueurs.length < 3 ? 'Il manque des joueurs…' : 'Démarrer la partie 🚀'}
        </button>
      </div>
    )
  }

  // ----- Fin de partie -----
  if (etat?.phase === 'game_over') {
    const win = etat.winner === user.id
    const winner = etat.players.find((p) => p.user_id === etat.winner)
    return (
      <div className="poker">
        <Backdrop />
        <div className="poker__overlay">
          <div className="poker__panel">
            <h2 className="poker__panel-title">{win ? '🏆 Victoire !' : '🃏 Partie terminée'}</h2>
            <FallGuy avatar={winner?.avatar} role={winner?.role} className="poker__panel-av" anim="jump" />
            <p className="poker__panel-text">
              <strong>{winner?.pseudo}</strong> remporte la partie&nbsp;!<br />
              {win ? <>Tu gagnes <strong>8 🍩</strong> donuts&nbsp;!</> : <>Tu perds <strong>3 🍩</strong> donuts.</>}
            </p>
            <div className="poker__panel-actions">
              <button className="poker__btn" onClick={() => navigate('/dashboard')}>Retour</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ----- Partie en cours -----
  const players = etat.players
  const myIdx = players.findIndex((p) => p.user_id === user.id)
  const me = players[myIdx]
  const isMyTurn = etat.turn === myIdx && me && !me.out
  const placed = totalPlaced(etat)
  const flip = etat.flip

  const canBid = etat.phase === 'placing' && isMyTurn && placed >= 1
  const isFlipper = etat.phase === 'flipping' && flip && players[flip.flipper]?.user_id === user.id

  // Disposition circulaire des joueurs autour de la table.
  const seatStyle = (i) => {
    const ang = (i / players.length) * 2 * Math.PI - Math.PI / 2
    return { left: `${50 + 42 * Math.cos(ang)}%`, top: `${50 + 42 * Math.sin(ang)}%` }
  }

  const revealedCount = (ownerIdx) =>
    flip ? flip.revealed.filter((r) => r.owner === ownerIdx).length : 0

  return (
    <div className="poker">
      <Backdrop />
      <header className="poker__top">
        <button className="poker__back" onClick={leave}>⬅️ Quitter</button>
        <ZigzamLogo size="sm" />
        <span className="poker__round">Manche {etat.round}{etat.phase === 'flipping' && flip ? ` · défi ${flip.target}` : ''}</span>
      </header>

      <div className="poker__table-wrap">
        <div className="poker__table">
          <div className="poker__table-center">
            <span className="poker__pot">🍩</span>
            <span className="poker__log">{etat.log}</span>
            {etat.bid && etat.phase === 'bidding' && (
              <span className="poker__bid">Mise : {etat.bid.amount} par {players[etat.bid.bidder]?.pseudo}</span>
            )}
          </div>

          {players.map((p, i) => {
            const isTurn = etat.turn === i && etat.phase !== 'flipping'
            const clickable = isFlipper && p.stack.length > revealedCount(i)
            return (
              <div
                key={p.user_id}
                className={`poker__seat ${isTurn ? 'poker__seat--turn' : ''} ${p.out ? 'poker__seat--out' : ''} ${p.user_id === user.id ? 'poker__seat--me' : ''}`}
                style={seatStyle(i)}
              >
                <FallGuy avatar={p.avatar} role={p.role} className="poker__seat-av" anim={isTurn ? 'idle' : null} />
                <span className="poker__seat-name">{p.pseudo}</span>
                <span className="poker__seat-info">
                  🃏 {playerCardCount(p)} · 🏆 {p.roundsWon}
                </span>
                <button
                  className={`poker__stack ${clickable ? 'poker__stack--clickable' : ''}`}
                  onClick={() => clickable && push(flipCard(etat, i))}
                  disabled={!clickable}
                  aria-label={`Pile de ${p.pseudo}`}
                >
                  {p.stack.map((_, k) => {
                    const isRevealed = flip && (p.stack.length - 1 - k) < revealedCount(i)
                    const card = isRevealed ? p.stack[k] : null
                    return (
                      <span key={k} className={`poker__card ${isRevealed ? 'poker__card--up' : ''}`}>
                        {isRevealed ? (card === 'skull' ? '💀' : '🌸') : '🂠'}
                      </span>
                    )
                  })}
                  {p.stack.length === 0 && <span className="poker__card poker__card--empty" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contrôles du joueur */}
      <div className="poker__controls">
        {etat.phase === 'placing' && isMyTurn && (
          <>
            <button className="poker__btn poker__btn--sm" disabled={busy || flowersLeft(me) <= 0}
              onClick={() => push(place(etat, myIdx, 'flower'))}>Poser 🌸</button>
            <button className="poker__btn poker__btn--sm" disabled={busy || skullLeft(me) <= 0}
              onClick={() => push(place(etat, myIdx, 'skull'))}>Poser 💀</button>
            <button className="poker__btn poker__btn--sm poker__btn--accent" disabled={busy || !canBid}
              onClick={() => push(startBid(etat, myIdx, Math.max(1, Math.min(bidInput, placed))))}>
              Défi : {Math.max(1, Math.min(bidInput, placed))} 🃏
            </button>
            <input className="poker__bid-input" type="number" min="1" max={placed}
              value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} />
          </>
        )}

        {etat.phase === 'bidding' && isMyTurn && (
          <>
            <input className="poker__bid-input" type="number" min={(etat.bid?.amount ?? 0) + 1} max={placed}
              value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} />
            <button className="poker__btn poker__btn--sm poker__btn--accent" disabled={busy || bidInput <= (etat.bid?.amount ?? 0) || bidInput > placed}
              onClick={() => push(raise(etat, myIdx, bidInput))}>Surenchérir ⬆️</button>
            <button className="poker__btn poker__btn--sm" disabled={busy}
              onClick={() => push(pass(etat, myIdx))}>Passer</button>
          </>
        )}

        {etat.phase === 'flipping' && (
          <p className="poker__instruct">
            {isFlipper
              ? `À toi de retourner ${flip.target} carte(s) — commence par les tiennes 👆`
              : `${players[flip.flipper]?.pseudo} retourne les cartes…`}
          </p>
        )}

        {etat.phase === 'round_end' && (
          <>
            <p className="poker__instruct">
              {flip?.success ? '🎉 Défi réussi !' : '💀 Crâne trouvé !'} {etat.log}
            </p>
            {etat.turn === myIdx && (
              <button className="poker__btn poker__btn--sm" disabled={busy}
                onClick={() => push(nextRound(etat))}>Manche suivante →</button>
            )}
          </>
        )}

        {!isMyTurn && etat.phase !== 'flipping' && etat.phase !== 'round_end' && (
          <p className="poker__instruct">⏳ Au tour de {players[etat.turn]?.pseudo}…</p>
        )}
      </div>
    </div>
  )
}
