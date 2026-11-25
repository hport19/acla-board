import { useEffect, useState, type ComponentType } from 'react'
import { isLocal } from './edition'
import { AnimatePresence, motion } from 'framer-motion'
import { navigate, useRoute, usePhone, relDay, day, money, buzz, daysFrom } from './lib'
import { useStore, resetDemo, ME } from './store/store'
import { roomCounts, nextMeeting, dir, attention, quorumOf, money$ } from './store/derive'
import type { State } from './store/types'
import type { RoomKey } from './store/types'
import { RoomIcon, Icon } from './ui/Icons'
import { Portrait } from './ui/Portrait'
import { Toasts, ConfirmButton, toast, Sheet } from './ui/kit'
import Home from './rooms/Home'

import Board from './rooms/Board'
import Meetings from './rooms/Meetings'
import Votes from './rooms/Votes'
import Events from './rooms/Events'
import Artists from './rooms/Artists'
import Programs from './rooms/Programs'
import Money from './rooms/Money'
import Documents from './rooms/Documents'

export const ROOMS: { key: RoomKey; label: string; color: string; C: ComponentType }[] = [
  { key: 'home', label: 'Home', color: 'var(--cempasuchil)', C: Home },
  { key: 'board', label: 'Board', color: 'var(--indigo)', C: Board },
  { key: 'meetings', label: 'Meetings', color: 'var(--teal)', C: Meetings },
  { key: 'votes', label: 'Votes', color: 'var(--rosa)', C: Votes },
  { key: 'events', label: 'Events', color: 'var(--terracotta)', C: Events },
  { key: 'artists', label: 'Artists', color: 'var(--cobalt)', C: Artists },
  { key: 'programs', label: 'Programs', color: 'var(--agave)', C: Programs },
  { key: 'money', label: 'Money', color: 'var(--gold)', C: Money },
  { key: 'documents', label: 'Documents', color: 'var(--walnut)', C: Documents },
]

export function Mark({ size = 34 }: { size?: number }) {
  if (isLocal) return <Portico size={size} />
  // A cempasúchil bloom: layered petals cut like paper.
  const petals = 12
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="mark">
      <g transform="translate(32 32)">
        {Array.from({ length: petals }).map((_, i) => (
          <path key={i} transform={`rotate(${(i * 360) / petals})`} d="M0,-4 C6,-12 5,-24 0,-29 C-5,-24 -6,-12 0,-4Z" fill={i % 2 ? '#e39b1b' : '#d9822b'} />
        ))}
        {Array.from({ length: petals }).map((_, i) => (
          <path key={`b${i}`} transform={`rotate(${(i * 360) / petals + 15}) scale(.62)`} d="M0,-4 C6,-12 5,-24 0,-29 C-5,-24 -6,-12 0,-4Z" fill="#f2c14e" />
        ))}
        <circle r="7.5" fill="#b9472a" />
        <circle r="3" fill="#f6ead8" />
      </g>
    </svg>
  )
}

/* The Local Arts mark: a portico, the plain sign of a civic institution, in brass. */
function Portico({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="mark">
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d6bd84" /><stop offset=".55" stopColor="#b39554" /><stop offset="1" stopColor="#8a6d38" /></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30.5" fill="none" stroke="url(#brass)" strokeWidth="1.4" />
      <path d="M15,26 L32,15 L49,26Z" fill="url(#brass)" />
      <rect x="15" y="27.6" width="34" height="2.2" fill="url(#brass)" />
      {[19.5, 27.2, 34.8, 42.5].map((x) => <rect key={x} x={x - 1.6} y="31.6" width="3.2" height="14" fill="url(#brass)" />)}
      <rect x="14" y="47.4" width="36" height="2.4" fill="url(#brass)" />
    </svg>
  )
}

function Sidebar({ room }: { room: RoomKey }) {
  const counts = useStore(roomCounts)
  const next = useStore(nextMeeting)
  const me = useStore((s) => dir(s, ME))
  return (
    <nav className="side" aria-label="Rooms">
      <div className="side-picado" aria-hidden />
      <button className="side-brand" onClick={() => navigate('/')}>
        <Mark />
        <span className="side-brand-text">
          <span className="side-brand-name serif">ACLA</span>
          <span className="side-brand-sub">Board of Directors</span>
        </span>
      </button>

      <ul className="side-rooms">
        {ROOMS.map((r) => {
          const on = r.key === room
          return (
            <li key={r.key}>
              <button className={`side-room ${on ? 'on' : ''}`} style={{ ['--c' as string]: r.color }} onClick={() => navigate(r.key === 'home' ? '/' : `/${r.key}`)} aria-current={on ? 'page' : undefined}>
                {on && <motion.span layoutId="side-on" className="side-on" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                <RoomIcon room={r.key} size={20} className="side-icon" />
                <span className="side-label">{r.label}</span>
                {!!counts[r.key] && r.key !== 'home' && <span className="side-count num">{counts[r.key]}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {next && (
        <button className="side-next" onClick={() => navigate(`/meetings/${next.id}`)}>
          <span className="side-next-k">Next meeting</span>
          <span className="side-next-v serif">{day(next.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <span className="side-next-k">{relDay(next.date)} · {new Date(next.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </button>
      )}

      <div className="side-me">
        {me && <Portrait name={me.name} hue={me.hue} size={36} />}
        <span className="side-me-text">
          <span className="side-me-name">{me?.name}</span>
          <span className="side-me-role">Secretary</span>
        </span>
      </div>
      <div className="side-reset">
        <ConfirmButton tone="ghost" size="sm" icon={<Icon.reset size={15} />} confirm="Restore the demo data?" onConfirm={() => { resetDemo(); navigate('/'); toast('Demo data restored') }}>
          Demo data
        </ConfirmButton>
      </div>
    </nav>
  )
}

/* The phone's dock: the four rooms a director reaches for most, and every room one tap away. */
const DOCK: RoomKey[] = ['home', 'meetings', 'votes', 'events']

/** One honest line about each room, for the rooms sheet. */
function roomLine(s: State, k: RoomKey) {
  switch (k) {
    case 'home': { const n = attention(s).length; return n ? `${n} thing${n > 1 ? 's' : ''} need you` : 'Nothing needs you today' }
    case 'board': return `${s.directors.length} directors · a quorum is ${quorumOf(s)}`
    case 'meetings': { const m = nextMeeting(s); return m ? `Next meeting ${relDay(m.date)}` : 'No meeting planned' }
    case 'votes': { const n = s.motions.filter((m) => m.status === 'open').length; return n ? `${n} open ballot${n > 1 ? 's' : ''}` : 'No ballots open' }
    case 'events': { const e = [...s.events].filter((x) => daysFrom(x.start) >= 0).sort((a, b) => a.start.localeCompare(b.start))[0]; return e ? `${e.name} ${relDay(e.start)}` : 'Season ahead' }
    case 'artists': { const n = s.artists.filter((a) => a.profile === 'Pending review').length; return `${s.artists.length} artists${n ? ` · ${n} to review` : ''}` }
    case 'programs': { const n = s.applicants.filter((a) => a.stage === 'In review' || a.stage === 'Interview').length; return `${s.programs.length} programs · ${n} applicants in review` }
    case 'money': { const m = money$(s); return `${money(m.raised)} of ${money(s.campaign.goal)} for ${s.campaign.name}` }
    case 'documents': { const n = s.docs.filter((d) => d.status === 'Awaiting approval').length; return n ? `${n} awaiting approval` : `${s.docs.length} documents` }
  }
}

function Dock({ room }: { room: RoomKey }) {
  const counts = useStore(roomCounts)
  const [more, setMore] = useState(false)
  const inMore = !DOCK.includes(room)
  const R = ROOMS.find((r) => r.key === room)!
  const moreCount = ROOMS.filter((r) => !DOCK.includes(r.key)).reduce((a, r) => a + (counts[r.key] ?? 0), 0)
  const go = (k: RoomKey) => { buzz(); navigate(k === 'home' ? '/' : `/${k}`) }
  return (
    <>
      <nav className="dock" aria-label="Rooms">
        {DOCK.map((k) => {
          const r = ROOMS.find((x) => x.key === k)!
          const on = k === room
          return (
            <button key={k} className={`dock-room ${on ? 'on' : ''}`} style={{ ['--c' as string]: r.color }} onClick={() => go(k)} aria-current={on ? 'page' : undefined}>
              {on && <motion.span layoutId="dock-on" className="dock-on" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <RoomIcon room={k} size={23} />
              <span>{r.label}</span>
              {!!counts[k] && k !== 'home' && <i className="dock-n num">{counts[k]}</i>}
            </button>
          )
        })}
        <button className={`dock-room ${inMore ? 'on' : ''}`} style={{ ['--c' as string]: inMore ? R.color : 'var(--ink-2)' }} onClick={() => { buzz(); setMore(true) }} aria-haspopup="dialog">
          {inMore && <motion.span layoutId="dock-on" className="dock-on" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          {inMore ? <RoomIcon room={room} size={23} /> : <Icon.more size={23} />}
          <span>{inMore ? R.label : 'More'}</span>
          {!inMore && moreCount > 0 && <i className="dock-n num">{moreCount}</i>}
        </button>
      </nav>
      <RoomsSheet open={more} onClose={() => setMore(false)} room={room} />
    </>
  )
}

function RoomsSheet({ open, onClose, room }: { open: boolean; onClose: () => void; room: RoomKey }) {
  const counts = useStore(roomCounts)
  const s = useStore((x) => x)
  const me = dir(s, ME)
  return (
    <Sheet open={open} onClose={onClose} title={<>Every <em className="rooms-em">room</em></>}>
      <ul className="rooms-list">
        {ROOMS.map((r, i) => (
          <motion.li key={r.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}>
            <button className={`rooms-row ${r.key === room ? 'on' : ''}`} style={{ ['--c' as string]: r.color }} onClick={() => { buzz(); onClose(); navigate(r.key === 'home' ? '/' : `/${r.key}`) }}>
              <span className="rooms-glyph"><RoomIcon room={r.key} size={24} /></span>
              <span className="rooms-text">
                <span className="rooms-name">{r.label}</span>
                <span className="rooms-line">{roomLine(s, r.key)}</span>
              </span>
              {!!counts[r.key] && r.key !== 'home' && <span className="rooms-n num">{counts[r.key]}</span>}
            </button>
          </motion.li>
        ))}
      </ul>
      <div className="rooms-foot">
        {me && <Portrait name={me.name} hue={me.hue} size={40} />}
        <span className="rooms-me"><b>{me?.name}</b><span>Secretary of the Board</span></span>
        <ConfirmButton tone="ghost" size="sm" icon={<Icon.reset size={15} />} confirm="Restore?" onConfirm={() => { resetDemo(); onClose(); navigate('/'); toast('Demo data restored') }}>Demo data</ConfirmButton>
      </div>
    </Sheet>
  )
}

let lastIndex = 0

export default function App() {
  const { room, sub } = useRoute()
  const phone = usePhone()
  // A meeting in session takes the whole phone screen.
  const immersive = phone && room === 'meetings' && sub === 'live'
  const idx = ROOMS.findIndex((r) => r.key === room)
  const dirn = idx >= lastIndex ? 1 : -1
  useEffect(() => { lastIndex = idx }, [idx])
  const R = ROOMS[idx]

  useEffect(() => {
    document.title = R.key === 'home' ? 'ACLA Board' : `${R.label} · ACLA Board`
  }, [R])

  return (
    <div className={`window ${immersive ? 'immersive' : ''}`} style={{ ['--room' as string]: R.color }}>
      {!phone && <Sidebar room={room} />}
      {phone && !immersive && (
        <header className="topbar">
          <button className="topbar-brand" onClick={() => navigate('/')}><Mark size={28} /><span className="serif">ACLA</span></button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={R.key} className="topbar-room" style={{ ['--c' as string]: R.color }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              <RoomIcon room={R.key} size={17} />{R.label}
            </motion.span>
          </AnimatePresence>
        </header>
      )}
      <main className="stage">
        <AnimatePresence mode="popLayout" initial={false} custom={dirn}>
          <motion.section
            key={room}
            className={`room room-${room}`}
            custom={dirn}
            variants={phone ? {
              // On a phone rooms slide sideways, in the order of the dock.
              enter: (d: number) => ({ opacity: 0, x: d * 44 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -30 }),
            } : {
              enter: (d: number) => ({ opacity: 0, y: d * 34, scale: 0.985, filter: 'blur(6px)' }),
              center: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
              exit: (d: number) => ({ opacity: 0, y: d * -26, scale: 0.99, filter: 'blur(4px)' }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: phone ? 0.38 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <R.C />
          </motion.section>
        </AnimatePresence>
      </main>
      {phone && !immersive && <Dock room={room} />}
      <Toasts />
    </div>
  )
}
