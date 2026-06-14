import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FallGuy from './FallGuy'

// Le bonhomme de l'utilisateur, animé : oscille en continu (idle),
// saute quand son solde (donuts + gemmes) augmente, se dandine à chaque
// changement de page. C'est le « compagnon » qui suit l'élève partout.
export default function Buddy({ className = '' }) {
  const { user } = useAuth()
  const location = useLocation()
  const [anim, setAnim] = useState('idle')
  const prevTotal = useRef((user?.donuts ?? 0) + (user?.gemmes ?? 0))
  const timer = useRef()

  const play = (a) => {
    clearTimeout(timer.current)
    setAnim(a)
    timer.current = setTimeout(() => setAnim('idle'), a === 'jump' ? 900 : 700)
  }

  // Saut de joie quand le solde augmente (gain de donuts/gemmes)
  useEffect(() => {
    const total = (user?.donuts ?? 0) + (user?.gemmes ?? 0)
    if (total > prevTotal.current) play('jump')
    prevTotal.current = total
  }, [user?.donuts, user?.gemmes])

  // Dandinement à chaque navigation
  useEffect(() => {
    play('walk')
  }, [location.pathname])

  useEffect(() => () => clearTimeout(timer.current), [])

  return <FallGuy className={className} avatar={user?.avatar} anim={anim} role={user?.role} />
}
