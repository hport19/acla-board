import { useMemo, useState } from 'react'
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion'
import { useStore, update } from '../store/store'
import { navigate, useRoute, money, daysFrom, day, usePhone, openDetail, closeTo } from '../lib'
import { Art } from '../ui/Art'
import { Icon } from '../ui/Icons'
import { Button, ConfirmButton, Wash, toast, Brush, Drawer } from '../ui/kit'
import type { Artist } from '../store/types'
import './artists.css'

/* Salon hanging: a rhythm of large, tall and small frames. */
/* A composed hanging for the full wall (row, column, rows, columns); filters fall back to the rhythm below. */
const FULL: [number, number, number, number][] = [[1, 1, 2, 2], [1, 3, 1, 1], [1, 4, 2, 1], [1, 5, 1, 1], [1, 6, 1, 1], [2, 3, 2, 1], [2, 5, 2, 2], [3, 1, 2, 2], [3, 4, 1, 1], [4, 3, 2, 1], [4, 4, 2, 1], [4, 5, 2, 2], [5, 1, 1, 2]]
const HANG: [number, number][] = [[2, 2], [1, 1], [2, 1], [1, 1], [3, 2], [1, 1], [2, 1], [2, 2], [1, 1], [1, 1], [2, 1], [2, 2], [1, 1], [2, 1]]

export default function Artists() {
  const { id } = useRoute()
  const artists = useStore((s) => s.artists)
  const [filter, setFilter] = useState<string>('All')
  const groups = useMemo(() => {
    const g = new Map<string, number>()
    artists.forEach((a) => { const k = family(a.discipline); g.set(k, (g.get(k) ?? 0) + 1) })
    return ['All', ...[...g.keys()].sort()]
  }, [artists])
  const shown = artists.filter((a) => filter === 'All' || (filter === 'Waiting for review' ? a.profile === 'Pending review' : family(a.discipline) === filter))
  const current = artists.find((a) => a.id === id) ?? shown[0] ?? artists[0]
  const pending = artists.filter((a) => a.profile === 'Pending review').length
  const phone = usePhone()

  return (
    <>
      <Wash color="var(--cobalt)" x="30%" y="0%" />
      <div className="ar">
        <div className="ar-wall-side">
          <header className="ar-head">
            <div>
              <h1 className="display room-title">The <em>wall</em></h1>
              <Brush color="var(--cobalt)" />
            </div>
            <p className="ar-lede">{artists.length} artists ACLA has shown, paid or profiled on 806.art.</p>
          </header>
          <div className="ar-filters" role="tablist">
            {groups.map((g) => (
              <button key={g} role="tab" aria-selected={filter === g} className={`ar-f ${filter === g ? 'on' : ''}`} onClick={() => setFilter(g)}>
                {filter === g && <motion.span layoutId="ar-f" className="ar-f-on" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span>{g}</span>
              </button>
            ))}
            {pending > 0 && (
              <button className={`ar-f pending ${filter === 'Waiting for review' ? 'on' : ''}`} onClick={() => setFilter('Waiting for review')}>
                {filter === 'Waiting for review' && <motion.span layoutId="ar-f" className="ar-f-on" />}
                <span>{pending} waiting for review</span>
              </button>
            )}
          </div>
          <LayoutGroup>
            <div className="wall">
              <AnimatePresence>
                {shown.map((a, i) => {
                  const [r, c] = HANG[i % HANG.length]
                  const f = shown.length === FULL.length ? FULL[i] : null
                  const on = a.id === current?.id && (!phone || !!id)
                  return (
                    <motion.button key={a.id} layout className={`frame ${on ? 'on' : ''}`} style={f ? { gridArea: `${f[0]} / ${f[1]} / span ${f[2]} / span ${f[3]}` } : { gridRow: `span ${r}`, gridColumn: `span ${c}` }}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.03 * i }}
                      onClick={() => openDetail(`/artists/${a.id}`)} aria-label={`${a.work} by ${a.name}`} aria-pressed={on} data-name={a.name}>
                      <span className="frame-mat"><Art style={a.style} seed={a.seed} title={a.work} /></span>
                      {a.profile === 'Pending review' && <span className="frame-tag">New</span>}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>
        <Drawer open={!!id && !!current} onClose={() => closeTo('/artists')} label="Artist" className="artists-drawer">
          <AnimatePresence mode="wait">
            {current && <Label key={current.id} a={current} />}
          </AnimatePresence>
        </Drawer>
      </div>
    </>
  )
}

function family(discipline: string) {
  if (/mural|paint|illustr/i.test(discipline)) return 'Painting and murals'
  if (/print|paper|textile|ceram|jewel/i.test(discipline)) return 'Craft and print'
  if (/photo/i.test(discipline)) return 'Photography'
  return 'Music and dance'
}

/* The museum wall label. */
function Label({ a }: { a: Artist }) {
  const events = useStore((s) => s.events.filter((e) => daysFrom(e.start) >= 0))
  const showing = events.filter((e) => e.artists.includes(a.id))
  const [inviting, setInviting] = useState(false)
  const free = events.filter((e) => !e.artists.includes(a.id))

  const setProfile = (p: Artist['profile'], text: string) => {
    update((s) => { s.artists.find((x) => x.id === a.id)!.profile = p }, { text, room: 'artists', link: `/artists/${a.id}` })
  }
  const stipend = () => {
    update((s) => {
      s.artists.find((x) => x.id === a.id)!.paid += 250
      const line = s.budget.find((b) => b.name === 'Artist stipends')
      if (line) line.actual += 250
    }, { text: `paid ${a.name} a $250 stipend`, room: 'money', link: '/money' })
    toast(`$250 stipend to ${a.name.split(' ')[0]}, charged to Artist stipends`, { undoable: true })
  }
  const invite = (eid: string, name: string) => {
    update((s) => { s.events.find((e) => e.id === eid)!.artists.push(a.id) }, { text: `invited ${a.name} to ${name}`, room: 'events', link: `/events/${eid}` })
    setInviting(false)
    toast(`${a.name.split(' ')[0]} is on the bill for ${name}`, { undoable: true })
  }

  return (
    <motion.aside className="label" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div className="label-art" initial={{ rotate: -1.5, y: 10 }} animate={{ rotate: 0, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }}>
        <Art style={a.style} seed={a.seed} title={a.work} />
      </motion.div>
      <div className="plaque">
        <h2 className="display plaque-name">{a.name}</h2>
        <p className="plaque-meta">{a.discipline} · {a.town}</p>
        <p className="plaque-work"><em>{a.work}</em>, {a.year}</p>
        <p className="plaque-medium">{a.medium}</p>
        <p className="plaque-statement serif">“{a.statement}”</p>
      </div>
      <dl className="facts">
        <div><dt>806.art</dt><dd className={`pf pf-${a.profile.split(' ')[0].toLowerCase()}`}>{a.profile}</dd></div>
        <div><dt>Paid this year</dt><dd className="num">{money(a.paid)}</dd></div>
        <div><dt>With ACLA</dt><dd>{a.spotlights.length ? a.spotlights.join(' · ') : 'Not yet shown'}</dd></div>
        {showing.length > 0 && <div><dt>Coming up</dt><dd>{showing.map((e) => <button key={e.id} className="link" onClick={() => navigate(`/events/${e.id}`)}>{e.name}, {day(e.start, { month: 'short', day: 'numeric' })}</button>)}</dd></div>}
      </dl>
      <div className="label-actions">
        {a.profile === 'Pending review' && <Button tone="accent" icon={<Icon.check size={16} />} onClick={() => { setProfile('Live', `approved ${a.name}’s 806.art profile`); toast('Profile approved and live on 806.art', { undoable: true }) }}>Approve profile</Button>}
        {a.profile === 'Live' && <Button tone="quiet" icon={<Icon.star size={16} />} onClick={() => { setProfile('Featured', `featured ${a.name} on 806.art`); toast('Featured in the next 806.art newsletter', { undoable: true }) }}>Feature on 806.art</Button>}
        {a.profile === 'Featured' && <Button tone="ghost" onClick={() => { setProfile('Live', `ended ${a.name}’s feature`); toast('Feature ended; the profile stays live', { undoable: true }) }}>End the feature</Button>}
        <ConfirmButton tone="quiet" icon={<Icon.heart size={16} />} confirm="Pay a $250 stipend?" onConfirm={stipend}>Stipend</ConfirmButton>
        {free.length > 0 && <Button tone="ghost" icon={<Icon.plus size={16} />} onClick={() => setInviting((v) => !v)} aria-expanded={inviting}>Invite to an event</Button>}
      </div>
      <AnimatePresence>
        {inviting && (
          <motion.ul className="invite" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {free.slice(0, 5).map((e) => <li key={e.id}><button onClick={() => invite(e.id, e.name)}><span className="serif">{e.name}</span><span>{day(e.start, { month: 'short', day: 'numeric' })}</span></button></li>)}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
