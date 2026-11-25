import { update, getState, uid, ME } from './store'
import { outcome, dir } from './derive'
import type { Ballot, Meeting } from './types'
import { day, time } from '../lib'

export function nextResolutionNumber() {
  const s = getState()
  const y = new Date().getFullYear()
  const nums = s.motions.map((m) => m.number).filter(Boolean).map((n) => Number(n!.split('-')[2])).filter((n) => !Number.isNaN(n))
  return `R-${y}-${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`
}

export function castBallot(motionId: string, who: string, b: Ballot | null) {
  const s = getState()
  const m = s.motions.find((x) => x.id === motionId)
  if (!m) return
  const name = dir(s, who)?.name ?? ''
  update((d) => {
    const mm = d.motions.find((x) => x.id === motionId)!
    if (b) mm.ballots[who] = b
    else delete mm.ballots[who]
  }, who === ME ? { text: b ? `voted ${b} on ${m.title.toLowerCase()}` : `withdrew a vote on ${m.title.toLowerCase()}`, room: 'votes', link: `/votes/${motionId}` } : b ? { text: `recorded ${name}’s ${b} on ${m.title.toLowerCase()}`, room: 'votes', link: `/votes/${motionId}` } : undefined)
}

/** Close a motion, number it as a resolution and return the result. */
export function closeMotion(motionId: string) {
  const s = getState()
  const m = s.motions.find((x) => x.id === motionId)!
  const o = outcome(m, s.directors.length)
  const number = nextResolutionNumber()
  update((d) => {
    const mm = d.motions.find((x) => x.id === motionId)!
    mm.status = o.carried ? 'carried' : 'failed'
    mm.number = number
    mm.closedAt = new Date().toISOString()
  }, { text: `closed the vote on ${m.title.toLowerCase()}: ${o.carried ? 'carried' : 'failed'} ${o.aye} to ${o.nay}`, room: 'votes', link: `/votes/${motionId}` })
  return { ...o, number }
}

/** End a live meeting and draft its minutes from what was captured. */
export function endMeeting(meetingId: string) {
  const s = getState()
  const m = s.meetings.find((x) => x.id === meetingId)!
  const docId = uid('doc')
  const absent = s.directors.filter((d) => !m.present.includes(d.id)).map((d) => d.name)
  const passed = s.motions.filter((x) => x.meetingId === meetingId && x.status !== 'open')
  const started = m.startedAt ? new Date(m.startedAt) : new Date(m.date)
  const sections = [
    { heading: 'Present', body: `${m.present.length} of ${s.directors.length} directors. ${absent.length ? `Absent: ${absent.join(', ')}.` : 'No absences.'} ${m.present.length >= Math.floor(s.directors.length / 2) + 1 ? 'A quorum was present.' : 'A quorum was not present; no action was taken.'}` },
    ...(m.agenda[0]?.notes ? [] : [{ heading: 'Call to order', body: `The Chair called the meeting to order at ${time(started.toISOString())} at ${m.place}.` }]),
    ...m.agenda.filter((a) => (a.kind !== 'procedure' || a.notes) && a.title !== 'Adjourn').map((a) => {
      const mo = s.motions.find((x) => x.id === a.motionId && x.status !== 'open')
      const result = mo ? (() => { const o = outcome(mo, s.directors.length); return ` On motion by ${dir(s, mo.movedBy)?.name}, seconded by ${dir(s, mo.secondedBy)?.name}, the motion ${mo.status} ${o.aye} to ${o.nay}${o.abstain ? ` with ${o.abstain} abstaining` : ''} (${mo.number}).` })() : ''
      const body = (a.notes?.trim() || (a.done || mo ? (mo ? '' : 'Discussed. No notes recorded.') : 'Not reached; carried to the next meeting.')) + result
      return { heading: a.title, body: body.trim() }
    }),
    ...(passed.length ? [{ heading: 'Resolutions', body: passed.map((p) => { const o = outcome(p, s.directors.length); return `${p.number}: ${p.title}, ${p.status} ${o.aye} to ${o.nay}${o.abstain ? ` with ${o.abstain} abstaining` : ''}.` }).join(' ') }] : []),
    { heading: 'Adjournment', body: `The meeting adjourned at ${time(new Date().toISOString())}.` },
  ]
  update((d) => {
    const mm = d.meetings.find((x) => x.id === meetingId)!
    mm.status = 'held'
    mm.endedAt = Date.now()
    mm.minutesDocId = docId
    d.docs.unshift({ id: docId, title: `Minutes: ${m.title}`, shelf: 'Minutes', status: 'Awaiting approval', updated: new Date().toISOString(), author: ME, sections, meetingId })
  }, { text: `closed the ${day(m.date)} meeting and drafted its minutes`, room: 'documents', link: `/documents/${docId}` })
  return docId
}

export function planNextMeeting(after: Meeting) {
  const id = uid('m')
  const d = new Date(after.date)
  d.setMonth(d.getMonth() + 1)
  update((s) => {
    s.meetings.push({
      id, title: 'Regular Board Meeting', kind: 'Regular', date: d.toISOString(), place: after.place, status: 'planned', present: [],
      agenda: [
        { id: uid('a'), title: 'Call to order and roll call', kind: 'procedure', minutes: 5, owner: 'd-marisol' },
        { id: uid('a'), title: 'Approve the minutes of the last meeting', kind: 'action', minutes: 5, owner: ME },
        { id: uid('a'), title: "Treasurer's report", kind: 'report', minutes: 15, owner: 'd-elena' },
        { id: uid('a'), title: 'Adjourn', kind: 'procedure', minutes: 2, owner: 'd-marisol' },
      ],
    })
  }, { text: `planned the ${day(d.toISOString())} meeting`, room: 'meetings', link: `/meetings/${id}` })
  return id
}
