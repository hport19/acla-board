import { useState } from 'react'
import { isLocal } from '../edition'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, update, uid } from '../store/store'
import { money$ } from '../store/derive'
import { money, daysFrom, firstName, relDay, ago } from '../lib'
import { Icon } from '../ui/Icons'
import { Button, Wash, toast, Count, RoomHead, Sheet, Field, Segmented } from '../ui/kit'
import type { BudgetLine, Donation, Grant } from '../store/types'
import './money.css'

export default function Money() {
  const m = useStore(money$)
  const [gift, setGift] = useState(false)
  const net = m.incomeActual - m.expenseActual
  return (
    <>
      <Wash color="var(--gold)" x="0%" y="0%" />
      <RoomHead title={<>The <em>money</em></>} lede={<>Income {money(m.incomeActual)} of {money(m.incomeBudget)} planned · spending {money(m.expenseActual)} of {money(m.expenseBudget)} · <b className={net >= 0 ? 'pos' : 'neg'}>{net >= 0 ? '+' : '−'}{money(Math.abs(net))} net</b></>} color="var(--gold)">
        <Button tone="accent" icon={<Icon.heart size={16} />} onClick={() => setGift(true)}>Record a gift</Button>
      </RoomHead>
      <div className="mn">
        <Campaign />
        <Ledger />
        <div className="mn-right">
          <Cash />
          <Grants />
        </div>
      </div>
      <GiftSheet open={gift} onClose={() => setGift(false)} />
    </>
  )
}

/* The year-end campaign as a cántaro filling with marigold (Latino edition) or a glass column filling with brass (Local edition). */
const VESSEL = isLocal ? 'M58,40 V272 Q58,282 68,282 H172 Q182,282 182,272 V40Z' : 'M92,40 C92,58 70,62 52,92 C26,134 28,214 56,252 C78,282 162,282 184,252 C212,214 214,134 188,92 C170,62 148,58 148,40Z'
function Campaign() {
  const c = useStore((s) => s.campaign)
  const gifts = useStore((s) => s.donations.filter((d) => d.campaign === c.name).sort((a, b) => b.date.localeCompare(a.date)))
  const raised = gifts.reduce((t, g) => t + g.amount, 0)
  const pct = Math.min(1, raised / c.goal)
  const donors = new Set(gifts.map((g) => g.donor)).size
  // the jar's interior spans y=60..280 in its own coordinates
  const top = 60, bottom = 282
  const level = bottom - (bottom - top) * pct
  return (
    <section className="cmp">
      <div className="jar-wrap">
        <svg viewBox="0 0 240 300" className="jar" role="img" aria-label={`${money(raised)} raised of ${money(c.goal)}`}>
          <defs>
            <clipPath id="jarInside"><path d={VESSEL} /></clipPath>
            <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={isLocal ? '#c9ae72' : '#f2c14e'} /><stop offset="1" stopColor={isLocal ? '#8f713c' : '#d9822b'} /></linearGradient>
            <linearGradient id="clay" x1="0" y1="0" x2="1" y2="0">{isLocal ? <><stop offset="0" stopColor="#5d6878" /><stop offset=".45" stopColor="#9aa4b2" /><stop offset="1" stopColor="#4a5463" /></> : <><stop offset="0" stopColor="#9c4a2c" /><stop offset=".45" stopColor="#c56a42" /><stop offset="1" stopColor="#8a3d24" /></>}</linearGradient>
          </defs>
          <path d={VESSEL} fill="url(#clay)" opacity={isLocal ? 0.1 : 0.18} />
          <g clipPath="url(#jarInside)">
            <motion.g initial={{ y: bottom - top }} animate={{ y: level - top }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}>
              <motion.path d={`M-60,${top} q30,-10 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 V320 H-60Z`} fill="url(#liquid)"
                animate={{ x: [0, -60] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }} />
              <motion.path d={`M-60,${top + 6} q30,8 60,0 t60,0 t60,0 t60,0 t60,0 t60,0`} stroke="#fff3d0" strokeOpacity=".5" strokeWidth="2" fill="none"
                animate={{ x: [-60, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }} />
            </motion.g>
          </g>
          <path d={VESSEL} fill="none" stroke="url(#clay)" strokeWidth={isLocal ? 3 : 7} strokeLinejoin="round" />
          {isLocal ? (
            <>
              <path d="M50,40 h140" stroke="#4a5463" strokeWidth="4" strokeLinecap="round" />
              <path d="M72,62 v200" stroke="#fff" strokeOpacity=".3" strokeWidth="5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M84,40 h72" stroke="#8a3d24" strokeWidth="9" strokeLinecap="round" />
              <path d="M60,150 q60,16 120,0" stroke="#fff6e6" strokeOpacity=".55" strokeWidth="2.5" fill="none" strokeDasharray="4 6" />
              <path d="M62,190 q58,14 116,0" stroke="#8a3d24" strokeOpacity=".4" strokeWidth="2" fill="none" />
              <path d="M70,110 c-8,30 -10,70 0,110" stroke="#fff" strokeOpacity=".22" strokeWidth="8" fill="none" strokeLinecap="round" />
            </>
          )}
          {[0.25, 0.5, 0.75].map((q) => <g key={q}><line x1="196" x2="206" y1={bottom - (bottom - top) * q} y2={bottom - (bottom - top) * q} stroke="rgba(34,28,44,.3)" /><text x="210" y={bottom - (bottom - top) * q + 4} className="jar-tick">{Math.round(q * 100)}%</text></g>)}
        </svg>
        <div className="jar-copy">
          <p className="cmp-k">{c.name} year-end campaign</p>
          <p className="display cmp-v"><Count value={raised} format={(v) => money(v)} /></p>
          <p className="cmp-sub">of {money(c.goal)} · {donors} donors · closes {relDay(c.ends)}</p>
        </div>
      </div>
      <div className="gifts">
        <p className="gifts-k">Latest gifts</p>
        <ul>
          <AnimatePresence initial={false}>
            {gifts.slice(0, 7).map((g) => <GiftRow key={g.id} g={g} />)}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}

function GiftRow({ g }: { g: Donation }) {
  return (
    <motion.li layout initial={{ opacity: 0, x: -14, backgroundColor: 'rgba(227,155,27,.25)' }} animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(227,155,27,0)' }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <span className="g-amt num">{money(g.amount)}</span>
      <span className="g-who">{g.donor}<small>{g.method} · {ago(g.date)}</small></span>
      <button className={`g-thank ${g.thanked ? 'done' : ''}`} onClick={() => {
        if (g.thanked) return
        update((s) => { s.donations.find((x) => x.id === g.id)!.thanked = true }, { text: `thanked ${g.donor} for ${money(g.amount)}`, room: 'money', link: '/money' })
        toast(`Thank-you letter queued for ${g.donor}`, { undoable: true })
      }} aria-label={g.thanked ? 'Thanked' : `Thank ${g.donor}`} title={g.thanked ? 'Thanked' : 'Send a thank-you'}>
        {g.thanked ? <Icon.check size={14} /> : <Icon.heart size={14} />}<span>{g.thanked ? 'Thanked' : 'Thank'}</span>
      </button>
    </motion.li>
  )
}

/* Budget against actual, with the year's progress as a line to read against. */
function Ledger() {
  const lines = useStore((s) => s.budget)
  const [side, setSide] = useState<'expense' | 'income'>('expense')
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1).getTime()
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime()
  const yearFrac = (now.getTime() - start) / (end - start)
  const shown = lines.filter((l) => l.side === side)
  const max = Math.max(...shown.map((l) => Math.max(l.budget, l.actual)))
  return (
    <section className="ledger">
      <div className="ledger-head">
        <Segmented layoutId="ledger-side" value={side} onChange={setSide} options={[{ value: 'expense', label: 'Spending' }, { value: 'income', label: 'Income' }]} />
        <span className="ledger-year">{Math.round(yearFrac * 100)}% of the year has passed</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.ul key={side} className="ledger-rows" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {shown.map((l, i) => <LedgerRow key={l.id} l={l} max={max} i={i} yearFrac={yearFrac} />)}
        </motion.ul>
      </AnimatePresence>
      <p className="ledger-note">The faint line marks where each line would be if money moved evenly through the year. {side === 'expense' ? 'Bars past it are spending ahead of plan.' : 'Bars past it are income ahead of plan.'}</p>
    </section>
  )
}

function LedgerRow({ l, max, i, yearFrac }: { l: BudgetLine; max: number; i: number; yearFrac: number }) {
  const pct = l.actual / l.budget
  const ahead = pct > yearFrac + 0.05
  const tone = l.side === 'income' ? (pct >= 1 ? 'good' : '') : pct > 1 ? 'over' : ahead ? 'warm' : ''
  return (
    <li className={`lrow ${tone}`}>
      <div className="lrow-top">
        <span className="lrow-name">{l.name}</span>
        <span className="lrow-v num"><b>{money(l.actual)}</b> of {money(l.budget)}</span>
      </div>
      <div className="lrow-track" style={{ width: `${(l.budget / max) * 100}%` }}>
        <motion.span className="lrow-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 1.15) * 100}%` }} transition={{ duration: 1, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }} />
        <span className="lrow-pace" style={{ left: `${yearFrac * 100}%` }} />
      </div>
      <span className="lrow-pct num">{Math.round(pct * 100)}%</span>
    </li>
  )
}

/* Twelve months of cash on hand, drawn as a line. */
function Cash() {
  const cash = useStore((s) => s.cash)
  const spend = useStore((s) => money$(s).expenseBudget)
  const W = 320, H = 120, P = 6
  const vals = cash.map((c) => c.balance)
  const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.04
  const pts = cash.map((c, i) => [P + (i / (cash.length - 1)) * (W - 2 * P), H - P - ((c.balance - lo) / (hi - lo)) * (H - 2 * P)])
  const d = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`
    const prev = pts[i - 1]
    const cx = (prev[0] + p[0]) / 2
    return `C${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`
  }).join(' ')
  const last = cash[cash.length - 1]
  const first = cash[0]
  const [hover, setHover] = useState<number | null>(null)
  const h = hover !== null ? cash[hover] : last
  const label = (k: string) => new Date(`${k}-15`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return (
    <section className="cash">
      <p className="cash-k">Cash on hand{hover !== null ? `, ${label(h.month)}` : ''}</p>
      <p className="display cash-v"><Count value={h.balance} format={(v) => money(v)} duration={0.5} /></p>
      <p className="cash-sub">{last.balance >= first.balance ? 'Up' : 'Down'} {money(Math.abs(last.balance - first.balance))} over twelve months · about {(last.balance / (spend / 12)).toFixed(1)} months of spending</p>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="cash-svg" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b8860b" stopOpacity=".28" /><stop offset="1" stopColor="#b8860b" stopOpacity="0" /></linearGradient>
        </defs>
        <motion.path d={`${d} L${W - P},${H} L${P},${H}Z`} fill="url(#cashFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} />
        <motion.path d={d} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)}>
            <rect x={p[0] - (W / cash.length) / 2} y={0} width={W / cash.length} height={H + 18} fill="transparent" />
            {(hover === i || (hover === null && i === pts.length - 1)) && <circle cx={p[0]} cy={p[1]} r="5" fill="var(--paper)" stroke="var(--gold)" strokeWidth="2.5" />}
            {i % 3 === 2 && <text x={p[0]} y={H + 15} textAnchor="middle" className="cash-m">{new Date(`${cash[i].month}-15`).toLocaleDateString('en-US', { month: 'short' })}</text>}
          </g>
        ))}
      </svg>
    </section>
  )
}

const NEXT: Partial<Record<Grant['status'], { label: string; to: Grant['status'] }[]>> = {
  Drafting: [{ label: 'Mark submitted', to: 'Submitted' }],
  Submitted: [{ label: 'Awarded', to: 'Awarded' }, { label: 'Declined', to: 'Declined' }],
  'Report due': [{ label: 'Report sent', to: 'Awarded' }],
}

function Grants() {
  const grants = useStore((s) => [...s.grants].sort((a, b) => order(a) - order(b) || a.deadline.localeCompare(b.deadline)))
  const directors = useStore((s) => s.directors)
  const move = (g: Grant, to: Grant['status']) => {
    update((s) => {
      const x = s.grants.find((y) => y.id === g.id)!
      x.status = to
      if (to === 'Awarded' && g.status === 'Submitted') {
        const line = s.budget.find((b) => b.name === 'Grants')
        if (line) line.actual += g.amount
        s.cash[s.cash.length - 1].balance += g.amount
      }
    }, { text: `${to === 'Awarded' && g.status === 'Report due' ? 'sent the final report to' : `marked ${to.toLowerCase()}:`} ${g.funder}`, room: 'money', link: '/money' })
    toast(to === 'Awarded' && g.status === 'Submitted' ? <>{money(g.amount)} from {g.funder} added to income</> : `${g.funder}: ${to === 'Awarded' ? 'report sent' : to.toLowerCase()}`, { undoable: true })
  }
  return (
    <section className="grants">
      <p className="cash-k">Grants</p>
      <ul>
        {grants.map((g) => {
          const d = daysFrom(g.deadline)
          const owner = directors.find((x) => x.id === g.owner)
          const soon = (g.status === 'Drafting' || g.status === 'Report due') && d >= 0 && d <= 30
          return (
            <li key={g.id} className={`gr st-${g.status.replace(' ', '-').toLowerCase()}`}>
              <span className="gr-status">{g.status}</span>
              <span className="gr-main">
                <span className="gr-funder serif">{g.funder}</span>
                <span className="gr-purpose">{g.purpose}{owner ? ` · ${firstName(owner.name)}` : ''}</span>
              </span>
              <span className="gr-amt num">{g.amount ? money(g.amount, { compact: true }) : ''}{soon && <small className="gr-due">due {relDay(g.deadline)}</small>}</span>
              {NEXT[g.status] && (
                <span className="gr-actions">
                  {NEXT[g.status]!.map((n) => <button key={n.label} className="gr-btn" onClick={() => move(g, n.to)}>{n.label}</button>)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
const order = (g: Grant) => ({ Drafting: 0, 'Report due': 1, Submitted: 2, Awarded: 3, Declined: 4 })[g.status]

function GiftSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const campaign = useStore((s) => s.campaign)
  const [donor, setDonor] = useState('')
  const [amount, setAmount] = useState(250)
  const [method, setMethod] = useState<Donation['method']>('Card')
  const [toCampaign, setToCampaign] = useState(true)
  const submit = () => {
    update((s) => {
      s.donations.unshift({ id: uid('g'), donor: donor.trim() || 'Anonymous', amount, method, date: new Date().toISOString(), campaign: toCampaign ? campaign.name : undefined, thanked: false })
      const line = s.budget.find((b) => b.name === (method === 'Funders Club' ? 'Funders Club' : 'Individual donations'))
      if (line) line.actual += amount
      s.cash[s.cash.length - 1].balance += amount
    }, { text: `recorded a ${money(amount)} gift from ${donor.trim() || 'an anonymous donor'}`, room: 'money', link: '/money' })
    onClose(); setDonor(''); setAmount(250)
    toast(<>{money(amount)} recorded{toCampaign ? ` toward ${campaign.name}` : ''}. Remember the thank-you.</>, { undoable: true })
  }
  return (
    <Sheet open={open} onClose={onClose} title="Record a gift">
      <Field label="From"><input value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="Name, family or business. Leave empty for anonymous." autoFocus /></Field>
      <div className="field-row">
        <Field label="Amount"><input type="number" min={1} value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))} /></Field>
        <Field label="How"><select value={method} onChange={(e) => setMethod(e.target.value as Donation['method'])}>{['Card', 'Check', 'Cash', 'Stock', 'Funders Club'].map((m) => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <div className="amount-quick">{[50, 100, 250, 500, 1000].map((a) => <button key={a} className={amount === a ? 'on' : ''} onClick={() => setAmount(a)}>{money(a)}</button>)}</div>
      <label className="check"><input type="checkbox" checked={toCampaign} onChange={(e) => setToCampaign(e.target.checked)} /> Count it toward {campaign.name}</label>
      <div className="sheet-foot">
        <Button tone="ghost" onClick={onClose}>Cancel</Button>
        <Button tone="accent" icon={<Icon.heart size={16} />} onClick={submit}>Record {money(amount)}</Button>
      </div>
    </Sheet>
  )
}

