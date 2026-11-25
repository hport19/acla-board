import type { RoomKey } from '../store/types'

type P = { size?: number; className?: string }

const base = (size = 22) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
})

/* Room glyphs: drawn, slightly irregular strokes rather than a stock icon set. */
const glyphs: Record<RoomKey, React.ReactNode> = {
  home: (<><path d="M12 3.2c.9 2.4 2.9 3.6 5.3 3.4-.8 2.3-.1 4.4 1.9 5.7-2 1.1-2.9 3.2-2.3 5.5-2.3-.4-4.2.6-4.9 2.9-.8-2.3-2.7-3.4-5-3 .6-2.3-.3-4.4-2.3-5.5 2-1.2 2.7-3.3 2-5.6 2.4.2 4.4-1 5.3-3.4Z" /><circle cx="12" cy="12" r="2.6" /></>),
  board: (<><path d="M4 17.5c1.6-3.8 4.4-5.6 8-5.6s6.4 1.8 8 5.6" /><circle cx="6.5" cy="9" r="1.7" /><circle cx="12" cy="6.6" r="1.9" /><circle cx="17.5" cy="9" r="1.7" /><path d="M3 20.3h18" /></>),
  meetings: (<><path d="M5 4.5h14M6.5 4.5v15M17.5 4.5v15" /><path d="M9.5 9h5M9.5 12.5h5M9.5 16h3" /></>),
  votes: (<><path d="M4.5 12.8 9 17.2l10.5-10.4" /><path d="M3.5 20.5h17" opacity=".55" /></>),
  events: (<><path d="M3.5 15.5c3-6 6-9 8.5-9s5.5 3 8.5 9" /><circle cx="7" cy="12.2" r="1.1" fill="currentColor" /><circle cx="12" cy="6.5" r="1.3" fill="currentColor" /><circle cx="17" cy="12.2" r="1.1" fill="currentColor" /><path d="M3.5 19.5h17" /></>),
  artists: (<><rect x="4.5" y="4" width="15" height="16" rx="1" /><rect x="7.5" y="7" width="9" height="10" rx=".5" /><path d="m8 15 2.6-3 2 2 1.6-1.6L16 15" /></>),
  programs: (<><path d="M12 20.5V9" /><path d="M12 13c-3.8.2-6-1.7-6.5-5.6 3.8-.1 6 1.8 6.5 5.6Z" /><path d="M12 10.5c.3-3.8 2.5-5.8 6.5-6-.1 3.9-2.3 6-6.5 6Z" /></>),
  money: (<><path d="M7 7.5c0-1.7 2.2-3 5-3s5 1.3 5 3c0 1.6-1.6 2.3-5 3s-5 1.4-5 3c0 1.7 2.2 3 5 3s5-1.3 5-3" transform="translate(0 1)" /><path d="M12 3v18" /></>),
  documents: (<><path d="M6.5 3.5h7.5l4 4v13h-11.5z" /><path d="M14 3.5v4h4" /><path d="M9 12h6M9 15h6M9 18h3.5" /></>),
}

export function RoomIcon({ room, size, className }: P & { room: RoomKey }) {
  return <svg {...base(size)} className={className}>{glyphs[room]}</svg>
}

export const Icon = {
  plus: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M12 5v14M5 12h14" /></svg>,
  check: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>,
  close: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  arrow: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  back: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  up: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="m6 14 6-6 6 6" /></svg>,
  down: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="m6 10 6 6 6-6" /></svg>,
  play: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" /></svg>,
  pause: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M8 5v14M16 5v14" strokeWidth="2.4" /></svg>,
  undo: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9.5a5 5 0 0 1 0 10H11" /></svg>,
  search: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></svg>,
  gavel: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="m14 4 6 6M11.5 6.5l6 6M13 5l-4.5 4.5 6 6L19 11" /><path d="m8.5 12.5-5 5 2 2 5-5" /><path d="M13 21h8" /></svg>,
  pen: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M4 20l1.2-4.4L15.8 5a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L8.4 18.8 4 20Z" /><path d="m13.5 7.3 3.2 3.2" /></svg>,
  heart: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" /></svg>,
  clock: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg>,
  pin: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>,
  mail: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></svg>,
  reset: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4h4" /></svg>,
  print: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M7 9V4h10v5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2" /><path d="M7 14h10v6H7z" /></svg>,
  star: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="m12 4 2.3 5 5.2.5-3.9 3.5 1.2 5.2L12 15.5l-4.8 2.7 1.2-5.2-3.9-3.5 5.2-.5z" /></svg>,
  drag: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><circle cx="9" cy="7" r=".8" fill="currentColor" /><circle cx="15" cy="7" r=".8" fill="currentColor" /><circle cx="9" cy="12" r=".8" fill="currentColor" /><circle cx="15" cy="12" r=".8" fill="currentColor" /><circle cx="9" cy="17" r=".8" fill="currentColor" /><circle cx="15" cy="17" r=".8" fill="currentColor" /></svg>,
  more: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><circle cx="6.5" cy="6.5" r="2.2" /><circle cx="17.5" cy="6.5" r="2.2" /><circle cx="6.5" cy="17.5" r="2.2" /><circle cx="17.5" cy="17.5" r="2.2" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></svg>,
  trash: (p: P) => <svg {...base(p.size ?? 18)} className={p.className}><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></svg>,
}
