import FallGuy from './FallGuy'
import JurassicDecor from './JurassicDecor'
import { useSaison } from '../context/SaisonContext'
import './Backdrop.css'

// Décor de fond partagé par toutes les pages.
//  - Hors saison : anneaux colorés 3D, boules radiales lumineuses et bonhommes.
//  - Pendant une saison : décor immersif dédié (ex. Jurassic Web) + bonhommes
//    qui prennent l'attitude de la saison (idle « apeuré ») via le thème CSS.
export default function Backdrop() {
  const { active } = useSaison()

  if (active) {
    return (
      <div className="backdrop backdrop--saison" aria-hidden="true">
        <JurassicDecor />
        {/* Bonhommes : conservés mais discrets, ils tremblent face aux dinos. */}
        <FallGuy className="guy guy--1" color="#3dd68c" />
        <FallGuy className="guy guy--2" color="#8ff196" />
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
