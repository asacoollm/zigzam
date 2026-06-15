import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  pokerJoin, pokerStart, pokerSave, pokerFinish, pokerState, pokerLeave,
  pokerAddBot, pokerRemoveBot, subscribePoker, broadcastPoker,
  initGame, placeDisk, launchChallenge, raise, pass, flipDisk, nextRound, botAction, actorIndex,
  flowersLeft, skullLeft, totalPlaced, ownedTotal,
} from '../lib/poker'
import Backdrop from '../components/Backdrop'
import ZigzamLogo from '../components/ZigzamLogo'
import FallGuy from '../components/FallGuy'
import './PokerDonuts.css'

const PHASE_LABEL = {
  placing: 'Pose un disque',
  bidding: 'Enchère en cours',
  resolving: 'Résolution du défi',
  round_end: 'Fin de manche',
}

export default function PokerDonuts() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [bidInput, setBidInput] = useState(1)
  const [busy, setBusy] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const channelRef = useRef(null)
  const sessionRef = useRef(null)
  const finishedRef = useRef(false)
  const rewardedRef = useRef(false)
  const initRef = useRef(false)
  const botTimer = useRef(null)

  const session = data?.session || null
  const joueurs = data?.joueurs || []
  const etat = data?.etat && data.etat.players ? data.etat : null

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

  const push = async (newEtat, statut = '') => {
    setBusy(true)
    setData((d) => ({ ...d, etat: newEtat }))
    const sid = sessionRef.current?.id
    const st = await pokerSave(sid, user.id, newEtat, statut)
    sync(st)
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }

  // L'hôte (1er joueur humain) construit l'état initial du jeu.
  useEffect(() => {
    if (data?.session?.statut !== 'playing') return
    if (data?.etat && data.etat.players) return // déjà initialisé
    const host = (data?.joueurs || []).find((j) => !j.is_bot)
    if (!host || host.user_id !== user.id || initRef.current) return
    initRef.current = true
    const fp = Math.floor(Math.random() * data.joueurs.length)
    push(initGame(data.joueurs, fp))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user.id])

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

  // Pilote des bots : seul l'hôte (1er joueur humain) joue les coups des bots.
  useEffect(() => {
    const e = data?.etat && data.etat.players ? data.etat : null
    if (!e || data?.session?.statut !== 'playing') return
    const host = e.players.find((p) => !p.is_bot)
    if (!host || host.user_id !== user.id) return
    const idx = actorIndex(e)
    if (idx < 0) return
    const actor = e.players[idx]
    if (!actor || !actor.is_bot) return
    clearTimeout(botTimer.current)
    botTimer.current = setTimeout(() => {
      const next = botAction(e, idx)
      if (next !== e) push(next)
    }, 1100)
    return () => clearTimeout(botTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user.id])

  const addBot = async () => {
    setBusy(true)
    sync(await pokerAddBot(sessionRef.current?.id))
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }
  const removeBot = async () => {
    setBusy(true)
    sync(await pokerRemoveBot(sessionRef.current?.id))
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }
  const start = async () => {
    setBusy(true)
    sync(await pokerStart(sessionRef.current?.id, user.id))
    if (channelRef.current) broadcastPoker(channelRef.current)
    setBusy(false)
  }
  const leave = () => {
    const sid = sessionRef.current?.id
    if (sid) pokerLeave(sid, user.id)
    navigate('/dashboard')
  }

  const rulesButton = () => (
    <button className="poker__rules-btn" onClick={() => setShowRules(true)}>📖 Lire les règles</button>
  )
  const rulesModal = () => (
    <div className="poker__overlay" onMouseDown={() => setShowRules(false)}>
      <div className="poker__rules" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="poker__rules-title">📖 Règles du Poker Donuts 🃏</h2>
        <div className="poker__rules-body">
          <p>Chaque joueur a <strong>4 disques</strong> : 3 fleurs 🌸 et 1 crâne 💀 (face cachée).</p>
          <p><strong>1. On pose :</strong> à tour de rôle, pose un disque face cachée sur ton tapis.</p>
          <p><strong>2. Le défi :</strong> au lieu de poser, tu peux parier que tu retourneras X disques sans crâne. Les autres surenchérissent ou passent. Le dernier qui reste devient le <strong>challenger</strong>.</p>
          <p><strong>3. On retourne :</strong> le challenger retourne les disques, <strong>en commençant par les siens</strong>.</p>
          <p>🌸 <strong>Que des fleurs ?</strong> → il gagne la manche et retourne son tapis côté fleur.</p>
          <p>💀 <strong>Un crâne ?</strong> → il perd un disque au hasard. Plus de disque = éliminé !</p>
          <p>🍀 <strong>Dernière chance :</strong> en tombant à 1 disque, tu reçois un disque fleur bonus pour 1 manche (une seule fois).</p>
          <p>🏆 <strong>Gagner :</strong> remporte 2 manches (tapis déjà côté fleur), ou sois le dernier en jeu !</p>
        </div>
        <button className="poker__btn" onClick={() => setShowRules(false)}>Compris ! 👍</button>
      </div>
    </div>
  )

  if (!session) {
    return <div className="poker"><Backdrop /><div className="poker__loading">🃏 Connexion à la table…</div></div>
  }

  // ----- Salle d'attente -----
  if (session.statut === 'waiting') {
    return (
      <div className="poker">
        <Backdrop />
        <header className="poker__top">
          <button className="poker__back" onClick={leave}>⬅️ Quitter</button>
          <ZigzamLogo size="sm" />
          {rulesButton()}
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
          <button className="poker__btn poker__btn--sm" disabled={joueurs.length >= 6 || busy} onClick={addBot}>🤖 Ajouter un bot</button>
          {joueurs.some((j) => j.is_bot) && (
            <button className="poker__btn poker__btn--sm poker__btn--ghost" disabled={busy} onClick={removeBot}>❌ Retirer un bot</button>
          )}
        </div>
        <button className="poker__btn" disabled={joueurs.length < 3 || busy} onClick={start}>
          {joueurs.length < 3 ? 'Il manque des joueurs…' : 'Démarrer la partie 🚀'}
        </button>
        {showRules && rulesModal()}
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

  // ----- Distribution (état en cours d'initialisation par l'hôte) -----
  if (!etat) {
    return <div className="poker"><Backdrop /><div className="poker__loading">🃏 Distribution des disques…</div></div>
  }

  // ----- Partie en cours -----
  const players = etat.players
  const myIdx = players.findIndex((p) => p.user_id === user.id)
  const me = myIdx >= 0 ? players[myIdx] : null
  const isMyTurn = actorIndex(etat) === myIdx && me && !me.out
  const placed = totalPlaced(etat)
  const r = etat.resolve
  const isChallenger = etat.phase === 'resolving' && r && players[r.challenger]?.user_id === user.id

  const seatStyle = (i) => {
    const ang = (i / players.length) * 2 * Math.PI - Math.PI / 2
    return { left: `${50 + 42 * Math.cos(ang)}%`, top: `${50 + 42 * Math.sin(ang)}%` }
  }
  const revealedCount = (ownerIdx) => (r ? r.revealed.filter((x) => x.owner === ownerIdx).length : 0)
  // Un joueur peut-il retourner la pile du joueur `i` maintenant ?
  const canFlip = (i) => {
    if (!isChallenger) return false
    if (players[i].stack.length <= revealedCount(i)) return false
    const ownRevealed = revealedCount(r.challenger)
    if (ownRevealed < players[r.challenger].stack.length && i !== r.challenger) return false
    return true
  }

  const phaseText = etat.phase === 'placing'
    ? (etat.prep ? 'Préparation : pose un disque' : 'Pose un disque ou lance un défi')
    : PHASE_LABEL[etat.phase] || ''

  return (
    <div className="poker">
      <Backdrop />
      <header className="poker__top">
        <button className="poker__back" onClick={leave}>⬅️ Quitter</button>
        {rulesButton()}
        <span className="poker__round">
          Manche {etat.round}{etat.phase === 'resolving' && r ? ` · défi ${r.target}` : ''}
        </span>
      </header>

      <p className="poker__phase">{phaseText}</p>

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
            const isTurn = actorIndex(etat) === i
            const flippable = canFlip(i)
            return (
              <div
                key={p.user_id}
                className={`poker__seat ${isTurn ? 'poker__seat--turn' : ''} ${p.out ? 'poker__seat--out' : ''} ${p.user_id === user.id ? 'poker__seat--me' : ''}`}
                style={seatStyle(i)}
              >
                <FallGuy avatar={p.avatar} role={p.role} className="poker__seat-av" anim={isTurn ? 'idle' : null} />
                <span className="poker__seat-name">{p.pseudo}{p.passed ? ' 🙅' : ''}</span>
                <span className="poker__seat-info">🃏 {ownedTotal(p)}{p.mat === 'flower' ? ' · 🌸' : ''}{p.bonus ? ' · 🍀' : ''}</span>
                {/* Tapis + pile de disques posés (légèrement décalés) */}
                <button
                  className={`poker__mat ${p.mat === 'flower' ? 'poker__mat--flower' : ''} ${flippable ? 'poker__mat--flip' : ''}`}
                  onClick={() => flippable && push(flipDisk(etat, i))}
                  disabled={!flippable}
                  aria-label={`Tapis de ${p.pseudo}`}
                >
                  {p.stack.map((_, k) => {
                    const isUp = r && (p.stack.length - 1 - k) < revealedCount(i)
                    const disk = isUp ? p.stack[k] : null
                    return (
                      <span key={k} className={`poker__disk ${isUp ? 'poker__disk--up' : ''}`} style={{ marginTop: k === 0 ? 0 : -14 }}>
                        {isUp ? (disk === 'skull' ? '💀' : '🌸') : '⬤'}
                      </span>
                    )
                  })}
                  {p.stack.length === 0 && <span className="poker__disk poker__disk--empty" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ma main (disques que je peux poser) */}
      {me && !me.out && (
        <div className="poker__hand">
          <span className="poker__hand-label">Ta main :</span>
          {Array.from({ length: Math.max(0, flowersLeft(me)) }).map((_, k) => (
            <button key={`f${k}`} className="poker__hand-disk poker__hand-disk--flower"
              disabled={busy || !(etat.phase === 'placing' && isMyTurn)}
              onClick={() => push(placeDisk(etat, myIdx, 'flower'))}>🌸</button>
          ))}
          {skullLeft(me) > 0 && (
            <button className="poker__hand-disk poker__hand-disk--skull"
              disabled={busy || !(etat.phase === 'placing' && isMyTurn)}
              onClick={() => push(placeDisk(etat, myIdx, 'skull'))}>💀</button>
          )}
          {me.bonus > 0 && <span className="poker__hand-bonus">🍀 Dernière chance</span>}
        </div>
      )}

      {/* Contrôles selon la phase */}
      <div className="poker__controls">
        {etat.phase === 'placing' && isMyTurn && !etat.prep && (
          <div className="poker__challenge">
            <input className="poker__bid-input" type="number" min="1" max={placed}
              value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} />
            <button className="poker__btn poker__btn--sm poker__btn--accent" disabled={busy || placed < 1}
              onClick={() => push(launchChallenge(etat, myIdx, Math.max(1, Math.min(bidInput, placed))))}>
              Lancer un défi : {Math.max(1, Math.min(bidInput, placed))} 🎯
            </button>
          </div>
        )}

        {etat.phase === 'bidding' && isMyTurn && (
          <div className="poker__challenge">
            <input className="poker__bid-input" type="number" min={(etat.bid?.amount ?? 0) + 1} max={placed}
              value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} />
            <button className="poker__btn poker__btn--sm poker__btn--accent"
              disabled={busy || bidInput <= (etat.bid?.amount ?? 0) || bidInput > placed}
              onClick={() => push(raise(etat, myIdx, bidInput))}>Surenchérir ⬆️</button>
            <button className="poker__btn poker__btn--sm" disabled={busy}
              onClick={() => push(pass(etat, myIdx))}>Passer 🙅</button>
          </div>
        )}

        {etat.phase === 'resolving' && (
          <p className="poker__instruct">
            {isChallenger
              ? `Retourne ${r.target} disque(s) — clique d'abord sur TES disques 👆`
              : `${players[r.challenger]?.pseudo} retourne les disques…`}
          </p>
        )}

        {etat.phase === 'round_end' && (
          <>
            <p className="poker__instruct">{r?.success ? '🎉 ' : '💀 '}{etat.log}</p>
            {isMyTurn && (
              <button className="poker__btn poker__btn--sm" disabled={busy}
                onClick={() => push(nextRound(etat))}>Manche suivante →</button>
            )}
          </>
        )}

        {!isMyTurn && etat.phase !== 'resolving' && etat.phase !== 'round_end' && (
          <p className="poker__instruct">⏳ Au tour de {players[actorIndex(etat)]?.pseudo}…</p>
        )}
      </div>

      {showRules && rulesModal()}
    </div>
  )
}
