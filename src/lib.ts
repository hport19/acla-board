import { useEffect, useState, useSyncExternalStore } from 'react'
import type { RoomKey } from './store/types'
import { toUrl, fromUrl } from './edition'

/* ---------- routing ---------- */

const routeListeners = new Set<() => void>()
window.addEventListener('popstate', () => routeListeners.forEach((l) => l()))

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const url = toUrl(path)
  if (url === location.pathname + location.search) return
  // Remember where a pushed page came from, so closing it can step back instead of piling up history.
  if (opts.replace) history.replaceState(history.state, '', url)
  else history.pushState({ from: fromUrl(location.pathname) }, '', url)
  routeListeners.forEach((l) => l())
}

export const PHONE = '(max-width: 820px)'
export const isPhone = () => matchMedia(PHONE).matches
export const usePhone = () => useMedia(PHONE)

/** Open an item in a room. On a phone it opens as a sheet over the room, so it is a step back can undo. */
export function openDetail(path: string) {
  const hasId = fromUrl(location.pathname).split('/').filter(Boolean).length > 1
  navigate(path, { replace: hasId && !isPhone() })
}

/** Close an item and return to its room: step back if that is where we came from. */
export function closeTo(path: string) {
  if (history.state?.from === path) history.back()
  else navigate(path, { replace: true })
}

/** A short tap of the motor, where the phone has one. */
export const buzz = (ms = 8) => { try { navigator.vibrate?.(ms) } catch { /* not supported */ } }

export function useRoute() {
  const path = useSyncExternalStore(
    (fn) => { routeListeners.add(fn); return () => routeListeners.delete(fn) },
    () => fromUrl(location.pathname),
  )
  const parts = path.split('/').filter(Boolean)
  const rooms: RoomKey[] = ['home', 'board', 'meetings', 'votes', 'events', 'artists', 'programs', 'money', 'documents']
  const room = (rooms.includes(parts[0] as RoomKey) ? parts[0] : 'home') as RoomKey
  return { room, id: parts[1], sub: parts[2], path }
}

/* ---------- formatting ---------- */

export const money = (n: number, opts: { cents?: boolean; compact?: boolean } = {}) => {
  if (opts.compact && Math.abs(n) >= 1000) {
    const k = n / 1000
    return `$${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: opts.cents ? 2 : 0 })
}

export const num = (n: number) => n.toLocaleString('en-US')

export const day = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-US', opts)

export const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export const DAY = 86400000

export function daysFrom(iso: string, from = Date.now()) {
  const a = new Date(iso); a.setHours(0, 0, 0, 0)
  const b = new Date(from); b.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - b.getTime()) / DAY)
}

export function relDay(iso: string) {
  const d = daysFrom(iso)
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d === -1) return 'yesterday'
  if (d > 1 && d < 7) return `in ${d} days`
  if (d < -1 && d > -7) return `${-d} days ago`
  if (d >= 7 && d < 60) return `in ${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? 's' : ''}`
  if (d <= -7 && d > -60) return `${Math.round(-d / 7)} week${Math.round(-d / 7) > 1 ? 's' : ''} ago`
  return day(iso, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400 && new Date(iso).getDate() === new Date().getDate()) return `today, ${time(iso)}`
  return relDay(iso)
}

export const firstName = (name: string) => name.split(' ')[0]
export const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w)).map((w) => w[0]).slice(0, 2).join('')

/* ---------- small hooks ---------- */

export function useReducedMotion() {
  const [r, set] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => set(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [])
  return r
}

export function useMedia(q: string) {
  const [r, set] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const fn = () => set(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [q])
  return r
}

export function useNow(ms = 1000) {
  const [now, set] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => set(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

/** deterministic pseudo-random generator for generative art */
export function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
