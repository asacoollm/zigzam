import FallGuy from './FallGuy'
import './Backdrop.css'

// Décor de fond partagé par toutes les pages :
// anneaux colorés 3D, boules radiales lumineuses et bonhommes Fall Guys.
export default function Backdrop() {
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
