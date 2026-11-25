import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, ME } from '../store/store'
import { attention, upcoming, money$, nextMeeting, outcome, type Attention } from '../store/derive'
import { navigate, ago, day, daysFrom, firstName, money, relDay } from '../lib'
import { Portrait } from '../ui/Portrait'
import { Icon, RoomIcon } from '../ui/Icons'
import { Button, Count, toast, Wash, stagger } from '../ui/kit'
import type { Ballot } from '../store/types'
import './home.css'

type Q = 'attention' | 'changed' | 'next'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const items = useStore(attention)
  const activity = useStore((s) => s.activity)
  const next = useStore(upcoming)
  const [q, setQ] = useState<Q>('attention')
  const weekAgo = Date.now() - 7 * 86400000
  const changed = activity.filter((a) => new Date(a.at).getTime() > weekAgo)
  const meeting = useStore(nextMeeting)
  const me = useStore((s) => s.directors.find((d) => d.id === ME))

  const questions: { key: Q; n: number; text: string; sub: string }[] = [
    { key: 'attention', n: items.length, text: items.length === 1 ? 'thing needs you' : 'things need you', sub: items.length ? 'Ranked by what is due first' : 'Nothing waiting on you' },
    { key: 'changed', n: changed.length, text: 'things changed this week', sub: 'From the board and the record' },
    { key: 'next', n: meeting ? daysFrom(meeting.date) : 0, text: meeting ? 'days to the next meeting' : 'meetings planned', sub: meeting ? day(meeting.date, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Plan one in Meetings' },
  ]

  return (
    <>
      <Wash color="var(--cempasuchil)" x="100%" y="0%" />
      <div className="home">
        <div className="home-left">
          <motion.p className="home-date" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </motion.p>
          <motion.h1 className="display home-hello" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            {greeting()},<br /><em>{firstName(me?.name ?? 'friend')}.</em>
          </motion.h1>

          <motion.ol className="home-qs" variants={stagger.parent} initial="hidden" animate="show">
            {questions.map((x) => (
              <motion.li key={x.key} variants={stagger.child}>
                <button className={`home-q ${q === x.key ? 'on' : ''}`} onClick={() => setQ(x.key)} aria-expanded={q === x.key}>
                  <span className="home-q-n display"><Count value={x.n} /></span>
                  <span className="home-q-text">
                    <span className="home-q-line serif">{x.text}</span>
                    <span className="home-q-sub">{x.sub}</span>
                  </span>
                  {q === x.key && <motion.span layoutId="home-q-mark" className="home-q-mark" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                </button>
              </motion.li>
            ))}
          </motion.ol>

          <Pulse />
        </div>

        <div className="home-right">
          <AnimatePresence mode="wait">
            <motion.div key={q} className="home-panel" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              {q === 'attention' && <AttentionList items={items} />}
              {q === 'changed' && <Changed />}
              {q === 'next' && <Next list={next} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

function AttentionList({ items }: { items: Attention[] }) {
  const state = useStore((s) => s)
  if (!items.length) {
    return (
      <div className="home-empty">
        <p className="display">You’re clear.</p>
        <p className="quiet">Nothing is waiting on you. The next thing is the meeting agenda.</p>
      </div>
    )
  }
  return (
    <motion.ul className="att" variants={stagger.parent} initial="hidden" animate="show">
      <AnimatePresence initial={false}>
        {items.map((a) => (
          <motion.li key={a.id} className={`att-item tone-${a.tone}`} variants={stagger.child} layout exit={{ opacity: 0, x: 40, transition: { duration: 0.3 } }}>
            <span className="att-glyph"><RoomIcon room={a.room} size={20} /></span>
            <div className="att-body">
              <button className="att-title serif" onClick={() => navigate(a.link)}>{a.title}</button>
              <p className="att-detail">{a.detail}</p>
              <div className="att-actions">
                <QuickAction a={a} />
                <Button tone="ghost" size="sm" onClick={() => {
                  update((s) => { s.dismissed.push(a.id) })
                  toast('Set aside until something changes', { undoable: true })
                }}>Later</Button>
              </div>
            </div>
            {a.due && <span className="att-due">{relDay(a.due)}</span>}
          </motion.li>
        ))}
      </AnimatePresence>
      <li className="att-foot quiet small">{state.dismissed.length > 0 && (
        <button className="link" onClick={() => { update((s) => { s.dismissed = [] }); toast('Everything you set aside is back') }}>Show {state.dismissed.length} set aside</button>
      )}</li>
    </motion.ul>
  )
}

function QuickAction({ a }: { a: Attention }) {
  const motionId = a.id.startsWith('vote-') ? a.id.slice(5) : null
  const m = useStore((s) => s.motions.find((x) => x.id === motionId))
  const size = useStore((s) => s.directors.length)

  if (m) {
    const cast = (b: Ballot) => {
      update((s) => {
        const mm = s.motions.find((x) => x.id === m.id)!
        mm.ballots[ME] = b
      }, { text: `voted ${b} on ${m.title.toLowerCase()}`, room: 'votes', link: `/votes/${m.id}` })
      const o = outcome({ ...m, ballots: { ...m.ballots, [ME]: b } }, size)
      toast(<>Your <b>{b}</b> is recorded. {o.aye} aye, {o.nay} nay so far.</>, { undoable: true })
    }
    return (
      <span className="att-vote">
        <Button tone="quiet" size="sm" onClick={() => cast('aye')}>Aye</Button>
        <Button tone="quiet" size="sm" onClick={() => cast('nay')}>Nay</Button>
        <Button tone="ghost" size="sm" onClick={() => cast('abstain')}>Abstain</Button>
        <Button tone="ghost" size="sm" icon={<Icon.arrow size={15} />} onClick={() => navigate(a.link)}>Read the motion</Button>
      </span>
    )
  }
  if (a.id.startsWith('notice-')) {
    const id = a.id.slice(7)
    return <Button tone="accent" size="sm" icon={<Icon.mail size={15} />} onClick={() => {
      update((s) => { const mm = s.meetings.find((x) => x.id === id); if (mm) mm.noticeSent = new Date().toISOString() }, { text: 'sent the notice and agenda for the next meeting', room: 'meetings', link: `/meetings/${id}` })
      toast('Notice and agenda sent to all 11 directors', { undoable: true })
    }}>Send notice now</Button>
  }
  if (a.id.startsWith('thanks-')) {
    return <Button tone="accent" size="sm" icon={<Icon.heart size={15} />} onClick={() => {
      update((s) => { s.donations.forEach((d) => { d.thanked = true }) }, { text: 'sent thank-you letters to recent donors', room: 'money', link: '/money' })
      toast('Thank-you letters queued and donors marked thanked', { undoable: true })
    }}>Send thank-yous</Button>
  }
  if (a.id.startsWith('task-')) {
    const cid = a.id.slice(5)
    return <Button tone="accent" size="sm" icon={<Icon.check size={15} />} onClick={() => {
      update((s) => { s.events.forEach((e) => e.checklist.forEach((c) => { if (c.id === cid) c.done = true })) }, { text: `finished: ${a.title.toLowerCase()}`, room: 'events', link: a.link })
      toast('Marked done', { undoable: true })
    }}>Mark done</Button>
  }
  const verbs: Record<string, string> = { min: 'Review the draft', score: 'Score applicants', grant: 'Open the grant', term: 'Open her seat', artists: 'Review profiles' }
  const k = a.id.split('-')[0]
  return <Button tone="accent" size="sm" icon={<Icon.arrow size={15} />} onClick={() => navigate(a.link)}>{verbs[k] ?? 'Open'}</Button>
}

function Changed() {
  const activity = useStore((s) => s.activity)
  const directors = useStore((s) => s.directors)
  return (
    <motion.ul className="chg" variants={stagger.parent} initial="hidden" animate="show">
      {activity.slice(0, 9).map((a) => {
        const who = directors.find((d) => d.id === a.who)
        return (
          <motion.li key={a.id} variants={stagger.child}>
            <button className="chg-item" onClick={() => a.link && navigate(a.link)}>
              {who ? <Portrait name={who.name} hue={who.hue} size={34} /> : <span className="chg-sys"><RoomIcon room={a.room} size={18} /></span>}
              <span className="chg-text">
                {who && <b>{who.you ? 'You' : firstName(who.name)} </b>}{a.text}
              </span>
              <span className="chg-when">{ago(a.at)}</span>
            </button>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

function Next({ list }: { list: ReturnType<typeof upcoming> }) {
  return (
    <motion.ol className="nxt" variants={stagger.parent} initial="hidden" animate="show">
      {list.slice(0, 7).map((u, i) => {
        const d = new Date(u.when)
        return (
          <motion.li key={u.id + i} variants={stagger.child}>
            <button className={`nxt-item room-${u.room}`} onClick={() => navigate(u.link)}>
              <span className="nxt-date">
                <span className="nxt-day display">{d.getDate()}</span>
                <span className="nxt-mon">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              </span>
              <span className="nxt-rule" />
              <span className="nxt-body">
                <span className="nxt-title serif">{u.title}</span>
                <span className="nxt-detail">{u.detail}</span>
              </span>
              <span className="nxt-rel">{relDay(u.when)}</span>
            </button>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}

/* Four instruments of the organisation's health, set in open space. */
function Pulse() {
  const m = useStore(money$)
  const campaign = useStore((s) => s.campaign)
  const open = useStore((s) => s.motions.filter((x) => x.status === 'open'))
  const size = useStore((s) => s.directors.length)
  const nextEvent = useStore((s) => s.events.filter((e) => daysFrom(e.start) >= 0).sort((a, b) => a.start.localeCompare(b.start))[0])
  const pct = Math.min(1, m.raised / campaign.goal)
  const net = m.incomeActual - m.expenseActual
  const R = 30
  const C = Math.PI * R

  return (
    <motion.div className="pulse" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }}>
      <button className="pulse-i" onClick={() => navigate('/money')}>
        <svg width="78" height="46" viewBox="0 0 78 46" aria-hidden>
          <path d={`M9,40 A${R},${R} 0 0 1 69,40`} stroke="rgba(34,28,44,.1)" strokeWidth="7" fill="none" strokeLinecap="round" />
          <motion.path d={`M9,40 A${R},${R} 0 0 1 69,40`} stroke="var(--marigold)" strokeWidth="7" fill="none" strokeLinecap="round"
            strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct) }} transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }} />
        </svg>
        <span className="pulse-v display"><Count value={m.raised} format={(n) => money(n, { compact: true })} /></span>
        <span className="pulse-k">of {money(campaign.goal, { compact: true })} · {campaign.name}</span>
      </button>
      <button className="pulse-i" onClick={() => navigate('/money')}>
        <span className="pulse-v display" style={{ color: net >= 0 ? 'var(--teal)' : 'var(--terracotta)' }}><Count value={net} format={(n) => (n >= 0 ? '+' : '−') + money(Math.abs(n), { compact: true })} /></span>
        <span className="pulse-k">net this year</span>
      </button>
      <button className="pulse-i" onClick={() => navigate(open[0] ? `/votes/${open[0].id}` : '/votes')}>
        <span className="pulse-dots" aria-hidden>
          {open.slice(0, 2).map((mo) => {
            const o = outcome(mo, size)
            return (
              <span key={mo.id} className="pulse-dotrow">
                {Array.from({ length: size }).map((_, i) => <i key={i} className={i < o.aye ? 'aye' : i < o.aye + o.nay ? 'nay' : i < o.cast ? 'abs' : ''} />)}
              </span>
            )
          })}
        </span>
        <span className="pulse-v display">{open.length}</span>
        <span className="pulse-k">open ballot{open.length === 1 ? '' : 's'}</span>
      </button>
      {nextEvent && (
        <button className="pulse-i" onClick={() => navigate(`/events/${nextEvent.id}`)}>
          <span className="pulse-v display"><Count value={daysFrom(nextEvent.start)} /> <small>days</small></span>
          <span className="pulse-k">to {nextEvent.name}</span>
        </button>
      )}
    </motion.div>
  )
}
