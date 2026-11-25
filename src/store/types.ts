export type ID = string

export type Office = 'Chair' | 'Vice Chair' | 'Treasurer' | 'Secretary' | 'Director'

export interface Director {
  id: ID
  name: string
  office: Office
  you?: boolean
  pronoun?: string
  craft: string // what they bring to the board
  town: string
  joined: string // ISO date
  termEnds: string // ISO date
  termNumber: number
  committees: ID[]
  hue: number // portrait colour seed
  note: string
}

export interface Committee {
  id: ID
  name: string
  chair: ID
  color: string
  purpose: string
}

export type AgendaKind = 'procedure' | 'report' | 'discussion' | 'action'

export interface AgendaItem {
  id: ID
  title: string
  kind: AgendaKind
  minutes: number
  owner?: ID
  notes?: string // minutes captured live
  done?: boolean
  motionId?: ID
}

export type MeetingStatus = 'planned' | 'live' | 'held'

export interface Meeting {
  id: ID
  title: string
  kind: 'Regular' | 'Special' | 'Annual'
  date: string // ISO datetime
  place: string
  status: MeetingStatus
  agenda: AgendaItem[]
  present: ID[]
  liveIndex?: number
  startedAt?: number
  minutesDocId?: ID
  noticeSent?: string
  endedAt?: number
}

export type Ballot = 'aye' | 'nay' | 'abstain'

export interface Motion {
  id: ID
  number?: string // resolution number once closed
  title: string
  text: string
  movedBy: ID
  secondedBy?: ID
  meetingId?: ID
  opened: string
  closes?: string
  method: 'In meeting' | 'Unanimous written consent' | 'Electronic ballot'
  ballots: Record<ID, Ballot>
  status: 'open' | 'carried' | 'failed'
  closedAt?: string
  threshold: 'majority' | 'two-thirds'
}

export interface ChecklistItem { id: ID; label: string; done: boolean; owner?: ID }

export interface ArtsEvent {
  id: ID
  name: string
  kind: 'Festival' | 'Market' | 'Talk' | 'Showcase' | 'Workshop' | 'Recital' | 'Celebration'
  start: string
  end?: string
  place: string
  lead: ID
  expected: number
  attendance?: number
  budget: number
  spent: number
  artists: ID[]
  checklist: ChecklistItem[]
  blurb: string
}

export type ArtStyle = 'papel' | 'serape' | 'sol' | 'milpa' | 'mesa' | 'barro' | 'son' | 'mural' | 'tinta' | 'milagro'

export interface Artist {
  id: ID
  name: string
  discipline: string
  town: string
  style: ArtStyle
  seed: number
  work: string // title of featured work
  medium: string
  year: number
  profile: 'Featured' | 'Live' | 'Pending review'
  spotlights: string[]
  paid: number // stipends + commissions this year
  statement: string
}

export type Stage = 'Applied' | 'In review' | 'Interview' | 'Awarded' | 'Declined'

export interface Applicant {
  id: ID
  name: string
  age: number
  school: string
  discipline: string
  ask: number
  stage: Stage
  statement: string
  scores: Record<ID, { craft: number; promise: number; need: number; community: number }>
  hue: number
}

export interface Program {
  id: ID
  name: string
  tagline: string
  lead: ID
  color: string
  measures: { label: string; value: number; unit?: string; goal?: number }[]
  story: string
}

export interface BudgetLine {
  id: ID
  side: 'income' | 'expense'
  name: string
  budget: number
  actual: number
}

export interface Donation {
  id: ID
  donor: string
  amount: number
  date: string
  method: 'Card' | 'Check' | 'Funders Club' | 'Stock' | 'Cash'
  campaign?: string
  thanked: boolean
}

export interface Grant {
  id: ID
  funder: string
  purpose: string
  amount: number
  status: 'Drafting' | 'Submitted' | 'Awarded' | 'Declined' | 'Report due'
  deadline: string
  owner: ID
}

export interface DocSection { heading: string; body: string }

export interface BoardDoc {
  id: ID
  title: string
  shelf: 'Governing' | 'Policies' | 'Minutes' | 'Filings'
  status: 'Adopted' | 'Draft' | 'Approved' | 'Awaiting approval' | 'Filed' | 'In revision'
  updated: string
  author?: ID
  sections: DocSection[]
  meetingId?: ID
}

export interface Activity {
  id: ID
  at: string
  who?: ID
  text: string
  room: RoomKey
  link?: string
}

export type RoomKey =
  | 'home'
  | 'board'
  | 'meetings'
  | 'votes'
  | 'events'
  | 'artists'
  | 'programs'
  | 'money'
  | 'documents'

export interface State {
  version: number
  seededAt: string
  directors: Director[]
  committees: Committee[]
  meetings: Meeting[]
  motions: Motion[]
  events: ArtsEvent[]
  artists: Artist[]
  applicants: Applicant[]
  programs: Program[]
  budget: BudgetLine[]
  campaign: { name: string; goal: number; ends: string }
  donations: Donation[]
  grants: Grant[]
  cash: { month: string; balance: number }[]
  docs: BoardDoc[]
  activity: Activity[]
  dismissed: ID[]
}
