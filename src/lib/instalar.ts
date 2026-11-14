// Captura o convite de instalação do navegador (Chrome/Edge/Android) e o estado online/offline.
import { useSyncExternalStore } from 'react'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let convite: EventoInstalar | null = null
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  convite = e as EventoInstalar
  avisar()
})
window.addEventListener('appinstalled', () => {
  convite = null
  avisar()
})
window.addEventListener('online', avisar)
window.addEventListener('offline', avisar)

const assinar = (f: () => void) => {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

export const useConviteInstalar = () => useSyncExternalStore(assinar, () => convite)
export const useOnline = () => useSyncExternalStore(assinar, () => navigator.onLine)

export const jaInstalado = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export async function instalar() {
  if (!convite) return false
  await convite.prompt()
  const { outcome } = await convite.userChoice
  convite = null
  avisar()
  return outcome === 'accepted'
}
