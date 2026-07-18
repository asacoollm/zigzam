import FallGuy from './FallGuy'
import JurassicDecor from './JurassicDecor'
import DisneyDecor from './DisneyDecor'
import { useSaison } from '../context/SaisonContext'
import './Backdrop.css'

// Décor immersif + teintes des bonhommes, par saison.
//  Une saison sans entrée ici retombe sur le décor normal (garde-fou).
const DECORS = {
  jurassic: { Decor: JurassicDecor, guys: ['#3dd68c', '#8ff196'] },
  disney: { Decor: DisneyDecor, guys: ['#ffd76a', '#ff8fc7'] },
}

// Décor de fond partagé par toutes les pages.
//  - Hors saison : anneaux colorés 3D, boules radiales lumineuses et bonhommes.
//  - Pendant une saison : décor immersif dédié (Jurassic Web, Zigzamland…) +
//    bonhommes qui prennent l'attitude de la saison via le thème CSS.
export default function Backdrop() {
  const { active, slug } = useSaison()

  const theme = active ? DECORS[slug] : null
  if (theme) {
    const { Decor, guys } = theme
    return (
      <div className="backdrop backdrop--saison" aria-hidden="true">
        <Decor />
        {/* Bonhommes : conservés mais discrets, ils prennent la teinte de la saison. */}
        <FallGuy className="guy guy--1" color={guys[0]} />
        <FallGuy className="guy guy--2" color={guys[1]} />
      </div>
    )
  }

  return (
    <div className="backdrop" aria-hidden="true">
      {/* Anneaux 3D */}
      <span className="ring ring--1" />
      <span className="ring ring--2" />
      <span className="ring ring--3" />

      {/* Boules radiales */}
      <span className="orb orb--rose" />
      <span className="orb orb--bleu" />
      <span className="orb orb--vert" />
      <span className="orb orb--orange" />

      {/* Bonhommes Fall Guys qui flottent */}
      <FallGuy className="guy guy--1" color="#ff4d8d" />
      <FallGuy className="guy guy--2" color="#00bfff" />
      <FallGuy className="guy guy--3" color="#3dd68c" />
    </div>
  )
}
