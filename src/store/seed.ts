import type { State, Director, Committee, Meeting, Motion, ArtsEvent, Artist, Applicant, Program, BudgetLine, Donation, Grant, BoardDoc, Activity } from './types'

/*
 * Invented demonstration data for the ACLA Board OS prototype.
 * Every director other than the signed-in Secretary, every artist, applicant,
 * donor and funder is fictional. Dates are laid out relative to the day the
 * data is first seeded so the prototype always reads as "now".
 */

const DAY = 86400000

function at(offsetDays: number, hour = 12, minute = 0): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return new Date(d.getTime() + offsetDays * DAY).toISOString()
}

function monthKey(offsetMonths: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offsetMonths)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const year = new Date().getFullYear()

const committees: Committee[] = [
  { id: 'exec', name: 'Executive', chair: 'd-marisol', color: '#2B2D6B', purpose: 'Acts between meetings within limits set by the bylaws; sets the board agenda.' },
  { id: 'finance', name: 'Finance', chair: 'd-elena', color: '#1D5E5C', purpose: 'Budget, monthly financials, audit readiness and the reserve policy.' },
  { id: 'programs', name: 'Programs & Events', chair: 'd-tomas', color: '#B9472A', purpose: 'The festival, the season of events and the artist programs.' },
  { id: 'scholar', name: 'Scholarships', chair: 'd-analucia', color: '#C8366E', purpose: 'Runs the scholarship cycle, scores applicants and recommends awards.' },
  { id: 'develop', name: 'Development', chair: 'd-gloria', color: '#D18A12', purpose: 'Donors, the Funders Club, sponsorships and the year-end campaign.' },
  { id: 'gov', name: 'Governance', chair: 'd-pilar', color: '#6E8B4E', purpose: 'Bylaws, policies, nominations and director onboarding.' },
]

const directors: Director[] = [
  { id: 'd-marisol', name: 'Marisol Treviño', office: 'Chair', craft: 'Printmaker and gallery owner', town: 'Amarillo', joined: '2023-03-14', termEnds: at(400), termNumber: 2, committees: ['exec', 'develop'], hue: 14, note: 'Founding director. Leads the relationship with the city arts office.' },
  { id: 'd-ruben', name: 'Rubén Castañeda', office: 'Vice Chair', craft: 'Music educator, mariachi director', town: 'Canyon', joined: '2023-03-14', termEnds: at(400), termNumber: 2, committees: ['exec', 'programs'], hue: 205, note: 'Runs the festival main stage every year.' },
  { id: 'd-elena', name: 'Elena Whitfield', office: 'Treasurer', craft: 'Certified public accountant', town: 'Amarillo', joined: '2023-09-01', termEnds: at(586), termNumber: 1, committees: ['exec', 'finance'], hue: 168, note: 'Prepares the monthly financials and the Form 990 with the outside preparer.' },
  { id: 'd-hector', name: 'Hector Portillo', office: 'Secretary', you: true, craft: 'Technology and operations', town: 'Amarillo', joined: '2024-01-18', termEnds: at(640), termNumber: 1, committees: ['exec', 'gov', 'scholar'], hue: 38, note: 'Keeps the minutes, the resolutions book and the records of the corporation.' },
  { id: 'd-analucia', name: 'Ana Lucía Ibarra', office: 'Director', craft: 'High school art teacher', town: 'Hereford', joined: '2023-09-01', termEnds: at(586), termNumber: 1, committees: ['scholar', 'programs'], hue: 330, note: 'Chairs Scholarships; knows every art teacher from Dumas to Tulia.' },
  { id: 'd-tomas', name: 'Tomás Reyes', office: 'Director', craft: 'Muralist', town: 'Amarillo', joined: '2023-03-14', termEnds: at(400), termNumber: 2, committees: ['programs'], hue: 22, note: 'Leads Mural Week and the festival installations.' },
  { id: 'd-gloria', name: 'Gloria Esparza', office: 'Director', craft: 'Restaurant owner, community organizer', town: 'Amarillo', joined: '2024-01-18', termEnds: at(640), termNumber: 1, committees: ['develop'], hue: 48, note: 'Chairs Development; built the Funders Club from twelve to sixty-four members.' },
  { id: 'd-jordan', name: 'Jordan Mills', office: 'Director', craft: 'Commercial banker', town: 'Amarillo', joined: '2024-06-10', termEnds: at(760), termNumber: 1, committees: ['finance', 'gov'], hue: 222, note: 'Second signer on the operating account.' },
  { id: 'd-pilar', name: 'Pilar Domínguez', office: 'Director', craft: 'Attorney, nonprofit law', town: 'Canyon', joined: '2023-09-01', termEnds: at(586), termNumber: 1, committees: ['gov', 'scholar'], hue: 280, note: 'Chairs Governance; drafted the revised conflict of interest policy.' },
  { id: 'd-samuel', name: 'Samuel Ortega', office: 'Director', craft: 'Photographer', town: 'Borger', joined: '2024-06-10', termEnds: at(760), termNumber: 1, committees: ['programs', 'develop'], hue: 190, note: 'Documents every event; runs the 806.art photo days.' },
  { id: 'd-nadia', name: 'Nadia Benavides', office: 'Director', craft: 'Dancer, folklórico instructor', town: 'Dumas', joined: '2023-03-14', termEnds: at(52), termNumber: 1, committees: ['scholar', 'develop'], hue: 350, note: 'Term ends soon. Eligible for a second term; nomination pending.' },
]

const allIds = directors.map((d) => d.id)
const without = (...ids: string[]) => allIds.filter((id) => !ids.includes(id))

function agenda(prefix: string, items: [string, Meeting['agenda'][number]['kind'], number, string?, string?][], done = false) {
  return items.map(([title, kind, minutes, owner, notes], i) => ({ id: `${prefix}-a${i}`, title, kind, minutes, owner, notes, done }))
}

const meetings: Meeting[] = [
  {
    id: 'm-next', title: 'Regular Board Meeting', kind: 'Regular', date: at(12, 18, 0), place: 'ACLA Studio, Polk Street', status: 'planned',
    present: [],
    agenda: agenda('m-next', [
      ['Call to order and roll call', 'procedure', 5, 'd-marisol'],
      ['Approve the minutes of the last regular meeting', 'action', 5, 'd-hector'],
      ["Treasurer's report: October financials", 'report', 15, 'd-elena'],
      ['Día de Muertos Festival debrief', 'discussion', 20, 'd-ruben'],
      ['Spring scholarship slate', 'action', 15, 'd-analucia'],
      ['First reading of the next year budget', 'discussion', 20, 'd-elena'],
      ['Posada de las Artes logistics', 'report', 10, 'd-tomas'],
      ['Nominations: director seat ending in January', 'action', 10, 'd-pilar'],
      ['Adjourn', 'procedure', 2, 'd-marisol'],
    ]),
  },
  {
    id: 'm-nov', title: 'Regular Board Meeting', kind: 'Regular', date: at(-16, 18, 0), place: 'ACLA Studio, Polk Street', status: 'held',
    present: without('d-jordan', 'd-samuel'), minutesDocId: 'doc-min-nov',
    agenda: agenda('m-nov', [
      ['Call to order and roll call', 'procedure', 5, 'd-marisol', 'Called to order at 6:04 PM. Quorum present (9 of 11).'],
      ['Approve the October minutes', 'action', 5, 'd-hector', 'Approved as circulated. Resolution R-' + year + '-14.'],
      ["Treasurer's report", 'report', 15, 'd-elena', 'Festival came in under budget by about $1,600. Sponsorship income ahead of plan.'],
      ['Festival attendance and feedback', 'discussion', 20, 'd-ruben', 'Attendance finalized at 3,140. Parking and shade were the top two requests.'],
      ['Year-end campaign launch', 'action', 10, 'd-gloria', 'Campaign "Raíces" approved with a $25,000 goal.'],
      ['Adjourn', 'procedure', 2, 'd-marisol', 'Adjourned at 7:41 PM.'],
    ], true),
  },
  {
    id: 'm-oct', title: 'Regular Board Meeting', kind: 'Regular', date: at(-44, 18, 0), place: 'ACLA Studio, Polk Street', status: 'held',
    present: without('d-nadia'), minutesDocId: 'doc-min-oct',
    agenda: agenda('m-oct', [
      ['Call to order and roll call', 'procedure', 5, 'd-marisol', 'Called to order at 6:01 PM. Quorum present (10 of 11).'],
      ['Festival readiness review', 'report', 25, 'd-ruben', 'Vendors confirmed, stage plot final, insurance rider received.'],
      ['Festival budget increase', 'action', 10, 'd-elena', 'Increase of $3,500 for shade structures approved, 7 to 2.'],
      ['Adjourn', 'procedure', 2, 'd-marisol', 'Adjourned at 7:20 PM.'],
    ], true),
  },
  {
    id: 'm-sep', title: 'Special Meeting: Festival Partners', kind: 'Special', date: at(-61, 17, 30), place: 'Video call', status: 'held',
    present: without('d-gloria', 'd-samuel', 'd-nadia', 'd-jordan'), minutesDocId: 'doc-min-sep',
    agenda: agenda('m-sep', [
      ['Call to order', 'procedure', 3, 'd-marisol', 'Called to order at 5:33 PM. Quorum present (7 of 11).'],
      ['Beverage sponsor proposal', 'action', 20, 'd-gloria', 'Motion to accept the exclusive beverage sponsorship failed, 3 to 6.'],
      ['Adjourn', 'procedure', 2, 'd-marisol', 'Adjourned at 6:10 PM.'],
    ], true),
  },
  {
    id: 'm-aug', title: 'Regular Board Meeting', kind: 'Regular', date: at(-79, 18, 0), place: 'ACLA Studio, Polk Street', status: 'held',
    present: without('d-ruben', 'd-pilar'), agenda: agenda('m-aug', [['Regular business', 'procedure', 60, 'd-marisol', 'See approved minutes.']], true),
  },
  {
    id: 'm-jul', title: 'Regular Board Meeting', kind: 'Regular', date: at(-107, 18, 0), place: 'ACLA Studio, Polk Street', status: 'held',
    present: without('d-samuel'), agenda: agenda('m-jul', [['Regular business', 'procedure', 60, 'd-marisol', 'See approved minutes.']], true),
  },
  {
    id: 'm-jun', title: 'Regular Board Meeting', kind: 'Regular', date: at(-135, 18, 0), place: 'ACLA Studio, Polk Street', status: 'held',
    present: without('d-nadia', 'd-gloria', 'd-tomas'), agenda: agenda('m-jun', [['Regular business', 'procedure', 60, 'd-marisol', 'See approved minutes.']], true),
  },
  {
    id: 'm-may', title: 'Annual Meeting', kind: 'Annual', date: at(-170, 18, 0), place: 'Amarillo Public Library, Community Room', status: 'held',
    present: allIds, agenda: agenda('m-may', [['Election of officers', 'action', 30, 'd-pilar', 'Officers re-elected by acclamation.']], true),
  },
]

function ballots(map: Record<string, 'aye' | 'nay' | 'abstain'>) { return map }

const motions: Motion[] = [
  {
    id: 'v-slate', title: 'Spring scholarship slate', text: 'Resolved, that the Board awards four Spring scholarships totaling $6,000 to the applicants recommended by the Scholarships Committee, to be paid directly to each recipient’s institution or program.',
    movedBy: 'd-analucia', secondedBy: 'd-pilar', opened: at(-3, 9), closes: at(4, 17), method: 'Electronic ballot', status: 'open', threshold: 'majority',
    ballots: ballots({ 'd-analucia': 'aye', 'd-pilar': 'aye', 'd-marisol': 'aye', 'd-ruben': 'aye', 'd-gloria': 'aye', 'd-jordan': 'abstain', 'd-tomas': 'aye' }),
  },
  {
    id: 'v-coi', title: 'Revised conflict of interest policy', text: 'Resolved, that the Board adopts the revised Conflict of Interest Policy as presented by the Governance Committee, replacing the policy adopted at organization, and directs every director to sign the annual disclosure within thirty days.',
    movedBy: 'd-pilar', secondedBy: 'd-jordan', opened: at(-1, 10), closes: at(9, 17), method: 'Electronic ballot', status: 'open', threshold: 'two-thirds',
    ballots: ballots({ 'd-pilar': 'aye', 'd-jordan': 'aye', 'd-elena': 'aye' }),
  },
  {
    id: 'v-14', number: `R-${year}-14`, title: 'Approve the October minutes', text: 'Resolved, that the minutes of the October regular meeting are approved as circulated.',
    movedBy: 'd-hector', secondedBy: 'd-ruben', meetingId: 'm-nov', opened: at(-16, 18, 10), closedAt: at(-16, 18, 12), method: 'In meeting', status: 'carried', threshold: 'majority',
    ballots: ballots({ 'd-marisol': 'aye', 'd-ruben': 'aye', 'd-elena': 'aye', 'd-hector': 'aye', 'd-analucia': 'aye', 'd-tomas': 'aye', 'd-gloria': 'aye', 'd-pilar': 'aye', 'd-nadia': 'abstain' }),
  },
  {
    id: 'v-13', number: `R-${year}-13`, title: 'Launch the Raíces year-end campaign', text: 'Resolved, that the Board launches the year-end campaign "Raíces" with a goal of $25,000, the proceeds to support artist stipends and the scholarship fund.',
    movedBy: 'd-gloria', secondedBy: 'd-marisol', meetingId: 'm-nov', opened: at(-16, 19, 2), closedAt: at(-16, 19, 6), method: 'In meeting', status: 'carried', threshold: 'majority',
    ballots: ballots({ 'd-marisol': 'aye', 'd-ruben': 'aye', 'd-elena': 'aye', 'd-hector': 'aye', 'd-analucia': 'aye', 'd-tomas': 'aye', 'd-gloria': 'aye', 'd-pilar': 'aye', 'd-nadia': 'aye' }),
  },
  {
    id: 'v-12', number: `R-${year}-12`, title: 'Festival shade structures', text: 'Resolved, that the festival production budget is increased by $3,500 for rented shade structures and additional seating.',
    movedBy: 'd-elena', secondedBy: 'd-ruben', meetingId: 'm-oct', opened: at(-44, 18, 40), closedAt: at(-44, 18, 48), method: 'In meeting', status: 'carried', threshold: 'majority',
    ballots: ballots({ 'd-marisol': 'aye', 'd-ruben': 'aye', 'd-elena': 'aye', 'd-hector': 'aye', 'd-analucia': 'aye', 'd-tomas': 'aye', 'd-gloria': 'aye', 'd-jordan': 'nay', 'd-pilar': 'nay', 'd-samuel': 'abstain' }),
  },
  {
    id: 'v-11', number: `R-${year}-11`, title: 'Exclusive beverage sponsorship', text: 'Resolved, that ACLA accepts an exclusive beverage sponsorship for the festival, including on-site product placement.',
    movedBy: 'd-gloria', secondedBy: 'd-elena', meetingId: 'm-sep', opened: at(-61, 17, 40), closedAt: at(-61, 17, 58), method: 'In meeting', status: 'failed', threshold: 'majority',
    ballots: ballots({ 'd-marisol': 'nay', 'd-ruben': 'nay', 'd-elena': 'aye', 'd-hector': 'nay', 'd-analucia': 'nay', 'd-tomas': 'nay', 'd-pilar': 'nay', 'd-gloria': 'aye', 'd-jordan': 'aye' }),
  },
  {
    id: 'v-10', number: `R-${year}-10`, title: 'Mural Week artist stipends', text: 'Resolved, that each of the six Mural Week lead artists receives a stipend of $750.',
    movedBy: 'd-tomas', secondedBy: 'd-samuel', opened: at(-150, 12), closedAt: at(-146, 12), method: 'Unanimous written consent', status: 'carried', threshold: 'majority',
    ballots: Object.fromEntries(allIds.map((id) => [id, 'aye'])) as Record<string, 'aye'>,
  },
]

function checklist(prefix: string, items: [string, boolean, string?][]) {
  return items.map(([label, done, owner], i) => ({ id: `${prefix}-c${i}`, label, done, owner }))
}

const events: ArtsEvent[] = [
  {
    id: 'e-muertos', name: 'Día de Muertos Festival', kind: 'Festival', start: at(-20, 11), end: at(-20, 22), place: 'Downtown plaza', lead: 'd-ruben', expected: 2800, attendance: 3140, budget: 28000, spent: 26410,
    artists: ['a-ximena', 'a-joaquin', 'a-lupe', 'a-rafael', 'a-carmen', 'a-ines'],
    checklist: checklist('e-muertos', [['City permit and road closure', true, 'd-ruben'], ['Main stage and sound', true, 'd-ruben'], ['Community altars (24)', true, 'd-tomas'], ['Catrina contest judges', true, 'd-nadia'], ['Vendor map', true, 'd-gloria'], ['Thank-you letters to sponsors', false, 'd-gloria'], ['Photo archive to 806.art', false, 'd-samuel']]),
    blurb: 'The flagship: altars, live music, a Catrina contest and workshops for children. Free and open to everyone.',
  },
  {
    id: 'e-posada', name: 'Posada de las Artes', kind: 'Celebration', start: at(22, 18), place: 'ACLA Studio, Polk Street', lead: 'd-tomas', expected: 220, budget: 3200, spent: 1180,
    artists: ['a-paloma', 'a-mateo', 'a-lupe'],
    checklist: checklist('e-posada', [['Date and space confirmed', true, 'd-tomas'], ['Musicians booked', true, 'd-ruben'], ['Tamales and champurrado', false, 'd-gloria'], ['Artist ornament table', true, 'd-tomas'], ['Volunteer sign-up', false, 'd-samuel'], ['Neighborhood flyers', false, 'd-samuel'], ['Insurance certificate', false, 'd-jordan']]),
    blurb: 'A winter procession and open studio night. Artists make ornaments with families; a donor thank-you moment for the Raíces campaign.',
  },
  {
    id: 'e-talk', name: 'Raíces: a printmaking talk', kind: 'Talk', start: at(57, 19), place: 'Amarillo Public Library', lead: 'd-marisol', expected: 80, budget: 900, spent: 0,
    artists: ['a-ximena'],
    checklist: checklist('e-talk', [['Room reserved', true, 'd-marisol'], ['Artist confirmed', true, 'd-marisol'], ['Press release', false, 'd-samuel'], ['Live stream test', false, 'd-hector']]),
    blurb: 'A conversation with a relief printmaker about carving family history into linoleum.',
  },
  {
    id: 'e-showcase', name: '806.art Spring Showcase', kind: 'Showcase', start: at(113, 18), place: 'Sixth Street gallery row', lead: 'd-samuel', expected: 600, budget: 5200, spent: 400,
    artists: ['a-joaquin', 'a-rafael', 'a-sofia', 'a-mateo', 'a-ines', 'a-dario'],
    checklist: checklist('e-showcase', [['Galleries committed (5 of 6)', false, 'd-samuel'], ['Open call published', true, 'd-samuel'], ['Jurors invited', false, 'd-marisol'], ['Walking map', false, 'd-tomas']]),
    blurb: 'One night, six galleries, every artist on 806.art invited to submit.',
  },
  {
    id: 'e-market', name: 'Spring Arts Market', kind: 'Market', start: at(155, 10), end: at(155, 17), place: 'Ellwood Park', lead: 'd-gloria', expected: 1400, budget: 6800, spent: 0,
    artists: ['a-lupe', 'a-carmen', 'a-paloma', 'a-beatriz'],
    checklist: checklist('e-market', [['Park permit', false, 'd-gloria'], ['Vendor applications open', false, 'd-gloria'], ['Food trucks', false, 'd-gloria']]),
    blurb: 'Sixty makers, food, and a children’s mural wall.',
  },
  {
    id: 'e-recital', name: 'Scholarship Recital', kind: 'Recital', start: at(176, 18, 30), place: 'Canyon high school auditorium', lead: 'd-analucia', expected: 300, budget: 1800, spent: 0,
    artists: ['a-dario'],
    checklist: checklist('e-recital', [['Auditorium booked', true, 'd-analucia'], ['Recipients confirmed', false, 'd-analucia']]),
    blurb: 'This year’s scholarship recipients perform and exhibit for the families and donors who made it possible.',
  },
  {
    id: 'e-mural', name: 'Mural Week', kind: 'Workshop', start: at(197, 9), end: at(204, 18), place: 'North Heights', lead: 'd-tomas', expected: 900, budget: 9500, spent: 0,
    artists: ['a-joaquin', 'a-tomasa', 'a-rafael'],
    checklist: checklist('e-mural', [['Wall owners signed', false, 'd-tomas'], ['Paint sponsor', false, 'd-gloria'], ['Lead artists selected', false, 'd-tomas']]),
    blurb: 'Six walls in one week, painted with neighbors, led by regional muralists.',
  },
  {
    id: 'e-muertos-next', name: 'Día de Muertos Festival', kind: 'Festival', start: at(344, 11), end: at(344, 22), place: 'Downtown plaza', lead: 'd-ruben', expected: 3400, budget: 31000, spent: 0,
    artists: [],
    checklist: checklist('e-muertos-next', [['Save the date with the city', true, 'd-ruben'], ['Sponsor deck', false, 'd-gloria'], ['Parking and shade plan', false, 'd-ruben']]),
    blurb: 'Planning starts now. Parking and shade are the two things attendees asked for.',
  },
  {
    id: 'e-mural-past', name: 'Mural Week', kind: 'Workshop', start: at(-168, 9), end: at(-161, 18), place: 'San José neighborhood', lead: 'd-tomas', expected: 700, attendance: 860, budget: 8200, spent: 8030,
    artists: ['a-joaquin', 'a-tomasa'], checklist: checklist('e-mural-past', [['Walls painted (5)', true]]), blurb: 'Five walls in seven days.',
  },
  {
    id: 'e-market-past', name: 'Spring Arts Market', kind: 'Market', start: at(-210, 10), place: 'Ellwood Park', lead: 'd-gloria', expected: 1100, attendance: 1260, budget: 6000, spent: 5710,
    artists: ['a-lupe', 'a-carmen'], checklist: checklist('e-market-past', [['Vendors (48)', true]]), blurb: 'Forty-eight makers on a windy April Saturday.',
  },
]

const artists: Artist[] = [
  { id: 'a-ximena', name: 'Ximena Robles', discipline: 'Relief printmaking', town: 'Amarillo', style: 'tinta', seed: 11, work: 'Abuela’s Kitchen, Third State', medium: 'Linocut on kozo paper', year: year, profile: 'Featured', spotlights: ['Festival print tent', 'Raíces talk'], paid: 1250, statement: 'I carve what my grandmother told me while she cooked. Every block is a recipe and a map.' },
  { id: 'a-joaquin', name: 'Joaquín Salazar', discipline: 'Muralism', town: 'Amarillo', style: 'mural', seed: 23, work: 'Llano Rising', medium: 'Acrylic on stucco, 14 × 40 ft', year: year - 1, profile: 'Featured', spotlights: ['Mural Week lead', 'Festival backdrop'], paid: 3400, statement: 'Walls belong to the neighbors who walk past them. I paint with them, not for them.' },
  { id: 'a-lupe', name: 'Lupe Carrizales', discipline: 'Papel picado', town: 'Hereford', style: 'papel', seed: 37, work: 'Veinticuatro Altares', medium: 'Hand-cut tissue paper', year: year, profile: 'Live', spotlights: ['Festival altars', 'Posada ornament table'], paid: 900, statement: 'A chisel, a stack of tissue, and patience. Light does the rest.' },
  { id: 'a-rafael', name: 'Rafael Montoya', discipline: 'Photography', town: 'Pampa', style: 'mesa', seed: 41, work: 'Caprock, Before Rain', medium: 'Archival pigment print', year: year, profile: 'Live', spotlights: ['806.art photo days'], paid: 600, statement: 'The Panhandle looks empty until you wait long enough.' },
  { id: 'a-carmen', name: 'Carmen Olivas', discipline: 'Ceramics', town: 'Canyon', style: 'barro', seed: 53, work: 'Cántaros for the Dry Months', medium: 'Burnished earthenware', year: year - 1, profile: 'Live', spotlights: ['Spring Market'], paid: 450, statement: 'Clay from the creek bed, fired low, burnished with a river stone.' },
  { id: 'a-ines', name: 'Inés Valdez', discipline: 'Textile art', town: 'Amarillo', style: 'serape', seed: 67, work: 'Saltillo for My Daughters', medium: 'Hand-woven wool', year: year, profile: 'Featured', spotlights: ['Festival textile hall'], paid: 1100, statement: 'Each stripe is a year. I am still weaving.' },
  { id: 'a-paloma', name: 'Paloma Guerra', discipline: 'Painting', town: 'Dumas', style: 'sol', seed: 71, work: 'Mediodía', medium: 'Oil on panel', year: year, profile: 'Live', spotlights: ['Posada guest artist'], paid: 300, statement: 'I paint the hour when the light is too strong to look at.' },
  { id: 'a-mateo', name: 'Mateo Cárdenas', discipline: 'Son jarocho, jarana', town: 'Amarillo', style: 'son', seed: 83, work: 'Fandango en el Llano', medium: 'Live performance and recording', year: year, profile: 'Live', spotlights: ['Festival main stage', 'Posada'], paid: 800, statement: 'A fandango is a conversation. Everyone gets a verse.' },
  { id: 'a-sofia', name: 'Sofía Delgado', discipline: 'Illustration', town: 'Amarillo', style: 'milpa', seed: 97, work: 'Milpa Alphabet', medium: 'Gouache and ink', year: year, profile: 'Pending review', spotlights: [], paid: 0, statement: 'Twenty-seven letters, twenty-seven plants my mother grew.' },
  { id: 'a-tomasa', name: 'Tomasa Ruelas', discipline: 'Muralism', town: 'Borger', style: 'mural', seed: 101, work: 'La Lumbre', medium: 'Mineral paint on brick', year: year - 1, profile: 'Live', spotlights: ['Mural Week'], paid: 750, statement: 'My murals are about fire: the kitchen, the forge, the field burn.' },
  { id: 'a-dario', name: 'Darío Fuentes', discipline: 'Classical guitar', town: 'Canyon', style: 'son', seed: 113, work: 'Suite for the Canadian River', medium: 'Composition and performance', year: year, profile: 'Live', spotlights: ['Scholarship recipient'], paid: 500, statement: 'A scholarship recipient who came back to teach.' },
  { id: 'a-beatriz', name: 'Beatriz Lomelí', discipline: 'Jewelry and metal', town: 'Amarillo', style: 'milagro', seed: 127, work: 'Milagros, Revised', medium: 'Hammered silver and copper', year: year, profile: 'Pending review', spotlights: [], paid: 0, statement: 'Small offerings for modern troubles: a phone, a truck, a diploma.' },
  { id: 'a-alma', name: 'Alma Quintero', discipline: 'Painting', town: 'Hereford', style: 'milpa', seed: 131, work: 'Cosecha Nocturna', medium: 'Acrylic on canvas', year: year, profile: 'Live', spotlights: [], paid: 0, statement: 'Farmworkers at night under the yard lights, painted as saints.' },
]

const sc = (craft: number, promise: number, need: number, community: number) => ({ craft, promise, need, community })

const applicants: Applicant[] = [
  { id: 's-1', name: 'Valeria Ochoa', age: 17, school: 'Palo Duro High School', discipline: 'Painting', ask: 1500, stage: 'Interview', hue: 18, statement: 'I paint my neighborhood because nobody else does. I want to study at a college with a real printmaking studio.', scores: { 'd-analucia': sc(5, 5, 4, 4), 'd-pilar': sc(4, 5, 4, 5) } },
  { id: 's-2', name: 'Andrés Medina', age: 18, school: 'Hereford High School', discipline: 'Mariachi violin', ask: 1500, stage: 'Interview', hue: 200, statement: 'My grandfather taught me in his garage. I want a teacher who can take me further than YouTube.', scores: { 'd-analucia': sc(4, 5, 5, 5), 'd-pilar': sc(4, 4, 5, 5), 'd-nadia': sc(5, 5, 5, 4) } },
  { id: 's-3', name: 'Camila Fuentes', age: 16, school: 'Dumas High School', discipline: 'Folklórico', ask: 1000, stage: 'In review', hue: 330, statement: 'I teach the little ones at our church on Saturdays. A summer intensive would let me bring back new regions.', scores: { 'd-nadia': sc(5, 4, 4, 5) } },
  { id: 's-4', name: 'Isaac Barrera', age: 19, school: 'Amarillo College', discipline: 'Photography', ask: 2000, stage: 'In review', hue: 190, statement: 'I photograph the feedyards and the people who work them. I need a lens and a semester of tuition.', scores: { 'd-analucia': sc(4, 4, 5, 3) } },
  { id: 's-5', name: 'Renata Solís', age: 17, school: 'Canyon High School', discipline: 'Ceramics', ask: 1200, stage: 'Interview', hue: 40, statement: 'I want to build a kiln at my school so more students can fire their work.', scores: { 'd-analucia': sc(4, 5, 3, 5), 'd-pilar': sc(5, 4, 3, 5) } },
  { id: 's-6', name: 'Diego Navarro', age: 18, school: 'Caprock High School', discipline: 'Graphic design', ask: 1500, stage: 'Applied', hue: 230, statement: 'I designed my family’s food truck menu and logo. I want to do this for real.', scores: {} },
  { id: 's-7', name: 'Lucía Paredes', age: 16, school: 'Tascosa High School', discipline: 'Creative writing', ask: 800, stage: 'Applied', hue: 280, statement: 'Bilingual poems about growing up between two kitchens.', scores: {} },
  { id: 's-8', name: 'Emilio Tovar', age: 17, school: 'Borger High School', discipline: 'Sculpture', ask: 1500, stage: 'In review', hue: 100, statement: 'Welded scrap from my uncle’s shop. I want to learn to cast bronze.', scores: { 'd-pilar': sc(4, 4, 4, 3), 'd-nadia': sc(3, 4, 4, 3) } },
  { id: 's-9', name: 'Mariana Ledesma', age: 18, school: 'Randall High School', discipline: 'Guitar', ask: 1000, stage: 'Declined', hue: 0, statement: 'Withdrew: received a full university music scholarship.', scores: {} },
]

const programs: Program[] = [
  { id: 'p-806', name: '806.art', tagline: 'A free home on the web for every artist in the 806', lead: 'd-samuel', color: '#1D5E5C', story: 'Public profiles, a directory and a newsletter that broadcasts arts events. Free to artists, sustained by the Funders Club.', measures: [{ label: 'Artists with profiles', value: 212, goal: 250 }, { label: 'Newsletter readers', value: 1480, goal: 2000 }, { label: 'Funders Club members', value: 64, goal: 80 }] },
  { id: 'p-fest', name: 'Día de Muertos Festival', tagline: 'Our flagship, free, every year since founding', lead: 'd-ruben', color: '#B9472A', story: 'Altars, live music, exhibitions, workshops and the Catrina contest. One of the largest cultural celebrations in the Panhandle.', measures: [{ label: 'Attendees this year', value: 3140, goal: 2800 }, { label: 'Community altars', value: 24, goal: 20 }, { label: 'Artists paid', value: 41, goal: 40 }] },
  { id: 'p-schol', name: 'Artist Scholarships', tagline: 'For young artists from the Panhandle', lead: 'd-analucia', color: '#C8366E', story: 'Awards paid directly to schools and programs. Recipients perform or exhibit at the spring recital.', measures: [{ label: 'Awarded this year', value: 9000, unit: '$', goal: 12000 }, { label: 'Recipients to date', value: 17 }, { label: 'Applicants this cycle', value: 9 }] },
  { id: 'p-work', name: 'Community Workshops', tagline: 'Hands-on, bilingual, free', lead: 'd-tomas', color: '#D18A12', story: 'Printmaking, papel picado, folklórico and mural workshops in libraries, churches and schools.', measures: [{ label: 'Workshops held', value: 26, goal: 30 }, { label: 'Participants', value: 640 }, { label: 'Partner sites', value: 9 }] },
]

const budget: BudgetLine[] = [
  { id: 'b-i1', side: 'income', name: 'Individual donations', budget: 38000, actual: 31450 },
  { id: 'b-i2', side: 'income', name: 'Funders Club', budget: 9600, actual: 8800 },
  { id: 'b-i3', side: 'income', name: 'Grants', budget: 45000, actual: 40000 },
  { id: 'b-i4', side: 'income', name: 'Festival sponsorships', budget: 22000, actual: 24500 },
  { id: 'b-i5', side: 'income', name: 'Events and market', budget: 8000, actual: 6320 },
  { id: 'b-e1', side: 'expense', name: 'Festival production', budget: 28000, actual: 26410 },
  { id: 'b-e2', side: 'expense', name: 'Artist stipends', budget: 14000, actual: 12750 },
  { id: 'b-e3', side: 'expense', name: 'Scholarships', budget: 12000, actual: 9000 },
  { id: 'b-e4', side: 'expense', name: 'Operations and insurance', budget: 9000, actual: 8240 },
  { id: 'b-e5', side: 'expense', name: 'Community workshops', budget: 7000, actual: 4100 },
  { id: 'b-e6', side: 'expense', name: '806.art platform', budget: 6500, actual: 5980 },
  { id: 'b-e7', side: 'expense', name: 'Marketing and printing', budget: 5000, actual: 4630 },
]

const donorNames = ['The Arredondo Family', 'Patricia Hale', 'Luis and Marta Cantú', 'Westgate Dental Group', 'Anonymous', 'Rosa Elizondo', 'Kevin Tran', 'Familia Zamora', 'Dr. Amelia Soto', 'High Plains Hardware', 'Anonymous', 'Beto Garza', 'Catherine Moore', 'Ignacio Prieto', 'The Lindqvist Fund', 'Yesenia Ruiz']
const amounts = [2500, 250, 1000, 1500, 5000, 100, 75, 500, 1000, 750, 300, 150, 2000, 250, 1000, 60]
const methods: Donation['method'][] = ['Check', 'Card', 'Card', 'Check', 'Stock', 'Card', 'Card', 'Funders Club', 'Card', 'Check', 'Cash', 'Card', 'Card', 'Funders Club', 'Check', 'Card']
const donations: Donation[] = donorNames.map((donor, i) => ({
  id: `g-${i}`, donor, amount: amounts[i], method: methods[i], date: at(-Math.round(i * 1.1) - (i > 9 ? 1 : 0), 10 + (i % 7)), campaign: 'Raíces', thanked: i > 3,
}))

const grants: Grant[] = [
  { id: 'gr-1', funder: 'Llano Arts Fund', purpose: 'Festival general support', amount: 15000, status: 'Awarded', deadline: at(-120), owner: 'd-gloria' },
  { id: 'gr-2', funder: 'High Plains Cultural Trust', purpose: 'Scholarship endowment seed', amount: 25000, status: 'Awarded', deadline: at(-200), owner: 'd-analucia' },
  { id: 'gr-3', funder: 'Caprock Family Foundation', purpose: 'Mural Week next summer', amount: 12000, status: 'Drafting', deadline: at(17), owner: 'd-tomas' },
  { id: 'gr-4', funder: 'Statewide Arts Partnership', purpose: 'Operating support, two years', amount: 30000, status: 'Submitted', deadline: at(-9), owner: 'd-elena' },
  { id: 'gr-5', funder: 'Llano Arts Fund', purpose: 'Final report: festival grant', amount: 0, status: 'Report due', deadline: at(26), owner: 'd-gloria' },
  { id: 'gr-6', funder: 'Westland Energy Giving', purpose: '806.art newsletter', amount: 5000, status: 'Declined', deadline: at(-60), owner: 'd-samuel' },
]

const cashSeries = [41200, 39800, 44100, 52600, 49900, 47300, 51800, 58400, 55100, 48700, 61900, 63850]
const cash = cashSeries.map((balance, i) => ({ month: monthKey(i - 11), balance }))

function sec(heading: string, body: string) { return { heading, body } }

const docs: BoardDoc[] = [
  {
    id: 'doc-bylaws', title: 'Bylaws of the Amarillo Council for the Latino Arts', shelf: 'Governing', status: 'Adopted', updated: '2024-05-16', author: 'd-pilar',
    sections: [
      sec('Article I. Name and purpose', 'The name of the corporation is the Amarillo Council for the Latino Arts. The corporation is organized exclusively for charitable and educational purposes within the meaning of Section 501(c)(3) of the Internal Revenue Code, to preserve, promote and celebrate Latino arts and cultural heritage in the Texas Panhandle.'),
      sec('Article II. Board of Directors', 'The affairs of the corporation are managed by a Board of not fewer than seven and not more than fifteen directors. Directors serve staggered terms of two years and may serve no more than three consecutive terms.'),
      sec('Article III. Meetings', 'The Board meets at least six times a year. The Annual Meeting is held in the spring. Special meetings may be called by the Chair or by any three directors with at least forty-eight hours’ notice. Directors may participate by video conference.'),
      sec('Article IV. Quorum and voting', 'A majority of directors in office constitutes a quorum. Except where these bylaws require otherwise, the act of a majority of directors present at a meeting at which a quorum is present is the act of the Board. Amendments to these bylaws and the adoption or revision of governing policies require two-thirds of the directors voting.'),
      sec('Article V. Action without a meeting', 'Any action required or permitted to be taken at a meeting may be taken without a meeting by unanimous written consent, or by electronic ballot open for at least seventy-two hours, provided that the number of directors voting would constitute a quorum.'),
      sec('Article VI. Officers', 'The officers are a Chair, a Vice Chair, a Treasurer and a Secretary, elected at the Annual Meeting for one-year terms. The Secretary keeps the minutes of all meetings, maintains the book of resolutions and the records of the corporation, and gives notice of meetings.'),
      sec('Article VII. Committees', 'The Board may establish standing and ad hoc committees. Standing committees are Executive, Finance, Programs and Events, Scholarships, Development and Governance. Each committee is chaired by a director.'),
      sec('Article VIII. Conflicts of interest', 'Every director discloses any actual or potential conflict of interest and recuses from discussion and vote on the matter, as described in the Conflict of Interest Policy.'),
    ],
  },
  {
    id: 'doc-coi', title: 'Conflict of Interest Policy (revision)', shelf: 'Policies', status: 'In revision', updated: at(-6), author: 'd-pilar',
    sections: [
      sec('Purpose', 'To protect the interests of ACLA when it considers a transaction or arrangement that might benefit the private interest of a director, officer or member of a committee.'),
      sec('Duty to disclose', 'An interested person must disclose the existence of a financial interest, including through family members and businesses, before the Board discusses the matter.'),
      sec('What changes in this revision', 'Adds artist commissions and festival vendor contracts as covered transactions. Requires an annual signed disclosure. Clarifies that a director may present information but must leave the room for discussion and vote.'),
      sec('Annual statement', 'Each director signs a statement each year affirming that they have received, read and agree to comply with this policy.'),
    ],
  },
  { id: 'doc-whistle', title: 'Whistleblower Policy', shelf: 'Policies', status: 'Adopted', updated: '2024-05-16', author: 'd-pilar', sections: [sec('Reporting', 'Directors, volunteers and contractors may report suspected misconduct to the Chair or, if the Chair is involved, to the Chair of Governance, without fear of retaliation.'), sec('Confidentiality', 'Reports are handled confidentially to the extent possible consistent with a full investigation.')] },
  { id: 'doc-retention', title: 'Document Retention and Destruction Policy', shelf: 'Policies', status: 'Adopted', updated: '2024-05-16', author: 'd-hector', sections: [sec('Permanent records', 'Articles of incorporation, bylaws, the IRS determination letter, minutes, resolutions and annual filings are kept permanently.'), sec('Seven years', 'Financial statements, bank records, grant files and donor acknowledgments are kept for seven years.'), sec('Litigation hold', 'No record may be destroyed once a legal claim is anticipated.')] },
  { id: 'doc-gift', title: 'Gift Acceptance Policy', shelf: 'Policies', status: 'Draft', updated: at(-30), author: 'd-gloria', sections: [sec('Purpose', 'Sets which gifts ACLA accepts and how sponsorships are acknowledged, so that donor recognition never becomes product placement.'), sec('Naming', 'Naming of programs or spaces requires a Board vote.')] },
  {
    id: 'doc-min-nov', title: 'Minutes: Regular Board Meeting', shelf: 'Minutes', status: 'Awaiting approval', updated: at(-14), author: 'd-hector', meetingId: 'm-nov',
    sections: [
      sec('Present', 'Nine of eleven directors. Absent: Jordan Mills, Samuel Ortega. Quorum present.'),
      sec('Call to order', 'The Chair called the meeting to order at 6:04 PM.'),
      sec('Minutes', 'The minutes of the October meeting were approved as circulated (R-' + year + '-14).'),
      sec("Treasurer's report", 'The festival came in under budget by about $1,600. Sponsorship income is ahead of plan.'),
      sec('Festival', 'Attendance was finalized at 3,140. Parking and shade were the top two requests.'),
      sec('Year-end campaign', 'The Board launched "Raíces" with a $25,000 goal (R-' + year + '-13).'),
      sec('Adjournment', 'The meeting adjourned at 7:41 PM.'),
    ],
  },
  { id: 'doc-min-oct', title: 'Minutes: Regular Board Meeting', shelf: 'Minutes', status: 'Approved', updated: at(-16), author: 'd-hector', meetingId: 'm-oct', sections: [sec('Present', 'Ten of eleven directors. Absent: Nadia Benavides.'), sec('Festival readiness', 'Vendors confirmed, stage plot final, insurance rider received.'), sec('Budget', 'Increase of $3,500 for shade structures approved, 7 to 2 (R-' + year + '-12).')] },
  { id: 'doc-min-sep', title: 'Minutes: Special Meeting, Festival Partners', shelf: 'Minutes', status: 'Approved', updated: at(-44), author: 'd-hector', meetingId: 'm-sep', sections: [sec('Present', 'Seven of eleven directors, by video.'), sec('Beverage sponsor', 'The motion to accept an exclusive beverage sponsorship failed, 3 to 6 (R-' + year + '-11).')] },
  { id: 'doc-990', title: 'Form 990-EZ, prior fiscal year', shelf: 'Filings', status: 'Filed', updated: at(-190), author: 'd-elena', sections: [sec('Filing', 'Filed electronically with the outside preparer. Copy available to the public on request, as required.'), sec('Totals', 'Gross receipts under $200,000; total assets under $500,000.')] },
  { id: 'doc-irs', title: 'IRS Determination Letter, 501(c)(3)', shelf: 'Filings', status: 'Filed', updated: '2024-03-02', sections: [sec('Status', 'Recognized as a public charity under sections 501(c)(3) and 509(a)(1)/170(b)(1)(A)(vi). Contributions are tax deductible.')] },
  { id: 'doc-sos', title: 'Texas Periodic Report', shelf: 'Filings', status: 'Draft', updated: at(-2), author: 'd-hector', sections: [sec('Due', 'Filed with the Secretary of State when requested, listing current directors and the registered agent.'), sec('Directors', 'Update after the January seat is filled.')] },
]

const activity: Activity[] = [
  { id: 'act-1', at: at(0, 8, 12), who: 'd-elena', text: 'posted the October financials for the next meeting', room: 'money', link: '/money' },
  { id: 'act-2', at: at(0, 7, 40), who: 'd-tomas', text: 'voted aye on the spring scholarship slate', room: 'votes', link: '/votes/v-slate' },
  { id: 'act-3', at: at(-1, 19, 5), text: 'Raíces passed $16,000, two-thirds of the goal', room: 'money', link: '/money' },
  { id: 'act-4', at: at(-1, 10, 2), who: 'd-pilar', text: 'opened the ballot on the revised conflict of interest policy', room: 'votes', link: '/votes/v-coi' },
  { id: 'act-5', at: at(-2, 16, 30), who: 'd-tomas', text: 'booked the musicians for Posada de las Artes', room: 'events', link: '/events/e-posada' },
  { id: 'act-6', at: at(-3, 9, 0), who: 'd-analucia', text: 'moved the spring scholarship slate to an electronic ballot', room: 'votes', link: '/votes/v-slate' },
  { id: 'act-7', at: at(-4, 14, 20), who: 'd-samuel', text: 'sent two new artist profiles for review', room: 'artists', link: '/artists' },
  { id: 'act-8', at: at(-9, 11, 0), who: 'd-elena', text: 'submitted the two-year operating grant', room: 'money', link: '/money' },
  { id: 'act-9', at: at(-14, 21, 10), who: 'd-hector', text: 'circulated the draft minutes of the November meeting', room: 'documents', link: '/documents/doc-min-nov' },
]

export function createSeed(): State {
  return {
    version: 4,
    seededAt: new Date().toISOString(),
    directors, committees, meetings, motions, events, artists, applicants, programs, budget,
    campaign: { name: 'Raíces', goal: 25000, ends: at(40) },
    donations, grants, cash, docs, activity, dismissed: [],
  }
}
