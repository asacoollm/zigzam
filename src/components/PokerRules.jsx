import { useEffect, useState } from 'react'
import FallGuy from './FallGuy'
import './PokerRules.css'

// 3 joueurs fictifs pour le tutoriel (bonhommes Fall Guys de couleurs différentes).
const TUTO_PLAYERS = [
  { name: 'Lucas', avatar: { color: 'rose' } },
  { name: 'Emma', avatar: { color: 'bleu' } },
  { name: 'Noah', avatar: { color: 'orange' } },
]

// Mini-partie scriptée : chaque étape décrit les piles de chaque joueur
// ('down' = carte face cachée, 'flower' = 🌸 révélée, 'skull' = 💀 révélée),
// le challenger éventuel, et une bulle de commentaire.
const TUTO_STEPS = [
  {
    bubble: 'Voici une manche de Skull avec 3 joueurs : Lucas, Emma et Noah 🃏. Chacun a 3 fleurs 🌸 et 1 crâne 💀… mais on ne voit pas qui est qui !',
    stacks: [[], [], []],
  },
  {
    bubble: 'Préparation : chacun pose UNE carte face cachée sur son tapis.',
    stacks: [['down'], ['down'], ['down']],
  },
  {
    bubble: 'Ici Lucas pose une 2e carte face cachée… une fleur 🌸 (mais personne ne le sait).',
    stacks: [['down', 'down'], ['down'], ['down']],
    speaker: 0,
  },
  {
    bubble: 'Emma pose une carte aussi… c\'est son crâne 💀 ! Tout est caché, alors elle bluffe 😈',
    stacks: [['down', 'down'], ['down', 'down'], ['down']],
    speaker: 1,
  },
  {
    bubble: 'Noah décide de lancer un défi ! Il parie qu\'il retournera 2 cartes sans tomber sur un crâne 🎯',
    stacks: [['down', 'down'], ['down', 'down'], ['down']],
    speaker: 2,
    challenger: 2,
    target: 2,
  },
  {
    bubble: 'Lucas et Emma préfèrent passer 🙅. Noah reste tout seul : il devient le challenger !',
    stacks: [['down', 'down'], ['down', 'down'], ['down']],
    challenger: 2,
    target: 2,
  },
  {
    bubble: 'Le challenger doit retourner SES cartes EN PREMIER. Noah retourne la sienne : une fleur 🌸 ! (1 sur 2)',
    stacks: [['down', 'down'], ['down', 'down'], ['flower']],
    challenger: 2,
    target: 2,
  },
  {
    bubble: 'Ensuite il peut retourner la carte d\'un autre joueur. Il choisit Lucas : encore une fleur 🌸 ! (2 sur 2) 🎉',
    stacks: [['down', 'flower'], ['down', 'down'], ['flower']],
    challenger: 2,
    target: 2,
  },
  {
    bubble: 'Réussi ! Noah retourne son tapis du côté fleur 🌸. Encore un défi réussi et il gagne la partie 🏆',
    stacks: [['down', 'flower'], ['down', 'down'], ['flower']],
    challenger: 2,
    win: true,
  },
  {
    bubble: '⚠️ S\'il avait retourné la carte d\'Emma, il serait tombé sur le crâne 💀 et aurait perdu une carte ! Tout l\'art du jeu, c\'est de bluffer 😏. À toi de jouer !',
    stacks: [['down', 'flower'], ['down', 'skull'], ['flower']],
  },
]

function TutoCard({ kind }) {
  if (kind === 'down') return <span className="ptuto__card ptuto__card--down" />
  return (
    <span className={`ptuto__card ptuto__card--up ${kind === 'skull' ? 'ptuto__card--skull' : ''}`}>
      {kind === 'skull' ? '💀' : '🌸'}
    </span>
  )
}

export default function PokerRules({ onClose }) {
  const [tab, setTab] = useState('regles')
  const [step, setStep] = useState(0)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const s = TUTO_STEPS[step]

  return (
    <div className="poker__overlay" onMouseDown={onClose}>
      <div className="pr" onMouseDown={(e) => e.stopPropagation()}>
        <header className="pr__head">
          <div className="pr__tabs">
            <button
              className={`pr__tab ${tab === 'regles' ? 'pr__tab--on' : ''}`}
              onClick={() => setTab('regles')}
            >📖 Règles</button>
            <button
              className={`pr__tab ${tab === 'tuto' ? 'pr__tab--on' : ''}`}
              onClick={() => setTab('tuto')}
            >🎮 Tutoriel</button>
          </div>
          <button className="pr__close" onClick={onClose} aria-label="Fermer">✕</button>
        </header>

        {tab === 'regles' && (
          <div className="pr__body">
            <p>Le but : être le premier à <strong>réussir 2 défis</strong>, ou le <strong>dernier joueur encore en jeu</strong> ! 🏆</p>
            <p>Chaque joueur a <strong>4 cartes</strong> : 3 fleurs 🌸 et 1 crâne 💀. On les pose toujours <strong>face cachée</strong>, alors personne ne sait ce que tu poses !</p>
            <p><strong>1. On pose :</strong> à tour de rôle, pose une carte face cachée sur ton tapis.</p>
            <p><strong>2. Le défi :</strong> au lieu de poser, tu peux te lancer un défi : annoncer combien de cartes tu vas retourner <strong>sans tomber sur un crâne</strong>. Les autres surenchérissent (plus de cartes) ou passent 🙅. Le dernier qui reste est le <strong>challenger</strong>.</p>
            <p><strong>3. On retourne :</strong> le challenger retourne les cartes une par une, <strong>en commençant TOUJOURS par les siennes</strong>, puis celles des autres s\'il le souhaite.</p>
            <p>🌸 <strong>Que des fleurs ?</strong> → défi réussi ! Il retourne son tapis côté fleur 🌸.</p>
            <p>💀 <strong>Un crâne ?</strong> → défi raté ! Il perd une carte au hasard. Plus de carte du tout = éliminé !</p>
            <p>🍀 <strong>Dernière chance :</strong> quand il te reste 1 seule carte, tu reçois une fleur bonus pour une manche (une seule fois).</p>
            <p className="pr__tip">💡 Astuce : pose parfois ton crâne pour piéger le challenger… mais attention, tu pourrais le retourner toi-même !</p>
            <button className="poker__btn pr__ok" onClick={onClose}>Compris ! 👍</button>
          </div>
        )}

        {tab === 'tuto' && (
          <div className="pr__tuto">
            <div className="pr__board">
              {TUTO_PLAYERS.map((p, i) => (
                <div
                  key={p.name}
                  className={`ptuto__player ${s.challenger === i ? 'ptuto__player--challenger' : ''} ${s.speaker === i ? 'ptuto__player--speaking' : ''}`}
                >
                  <FallGuy avatar={p.avatar} className="ptuto__av" anim={s.speaker === i ? 'idle' : null} />
                  <span className="ptuto__name">
                    {p.name}
                    {s.challenger === i && <span className="ptuto__badge">🎯 {s.target ?? ''}</span>}
                    {s.win && s.challenger === i && <span className="ptuto__badge ptuto__badge--win">🌸</span>}
                  </span>
                  <span className="ptuto__mat">
                    {s.stacks[i].length === 0
                      ? <span className="ptuto__card ptuto__card--empty" />
                      : s.stacks[i].map((k, j) => <TutoCard key={j} kind={k} />)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pr__bubble">{s.bubble}</div>

            <div className="pr__nav">
              <button
                className="poker__btn poker__btn--ghost poker__btn--sm"
                onClick={() => setStep((n) => Math.max(0, n - 1))}
                disabled={step === 0}
              >← Précédent</button>
              <span className="pr__progress">{step + 1} / {TUTO_STEPS.length}</span>
              {step < TUTO_STEPS.length - 1 ? (
                <button className="poker__btn poker__btn--sm" onClick={() => setStep((n) => n + 1)}>
                  Suivant →
                </button>
              ) : (
                <button className="poker__btn poker__btn--sm" onClick={() => setStep(0)}>
                  ↺ Recommencer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
