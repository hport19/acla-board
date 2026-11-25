import { useMemo, useState } from 'react'
import { isLocal } from '../edition'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, uid, ME } from '../store/store'
import { attendanceRate, heldMeetings, quorumOf } from '../store/derive'
import { navigate, useRoute, day, daysFrom, firstName, usePhone, openDetail, closeTo } from '../lib'
import { Portrait } from '../ui/Portrait'
import { Icon } from '../ui/Icons'
import { Button, ConfirmButton, RoomHead, Wash, toast, Count, Drawer } from '../ui/kit'
import type { Director } from '../store/types'
import './board.css'

/* Seats around the table, with the officers at the front. */
const SEAT_ORDER = ['d-marisol', 'd-hector', 'd-ruben', 'd-elena', 'd-pilar', 'd-analucia', 'd-nadia', 'd-gloria', 'd-tomas', 'd-samuel', 'd-jordan']

export default function Board() {
  const { id } = useRoute()
  const directors = useStore((s) => s.directors)
  const committees = useStore((s) => s.committees)
  const quorum = useStore(quorumOf)
  const [committee, setCommittee] = useState<string | null>(null)
  const phone = usePhone()

  const seated = useMemo(() => {
    const order = [...SEAT_ORDER, ...directors.map((d) => d.id).filter((x) => !SEAT_ORDER.includes(x))]
    return order.map((x) => directors.find((d) => d.id === x)).filter(Boolean) as Director[]
  }, [directors])

  const selected = directors.find((d) => d.id === id) ?? directors.find((d) => d.office === 'Chair')!
  const activeCommittee = committees.find((c) => c.id === committee)

  // Seats on an ellipse, in percent of the table area; the Chair sits at the front.
  const pos = seated.map((_, i) => {
    const a = Math.PI / 2 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * ((Math.PI * 2) / seated.length)
    return { x: 50 + Math.cos(a) * 41, y: 50 + Math.sin(a) * (phone ? 40 : 38) }
  })

  return (
    <>
      <Wash color="var(--indigo)" x="20%" y="10%" />
      <RoomHead title={<>The <em>board</em></>} lede={`${directors.length} directors, four officers, six committees. A quorum is ${quorum}.`} color="var(--indigo)" />
      <div className="board">
        <div className="board-left">
          <div className="table">
            <svg className="table-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <radialGradient id="tableWood" cx="50%" cy="40%" r="70%">
                  <stop offset="0" stopColor={isLocal ? '#f8f7f4' : '#fbf4e8'} />
                  <stop offset="1" stopColor={isLocal ? '#dfdbd2' : '#e9dac1'} />
                </radialGradient>
              </defs>
              <ellipse cx="50" cy="51.5" rx="30" ry="24" fill="rgba(34,28,44,.06)" />
              <ellipse cx="50" cy="50" rx="30" ry="24" fill="url(#tableWood)" stroke="rgba(34,28,44,.12)" strokeWidth=".3" />
              <ellipse cx="50" cy="50" rx="27" ry="21" fill="none" stroke="rgba(34,28,44,.09)" strokeWidth=".25" strokeDasharray="1 1.4" />
              <AnimatePresence>
                {activeCommittee && seated.map((d, i) => d.committees.includes(activeCommittee.id) && (
                  <motion.path key={`${activeCommittee.id}-${d.id}`}
                    d={`M${pos[i].x},${pos[i].y} Q${(pos[i].x + 50) / 2 + (i % 2 ? 7 : -7)},${(pos[i].y + 50) / 2} 50,50`}
                    stroke={activeCommittee.color} fill="none" strokeLinecap="round"
                    strokeWidth={d.id === activeCommittee.chair ? 0.75 : 0.42}
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.85 }} exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: 0.7, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }} />
                ))}
              </AnimatePresence>
            </svg>

            <div className="table-center">
              <AnimatePresence mode="wait">
                {activeCommittee ? (
                  <motion.div key={activeCommittee.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="table-center-in">
                    <span className="table-knot" style={{ background: activeCommittee.color }} />
                    <span className="display table-c-name" style={{ color: activeCommittee.color }}>{activeCommittee.name}</span>
                    <span className="table-c-purpose">{activeCommittee.purpose}</span>
                    <span className="table-c-chair">Chaired by {directors.find((d) => d.id === activeCommittee.chair)?.name}</span>
                  </motion.div>
                ) : (
                  <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="table-center-in">
                    <span className="display table-big"><Count value={directors.length} /></span>
                    <span className="table-c-purpose">directors at the table</span>
                    <span className="table-c-chair">Pick a committee below to see who sits on it</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {seated.map((d, i) => {
              const inC = !activeCommittee || d.committees.includes(activeCommittee.id)
              const on = d.id === selected.id && (!phone || !!id)
              const ending = daysFrom(d.termEnds) <= 90
              return (
                <motion.button key={d.id} className={`seat ${on ? 'on' : ''}`}
                  style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}
                  initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: inC ? 1 : 0.3, scale: on ? 1.08 : 1 }}
                  transition={{ delay: 0.04 * i, type: 'spring', stiffness: 260, damping: 22 }}
                  onClick={() => openDetail(`/board/${d.id}`)} aria-pressed={on}>
                  <Portrait name={d.name} hue={d.hue} size={phone ? 42 : 58} ring={on ? 'var(--indigo)' : ending ? 'var(--marigold)' : undefined} />
                  <span className="seat-name">{d.you ? 'You' : firstName(d.name)}</span>
                  {d.office !== 'Director' && <span className="seat-office">{d.office}</span>}
                </motion.button>
              )
            })}
          </div>

          <div className="threads" role="group" aria-label="Committees">
            {committees.map((c) => (
              <button key={c.id} className={`thread ${committee === c.id ? 'on' : ''}`} style={{ ['--t' as string]: c.color }} onClick={() => setCommittee(committee === c.id ? null : c.id)} aria-pressed={committee === c.id}>
                <i />{c.name}<span className="thread-n num">{directors.filter((d) => d.committees.includes(c.id)).length}</span>
              </button>
            ))}
          </div>

          <Horizon directors={directors} selected={phone && !id ? '' : selected.id} />
        </div>

        <Drawer open={!!id} onClose={() => closeTo('/board')} label="Director" className="board-drawer">
          <AnimatePresence mode="wait">
            <Profile key={selected.id} d={selected} />
          </AnimatePresence>
        </Drawer>
      </div>
    </>
  )
}

function Horizon({ directors, selected }: { directors: Director[]; selected: string }) {
  // Two years of term renewals on one line.
  const span = 800
  const groups = new Map<number, Director[]>()
  directors.forEach((d) => {
    const k = Math.round(Math.max(0, Math.min(1, daysFrom(d.termEnds) / span)) * 100)
    groups.set(k, [...(groups.get(k) ?? []), d])
  })
  // Labels that would touch their neighbour climb a step higher.
  const keys = [...groups.keys()].sort((a, b) => a - b)
  const lift = new Map<number, number>()
  keys.forEach((k, i) => { const prev = keys[i - 1]; lift.set(k, prev !== undefined && k - prev < 13 && !lift.get(prev) ? 1 : 0) })
  const now = new Date()
  const ticks = Array.from({ length: 5 }).map((_, i) => { const t = new Date(now); t.setMonth(t.getMonth() + i * 6); return { x: (i * 182.5) / span, label: i === 0 ? 'Today' : t.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) } })
  return (
    <div className="horizon">
      <span className="horizon-k">When seats come up for renewal</span>
      <div className="horizon-line">
        {ticks.map((t) => <span key={t.label} className="horizon-tick" style={{ left: `${t.x * 100}%` }}>{t.label}</span>)}
        {[...groups.entries()].map(([k, ds]) => (
          <div key={k} className="horizon-group" style={{ left: `${k}%` }}>
            {ds.map((d, j) => (
              <motion.button key={d.id} className={`horizon-dot ${d.id === selected ? 'on' : ''} ${daysFrom(d.termEnds) <= 90 ? 'soon' : ''}`}
                style={{ bottom: 6 + j * 13 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + j * 0.05 }}
                onClick={() => openDetail(`/board/${d.id}`)} title={`${d.name}: ${day(d.termEnds, { month: 'long', day: 'numeric', year: 'numeric' })}`} aria-label={d.name} />
            ))}
            <span className="horizon-label" style={{ bottom: 8 + Math.max(ds.length, ...(lift.get(k) ? [(groups.get(keys[keys.indexOf(k) - 1]) ?? []).length + 1.4] : [0])) * 13 }}>{ds.length > 1 ? `${ds.length} seats` : firstName(ds[0].name)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Profile({ d }: { d: Director }) {
  const committees = useStore((s) => s.committees)
  const held = useStore(heldMeetings)
  const rate = useStore((s) => attendanceRate(s, d.id))
  const motions = useStore((s) => s.motions)
  const voted = motions.filter((m) => m.ballots[d.id]).length
  const days = daysFrom(d.termEnds)
  const joined = new Date(d.joined).getTime()
  const ends = new Date(d.termEnds).getTime()
  const progress = Math.max(0, Math.min(1, (Date.now() - joined) / (ends - joined)))
  const nominated = motions.find((m) => m.status === 'open' && m.title.includes(d.name))

  const toggleCommittee = (cid: string, name: string) => {
    const on = d.committees.includes(cid)
    update((s) => {
      const x = s.directors.find((y) => y.id === d.id)!
      x.committees = on ? x.committees.filter((c) => c !== cid) : [...x.committees, cid]
    }, { text: `${on ? 'removed' : 'added'} ${d.name} ${on ? 'from' : 'to'} ${name}`, room: 'board', link: `/board/${d.id}` })
    toast(`${d.you ? 'You' : firstName(d.name)} ${on ? 'left' : 'joined'} ${name}`, { undoable: true })
  }

  const nominate = () => {
    const mid = uid('v')
    update((s) => {
      s.motions.unshift({
        id: mid, title: `Re-elect ${d.name} to a second term`, text: `Resolved, that ${d.name} is re-elected to the Board of Directors for a term of two years beginning at the expiration of the current term.`,
        movedBy: 'd-pilar', secondedBy: ME, opened: new Date().toISOString(), closes: new Date(Date.now() + 7 * 86400000).toISOString(),
        method: 'Electronic ballot', ballots: {}, status: 'open', threshold: 'majority',
      })
      s.dismissed.push(`term-${d.id}`)
    }, { text: `opened a ballot to re-elect ${d.name}`, room: 'votes', link: `/votes/${mid}` })
    toast('Ballot opened for seven days. Every director has been notified.', { undoable: true })
  }

  return (
    <motion.aside className="profile" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <div className="profile-top">
        <Portrait name={d.name} hue={d.hue} size={88} />
        <div>
          <p className="profile-office">{d.office}{d.you ? ' · you' : ''}</p>
          <h2 className="display profile-name">{d.name}</h2>
          <p className="profile-craft">{d.craft} · {d.town}</p>
        </div>
      </div>
      <p className="profile-note serif">{d.note}</p>

      <div className="profile-block">
        <div className="profile-row-head">
          <span>Term {d.termNumber} of 3</span>
          <span className={days <= 90 ? 'warn' : ''}>{days <= 90 ? `Ends in ${days} days` : `Ends ${day(d.termEnds, { month: 'long', year: 'numeric' })}`}</span>
        </div>
        <div className="term-bar">
          {[1, 2, 3].map((t) => (
            <span key={t} className={`term-seg ${t < d.termNumber ? 'past' : ''}`}>
              {t === d.termNumber && <motion.span className="term-fill" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ background: days <= 90 ? 'var(--marigold)' : 'var(--indigo)' }} />}
            </span>
          ))}
        </div>
        <div className="profile-row-foot"><span>Joined {day(d.joined, { month: 'long', year: 'numeric' })}</span><span>{3 - d.termNumber} more term{3 - d.termNumber === 1 ? '' : 's'} possible</span></div>
      </div>

      <div className="profile-block">
        <div className="profile-row-head"><span>Attendance, last eight meetings</span><span className="num">{Math.round(rate * 100)}% · {voted} votes cast</span></div>
        <div className="att-marks">
          {held.slice(0, 8).reverse().map((m, i) => {
            const here = m.present.includes(d.id)
            return (
              <motion.button key={m.id} className={`att-mark ${here ? 'here' : ''}`} onClick={() => navigate(`/meetings/${m.id}`)} title={`${day(m.date)}: ${here ? 'present' : 'absent'}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}>
                <i />
                <span>{new Date(m.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="profile-block">
        <div className="profile-row-head"><span>Committees</span><span>Tap to change</span></div>
        <div className="cmt-list">
          {committees.map((c) => {
            const on = d.committees.includes(c.id)
            return (
              <button key={c.id} className={`cmt ${on ? 'on' : ''}`} style={{ ['--t' as string]: c.color }} onClick={() => toggleCommittee(c.id, c.name)} aria-pressed={on}>
                <i>{on && <Icon.check size={12} />}</i>{c.name}{c.chair === d.id && <em>chair</em>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="profile-actions">
        {days <= 120 && d.termNumber < 3 && (
          nominated
            ? <Button tone="quiet" icon={<Icon.arrow size={16} />} onClick={() => navigate(`/votes/${nominated.id}`)}>Re-election ballot is open</Button>
            : <ConfirmButton tone="accent" icon={<Icon.gavel size={16} />} confirm="Open a 7-day ballot?" onConfirm={nominate}>Nominate for a second term</ConfirmButton>
        )}
        <Button tone="ghost" icon={<Icon.mail size={16} />} onClick={() => toast(`A note to ${d.you ? 'yourself' : firstName(d.name)} is waiting in your outbox`)}>Write to {d.you ? 'yourself' : firstName(d.name)}</Button>
      </div>
    </motion.aside>
  )
}
