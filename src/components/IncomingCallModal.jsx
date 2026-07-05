import FallGuy from './FallGuy'
import './IncomingCallModal.css'

// Modale « on t'appelle » (sonnerie gérée par le provider).
export default function IncomingCallModal({ incoming, onAccept, onRefuse }) {
  const { type, fromPseudo, fromAvatar, fromRole } = incoming
  return (
    <div className="incall">
      <div className="incall__panel" role="dialog" aria-modal="true">
        <div className="incall__avatar-ring">
          <FallGuy avatar={fromAvatar ?? null} role={fromRole} anim="idle" className="incall__avatar" />
        </div>
        <p className="incall__type">{type === 'video' ? '📹 Appel vidéo' : '📞 Appel audio'}</p>
        <h2 className="incall__title">{fromPseudo} t'appelle !</h2>
        <div className="incall__actions">
          <button className="incall__btn incall__btn--refuse" onClick={onRefuse}>
            <span className="incall__btn-emoji">❌</span>
            Refuser
          </button>
          <button className="incall__btn incall__btn--accept" onClick={onAccept}>
            <span className="incall__btn-emoji">✅</span>
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
