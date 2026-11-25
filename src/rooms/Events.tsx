import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, uid, ME } from '../store/store'
import { dir } from '../store/derive'
import { navigate, useRoute, day, daysFrom, firstName, money, num, relDay, DAY, usePhone, openDetail, closeTo, buzz } from '../lib'
import { Portrait } from '../ui/Portrait'
import { Art } from '../ui/Art'
import { Icon } from '../ui/Icons'
import { Button, Wash, toast, Count, RoomHead, Sheet, Field, Drawer } from '../ui/kit'
import type { ArtsEvent } from '../store/types'
import './events.css'

const KIND_COLOR: Record<ArtsEvent['kind'], string> = {
  Festival: '#b9472a', Celebration: '#c8366e', Talk: '#2f57a6', Showcase: '#1d5e5c', Market: '#d18a12', Recital: '#7a4fa0', Workshop: '#5e7f3f',
}

const shortName = (n: string) => n.split(':')[0].replace(/^(806\.art |Spring |Scholarship )/, '').replace(/ Festival$/, '').replace(/ de las Artes$/, '')

export default function Events() {
  const { id } = useRoute()
  const events = useStore((s) => s.events)
  const sorted = useMemo(() => [...events].sort((a, b) => a.start.localeCompare(b.start)), [events])
  const next = sorted.find((e) => daysFrom(e.start) >= 0)
  const current = events.find((e) => e.id === id) ?? next ?? sorted[0]
  const [creating, setCreating] = useState(false)
  const upcoming = sorted.filter((e) => daysFrom(e.start) >= 0)
  const lastYear = sorted.filter((e) => daysFrom(e.start) < 0 && daysFrom(e.start) > -365)
  const reached = lastYear.reduce((a, e) => a + (e.attendance ?? 0), 0)
  const phone = usePhone()
  const sel = phone && !id ? undefined : current?.id

  return (
    <>
      <Wash color="var(--terracotta)" x="50%" y="0%" />
      <RoomHead title={<>The <em>season</em></>} lede={`${upcoming.length} events ahead. ${num(reached)} people came to the last twelve months of ACLA events.`} color="var(--terracotta)">
        <Button tone="accent" icon={<Icon.plus size={16} />} onClick={() => setCreating(true)}>New event</Button>
      </RoomHead>
      <Garland events={sorted} current={sel} />
      {phone && <SeasonList events={sorted} />}
      <Drawer open={!!id && !!current} onClose={() => closeTo('/events')} label={current ? `${current.kind} · ${relDay(current.start)}` : 'Event'} className="events-drawer">
        <AnimatePresence mode="wait">
          {current && <EventDetail key={current.id} e={current} />}
        </AnimatePresence>
      </Drawer>
      <NewEvent open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

/* The season as a string of papel picado: one flag per event, sized by the crowd. */
/* On a phone: the season as a list you can thumb through, coming events first. */
function SeasonList({ events }: { events: ArtsEvent[] }) {
  const ahead = events.filter((e) => daysFrom(e.start) >= 0)
  const behind = events.filter((e) => daysFrom(e.start) < 0).reverse()
  const row = (e: ArtsEvent, i: number) => {
    const done = e.checklist.filter((c) => c.done).length
    const ready = e.checklist.length ? done / e.checklist.length : 1
    const past = daysFrom(e.start) < 0
    return (
      <motion.li key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
        <button className={`sl-row ${past ? 'past' : ''}`} style={{ ['--k' as string]: KIND_COLOR[e.kind] }} onClick={() => openDetail(`/events/${e.id}`)}>
          <span className="sl-date"><b className="display">{new Date(e.start).getDate()}</b><span>{day(e.start, { month: 'short' })}</span></span>
          <span className="sl-text">
            <span className="sl-name">{e.name}</span>
            <span className="sl-sub">{e.kind} · {past ? `${num(e.attendance ?? 0)} came` : `${relDay(e.start)} · ${e.place}`}</span>
          </span>
          {!past && (
            <svg className="sl-ring" width="34" height="34" viewBox="0 0 34 34" aria-label={`${Math.round(ready * 100)}% ready`}>
              <circle cx="17" cy="17" r="13" fill="none" stroke="rgba(34,28,44,.09)" strokeWidth="3.5" />
              <motion.circle cx="17" cy="17" r="13" fill="none" stroke="var(--k)" strokeWidth="3.5" strokeLinecap="round" transform="rotate(-90 17 17)"
                strokeDasharray={2 * Math.PI * 13} initial={{ strokeDashoffset: 2 * Math.PI * 13 }} animate={{ strokeDashoffset: 2 * Math.PI * 13 * (1 - ready) }} transition={{ duration: 0.9, delay: 0.3 + i * 0.05 }} />
            </svg>
          )}
        </button>
      </motion.li>
    )
  }
  return (
    <div className="sl">
      <p className="sl-k">Coming up</p>
      <ul>{ahead.map(row)}</ul>
      {behind.length > 0 && <><p className="sl-k">This past year</p><ul>{behind.map((e, i) => row(e, i + ahead.length))}</ul></>}
    </div>
  )
}

function Garland({ events, current }: { events: ArtsEvent[]; current?: string }) {
  const phone = usePhone()
  const wrap = useRef<HTMLDivElement>(null)
  const from = Date.now() - (phone ? 120 : 230) * DAY
  const to = Date.now() + 365 * DAY
  const W = phone ? 900 : 1200
  const H = 190
  const x = (iso: string) => ((new Date(iso).getTime() - from) / (to - from)) * W
  const sag = (px: number) => 26 + Math.sin((px / W) * Math.PI) * 22
  const months: { x: number; label: string; year?: number }[] = []
  const m0 = new Date(from); m0.setDate(1); m0.setMonth(m0.getMonth() + 1)
  for (let d = new Date(m0); d.getTime() < to; d.setMonth(d.getMonth() + 1)) months.push({ x: x(d.toISOString()), label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getMonth() === 0 ? d.getFullYear() : undefined })
  const todayX = x(new Date().toISOString())
  const visible = events.filter((e) => x(e.start) > 10 && x(e.start) < W - 10)
  // On a phone the garland is wider than the screen: start with today in view.
  useEffect(() => {
    const el = wrap.current
    if (el && phone) el.scrollLeft = Math.max(0, (todayX / W) * el.scrollWidth - el.clientWidth * 0.3)
  }, [phone]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="garland-wrap" ref={wrap}>
      <svg className="garland" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="group" aria-label="Season timeline">
        <path d={`M0,${sag(0)} ${Array.from({ length: 41 }).map((_, i) => `L${(i / 40) * W},${sag((i / 40) * W)}`).join(' ')}`} fill="none" stroke="rgba(34,28,44,.35)" strokeWidth="1.2" />
        <line x1={todayX} x2={todayX} y1={8} y2={H - 22} stroke="var(--terracotta)" strokeDasharray="3 4" />
        <text x={todayX + 6} y={16} className="g-today">Today</text>
        {months.map((m) => (
          <g key={m.x}>
            <text x={m.x} y={H - 6} className="g-month" textAnchor="middle">{m.label}{m.year ? ` ${m.year}` : ''}</text>
          </g>
        ))}
        {visible.map((e, i) => {
          const px = x(e.start)
          const top = sag(px)
          const size = Math.max(0.55, Math.min(1.25, Math.sqrt((e.attendance ?? e.expected) / 1400)))
          const w = 44 * size
          const h = 56 * size
          const drop = i % 2 ? 28 : 6
          const on = e.id === current
          const past = daysFrom(e.start) < 0
          const c = KIND_COLOR[e.kind]
          const teeth = 5
          const tw = w / teeth
          const scallop = Array.from({ length: teeth }).map((_, k) => `L${w / 2 - (k + 0.5) * tw},${h + 5} L${w / 2 - (k + 1) * tw},${h}`).join(' ')
          return (
            <motion.g key={e.id} className={`flag ${on ? 'on' : ''} ${past ? 'past' : ''}`} style={{ cursor: 'pointer', transformOrigin: `${px}px ${top}px`, transformBox: 'view-box' }}
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0, rotate: on ? [0, -4, 3, -1.5, 0] : 0 }}
              transition={{ opacity: { delay: 0.2 + i * 0.05 }, y: { delay: 0.2 + i * 0.05, type: 'spring', stiffness: 180, damping: 14 }, rotate: { duration: 1.4 } }}
              onClick={() => openDetail(`/events/${e.id}`)} role="button" aria-label={`${e.name}, ${day(e.start)}`} tabIndex={0}
              onKeyDown={(ev) => { if (ev.key === 'Enter') openDetail(`/events/${e.id}`) }}>
              <line x1={px} x2={px} y1={top} y2={top + drop} stroke="rgba(34,28,44,.3)" />
              <g transform={`translate(${px} ${top + drop})`}>
                <path d={`M${-w / 2},0 L${w / 2},0 L${w / 2},${h} ${scallop} Z`} fill={c} opacity={past && !on ? 0.5 : 1} />
                <circle cx={0} cy={h * 0.38} r={w * 0.16} fill="var(--plaster)" />
                <path d={`M0,${h * 0.62} l${w * 0.12},${w * 0.12} l${-w * 0.12},${w * 0.12} l${-w * 0.12},${-w * 0.12}Z`} fill="var(--plaster)" />
                <circle cx={-w * 0.3} cy={h * 0.18} r={w * 0.06} fill="var(--plaster)" />
                <circle cx={w * 0.3} cy={h * 0.18} r={w * 0.06} fill="var(--plaster)" />
                {on && <rect x={-w / 2 - 5} y={-5} width={w + 10} height={h + 15} rx={6} fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="3 3" />}
                <text y={h + 22} textAnchor="middle" className={`g-label ${on ? 'on' : ''}`}>{shortName(e.name)}</text>
                <title>{`${e.name} · ${day(e.start, { month: 'long', day: 'numeric', year: 'numeric' })}`}</title>
              </g>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}

function EventDetail({ e }: { e: ArtsEvent }) {
  const lead = useStore((s) => dir(s, e.lead))
  const directors = useStore((s) => s.directors)
  const artists = useStore((s) => s.artists.filter((a) => e.artists.includes(a.id)))
  const d = daysFrom(e.start)
  const past = d < 0
  const done = e.checklist.filter((c) => c.done).length
  const ready = e.checklist.length ? done / e.checklist.length : 1
  const [task, setTask] = useState('')
  const R = 46
  const C = 2 * Math.PI * R

  const toggle = (cid: string) => {
    const c = e.checklist.find((x) => x.id === cid)!
    update((s) => { const it = s.events.find((x) => x.id === e.id)!.checklist.find((x) => x.id === cid)!; it.done = !it.done }, !c.done ? { text: `checked off “${c.label}” for ${e.name}`, room: 'events', link: `/events/${e.id}` } : undefined)
    buzz()
    if (!c.done) toast(`Done: ${c.label}`, { undoable: true })
  }
  const add = () => {
    if (!task.trim()) return
    update((s) => { s.events.find((x) => x.id === e.id)!.checklist.push({ id: uid('c'), label: task.trim(), done: false, owner: ME }) }, { text: `added “${task.trim()}” to ${e.name}`, room: 'events', link: `/events/${e.id}` })
    setTask('')
    toast('Task added, and it’s yours', { undoable: true })
  }

  return (
    <motion.div className="ev" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} style={{ ['--k' as string]: KIND_COLOR[e.kind] }}>
      <section className="ev-story">
        <p className="ev-kind">{e.kind} · {past ? `held ${relDay(e.start)}` : relDay(e.start)}</p>
        <h2 className="display ev-name">{e.name}</h2>
        <p className="ev-when"><Icon.clock size={15} /> {day(e.start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{e.end && daysFrom(e.end) !== d ? ` – ${day(e.end, { month: 'long', day: 'numeric' })}` : ''}</p>
        <p className="ev-when"><Icon.pin size={15} /> {e.place}</p>
        <p className="ev-blurb serif">{e.blurb}</p>
        {lead && <button className="ev-lead" onClick={() => navigate(`/board/${lead.id}`)}><Portrait name={lead.name} hue={lead.hue} size={30} /> Led by {lead.you ? 'you' : lead.name}</button>}
        {artists.length > 0 && (
          <div className="ev-artists">
            {artists.slice(0, 6).map((a, i) => (
              <motion.button key={a.id} className="ev-art" onClick={() => navigate(`/artists/${a.id}`)} title={a.name} initial={{ opacity: 0, y: 8, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: (i % 2 ? 2 : -2) }} transition={{ delay: 0.25 + i * 0.05 }}>
                <Art style={a.style} seed={a.seed} />
              </motion.button>
            ))}
            <span className="ev-art-k">{artists.length} artist{artists.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </section>

      <section className="ev-ready">
        <div className="ev-ring">
          <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden>
            <circle cx="58" cy="58" r={R} stroke="rgba(34,28,44,.08)" strokeWidth="9" fill="none" />
            <motion.circle cx="58" cy="58" r={R} stroke="var(--k)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={C} transform="rotate(-90 58 58)"
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - ready) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          <span className="ev-ring-v display"><span><Count value={Math.round(ready * 100)} /><small>%</small></span></span>
        </div>
        <p className="ev-ready-k">{past ? 'Wrap-up' : 'Ready'} · {done} of {e.checklist.length} done{!past && d > 0 ? ` · ${d} days to go` : ''}</p>
        <ul className="ck">
          {e.checklist.map((c) => {
            const who = directors.find((x) => x.id === c.owner)
            return (
              <li key={c.id}>
                <button className={`ck-item ${c.done ? 'done' : ''}`} onClick={() => toggle(c.id)} aria-pressed={c.done}>
                  <span className="ck-box">{c.done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Icon.check size={13} /></motion.span>}</span>
                  <span className="ck-label">{c.label}</span>
                  {who && <span className="ck-who">{who.you ? 'You' : firstName(who.name)}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <form className="ck-add" onSubmit={(ev) => { ev.preventDefault(); add() }}>
          <input className="input" value={task} onChange={(ev) => setTask(ev.target.value)} placeholder="Add a task you’ll take on" aria-label="New task" />
          <Button tone="quiet" type="submit" icon={<Icon.plus size={15} />} disabled={!task.trim()}>Add</Button>
        </form>
      </section>

      <section className="ev-numbers">
        <div className="ev-n">
          <p className="ev-n-k">{past ? 'Came' : 'Expected'}</p>
          <p className="display ev-n-v"><Count value={e.attendance ?? e.expected} /></p>
          {e.attendance && <p className="ev-n-sub">{e.attendance >= e.expected ? `${num(e.attendance - e.expected)} more than planned` : `${num(e.expected - e.attendance)} fewer than planned`}</p>}
          <Crowd value={e.attendance ?? e.expected} expected={e.expected} />
        </div>
        <div className="ev-n">
          <p className="ev-n-k">Budget</p>
          <p className="display ev-n-v"><Count value={e.spent} format={(v) => money(v)} /></p>
          <p className="ev-n-sub">spent of {money(e.budget)}{e.spent > e.budget ? ' · over budget' : past ? ` · ${money(e.budget - e.spent)} under` : ''}</p>
          <div className="ev-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${Math.min(100, (e.spent / e.budget) * 100)}%` }} transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} /></div>
        </div>
      </section>
    </motion.div>
  )
}

/* A crowd of little marks, one per hundred people. */
function Crowd({ value, expected }: { value: number; expected: number }) {
  const per = value > 1500 ? 100 : value > 300 ? 25 : 10
  const n = Math.min(40, Math.round(value / per))
  const e = Math.min(40, Math.round(expected / per))
  return (
    <div className="crowd" aria-hidden>
      {Array.from({ length: Math.max(n, e) }).map((_, i) => (
        <motion.i key={i} className={i < n ? (i >= e ? 'extra' : '') : 'empty'} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.012 }} />
      ))}
      <span className="crowd-k">each mark is {per} people</span>
    </div>
  )
}

function NewEvent({ open, onClose }: { open: boolean; onClose: () => void }) {
  const directors = useStore((s) => s.directors)
  const [name, setName] = useState('')
  const [date, setDate] = useState(() => new Date(Date.now() + 45 * DAY).toISOString().slice(0, 10))
  const [kind, setKind] = useState<ArtsEvent['kind']>('Workshop')
  const [place, setPlace] = useState('')
  const [lead, setLead] = useState(ME)
  const [expected, setExpected] = useState(120)
  const [budget, setBudget] = useState(1500)
  const submit = () => {
    const id = uid('e')
    update((s) => {
      s.events.push({ id, name: name.trim(), kind, start: new Date(`${date}T18:00:00`).toISOString(), place: place.trim() || 'To be confirmed', lead, expected, budget, spent: 0, artists: [], blurb: 'New on the calendar. Add the story when it’s ready.', checklist: [{ id: uid('c'), label: 'Confirm the space', done: false, owner: lead }, { id: uid('c'), label: 'Invite artists', done: false, owner: lead }, { id: uid('c'), label: 'Announce in the 806.art newsletter', done: false, owner: 'd-samuel' }] })
    }, { text: `added ${name.trim()} to the season`, room: 'events', link: `/events/${id}` })
    onClose(); setName(''); setPlace('')
    openDetail(`/events/${id}`)
    toast('On the calendar, with a starter checklist', { undoable: true })
  }
  return (
    <Sheet open={open} onClose={onClose} title="A new event">
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Papel picado night for families" autoFocus /></Field>
      <div className="field-row">
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Kind"><select value={kind} onChange={(e) => setKind(e.target.value as ArtsEvent['kind'])}>{Object.keys(KIND_COLOR).map((k) => <option key={k}>{k}</option>)}</select></Field>
      </div>
      <Field label="Where"><input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="ACLA Studio, Polk Street" /></Field>
      <div className="field-row">
        <Field label="Who leads it"><select value={lead} onChange={(e) => setLead(e.target.value)}>{directors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="People expected"><input type="number" min={10} step={10} value={expected} onChange={(e) => setExpected(Number(e.target.value))} /></Field>
      </div>
      <Field label="Budget"><input type="number" min={0} step={100} value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></Field>
      <div className="sheet-foot">
        <Button tone="ghost" onClick={onClose}>Cancel</Button>
        <Button tone="accent" icon={<Icon.plus size={16} />} disabled={!name.trim()} onClick={submit}>Add to the season</Button>
      </div>
    </Sheet>
  )
}
