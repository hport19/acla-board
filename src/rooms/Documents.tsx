import { useEffect, useMemo, useState } from 'react'
import { isLocal } from '../edition'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, uid, ME } from '../store/store'
import { nextMeeting, dir } from '../store/derive'
import { navigate, useRoute, day, relDay, rng, usePhone, openDetail, closeTo } from '../lib'
import { Icon } from '../ui/Icons'
import { Button, ConfirmButton, Wash, toast, Brush, Drawer } from '../ui/kit'
import type { BoardDoc } from '../store/types'
import './documents.css'

const SHELVES: { key: BoardDoc['shelf']; label: string; color: string }[] = [
  { key: 'Governing', label: 'Governing', color: isLocal ? '#1e3256' : '#2b2d6b' },
  { key: 'Policies', label: 'Policies', color: isLocal ? '#2d5853' : '#1d5e5c' },
  { key: 'Minutes', label: 'Minutes', color: isLocal ? '#4a4640' : '#6b4e3d' },
  { key: 'Filings', label: 'Filings', color: isLocal ? '#6a2c40' : '#8a3d24' },
]

export default function Documents() {
  const { id } = useRoute()
  const docs = useStore((s) => s.docs)
  const [q, setQ] = useState('')
  const match = (d: BoardDoc) => !q.trim() || (d.title + ' ' + d.sections.map((s) => s.heading + ' ' + s.body).join(' ')).toLowerCase().includes(q.trim().toLowerCase())
  const current = docs.find((d) => d.id === id) ?? docs.find((d) => d.status === 'Awaiting approval') ?? docs[0]
  const hits = docs.filter(match)
  const phone = usePhone()
  const sel = phone && !id ? undefined : current?.id

  return (
    <>
      <Wash color="var(--walnut)" x="0%" y="100%" />
      <div className="dc">
        <div className="dc-shelves">
          <header className="dc-head">
            <h1 className="display room-title">The <em>archive</em></h1>
            <Brush color="var(--walnut)" />
          </header>
          <label className="dc-search">
            <Icon.search size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every document" aria-label="Search documents" />
            {q && <span className="dc-hits">{hits.length} found</span>}
          </label>
          {phone && q.trim() && (
            <ul className="dc-results">
              {hits.length === 0 && <li className="dc-none serif">Nothing in the archive says “{q.trim()}”.</li>}
              {hits.map((d) => {
                const sec = d.sections.find((x) => (x.heading + ' ' + x.body).toLowerCase().includes(q.trim().toLowerCase()))
                return (
                  <li key={d.id}>
                    <button onClick={() => openDetail(`/documents/${d.id}`)} style={{ ['--s' as string]: SHELVES.find((x) => x.key === d.shelf)?.color }}>
                      <span className="dc-r-title serif">{highlight(d.title, q)}</span>
                      <span className="dc-r-sub">{d.shelf} · {sec ? highlight(sec.body.slice(Math.max(0, sec.body.toLowerCase().indexOf(q.trim().toLowerCase()) - 30), 110), q) : d.status}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="shelves">
            {SHELVES.map((sh) => (
              <div key={sh.key} className="shelf" style={{ ['--s' as string]: sh.color }}>
                <span className="shelf-label serif">{sh.label}</span>
                <div className="shelf-books">
                  {docs.filter((d) => d.shelf === sh.key).map((d, i) => <Spine key={d.id} d={d} i={i} on={d.id === sel} dim={!match(d)} />)}
                  {sh.key === 'Governing' && <Vase />}
                  {sh.key === 'Filings' && <Stack />}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Drawer open={!!id && !!current} onClose={() => closeTo('/documents')} label={current ? `${current.shelf} · ${current.status}` : 'Document'} className="documents-drawer">
          <AnimatePresence mode="wait">
            {current && <Reader key={current.id} d={current} q={q} />}
          </AnimatePresence>
        </Drawer>
      </div>
    </>
  )
}

function Spine({ d, i, on, dim }: { d: BoardDoc; i: number; on: boolean; dim: boolean }) {
  const r = rng(d.id.length * 13 + i * 7 + d.title.length)
  const h = 80 + Math.round(r() * 18)
  const w = 34 + Math.round(r() * 12)
  const shelf = SHELVES.find((s) => s.key === d.shelf)!
  const light = r() > 0.6
  const pending = d.status === 'Awaiting approval' || d.status === 'Draft' || d.status === 'In revision'
  const meeting = useStore((s) => s.meetings.find((m) => m.id === d.meetingId))
  const short = d.shelf === 'Minutes'
    ? (meeting ? `${day(meeting.date, { month: 'long' })}${meeting.kind === 'Special' ? ', special' : ''}` : d.title.replace('Minutes: ', ''))
    : d.title.replace(' of the Amarillo Council for the Latino Arts', '').replace(/ Policy| \(revision\)|, .*$| Letter| and Destruction/g, '')
  return (
    <motion.button className={`spine ${on ? 'on' : ''} ${light ? 'light' : ''}`} style={{ height: `${h}%`, width: w, ['--b' as string]: shelf.color, opacity: dim ? 0.25 : 1 }}
      initial={{ y: 30, opacity: 0 }} animate={{ y: on ? -10 : 0, opacity: dim ? 0.25 : 1 }} whileHover={{ y: on ? -10 : -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.02 * i }}
      onClick={() => openDetail(`/documents/${d.id}`)} title={d.title} aria-pressed={on}>
      <span className="spine-title">{short}</span>
      {pending && <i className="spine-flag" aria-label="Needs action" />}
      <span className="spine-band" />
    </motion.button>
  )
}

/* Small objects that live on the shelves. */
function Vase() {
  if (isLocal) return <Bronze />
  return (
    <svg className="shelf-obj" width="70" height="96" viewBox="0 0 70 96" aria-hidden>
      {[[-14, 20], [0, 10], [14, 22], [-6, 30], [8, 34]].map(([x, y], i) => (
        <g key={i} transform={`translate(${35 + x} ${y})`}>
          <path d={`M0,8 Q${-x * 0.3},30 ${-x * 0.2},48`} stroke="#5e7f3f" strokeWidth="1.6" fill="none" />
          {Array.from({ length: 10 }).map((_, k) => <ellipse key={k} rx="3.2" ry="6" transform={`rotate(${k * 36}) translate(0 -4)`} fill={k % 2 ? '#e39b1b' : '#d9822b'} />)}
          <circle r="2.6" fill="#b9472a" />
        </g>
      ))}
      <path d="M22,52 C22,58 14,62 14,74 C14,88 24,95 35,95 C46,95 56,88 56,74 C56,62 48,58 48,52Z" fill="#b8683f" />
      <path d="M20,52 h30" stroke="#8a3d24" strokeWidth="4" strokeLinecap="round" />
      <path d="M17,76 q18,6 36,0" stroke="#f6ead8" strokeOpacity=".7" strokeWidth="1.6" fill="none" strokeDasharray="2 3" />
    </svg>
  )
}
/* The Local edition's shelf object: a small bronze sphere on a stone plinth. */
function Bronze() {
  return (
    <svg className="shelf-obj" width="60" height="96" viewBox="0 0 60 96" aria-hidden>
      <defs>
        <radialGradient id="bronzeBall" cx="38%" cy="32%" r="70%"><stop offset="0" stopColor="#d9bf86" /><stop offset=".5" stopColor="#9c7b43" /><stop offset="1" stopColor="#4d3a1c" /></radialGradient>
        <linearGradient id="plinth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#cfcbc2" /><stop offset=".5" stopColor="#efece6" /><stop offset="1" stopColor="#bdb8ad" /></linearGradient>
      </defs>
      <circle cx="30" cy="36" r="17" fill="url(#bronzeBall)" />
      <rect x="27" y="52" width="6" height="6" fill="#4d3a1c" />
      <rect x="12" y="58" width="36" height="38" fill="url(#plinth)" stroke="rgba(20,29,43,.18)" strokeWidth=".8" />
      <rect x="10" y="56" width="40" height="4" fill="#e4e1da" stroke="rgba(20,29,43,.18)" strokeWidth=".8" />
    </svg>
  )
}

function Stack() {
  return (
    <svg className="shelf-obj" width="92" height="40" viewBox="0 0 92 40" aria-hidden>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={4 + (i % 2) * 3} y={30 - i * 9} width={82 - (i % 2) * 6} height="8" rx="1.5" fill={(isLocal ? ['#e4e1da', '#cfcac0', '#efece6', '#b9b3a7'] : ['#e9dcc4', '#d8c3a0', '#f3ead8', '#c9a77e'])[i]} stroke="rgba(60,40,20,.25)" />)}
    </svg>
  )
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text
  const i = text.toLowerCase().indexOf(q.trim().toLowerCase())
  if (i < 0) return text
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.trim().length)}</mark>{text.slice(i + q.trim().length)}</>
}

function Reader({ d, q }: { d: BoardDoc; q: string }) {
  const author = useStore((s) => dir(s, d.author))
  const meeting = useStore((s) => s.meetings.find((m) => m.id === d.meetingId))
  const next = useStore(nextMeeting)
  const motions = useStore((s) => s.motions)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(d.sections)
  useEffect(() => { setDraft(d.sections); setEditing(false) }, [d.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const onAgenda = useMemo(() => !!next?.agenda.some((a) => a.title.toLowerCase().includes('minutes')) && d.shelf === 'Minutes', [next, d.shelf])
  const openVote = motions.find((m) => m.status === 'open' && (m.title.toLowerCase().includes(d.title.toLowerCase().split(' (')[0].toLowerCase()) || (d.id === 'doc-coi' && m.id === 'v-coi')))
  const canEdit = d.status !== 'Filed' && d.status !== 'Approved' && d.status !== 'Adopted'
  const shelf = SHELVES.find((s) => s.key === d.shelf)!

  const save = () => {
    update((s) => { const x = s.docs.find((y) => y.id === d.id)!; x.sections = draft; x.updated = new Date().toISOString() }, { text: `edited ${d.title}`, room: 'documents', link: `/documents/${d.id}` })
    setEditing(false)
    toast('Saved. Directors will see this version.', { undoable: true })
  }
  const approve = () => {
    update((s) => { const x = s.docs.find((y) => y.id === d.id)!; x.status = 'Approved'; x.updated = new Date().toISOString() }, { text: `entered the approved ${d.title.toLowerCase()} in the record`, room: 'documents', link: `/documents/${d.id}` })
    toast('Minutes approved and filed in the permanent record', { undoable: true })
  }
  const toVote = () => {
    const mid = uid('v')
    update((s) => {
      s.motions.unshift({ id: mid, title: `Adopt the ${d.title.replace(' (revision)', '').toLowerCase()}`, text: `Resolved, that the Board adopts the ${d.title.replace(' (revision)', '')} as circulated by the ${d.author === 'd-pilar' ? 'Governance' : 'Development'} Committee.`, movedBy: d.author ?? ME, secondedBy: ME, opened: new Date().toISOString(), closes: new Date(Date.now() + 7 * 86400000).toISOString(), method: 'Electronic ballot', ballots: {}, status: 'open', threshold: 'two-thirds' })
    }, { text: `sent ${d.title} to a vote`, room: 'votes', link: `/votes/${mid}` })
    toast('Ballot opened. Policies need two-thirds of directors voting.', { undoable: true })
  }
  const addToAgenda = () => {
    if (!next) return
    update((s) => {
      const m = s.meetings.find((x) => x.id === next.id)!
      m.agenda.splice(1, 0, { id: uid('a'), title: `Approve the ${d.title.replace('Minutes: ', '').toLowerCase()} minutes`, kind: 'action', minutes: 5, owner: ME })
    }, { text: `put ${d.title.toLowerCase()} on the next agenda`, room: 'meetings', link: `/meetings/${next.id}` })
    toast(`On the ${day(next.date)} agenda`, { undoable: true })
  }

  return (
    <motion.article className="reader" style={{ ['--s' as string]: shelf.color }} initial={{ opacity: 0, y: 16, rotateX: 4 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <header className="reader-head">
        <p className="reader-k">{d.shelf} · <span className={`st st-${d.status.split(' ')[0].toLowerCase()}`}>{d.status}</span> · updated {relDay(d.updated)}{author ? ` by ${author.you ? 'you' : author.name}` : ''}</p>
        <h2 className="display reader-title">{highlight(meeting && d.shelf === 'Minutes' ? `Minutes of ${day(meeting.date, { month: 'long', day: 'numeric', year: 'numeric' })}` : d.title, q)}</h2>
        {meeting && d.shelf === 'Minutes' && <p className="reader-sub serif">{meeting.title}, {meeting.place}</p>}
        <div className="reader-actions">
          {d.status === 'Awaiting approval' && (
            <>
              <ConfirmButton tone="accent" icon={<Icon.check size={16} />} confirm="The board approved them?" onConfirm={approve}>Mark approved by the board</ConfirmButton>
              {!onAgenda && next && <Button tone="quiet" icon={<Icon.plus size={16} />} onClick={addToAgenda}>Put on the next agenda</Button>}
            </>
          )}
          {(d.status === 'Draft' || d.status === 'In revision') && (openVote
            ? <Button tone="quiet" icon={<Icon.arrow size={16} />} onClick={() => navigate(`/votes/${openVote.id}`)}>A ballot is open on this</Button>
            : <ConfirmButton tone="accent" icon={<Icon.gavel size={16} />} confirm="Open a 7-day ballot?" onConfirm={toVote}>Send to a vote</ConfirmButton>)}
          {canEdit && !editing && <Button tone="ghost" icon={<Icon.pen size={16} />} onClick={() => setEditing(true)}>Edit</Button>}
          {editing && <><Button tone="ghost" onClick={() => { setDraft(d.sections); setEditing(false) }}>Discard</Button><Button tone="primary" icon={<Icon.check size={16} />} onClick={save}>Save</Button></>}
          <Button tone="ghost" icon={<Icon.print size={16} />} onClick={() => window.print()}>Print</Button>
        </div>
      </header>
      <div className="reader-body">
        {(editing ? draft : d.sections).map((s, i) => (
          <motion.section key={i} className="rsec" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}>
            <h3 className="rsec-h serif"><span className="rsec-n num">{i + 1}</span>{highlight(s.heading, q)}</h3>
            {editing
              ? <textarea className="rsec-edit" value={s.body} rows={Math.max(2, Math.ceil(s.body.length / 70))} onChange={(e) => setDraft(draft.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
              : <p className="rsec-b">{highlight(s.body, q)}</p>}
          </motion.section>
        ))}
        {d.meetingId && <button className="link reader-meeting" onClick={() => navigate(`/meetings/${d.meetingId}`)}>See the meeting these minutes record</button>}
      </div>
    </motion.article>
  )
}
