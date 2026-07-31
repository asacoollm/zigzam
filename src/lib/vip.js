// ============================================================
//  ZIGZAM — Statut Pass VIP 👑
// ============================================================
import { useEffect, useState } from 'react'

// True si vip_expire_at est dans le futur.
export function isVipActive(vipExpireAt) {
  return !!vipExpireAt && new Date(vipExpireAt).getTime() > Date.now()
}

// Temps restant (ms) avant expiration, 0 si non VIP.
export function vipTimeLeftMs(vipExpireAt) {
  if (!isVipActive(vipExpireAt)) return 0
  return new Date(vipExpireAt).getTime() - Date.now()
}

// Formatte le temps restant en texte court ("13j 4h", "2h 10min", "5min").
export function formatVipTimeLeft(vipExpireAt) {
  const ms = vipTimeLeftMs(vipExpireAt)
  if (ms <= 0) return ''
  const minutes = Math.floor(ms / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}j ${hours}h`
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
}

// formatVipTimeLeft() lit Date.now() à chaque appel, mais un composant ne se
// re-rend que si son state/props changent : sans ce hook, le décompte reste
// figé jusqu'au prochain rendu déclenché par autre chose. On force un
// re-render chaque minute (tant que le VIP est actif) pour qu'il avance seul.
export function useVipCountdown(active) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [active])
}
