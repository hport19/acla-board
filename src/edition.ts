/*
 * Two editions of the same platform, chosen by the address:
 *
 *   /…        the Amarillo Council for the Latino Arts: warm atelier, papel picado, cempasúchil
 *   /local/…  the Amarillo Council for the Local Arts (the assumed name): corporate, sober, navy and brass
 *
 * One build serves both. The edition only changes look, wording and demo data;
 * every room, rule and action is shared.
 */

export type Edition = 'latino' | 'local'

const LOCAL = '/local'

export const EDITION: Edition = location.pathname === LOCAL || location.pathname.startsWith(`${LOCAL}/`) ? 'local' : 'latino'
export const isLocal = EDITION === 'local'

/** The path prefix of this edition ('' or '/local'). */
export const BASE = isLocal ? LOCAL : ''

/** A room path ('/votes/v-1') as an address in this edition. */
export const toUrl = (path: string) => (BASE && path.startsWith('/') ? (path === '/' ? `${BASE}/` : BASE + path) : path)

/** An address back to a room path. */
export const fromUrl = (pathname: string) => {
  if (!BASE || !pathname.startsWith(BASE)) return pathname
  return pathname.slice(BASE.length) || '/'
}

export const BRAND = isLocal
  ? { name: 'Amarillo Council for the Local Arts', short: 'ACLA', sub: 'Board of Directors', app: 'ACLA Board', storage: 'acla-local-os', theme: '#0d1828' }
  : { name: 'Amarillo Council for the Latino Arts', short: 'ACLA', sub: 'Board of Directors', app: 'ACLA Board', storage: 'acla-board-os', theme: '#1f1a33' }

export function applyEdition() {
  const root = document.documentElement
  root.dataset.edition = EDITION
  if (!isLocal) return
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BRAND.theme)
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', '/manifest-local.webmanifest')
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', '/local-apple-touch-icon.png')
  document.querySelector('link[rel="icon"]')?.setAttribute('href', '/favicon-local.svg')
}
