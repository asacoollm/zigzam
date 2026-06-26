// Sélecteur de date de naissance « jour / mois / année » (3 menus déroulants).
// value : chaîne ISO 'AAAA-MM-JJ' (ou '' si incomplet).
// onChange(iso) : appelé avec l'ISO complète, ou '' tant que les 3 champs ne
// sont pas tous renseignés.

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

// Année courante figée au chargement du module (évite Date.now() au rendu).
const ANNEE_COURANTE = new Date().getFullYear()
const ANNEES = Array.from({ length: 100 }, (_, i) => ANNEE_COURANTE - i)
const JOURS = Array.from({ length: 31 }, (_, i) => i + 1)

function parse(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return { y: '', mo: '', d: '' }
  return { y: m[1], mo: String(Number(m[2])), d: String(Number(m[3])) }
}

export default function BirthdatePicker({ value, onChange, autoFocus }) {
  const { y, mo, d } = parse(value)

  const emit = (ny, nmo, nd) => {
    if (ny && nmo && nd) {
      onChange(`${ny}-${String(Number(nmo)).padStart(2, '0')}-${String(Number(nd)).padStart(2, '0')}`)
    } else {
      onChange('')
    }
  }

  return (
    <div className="birthdate">
      <select
        className="birthdate__select"
        value={d}
        autoFocus={autoFocus}
        onChange={(e) => emit(y, mo, e.target.value)}
        aria-label="Jour"
      >
        <option value="">Jour</option>
        {JOURS.map((j) => (
          <option key={j} value={j}>{j}</option>
        ))}
      </select>
      <select
        className="birthdate__select"
        value={mo}
        onChange={(e) => emit(y, e.target.value, d)}
        aria-label="Mois"
      >
        <option value="">Mois</option>
        {MOIS.map((label, i) => (
          <option key={label} value={i + 1}>{label}</option>
        ))}
      </select>
      <select
        className="birthdate__select"
        value={y}
        onChange={(e) => emit(e.target.value, mo, d)}
        aria-label="Année"
      >
        <option value="">Année</option>
        {ANNEES.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}
