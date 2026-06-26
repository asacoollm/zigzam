import { useState } from 'react'

// Sélecteur de date de naissance « jour / mois / année » (3 vrais <select>).
// value : chaîne ISO 'AAAA-MM-JJ' (sert uniquement de valeur initiale).
// onChange(iso) : appelé avec l'ISO complète dès que les 3 champs sont remplis,
//   sinon '' tant que la date est incomplète.
//
// Important : le composant garde son propre état interne (jour/mois/année).
// Sans cela, une sélection partielle renverrait '' au parent, qui réinitialiserait
// les menus → impossible de remplir les 3 champs (bug corrigé).

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
// Élèves de CM1/CM2 → années de naissance 2010 à 2016.
const ANNEES = [2010, 2011, 2012, 2013, 2014, 2015, 2016]
const JOURS = Array.from({ length: 31 }, (_, i) => i + 1) // 1 à 31

const pad = (n) => String(Number(n)).padStart(2, '0')

function parse(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return { y: '', mo: '', d: '' }
  return { y: m[1], mo: String(Number(m[2])), d: String(Number(m[3])) }
}

export default function BirthdatePicker({ value, onChange, autoFocus }) {
  const init = parse(value)
  const [d, setD] = useState(init.d)
  const [mo, setMo] = useState(init.mo)
  const [y, setY] = useState(init.y)

  // Émet l'ISO complète (ou '' si incomplet) à partir des 3 valeurs courantes.
  const emit = (nd, nmo, ny) => {
    onChange(nd && nmo && ny ? `${ny}-${pad(nmo)}-${pad(nd)}` : '')
  }

  const onDay = (e) => { const v = e.target.value; setD(v); emit(v, mo, y) }
  const onMonth = (e) => { const v = e.target.value; setMo(v); emit(d, v, y) }
  const onYear = (e) => { const v = e.target.value; setY(v); emit(d, mo, v) }

  return (
    <div className="birthdate">
      <select
        className="birthdate__select"
        value={d}
        autoFocus={autoFocus}
        onChange={onDay}
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
        onChange={onMonth}
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
        onChange={onYear}
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
