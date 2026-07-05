import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaison } from '../context/SaisonContext'
import FallGuy from './FallGuy'

// Le bonhomme de l'utilisateur, animé : oscille en continu (idle),
// saute quand son solde (donuts + gemmes) augmente, se dandine à chaque
// changement de page. C'est le « compagnon » qui suit l'élève partout.
// Pendant une saison, il fait une entrée en courant depuis la droite.
export default function Buddy({ className = '' }) {
  const { user } = useAuth()
  const { active } = useSaison()
  const location = useLocation()
  const [anim, setAnim] = useState(active ? 'enter' : 'idle')
  const prevTotal = useRef((user?.donuts ?? 0) + (user?.gemmes ?? 0))
  const mounted = useRef(false)
  const timer = useRef()

  const play = (a) => {
    clearTimeout(timer.current)
    setAnim(a)
    const d = a === 'jump' ? 900 : a === 'enter' ? 1000 : 700
    timer.current = setTimeout(() => setAnim('idle'), d)
  }

  // Saut de joie quand le solde augmente (gain de donuts/gemmes)
  useEffect(() => {
    const total = (user?.donuts ?? 0) + (user?.gemmes ?? 0)
    if (total > prevTotal.current) play('jump')
    prevTotal.current = total
  }, [user?.donuts, user?.gemmes])

  // Au 1er montage : entrée en courant pendant la saison, sinon idle.
  // Aux navigations suivantes : petit dandinement.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      if (active) play('enter')
      return
    }
    play('walk')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => () => clearTimeout(timer.current), [])

  return <FallGuy className={className} avatar={user?.avatar} anim={anim} role={user?.role} />
}
