import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import { useStore, update, uid, ME } from '../store/store'
import { quorumOf, outcome } from '../store/derive'
import { closeMotion, endMeeting, planNextMeeting, castBallot } from '../store/actions'
import { navigate, useRoute, day, time, daysFrom, firstName, useNow, relDay, usePhone, buzz } from '../lib'
import { Portrait } from '../ui/Portrait'
import { Icon } from '../ui/Icons'
import { Button, ConfirmButton, Wash, toast, Count, Brush, Segmented } from '../ui/kit'
import type { AgendaItem, AgendaKind, Meeting, Ballot } from '../store/types'
import './meetings.css'

const KIND: Record<AgendaKind, { label: string; color: string }> = {
  procedure: { label: 'Procedure', color: '#a89eab' },
  report: { label: 'Report', color: 'var(--teal)' },
  discussion: { label: 'Discussion', color: 'var(--marigold)' },
  action: { label: 'Decision', color: 'var(--rosa)' },
}


export default function Meetings() {
  const { id, sub } = useRoute()
  const meetings = useStore((s) => s.meetings)
  const sorted = useMemo(() => [...meetings].sort((a, b) => b.date.localeCompare(a.date)), [meetings])
  const upcoming = sorted.filter((m) => m.status !== 'held').reverse()
  const held = sorted.filter((m) => m.status === 'held')
  const current = meetings.find((m) => m.id === id) ?? meetings.find((m) => m.status === 'live') ?? upcoming[0] ?? held[0]

  if (sub === 'live' && current) return <Live m={current} />

  return (
    <>
      <Wash color="var(--teal)" x="90%" y="0%" />
      <div className="mt">
        <nav className="mt-rail" aria-label="Meetings">
          <h1 className="display mt-rail-title">Meetings</h1>
          <Brush color="var(--teal)" width={130} />
          <div className="mt-rail-scroll">
            <p className="mt-rail-k">Coming up</p>
            {upcoming.map((m) => <RailItem key={m.id} m={m} on={m.id === current?.id} />)}
            <button className="mt-plan" onClick={() => { const nid = planNextMeeting(upcoming[upcoming.length - 1] ?? held[0]); navigate(`/meetings/${nid}`); toast('Next meeting planned with a standard agenda', { undoable: true }) }}>
              <Icon.plus size={16} /> Plan another meeting
            </button>
            <p className="mt-rail-k">Held</p>
            {held.map((m) => <RailItem key={m.id} m={m} on={m.id === current?.id} />)}
          </div>
        </nav>
        <AnimatePresence mode="wait">
          <motion.div key={current?.id} className="mt-main" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {current && (current.status === 'held' ? <Held m={current} /> : <Planner m={current} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

function RailItem({ m, on }: { m: Meeting; on: boolean }) {
  const d = new Date(m.date)
  return (
    <button className={`mt-ri ${on ? 'on' : ''} ${m.status}`} onClick={() => navigate(`/meetings/${m.id}`, { replace: true })}>
      {on && <motion.span layoutId="mt-ri-on" className="mt-ri-on" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
      <span className="mt-ri-day display">{d.getDate()}</span>
      <span className="mt-ri-text">
        <span className="mt-ri-title">{m.kind === 'Regular' ? d.toLocaleDateString('en-US', { month: 'long' }) : m.title.replace('Special Meeting: ', '')}</span>
        <span className="mt-ri-sub">{m.status === 'live' ? 'In session now' : m.kind === 'Regular' ? `Regular · ${d.getFullYear()}` : `${m.kind} · ${d.toLocaleDateString('en-US', { month: 'short' })}`}</span>
      </span>
    </button>
  )
}

/* ---------------- the agenda builder ---------------- */

function Planner({ m }: { m: Meeting }) {
  const directors = useStore((s) => s.directors)
  const quorum = useStore(quorumOf)
  const [items, setItems] = useState(m.agenda)
  useEffect(() => setItems(m.agenda), [m.agenda])
  const total = items.reduce((a, b) => a + b.minutes, 0)
  const start = new Date(m.date)
  const end = new Date(start.getTime() + total * 60000)
  const decisions = items.filter((i) => i.kind === 'action').length
  const d = daysFrom(m.date)

  const save = (agenda: AgendaItem[], log?: string) => update((s) => { s.meetings.find((x) => x.id === m.id)!.agenda = agenda }, log ? { text: log, room: 'meetings', link: `/meetings/${m.id}` } : undefined)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<AgendaKind>('discussion')
  const add = () => {
    if (!title.trim()) return
    const item: AgendaItem = { id: uid('a'), title: title.trim(), kind, minutes: kind === 'procedure' ? 5 : 10, owner: ME }
    const adj = items.findIndex((i) => i.title === 'Adjourn')
    const next = adj >= 0 ? [...items.slice(0, adj), item, ...items.slice(adj)] : [...items, item]
    save(next, `added “${item.title}” to the agenda`)
    setTitle('')
    toast('Added to the agenda', { undoable: true })
  }

  let clock = 0
  return (
    <div className="pl">
      <header className="pl-head">
        <div>
          <p className="pl-kicker">{m.kind} meeting · {relDay(m.date)}</p>
          <h2 className="display pl-title">{day(m.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <p className="pl-sub"><Icon.clock size={15} /> {time(m.date)} to about {time(end.toISOString())} <span className="dot" /> <Icon.pin size={15} /> {m.place}</p>
        </div>
        <div className="pl-actions">
          {m.noticeSent
            ? <span className="pl-sent"><Icon.check size={15} /> Notice sent {relDay(m.noticeSent)}</span>
            : <Button tone="quiet" icon={<Icon.mail size={16} />} onClick={() => { update((s) => { s.meetings.find((x) => x.id === m.id)!.noticeSent = new Date().toISOString() }, { text: 'sent the notice and agenda for the next meeting', room: 'meetings', link: `/meetings/${m.id}` }); toast(`Notice and agenda sent to all ${directors.length} directors`, { undoable: true }) }}>Send notice</Button>}
          <Button tone="accent" size="lg" icon={<Icon.play size={16} />} onClick={() => {
            update((s) => { const mm = s.meetings.find((x) => x.id === m.id)!; mm.status = 'live'; mm.startedAt = Date.now(); mm.liveIndex = 0; mm.present = [] }, { text: `opened the ${day(m.date)} meeting`, room: 'meetings', link: `/meetings/${m.id}/live` })
            navigate(`/meetings/${m.id}/live`)
          }}>{m.status === 'live' ? 'Return to the meeting' : d > 0 ? 'Start the meeting' : 'Start now'}</Button>
        </div>
      </header>

      <div className="pl-body">
        <div className="pl-agenda">
          <div className="pl-agenda-head"><span>Running order</span><span>Drag to reorder · tap a time to change it</span></div>
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="ro" as="ol">
            {items.map((it) => {
              const at = new Date(start.getTime() + clock * 60000)
              clock += it.minutes
              return <AgendaRow key={it.id} it={it} at={at} owner={directors.find((x) => x.id === it.owner)}
                onCommit={() => save(items, 'reordered the agenda')}
                onChange={(patch) => save(items.map((x) => (x.id === it.id ? { ...x, ...patch } : x)))}
                onRemove={() => { save(items.filter((x) => x.id !== it.id), `removed “${it.title}” from the agenda`); toast('Removed from the agenda', { undoable: true }) }} />
            })}
          </Reorder.Group>
          <form className="ro-add" onSubmit={(e) => { e.preventDefault(); add() }}>
            <input className="input" placeholder="Add an item, for example “Mural Week sponsor update”" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="New agenda item" />
            <div className="ro-kinds">
              {(Object.keys(KIND) as AgendaKind[]).map((k) => (
                <button type="button" key={k} className={`ro-kind ${kind === k ? 'on' : ''}`} style={{ ['--k' as string]: KIND[k].color }} onClick={() => setKind(k)}>{KIND[k].label}</button>
              ))}
            </div>
            <Button tone="primary" type="submit" icon={<Icon.plus size={16} />} disabled={!title.trim()}>Add</Button>
          </form>
        </div>

        <aside className="pl-shape">
          <p className="pl-shape-k">The shape of the evening</p>
          <p className="display pl-shape-v"><Count value={total} /> <span className="unit">minutes</span></p>
          <div className="pl-bar">
            {items.map((it) => (
              <motion.span key={it.id} layout className="pl-bar-seg" style={{ flexGrow: it.minutes, background: KIND[it.kind].color }} title={`${it.title}: ${it.minutes} min`} />
            ))}
          </div>
          <ul className="pl-legend">
            {(Object.keys(KIND) as AgendaKind[]).map((k) => {
              const mins = items.filter((i) => i.kind === k).reduce((a, b) => a + b.minutes, 0)
              return <li key={k}><i style={{ background: KIND[k].color }} />{KIND[k].label}<span className="num">{mins} min</span></li>
            })}
          </ul>
          <div className="pl-facts">
            <p><b className="serif">{decisions}</b> decision{decisions === 1 ? '' : 's'} to make</p>
            <p><b className="serif">{quorum}</b> directors needed for a quorum</p>
            <p><b className="serif">{time(end.toISOString())}</b> expected close</p>
          </div>
          {total > 120 && <p className="pl-warn">This runs past two hours. Consider moving a report to the consent agenda.</p>}
        </aside>
      </div>
    </div>
  )
}

function AgendaRow({ it, at, owner, onChange, onRemove, onCommit }: { it: AgendaItem; at: Date; owner?: { name: string; hue: number }; onChange: (p: Partial<AgendaItem>) => void; onRemove: () => void; onCommit: () => void }) {
  const controls = useDragControls()
  const [editing, setEditing] = useState(false)
  const k = KIND[it.kind]
  return (
    <Reorder.Item value={it} as="li" className={`ro-item kind-${it.kind}`} dragListener={false} dragControls={controls} onDragEnd={onCommit}
      style={{ ['--k' as string]: k.color, minHeight: 46 + Math.min(it.minutes, 25) * 1.6 }}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <span className="ro-time num">{at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' PM', '').replace(' AM', '')}</span>
      <span className="ro-spine"><i /></span>
      <div className="ro-body">
        {editing
          ? <input className="ro-edit" autoFocus defaultValue={it.title} onBlur={(e) => { setEditing(false); if (e.target.value.trim() && e.target.value !== it.title) { onChange({ title: e.target.value.trim() }); toast('Agenda item renamed') } }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false) }} />
          : <button className="ro-title serif" onClick={() => setEditing(true)} title="Rename">{it.title}</button>}
        <span className="ro-meta">
          <span className="ro-kind-l">{k.label}</span>
          {owner && <><span className="dot" /><Portrait name={owner.name} hue={owner.hue} size={18} /> <span className="ro-owner">{firstName(owner.name)}</span></>}
        </span>
      </div>
      <div className="ro-mins">
        <button aria-label="Shorter" onClick={() => onChange({ minutes: Math.max(1, it.minutes - 5) })}>−</button>
        <span className="num">{it.minutes}<small>m</small></span>
        <button aria-label="Longer" onClick={() => onChange({ minutes: it.minutes + 5 })}>+</button>
      </div>
      <button className="ro-x" aria-label="Remove item" onClick={onRemove}><Icon.close size={15} /></button>
      <span className="ro-grip" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder"><Icon.drag size={18} /></span>
    </Reorder.Item>
  )
}

/* ---------------- a meeting that has been held ---------------- */

function Held({ m }: { m: Meeting }) {
  const directors = useStore((s) => s.directors)
  const resolutions = useStore((s) => s.motions.filter((x) => x.meetingId === m.id))
  const doc = useStore((s) => s.docs.find((x) => x.id === m.minutesDocId))
  const quorum = useStore(quorumOf)
  return (
    <div className="hd">
      <header className="pl-head">
        <div>
          <p className="pl-kicker">{m.kind} meeting · held {relDay(m.date)}</p>
          <h2 className="display pl-title">{day(m.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <p className="pl-sub"><Icon.pin size={15} /> {m.place}</p>
        </div>
        <div className="pl-actions">
          {doc && <Button tone="accent" icon={<Icon.arrow size={16} />} onClick={() => navigate(`/documents/${doc.id}`)}>{doc.status === 'Approved' ? 'Read the approved minutes' : 'Open the draft minutes'}</Button>}
        </div>
      </header>
      <div className="hd-body">
        <div className="hd-record">
          {m.agenda.map((a, i) => (
            <motion.div key={a.id} className="hd-item" style={{ ['--k' as string]: KIND[a.kind].color }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <span className="hd-n serif">{i + 1}</span>
              <div>
                <h3 className="serif hd-title">{a.title}</h3>
                <p className="hd-notes">{a.notes || 'No notes recorded.'}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <aside className="hd-side">
          <p className="pl-shape-k">Who was there</p>
          <p className="display pl-shape-v">{m.present.length}<span className="unit"> of {directors.length}</span></p>
          <p className={`hd-quorum ${m.present.length >= quorum ? 'ok' : ''}`}>{m.present.length >= quorum ? 'Quorum present' : 'No quorum'}</p>
          <div className="hd-people">
            {directors.map((d) => {
              const here = m.present.includes(d.id)
              return <span key={d.id} className={`hd-p ${here ? '' : 'away'}`} title={`${d.name}${here ? '' : ' (absent)'}`}><Portrait name={d.name} hue={d.hue} size={34} dim={!here} /></span>
            })}
          </div>
          {resolutions.length > 0 && (
            <>
              <p className="pl-shape-k" style={{ marginTop: 26 }}>Resolutions</p>
              <ul className="hd-res">
                {resolutions.map((r) => {
                  const o = outcome(r, directors.length)
                  return (
                    <li key={r.id}><button onClick={() => navigate(`/votes/${r.id}`)}>
                      <span className={`hd-res-mark ${r.status}`}>{r.status === 'carried' ? 'Carried' : 'Failed'}</span>
                      <span className="hd-res-title serif">{r.title}</span>
                      <span className="hd-res-n num">{r.number} · {o.aye}–{o.nay}</span>
                    </button></li>
                  )
                })}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ---------------- live meeting mode ---------------- */

function Live({ m }: { m: Meeting }) {
  const directors = useStore((s) => s.directors)
  const quorum = useStore(quorumOf)
  const motions = useStore((s) => s.motions.filter((x) => x.meetingId === m.id))
  const now = useNow(1000)
  const idx = m.liveIndex ?? 0
  const item = m.agenda[idx]
  const [itemStart, setItemStart] = useState(Date.now())
  useEffect(() => setItemStart(Date.now()), [idx])
  const elapsed = m.startedAt ? Math.floor((now - m.startedAt) / 1000) : 0
  const itemElapsed = Math.floor((now - itemStart) / 1000)
  const over = item && itemElapsed > item.minutes * 60
  const hasQuorum = m.present.length >= quorum
  const openMotion = motions.find((x) => x.status === 'open')
  const [notes, setNotes] = useState(item?.notes ?? '')
  useEffect(() => setNotes(m.agenda[idx]?.notes ?? ''), [idx, m.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const saveTimer = useRef<number>(0)
  const phone = usePhone()
  // On a phone the meeting is two panes: the roll call first, then the item at hand.
  const [pane, setPane] = useState<'item' | 'roll'>(m.present.length ? 'item' : 'roll')
  const steps = useRef<HTMLOListElement>(null)
  useEffect(() => { steps.current?.querySelector('.now')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }, [idx, phone])

  if (m.status === 'held') {
    return (
      <div className="live live-done">
        <Wash color="var(--teal)" />
        <p className="display">This meeting is closed.</p>
        <Button tone="accent" onClick={() => navigate(`/meetings/${m.id}`)}>See the record</Button>
      </div>
    )
  }

  const setMe = (patch: (mm: Meeting) => void, log?: string) => update((s) => patch(s.meetings.find((x) => x.id === m.id)!), log ? { text: log, room: 'meetings', link: `/meetings/${m.id}/live` } : undefined)
  const togglePresent = (id: string) => { buzz(); setMe((mm) => { mm.present = mm.present.includes(id) ? mm.present.filter((x) => x !== id) : [...mm.present, id] }) }
  const go = (to: number) => {
    buzz()
    setMe((mm) => {
      if (mm.agenda[idx]) { mm.agenda[idx].notes = notes; if (to > idx) mm.agenda[idx].done = true }
      mm.liveIndex = Math.max(0, Math.min(mm.agenda.length - 1, to))
    })
  }
  const saveNotes = (v: string) => {
    setNotes(v)
    clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => setMe((mm) => { if (mm.agenda[idx]) mm.agenda[idx].notes = v }), 500)
  }
  const fmt = (s: number) => `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ''}${String(Math.floor((s % 3600) / 60)).padStart(Math.floor(s / 3600) ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`

  const R = 54
  const C = 2 * Math.PI * R
  const frac = item ? Math.min(1, itemElapsed / (item.minutes * 60)) : 0

  return (
    <div className="live">
      <header className="live-bar">
        <span className="live-dot" /> <span className="live-k">In session</span>
        <span className="live-name serif">{m.title} · {day(m.date)}</span>
        <span className="live-clock num">{fmt(elapsed)}</span>
        <span className="live-spacer" />
        <Button tone="ghost" size="sm" icon={<Icon.back size={15} />} onClick={() => { setMe((mm) => { if (mm.agenda[idx]) mm.agenda[idx].notes = notes }); navigate(`/meetings/${m.id}`) }}>Agenda</Button>
        <ConfirmButton tone="accent" size="sm" icon={<Icon.gavel size={15} />} confirm="Adjourn and draft the minutes?" onConfirm={() => {
          setMe((mm) => { if (mm.agenda[idx]) { mm.agenda[idx].notes = notes; mm.agenda[idx].done = true } })
          const docId = endMeeting(m.id)
          toast('Adjourned. The draft minutes are in Documents.', { undoable: true })
          navigate(`/documents/${docId}`)
        }}>Adjourn</ConfirmButton>
      </header>

      {phone && (
        <div className="live-phone">
          <ol className="live-steps" ref={steps} aria-label="Agenda">
            {m.agenda.map((a, i) => (
              <li key={a.id}>
                <button className={`ls ${i === idx ? 'now' : ''} ${a.done ? 'done' : ''}`} style={{ ['--k' as string]: KIND[a.kind].color }} onClick={() => { go(i); setPane('item') }} aria-label={`${i + 1}. ${a.title}`}>
                  {a.done ? <Icon.check size={12} /> : i + 1}
                </button>
              </li>
            ))}
          </ol>
          <Segmented value={pane} onChange={(v) => { buzz(); setPane(v) }} layoutId="live-pane" options={[
            { value: 'item', label: `Item ${idx + 1} of ${m.agenda.length}` },
            { value: 'roll', label: <>Roll call <b className={hasQuorum ? 'q-ok' : ''}>{m.present.length}/{directors.length}</b></> },
          ]} />
        </div>
      )}

      <div className="live-body" data-pane={pane}>
        {/* roll call and quorum */}
        <section className="live-roll" aria-label="Roll call">
          <div className="quorum">
            <svg viewBox="0 0 140 80" className="quorum-arc" aria-hidden>
              <path d="M10,72 A60,60 0 0 1 130,72" stroke="rgba(246,234,216,.14)" strokeWidth="10" fill="none" strokeLinecap="round" />
              <motion.path d="M10,72 A60,60 0 0 1 130,72" stroke={hasQuorum ? 'var(--marigold)' : 'rgba(246,234,216,.6)'} strokeWidth="10" fill="none" strokeLinecap="round"
                pathLength={1} strokeDasharray="1 1" animate={{ strokeDashoffset: 1 - m.present.length / directors.length, opacity: m.present.length ? 1 : 0 }} initial={{ strokeDashoffset: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
              {(() => { const a = Math.PI - (quorum / directors.length) * Math.PI; return <line x1={70 + Math.cos(a) * 50} y1={72 - Math.sin(a) * 50} x2={70 + Math.cos(a) * 72} y2={72 - Math.sin(a) * 72} stroke="var(--cream)" strokeWidth="2" /> })()}
            </svg>
            <div className="quorum-n"><span className="display">{m.present.length}</span><span>of {directors.length}</span></div>
            <AnimatePresence mode="wait">
              <motion.p key={String(hasQuorum)} className={`quorum-state ${hasQuorum ? 'ok' : ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {hasQuorum ? 'Quorum present. The board can act.' : `${quorum - m.present.length} more for a quorum`}
              </motion.p>
            </AnimatePresence>
          </div>
          <p className="live-k2">Roll call · tap who is here</p>
          <div className="roll">
            {directors.map((d) => {
              const here = m.present.includes(d.id)
              return (
                <motion.button key={d.id} className={`roll-p ${here ? 'here' : ''}`} onClick={() => togglePresent(d.id)} whileTap={{ scale: 0.92 }} aria-pressed={here}>
                  <Portrait name={d.name} hue={d.hue} size={40} dim={!here} ring={here ? 'var(--marigold)' : undefined} />
                  <span>{d.you ? 'You' : firstName(d.name)}</span>
                </motion.button>
              )
            })}
          </div>
          {m.present.length < directors.length && <button className="link live-all" onClick={() => setMe((mm) => { mm.present = directors.map((d) => d.id) })}>Everyone is here</button>}
          {phone && hasQuorum && <Button tone="primary" size="lg" className="live-begin" onClick={() => setPane('item')}>Quorum. On to item {idx + 1} <Icon.arrow size={16} /></Button>}
        </section>

        {/* the moment */}
        <section className="live-now" aria-live="polite">
          <AnimatePresence mode="wait">
            {item && (
              <motion.div key={item.id} className="live-item" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <div className="live-item-top">
                  <div className="live-timer">
                    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden>
                      <circle cx="60" cy="60" r={R} stroke="rgba(246,234,216,.12)" strokeWidth="6" fill="none" />
                      <circle cx="60" cy="60" r={R} stroke={over ? 'var(--marigold)' : 'var(--cream)'} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
                    </svg>
                    <span className="live-timer-v num">{fmt(itemElapsed)}</span>
                    <span className="live-timer-k">{over ? `over ${item.minutes} min` : `of ${item.minutes} min`}</span>
                  </div>
                  <div>
                    <p className="live-pos">Item {idx + 1} of {m.agenda.length} · <span style={{ color: KIND[item.kind].color }}>{KIND[item.kind].label}</span>{item.owner && ` · ${directors.find((x) => x.id === item.owner)?.name ?? ''}`}</p>
                    <h2 className="display live-title" style={{ fontSize: item.title.length > 46 ? 38 : item.title.length > 28 ? 46 : undefined }}>{item.title}</h2>
                  </div>
                </div>
                <label className="live-notes">
                  <span>Minutes for this item</span>
                  <textarea value={notes} onChange={(e) => saveNotes(e.target.value)} placeholder="What was reported, discussed or decided. Saved as you type." rows={5} />
                </label>
                {item.kind === 'action' && (() => {
                  const done = motions.find((x) => x.id === item.motionId && x.status !== 'open')
                  if (done) {
                    const o = outcome(done, directors.length)
                    return (
                      <motion.div className={`lresult ${done.status}`} initial={{ scale: 1.4, opacity: 0, rotate: -6 }} animate={{ scale: 1, opacity: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                        <span className="display">{done.status === 'carried' ? 'Carried' : 'Failed'}</span>
                        <span className="num">{done.number} · {o.aye} aye, {o.nay} nay{o.abstain ? `, ${o.abstain} abstain` : ''}</span>
                      </motion.div>
                    )
                  }
                  return openMotion ? <LiveVote motionId={openMotion.id} present={m.present} /> : <MotionForm m={m} item={item} disabled={!hasQuorum} />
                })()}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="live-nav">
            <Button tone="ghost" icon={<Icon.back size={16} />} disabled={idx === 0} onClick={() => go(idx - 1)}>{phone ? 'Back' : 'Previous'}</Button>
            {idx < m.agenda.length - 1
              ? <Button tone="primary" size="lg" onClick={() => go(idx + 1)}>{phone ? 'Next item' : <>Next: {m.agenda[idx + 1].title.length > 34 ? m.agenda[idx + 1].title.slice(0, 32) + '…' : m.agenda[idx + 1].title}</>} <Icon.arrow size={16} /></Button>
              : <span className="live-last">Last item. Adjourn when ready.</span>}
          </div>
        </section>

        {/* agenda progress */}
        <ol className="live-agenda">
          {m.agenda.map((a, i) => (
            <li key={a.id}>
              <button className={`la ${i === idx ? 'now' : ''} ${a.done ? 'done' : ''}`} onClick={() => go(i)} style={{ ['--k' as string]: KIND[a.kind].color }}>
                <span className="la-mark">{a.done ? <Icon.check size={12} /> : i + 1}</span>
                <span className="la-title">{a.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function MotionForm({ m, item, disabled }: { m: Meeting; item: AgendaItem; disabled: boolean }) {
  const directors = useStore((s) => s.directors.filter((d) => m.present.includes(d.id)))
  const [text, setText] = useState(`Resolved, that the Board approves: ${item.title.charAt(0).toLowerCase() + item.title.slice(1)}.`)
  const [moved, setMoved] = useState(item.owner && m.present.includes(item.owner) ? item.owner : directors[0]?.id)
  const [second, setSecond] = useState(directors.find((d) => d.id !== moved)?.id)
  const record = () => {
    const id = uid('v')
    update((s) => {
      s.motions.unshift({ id, title: item.title, text, movedBy: moved!, secondedBy: second, meetingId: m.id, opened: new Date().toISOString(), method: 'In meeting', ballots: {}, status: 'open', threshold: 'majority' })
      const it = s.meetings.find((x) => x.id === m.id)!.agenda.find((x) => x.id === item.id)
      if (it) it.motionId = id
    }, { text: `recorded a motion: ${item.title.toLowerCase()}`, room: 'votes', link: `/votes/${id}` })
    toast('Motion on the floor. Record the vote.')
  }
  if (disabled) return <p className="live-hint">The board needs a quorum before it can take this action.</p>
  return (
    <div className="mform">
      <p className="mform-k"><Icon.gavel size={16} /> A motion</p>
      <textarea className="mform-text serif" value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      <div className="mform-row">
        <label>Moved by <select value={moved} onChange={(e) => setMoved(e.target.value)}>{directors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label>Seconded by <select value={second} onChange={(e) => setSecond(e.target.value)}>{directors.filter((d) => d.id !== moved).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <Button tone="accent" onClick={record} disabled={!moved || !second}>Put it to a vote</Button>
      </div>
    </div>
  )
}

function LiveVote({ motionId, present }: { motionId: string; present: string[] }) {
  const m = useStore((s) => s.motions.find((x) => x.id === motionId))!
  const directors = useStore((s) => s.directors.filter((d) => present.includes(d.id)))
  const size = useStore((s) => s.directors.length)
  const o = outcome(m, size)
  const cycle = (id: string) => {
    const order: (Ballot | null)[] = [null, 'aye', 'nay', 'abstain']
    const cur = m.ballots[id] ?? null
    buzz()
    castBallot(m.id, id, order[(order.indexOf(cur) + 1) % order.length])
  }
  return (
    <div className="lvote">
      <div className="lvote-head">
        <p className="mform-k"><Icon.gavel size={16} /> On the floor: {m.title}</p>
        <p className="lvote-tally num"><b style={{ color: 'var(--aye-l)' }}>{o.aye}</b> aye · <b style={{ color: 'var(--nay-l)' }}>{o.nay}</b> nay · {o.abstain} abstain</p>
      </div>
      <div className="lvote-people">
        {directors.map((d) => {
          const b = m.ballots[d.id]
          return (
            <button key={d.id} className={`lv-p ${b ?? ''}`} onClick={() => cycle(d.id)}>
              <Portrait name={d.name} hue={d.hue} size={30} />
              <span>{d.you ? 'You' : firstName(d.name)}</span>
              <em>{b ?? 'tap'}</em>
            </button>
          )
        })}
      </div>
      <div className="lvote-actions">
        <Button tone="quiet" size="sm" onClick={() => directors.forEach((d) => castBallot(m.id, d.id, 'aye'))}>All in favor</Button>
        <ConfirmButton tone="accent" size="sm" icon={<Icon.check size={15} />} disabled={o.cast === 0} confirm={o.carried ? `Carries ${o.aye} to ${o.nay}.` : `Fails ${o.aye} to ${o.nay}.`} onConfirm={() => {
          const r = closeMotion(m.id)
          toast(<>{r.number}: <b>{r.carried ? 'carried' : 'failed'}</b>, {r.aye} to {r.nay}</>, { undoable: true })
        }}>Close the vote</ConfirmButton>
      </div>
    </div>
  )
}
