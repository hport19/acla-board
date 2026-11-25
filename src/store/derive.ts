import type { State, RoomKey, Motion, Director, Applicant } from './types'
import { ME } from './store'
import { daysFrom, sum, firstName, money } from '../lib'

export const quorumOf = (s: State) => Math.floor(s.directors.length / 2) + 1

export const dir = (s: State, id?: string) => s.directors.find((d) => d.id === id)

export function tally(m: Motion) {
  const v = Object.values(m.ballots)
  return { aye: v.filter((b) => b === 'aye').length, nay: v.filter((b) => b === 'nay').length, abstain: v.filter((b) => b === 'abstain').length, cast: v.length }
}

/** Outcome by the bylaws: majority of those voting (abstentions don't count), or two-thirds for policies. */
export function outcome(m: Motion, boardSize: number) {
  const t = tally(m)
  const voting = t.aye + t.nay
  const quorum = Math.floor(boardSize / 2) + 1
  const needed = m.threshold === 'two-thirds' ? Math.ceil((voting * 2) / 3) : Math.floor(voting / 2) + 1
  const carried = t.cast >= quorum && voting > 0 && t.aye >= needed
  // Can the motion still pass or fail if the rest vote?
  const remaining = boardSize - t.cast
  return { ...t, voting, needed, carried, quorum, hasQuorum: t.cast >= quorum, remaining }
}

export const nextMeeting = (s: State) =>
  s.meetings.filter((m) => m.status !== 'held').sort((a, b) => a.date.localeCompare(b.date))[0]

export const heldMeetings = (s: State) => s.meetings.filter((m) => m.status === 'held').sort((a, b) => b.date.localeCompare(a.date))

export function attendanceRate(s: State, id: string) {
  const held = heldMeetings(s)
  if (!held.length) return 1
  return held.filter((m) => m.present.includes(id)).length / held.length
}

export function avgScore(a: Applicant) {
  const all = Object.values(a.scores).map((x) => x.craft + x.promise + x.need + x.community)
  return all.length ? sum(all) / all.length : 0
}

export function money$(s: State) {
  const inc = s.budget.filter((b) => b.side === 'income')
  const exp = s.budget.filter((b) => b.side === 'expense')
  const raised = sum(s.donations.filter((d) => d.campaign === s.campaign.name).map((d) => d.amount))
  return {
    incomeBudget: sum(inc.map((b) => b.budget)), incomeActual: sum(inc.map((b) => b.actual)),
    expenseBudget: sum(exp.map((b) => b.budget)), expenseActual: sum(exp.map((b) => b.actual)),
    raised, cash: s.cash[s.cash.length - 1]?.balance ?? 0,
  }
}

export interface Attention {
  id: string
  room: RoomKey
  link: string
  title: string
  detail: string
  due?: string
  weight: number // higher = more urgent
  tone: 'vote' | 'record' | 'money' | 'people' | 'event'
}

export function attention(s: State): Attention[] {
  const out: Attention[] = []
  const me = dir(s, ME)

  for (const m of s.motions.filter((x) => x.status === 'open')) {
    if (!m.ballots[ME]) {
      const d = m.closes ? daysFrom(m.closes) : 99
      out.push({ id: `vote-${m.id}`, room: 'votes', link: `/votes/${m.id}`, title: `Cast your vote: ${m.title.toLowerCase()}`, detail: `${Object.keys(m.ballots).length} of ${s.directors.length} directors have voted. The ballot closes ${d <= 0 ? 'today' : `in ${d} day${d > 1 ? 's' : ''}`}.`, due: m.closes, weight: 90 - d, tone: 'vote' })
    }
  }

  const next = nextMeeting(s)
  if (next) {
    const d = daysFrom(next.date)
    if (!next.noticeSent && d <= 14) out.push({ id: `notice-${next.id}`, room: 'meetings', link: `/meetings/${next.id}`, title: 'Send the notice and agenda for the next meeting', detail: `The meeting is ${d === 1 ? 'tomorrow' : `in ${d} days`}. The bylaws ask for at least 48 hours’ notice; directors like a week.`, due: next.date, weight: 80 - d, tone: 'record' })
  }

  for (const doc of s.docs.filter((x) => x.status === 'Awaiting approval' && x.author === ME)) {
    out.push({ id: `min-${doc.id}`, room: 'documents', link: `/documents/${doc.id}`, title: 'Your draft minutes go to the board next meeting', detail: 'Read them once more before they are circulated with the agenda.', weight: 55, tone: 'record' })
  }

  if (me?.committees.includes('scholar')) {
    const unscored = s.applicants.filter((a) => (a.stage === 'In review' || a.stage === 'Interview') && !a.scores[ME])
    if (unscored.length) out.push({ id: `score-${unscored.length}`, room: 'programs', link: '/programs', title: `Score ${unscored.length} scholarship applicant${unscored.length > 1 ? 's' : ''}`, detail: `The committee recommends the spring slate soon. ${unscored.slice(0, 3).map((a) => firstName(a.name)).join(', ')}${unscored.length > 3 ? ' and others' : ''} are waiting on your scores.`, weight: 60, tone: 'people' })
  }

  for (const g of s.grants.filter((x) => (x.status === 'Drafting' || x.status === 'Report due') && daysFrom(x.deadline) <= 30 && daysFrom(x.deadline) >= 0)) {
    const d = daysFrom(g.deadline)
    out.push({ id: `grant-${g.id}`, room: 'money', link: '/money?grants', title: g.status === 'Report due' ? `${g.funder} final report is due` : `${g.funder} proposal is due`, detail: `${g.purpose}${g.amount ? `, ${money(g.amount)}` : ''}. Due in ${d} days; ${firstName(dir(s, g.owner)?.name ?? '')} is writing it.`, due: g.deadline, weight: 70 - d, tone: 'money' })
  }

  for (const d of s.directors.filter((x) => daysFrom(x.termEnds) <= 90)) {
    out.push({ id: `term-${d.id}`, room: 'board', link: `/board/${d.id}`, title: `${d.name}’s term ends in ${daysFrom(d.termEnds)} days`, detail: 'Governance should bring a nomination to the next meeting. She is eligible for a second term.', due: d.termEnds, weight: 50, tone: 'people' })
  }

  const unthanked = s.donations.filter((x) => !x.thanked)
  if (unthanked.length) out.push({ id: `thanks-${unthanked.length}`, room: 'money', link: '/money', title: `${unthanked.length} donor${unthanked.length > 1 ? 's' : ''} still need a thank-you`, detail: `${money(sum(unthanked.map((x) => x.amount)))} from ${unthanked.slice(0, 2).map((x) => x.donor).join(' and ')}${unthanked.length > 2 ? ' and others' : ''}. A letter within 48 hours keeps donors giving.`, weight: 45, tone: 'money' })

  const pendingArtists = s.artists.filter((a) => a.profile === 'Pending review')
  if (pendingArtists.length) out.push({ id: `artists-${pendingArtists.map((a) => a.id).join('.')}`, room: 'artists', link: `/artists/${pendingArtists[0].id}`, title: `${pendingArtists.length} new artist profile${pendingArtists.length > 1 ? 's' : ''} for 806.art`, detail: `${pendingArtists.map((a) => a.name).join(' and ')} asked to be listed. A director approves each profile before it goes live.`, weight: 35, tone: 'people' })

  for (const e of s.events) {
    for (const c of e.checklist.filter((x) => x.owner === ME && !x.done)) {
      out.push({ id: `task-${c.id}`, room: 'events', link: `/events/${e.id}`, title: `${c.label} for ${e.name}`, detail: `You took this on. The event is ${daysFrom(e.start)} days out.`, due: e.start, weight: 30, tone: 'event' })
    }
  }

  return out.filter((a) => !s.dismissed.includes(a.id)).sort((a, b) => b.weight - a.weight)
}

export function roomCounts(s: State): Partial<Record<RoomKey, number>> {
  const c: Partial<Record<RoomKey, number>> = {}
  for (const a of attention(s)) c[a.room] = (c[a.room] ?? 0) + 1
  return c
}

export interface Upcoming { id: string; when: string; title: string; detail: string; link: string; room: RoomKey }

export function upcoming(s: State): Upcoming[] {
  const out: Upcoming[] = []
  for (const m of s.meetings.filter((x) => x.status !== 'held')) out.push({ id: m.id, when: m.date, title: m.title, detail: m.place, link: `/meetings/${m.id}`, room: 'meetings' })
  for (const v of s.motions.filter((x) => x.status === 'open' && x.closes)) out.push({ id: v.id, when: v.closes!, title: `Ballot closes: ${v.title}`, detail: v.method, link: `/votes/${v.id}`, room: 'votes' })
  for (const e of s.events.filter((x) => daysFrom(x.start) >= 0)) out.push({ id: e.id, when: e.start, title: e.name, detail: e.place, link: `/events/${e.id}`, room: 'events' })
  for (const g of s.grants.filter((x) => daysFrom(x.deadline) >= 0 && (x.status === 'Drafting' || x.status === 'Report due'))) out.push({ id: g.id, when: g.deadline, title: `${g.funder} deadline`, detail: g.purpose, link: '/money?grants', room: 'money' })
  out.push({ id: 'campaign', when: s.campaign.ends, title: `${s.campaign.name} campaign closes`, detail: `Goal ${money(s.campaign.goal)}`, link: '/money', room: 'money' })
  return out.sort((a, b) => a.when.localeCompare(b.when))
}

export const officerOrder: Director['office'][] = ['Chair', 'Vice Chair', 'Treasurer', 'Secretary', 'Director']
