import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, uid, ME } from '../store/store'
import { outcome, dir } from '../store/derive'
import { castBallot, closeMotion } from '../store/actions'
import { useRoute, day, daysFrom, firstName, relDay, usePhone, openDetail, closeTo, buzz } from '../lib'
import { Portrait } from '../ui/Portrait'
import { Icon } from '../ui/Icons'
import { Button, ConfirmButton, Wash, toast, Brush, Sheet, Field, Count, Drawer } from '../ui/kit'
import type { Ballot, Motion, Director } from '../store/types'
import './votes.css'

export default function Votes() {
  const { id } = useRoute()
  const motions = useStore((s) => s.motions)
  const open = motions.filter((m) => m.status === 'open')
  const closed = motions.filter((m) => m.status !== 'open').sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
  const current = motions.find((m) => m.id === id) ?? open[0] ?? closed[0]
  const [creating, setCreating] = useState(false)
  const phone = usePhone()
  const sel = phone && !id ? undefined : current?.id

  return (
    <>
      <Wash color="var(--rosa)" x="70%" y="0%" />
      <div className="vt">
        <nav className="vt-book" aria-label="Motions and resolutions">
          <h1 className="display vt-title">Votes</h1>
          <Brush color="var(--rosa)" width={110} />
          <div className="vt-book-scroll">
            <p className="vt-k">Open ballots</p>
            {open.length === 0 && <p className="vt-empty">No ballots are open.</p>}
            {open.map((m) => <BookItem key={m.id} m={m} on={m.id === sel} />)}
            <button className="vt-new" onClick={() => setCreating(true)}><Icon.plus size={16} /> Bring a motion</button>
            <p className="vt-k">Book of resolutions</p>
            {closed.map((m) => <BookItem key={m.id} m={m} on={m.id === sel} />)}
          </div>
        </nav>
        <Drawer open={!!id && !!current} onClose={() => closeTo('/votes')} label={current?.number ? `Resolution ${current.number}` : 'Motion before the board'} className="votes-drawer">
          <AnimatePresence mode="wait">
            {current && <MotionView key={current.id} m={current} />}
          </AnimatePresence>
        </Drawer>
      </div>
      <NewMotion open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

function BookItem({ m, on }: { m: Motion; on: boolean }) {
  const size = useStore((s) => s.directors.length)
  const o = outcome(m, size)
  return (
    <button className={`vb ${on ? 'on' : ''} ${m.status}`} onClick={() => openDetail(`/votes/${m.id}`)}>
      {on && <motion.span layoutId="vb-on" className="vb-on" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
      <span className="vb-n num">{m.number ? `${m.number} · ${m.status === 'carried' ? 'Carried' : 'Failed'} ${o.aye}–${o.nay}` : m.ballots[ME] ? `You voted ${m.ballots[ME]}` : 'Your vote'}{m.status === 'open' && m.closes && <em> · closes {relDay(m.closes)}</em>}</span>
      <span className="vb-title">{m.title}</span>
      <span className="vb-bar" aria-hidden>
        <i className="a" style={{ flexGrow: o.aye }} /><i className="n" style={{ flexGrow: o.nay }} /><i className="x" style={{ flexGrow: o.abstain }} /><i className="r" style={{ flexGrow: m.status === 'open' ? o.remaining : 0 }} />
      </span>
    </button>
  )
}

/* Parliament-style arc: ayes gather on the left, nays on the right, the undecided in the middle. */
function Hemicycle({ m, directors, onSeat }: { m: Motion; directors: Director[]; onSeat: (d: Director) => void }) {
  const phone = usePhone()
  const rank = (d: Director) => { const b = m.ballots[d.id]; return b === 'aye' ? 0 : b === 'abstain' ? 2 : b === 'nay' ? 3 : 1 }
  const ordered = useMemo(() => [...directors].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)), [directors, m.ballots]) // eslint-disable-line react-hooks/exhaustive-deps
  const n = ordered.length
  const W = 100, H = 54
  return (
    <div className="hemi" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="hemi-svg" aria-hidden>
        <path d={`M6,${H - 2} A44,44 0 0 1 94,${H - 2}`} fill="none" stroke="rgba(34,28,44,.08)" strokeWidth="9" />
      </svg>
      {ordered.map((d, i) => {
        const a = Math.PI - (i / (n - 1)) * Math.PI
        const x = 50 + Math.cos(a) * 44
        const y = (H - 2 - Math.sin(a) * 44) / H * 100
        const b = m.ballots[d.id]
        return (
          <motion.button key={d.id} layout className={`seat-v ${b ?? 'none'}`} style={{ left: `${x}%`, top: `${y}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }} onClick={() => onSeat(d)}
            title={`${d.name}: ${b ?? 'not yet voted'}`} disabled={m.status !== 'open'}>
            <Portrait name={d.name} hue={d.hue} size={phone ? 30 : 44} dim={!b} ring={b === 'aye' ? 'var(--aye)' : b === 'nay' ? 'var(--nay)' : b === 'abstain' ? 'var(--abstain)' : undefined} />
            <span className="seat-v-name" style={{ left: `calc(50% + ${Math.cos(a) * (phone ? 30 : 42)}px)`, top: `calc(50% - ${Math.sin(a) * (phone ? 28 : 38)}px)` }}>{d.you ? 'You' : firstName(d.name)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

function MotionView({ m }: { m: Motion }) {
  const directors = useStore((s) => s.directors)
  const mover = useStore((s) => dir(s, m.movedBy))
  const second = useStore((s) => dir(s, m.secondedBy))
  const meeting = useStore((s) => s.meetings.find((x) => x.id === m.meetingId))
  const o = outcome(m, directors.length)
  const mine = m.ballots[ME]
  const isOpen = m.status === 'open'
  const closesIn = m.closes ? daysFrom(m.closes) : null

  const vote = (b: Ballot) => {
    buzz(mine === b ? 6 : 14)
    castBallot(m.id, ME, mine === b ? null : b)
    toast(mine === b ? 'Your vote is withdrawn' : <>Your <b>{b}</b> is recorded</>, { undoable: true })
  }
  const recordFor = (d: Director) => {
    if (!isOpen) return
    if (d.id === ME) return
    const order: (Ballot | null)[] = [null, 'aye', 'nay', 'abstain']
    const cur = m.ballots[d.id] ?? null
    const next = order[(order.indexOf(cur) + 1) % order.length]
    castBallot(m.id, d.id, next)
    toast(next ? `Recorded ${firstName(d.name)}’s written ballot: ${next}` : `Cleared ${firstName(d.name)}’s ballot`)
  }

  const status = !isOpen ? (m.status === 'carried' ? 'Carried' : 'Failed')
    : !o.hasQuorum ? `${o.quorum - o.cast} more ballot${o.quorum - o.cast === 1 ? '' : 's'} for a quorum`
      : o.carried ? 'Carrying' : o.voting ? 'Not carrying yet' : 'Waiting for votes'

  return (
    <motion.div className="mv" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <article className={`paper ${isOpen ? '' : 'closed'}`}>
        <p className="paper-k">{m.number ? `Resolution ${m.number}` : 'Motion before the board'} · {m.method}{meeting ? ` · ${day(meeting.date)}` : ''}</p>
        <h2 className="display paper-title">{m.title}</h2>
        <p className="paper-text serif">{m.text}</p>
        <div className="paper-sig">
          {mover && <span><Portrait name={mover.name} hue={mover.hue} size={26} /> Moved by {mover.you ? 'you' : mover.name}</span>}
          {second && <span><Portrait name={second.name} hue={second.hue} size={26} /> Seconded by {second.you ? 'you' : second.name}</span>}
        </div>
        <p className="paper-rule">{m.threshold === 'two-thirds' ? 'Needs two-thirds of directors voting (bylaws, Article IV).' : 'Needs a majority of directors voting.'} Abstentions don’t count toward either side. A quorum of {o.quorum} must take part.</p>
        <AnimatePresence>
          {!isOpen && (
            <motion.div className={`stamp ${m.status}`} initial={{ scale: 2.4, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -9 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.25 }}>
              <span className="stamp-word">{m.status === 'carried' ? 'Carried' : 'Failed'}</span>
              <span className="stamp-sub num">{o.aye} – {o.nay}{o.abstain ? ` – ${o.abstain}` : ''} · {m.closedAt ? day(m.closedAt, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </article>

      <section className="tally">
        <Hemicycle m={m} directors={directors} onSeat={recordFor} />
        <div className="tally-center">
          <p className="tally-nums display">
            <span className="aye"><Count value={o.aye} /></span>
            <span className="sep">–</span>
            <span className="nay"><Count value={o.nay} /></span>
          </p>
          <p className={`tally-status ${!isOpen ? m.status : o.carried ? 'carrying' : ''}`}>{status}</p>
          <p className="tally-sub">{o.abstain} abstain · {isOpen ? `${o.remaining} yet to vote` : `${directors.length - o.cast} did not vote`} · needs {o.needed || 1} aye{(o.needed || 1) === 1 ? '' : 's'}</p>
        </div>

        {isOpen ? (
          <div className="ballot">
            <div className="ballot-cast">
            <p className="ballot-k">{mine ? <>You voted <b>{mine}</b>. Tap again to withdraw.</> : 'Your ballot'}{closesIn !== null && <span> · closes {relDay(m.closes!)}</span>}</p>
            <div className="ballot-btns">
              {(['aye', 'nay', 'abstain'] as Ballot[]).map((b) => (
                <motion.button key={b} className={`bb bb-${b} ${mine === b ? 'on' : ''}`} onClick={() => vote(b)} whileTap={{ scale: 0.95 }} aria-pressed={mine === b}>
                  {mine === b && <motion.span layoutId="bb-on" className="bb-on" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span className="bb-l">{b === 'aye' ? 'Aye' : b === 'nay' ? 'Nay' : 'Abstain'}</span>
                </motion.button>
              ))}
            </div>
            </div>
            <div className="ballot-foot">
              <span className="ballot-hint">Tap a seat to record a director’s written ballot.</span>
              <ConfirmButton tone="primary" icon={<Icon.gavel size={16} />} disabled={!o.hasQuorum} confirm={o.carried ? `It carries ${o.aye} to ${o.nay}.` : `It fails ${o.aye} to ${o.nay}.`} onConfirm={() => {
                const r = closeMotion(m.id)
                toast(<>{r.number} entered in the book: <b>{r.carried ? 'carried' : 'failed'}</b></>, { undoable: true })
              }}>Close the ballot</ConfirmButton>
            </div>
          </div>
        ) : (
          <div className="ballot closed">
            <p className="ballot-k">Entered in the book of resolutions{m.closedAt ? ` ${relDay(m.closedAt)}` : ''}.</p>
            <div className="voters">
              {(['aye', 'nay', 'abstain'] as Ballot[]).map((b) => {
                const who = directors.filter((d) => m.ballots[d.id] === b)
                if (!who.length) return null
                return <p key={b}><b className={`vk-${b}`}>{b === 'aye' ? 'Aye' : b === 'nay' ? 'Nay' : 'Abstain'}</b> {who.map((d) => (d.you ? 'You' : firstName(d.name))).join(', ')}</p>
              })}
            </div>
          </div>
        )}
      </section>
    </motion.div>
  )
}

function NewMotion({ open, onClose }: { open: boolean; onClose: () => void }) {
  const directors = useStore((s) => s.directors)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('Resolved, that ')
  const [moved, setMoved] = useState(ME)
  const [second, setSecond] = useState('d-marisol')
  const [days, setDays] = useState(5)
  const [threshold, setThreshold] = useState<Motion['threshold']>('majority')
  const submit = () => {
    const id = uid('v')
    update((s) => {
      s.motions.unshift({ id, title: title.trim(), text: text.trim(), movedBy: moved, secondedBy: second, opened: new Date().toISOString(), closes: new Date(Date.now() + days * 86400000).toISOString(), method: 'Electronic ballot', ballots: {}, status: 'open', threshold })
    }, { text: `opened a ballot: ${title.trim().toLowerCase()}`, room: 'votes', link: `/votes/${id}` })
    onClose()
    setTitle(''); setText('Resolved, that ')
    openDetail(`/votes/${id}`)
    toast('Ballot opened. Every director has been notified.', { undoable: true })
  }
  return (
    <Sheet open={open} onClose={onClose} title="Bring a motion">
      <Field label="What it is, in a few words"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Adopt the gift acceptance policy" autoFocus /></Field>
      <Field label="The resolution" hint="Write it as it should appear in the book of resolutions."><textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="field-row">
        <Field label="Moved by"><select value={moved} onChange={(e) => setMoved(e.target.value)}>{directors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Seconded by"><select value={second} onChange={(e) => setSecond(e.target.value)}>{directors.filter((d) => d.id !== moved).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
      </div>
      <div className="field-row">
        <Field label="Ballot stays open" hint="The bylaws require at least 72 hours."><select value={days} onChange={(e) => setDays(Number(e.target.value))}>{[3, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d} days</option>)}</select></Field>
        <Field label="To carry"><select value={threshold} onChange={(e) => setThreshold(e.target.value as Motion['threshold'])}><option value="majority">A majority</option><option value="two-thirds">Two-thirds (policies, bylaws)</option></select></Field>
      </div>
      <div className="sheet-foot">
        <Button tone="ghost" onClick={onClose}>Cancel</Button>
        <Button tone="accent" icon={<Icon.gavel size={16} />} disabled={!title.trim() || text.trim().length < 20} onClick={submit}>Open the ballot</Button>
      </div>
    </Sheet>
  )
}
