import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, ME } from '../store/store'
import { avgScore, dir } from '../store/derive'
import { navigate, money, num, firstName, usePhone, useRoute, openDetail, closeTo, buzz } from '../lib'
import { Portrait } from '../ui/Portrait'
import { Icon } from '../ui/Icons'
import { Button, ConfirmButton, Wash, toast, Count, RoomHead, Drawer } from '../ui/kit'
import type { Applicant, Program, Stage } from '../store/types'
import './programs.css'

const STAGES: Stage[] = ['Applied', 'In review', 'Interview', 'Awarded']
const CRITERIA: { key: keyof Applicant['scores'][string]; label: string; hint: string }[] = [
  { key: 'craft', label: 'Craft', hint: 'The work itself today' },
  { key: 'promise', label: 'Promise', hint: 'Where it could go with support' },
  { key: 'need', label: 'Need', hint: 'How much the award changes things' },
  { key: 'community', label: 'Community', hint: 'Gives back to the Panhandle' },
]
const FUND = 6000

export default function Programs() {
  const programs = useStore((s) => s.programs)
  const applicants = useStore((s) => s.applicants)
  const { id } = useRoute()
  const phone = usePhone()
  const [first] = useState<string>(() => applicants.find((a) => (a.stage === 'In review' || a.stage === 'Interview') && !a.scores[ME])?.id ?? applicants[0].id)
  const current = applicants.find((a) => a.id === id) ?? applicants.find((a) => a.id === first) ?? applicants[0]
  const awarded = applicants.filter((a) => a.stage === 'Awarded').reduce((t, a) => t + a.ask, 0)

  return (
    <>
      <Wash color="var(--agave)" x="10%" y="0%" />
      <RoomHead title={<>Programs <em>&amp;</em> scholarships</>} lede="What ACLA does all year, and the young artists it is about to invest in." color="var(--agave)" />
      <div className="pg-strip">
        {programs.map((p, i) => <ProgramMeasure key={p.id} p={p} i={i} />)}
      </div>
      <div className="sch">
        <section className="loom-side">
          <div className="loom-head">
            <h2 className="display loom-title">Spring scholarships</h2>
            <div className="fund">
              <span className="fund-k">Fund</span>
              <div className="fund-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${Math.min(100, (awarded / FUND) * 100)}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} /></div>
              <span className="fund-v num">{money(awarded)} of {money(FUND)} recommended</span>
            </div>
          </div>
          <Loom applicants={applicants} sel={phone && !id ? '' : current.id} onSel={(x) => openDetail(`/programs/${x}`)} />
        </section>
        <Drawer open={!!id} onClose={() => closeTo('/programs')} label="Scholarship applicant" className="programs-drawer">
          <AnimatePresence mode="wait">
            <Review key={current.id} a={current} awardedTotal={awarded} />
          </AnimatePresence>
        </Drawer>
      </div>
    </>
  )
}

function ProgramMeasure({ p, i }: { p: Program; i: number }) {
  const lead = useStore((s) => dir(s, p.lead))
  const main = p.measures[0]
  const frac = main.goal ? Math.min(1, main.value / main.goal) : 1
  const R = 24
  const C = 2 * Math.PI * R
  return (
    <motion.div className="pm" style={{ ['--p' as string]: p.color }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
      <div className="pm-top">
        <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden className="pm-ring">
          <circle cx="29" cy="29" r={R} stroke="rgba(34,28,44,.08)" strokeWidth="5" fill="none" />
          <motion.circle cx="29" cy="29" r={R} stroke="var(--p)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={C} transform="rotate(-90 29 29)"
            initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - frac) }} transition={{ duration: 1.3, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }} />
          {frac >= 1 && <path d="M21 29.5l5.5 5.5L37 24" stroke="var(--p)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        <div>
          <h3 className="pm-name serif">{p.name}</h3>
          <p className="pm-tag">{p.tagline}</p>
        </div>
      </div>
      <p className="pm-v display"><Count value={main.value} format={(v) => (main.unit === '$' ? money(v) : num(Math.round(v)))} /></p>
      <p className="pm-k">{main.label}{main.goal ? ` · goal ${main.unit === '$' ? money(main.goal) : num(main.goal)}` : ''}</p>
      <ul className="pm-more">
        {p.measures.slice(1).map((m) => <li key={m.label}><span className="num">{m.unit === '$' ? money(m.value) : num(m.value)}</span> {m.label.toLowerCase()}</li>)}
      </ul>
      {lead && <button className="pm-lead" onClick={() => navigate(`/board/${lead.id}`)}>Led by {lead.you ? 'you' : firstName(lead.name)}</button>}
    </motion.div>
  )
}

/* Each applicant is a thread woven across the stages; the knot is where they are now. */
function Loom({ applicants, sel, onSel }: { applicants: Applicant[]; sel: string; onSel: (id: string) => void }) {
  const phone = usePhone()
  const order = [...applicants].sort((a, b) => stageIndex(b) - stageIndex(a) || avgScore(b) - avgScore(a))
  return (
    <div className="loom" role="listbox" aria-label="Applicants">
      <div className="loom-stages" aria-hidden>
        <span />
        {STAGES.map((s) => <span key={s}>{phone ? s.replace('In review', 'Review') : s}</span>)}
      </div>
      <div className="loom-rows">
        {order.map((a, i) => {
          const si = stageIndex(a)
          const declined = a.stage === 'Declined'
          const end = declined ? 1 : si
          const on = a.id === sel
          const scored = !!a.scores[ME]
          return (
            <motion.button key={a.id} layout className={`lr ${on ? 'on' : ''} ${declined ? 'declined' : ''}`} onClick={() => onSel(a.id)} role="option" aria-selected={on}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
              <span className="lr-name">
                <span>{a.name}</span>
                <small>{a.discipline}{!scored && (a.stage === 'In review' || a.stage === 'Interview') ? <b> · needs your score</b> : ''}</small>
              </span>
              <span className="lr-track">
                <svg viewBox="0 0 400 30" preserveAspectRatio="none" className="lr-svg" aria-hidden>
                  {[0, 1, 2, 3].map((k) => <line key={k} x1={50 + k * 100} x2={50 + k * 100} y1="0" y2="30" stroke="rgba(34,28,44,.09)" />)}
                  <motion.path d={`M0,15 ${Array.from({ length: 16 }).map((_, k) => `L${(k + 1) * ((50 + end * 100) / 16)},${15 + Math.sin(k * 1.3 + a.hue) * 2.5}`).join(' ')}`}
                    stroke={declined ? 'var(--ink-4)' : `hsl(${a.hue} 55% 46%)`} strokeWidth="2.6" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
                </svg>
                <motion.span className="lr-knot" style={{ left: `${((50 + end * 100) / 400) * 100}%` }} layout transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
                  {declined ? <span className="lr-x"><Icon.close size={12} /></span> : <Portrait name={a.name} hue={a.hue} size={26} ring={a.stage === 'Awarded' ? 'var(--marigold)' : undefined} />}
                </motion.span>
              </span>
              <span className="lr-score num">{avgScore(a) ? avgScore(a).toFixed(1) : '–'}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

const stageIndex = (a: Applicant) => (a.stage === 'Declined' ? -1 : STAGES.indexOf(a.stage))

function Review({ a, awardedTotal }: { a: Applicant; awardedTotal: number }) {
  const directors = useStore((s) => s.directors)
  const mine = a.scores[ME]
  const [draft, setDraft] = useState(mine ?? { craft: 0, promise: 0, need: 0, community: 0 })
  useEffect(() => setDraft(a.scores[ME] ?? { craft: 0, promise: 0, need: 0, community: 0 }), [a.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const others = Object.entries(a.scores).filter(([k]) => k !== ME)
  const complete = Object.values(draft).every((v) => v > 0)
  const total = Object.values(draft).reduce((x, y) => x + y, 0)
  const si = stageIndex(a)
  const canScore = a.stage === 'In review' || a.stage === 'Interview'

  const save = () => {
    update((s) => { s.applicants.find((x) => x.id === a.id)!.scores[ME] = draft }, { text: `scored ${a.name}’s scholarship application`, room: 'programs', link: '/programs' })
    toast(<>Your score for {firstName(a.name)}: <b>{total} of 20</b></>, { undoable: true })
  }
  const move = (stage: Stage) => {
    update((s) => { s.applicants.find((x) => x.id === a.id)!.stage = stage }, { text: `moved ${a.name} to ${stage.toLowerCase()}`, room: 'programs', link: '/programs' })
    toast(stage === 'Awarded' ? `${firstName(a.name)} is on the recommended slate` : `${firstName(a.name)} moved to ${stage.toLowerCase()}`, { undoable: true })
  }

  return (
    <motion.aside className="rv" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <div className="rv-top">
        <Portrait name={a.name} hue={a.hue} size={64} />
        <div>
          <h3 className="display rv-name">{a.name}</h3>
          <p className="rv-meta">{a.age} · {a.school} · {a.discipline}</p>
        </div>
        <p className="rv-ask"><span className="display">{money(a.ask)}</span><small>asked</small></p>
      </div>
      <p className="rv-statement serif">“{a.statement}”</p>

      {canScore ? (
        <div className="rubric">
          <div className="rubric-head"><span>{mine ? 'Your score' : 'Score this applicant'}</span><span className="num">{total} / 20</span></div>
          {CRITERIA.map((c) => {
            const othersAvg = others.length ? others.reduce((t, [, v]) => t + v[c.key], 0) / others.length : 0
            return (
              <div key={c.key} className="crit">
                <span className="crit-l">{c.label}<small>{c.hint}</small></span>
                <span className="crit-dots" role="radiogroup" aria-label={c.label}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} role="radio" aria-checked={draft[c.key] === v} className={`cd ${draft[c.key] >= v ? 'on' : ''}`} onClick={() => { buzz(5); setDraft({ ...draft, [c.key]: v }) }}>
                      {Math.round(othersAvg) === v && <i className="cd-ghost" title={`Committee average ${othersAvg.toFixed(1)}`} />}
                    </button>
                  ))}
                </span>
              </div>
            )
          })}
          <div className="rubric-foot">
            <span className="rubric-others">{others.length ? <>Scored by {others.map(([k]) => firstName(directors.find((d) => d.id === k)?.name ?? '')).join(', ')}. The faint ring is their average.</> : 'You are the first to score.'}</span>
            <Button tone="accent" icon={<Icon.check size={16} />} disabled={!complete} onClick={save}>{mine ? 'Update my score' : 'Save my score'}</Button>
          </div>
        </div>
      ) : (
        <p className="rv-state serif">{a.stage === 'Applied' ? 'New application. Move it to review when the file is complete.' : a.stage === 'Awarded' ? `On the recommended slate. ${money(awardedTotal)} of the ${money(FUND)} fund is now committed.` : 'Withdrawn from this cycle.'}</p>
      )}

      <div className="rv-actions">
        {si >= 0 && si < 3 && (
          si === 2
            ? <ConfirmButton tone="primary" icon={<Icon.star size={16} />} confirm={awardedTotal + a.ask > FUND ? `This goes ${money(awardedTotal + a.ask - FUND)} over the fund.` : 'Add to the slate?'} onConfirm={() => move('Awarded')}>Recommend the award</ConfirmButton>
            : <Button tone="primary" icon={<Icon.arrow size={16} />} onClick={() => move(STAGES[si + 1])}>Move to {STAGES[si + 1].toLowerCase()}</Button>
        )}
        {si > 0 && <Button tone="ghost" onClick={() => move(STAGES[si - 1])}>Back to {STAGES[si - 1].toLowerCase()}</Button>}
      </div>
    </motion.aside>
  )
}
