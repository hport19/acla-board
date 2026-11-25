import type { State, Artist, Director, Applicant } from './types'

/*
 * Demo data for the Local Arts edition: the same board year as the Latino
 * edition (the same meetings, ballots, money and records, so every rule and
 * number lines up), retold for a general community arts council.
 * Still invented, apart from the signed-in Secretary.
 */

/** Wording swapped everywhere it appears: names, agendas, minutes, activity. Longest first. */
const WORDS: [string, string][] = [
  ['Amarillo Council for the Latino Arts', 'Amarillo Council for the Local Arts'],
  ['to preserve, promote and celebrate Latino arts and cultural heritage in the Texas Panhandle', 'to support, present and sustain the arts and the working artists of Amarillo and the Texas Panhandle'],
  ['Día de Muertos Festival', 'Panhandle Arts Festival'],
  ['Posada de las Artes', 'Winter Open Studios'],
  ['Raíces: a printmaking talk', 'The Cornerstone Lecture: printmaking'],
  ['Raíces', 'Cornerstone'],
  ['The flagship: altars, live music, a Catrina contest and workshops for children. Free and open to everyone.', 'The flagship: three stages of live music, a juried exhibition and workshops for children. Free and open to everyone.'],
  ['Altars, live music, exhibitions, workshops and the Catrina contest. One of the largest cultural celebrations in the Panhandle.', 'Live music, a juried exhibition, workshops and artist demonstrations. One of the largest cultural events in the Panhandle.'],
  ['A winter procession and open studio night.', 'An evening of open studios downtown.'],
  ['Community altars (24)', 'Juried exhibition hung (24 works)'],
  ['Community altars', 'Works exhibited'],
  ['Catrina contest judges', 'Exhibition jurors'],
  ['Tamales and champurrado', 'Catering and refreshments'],
  ['Festival altars', 'Festival installation'],
  ['Hands-on, bilingual, free', 'Hands-on and free'],
  ['Printmaking, papel picado, folklórico and mural workshops', 'Printmaking, ceramics, dance and mural workshops'],
  ['San José neighborhood', 'Bivins neighborhood'],
  ['Familia Zamora', 'The Zamora Family'],
]

/** Directors by id: some renamed so the board reads as the city's, crafts kept general. */
const DIRECTORS: Record<string, Partial<Director>> = {
  'd-marisol': { name: 'Margaret Lyle' },
  'd-ruben': { name: 'Michael Castañeda', craft: 'Music educator, symphony board' },
  'd-analucia': { name: 'Laura Ibarra' },
  'd-tomas': { name: 'Thomas Reed' },
  'd-gloria': { name: 'Gloria Bennett' },
  'd-pilar': { name: 'Victoria Pierce' },
  'd-nadia': { name: 'Natalie Brooks', craft: 'Dancer, ballet instructor' },
}

const ARTISTS: Record<string, Partial<Artist>> = {
  'a-ximena': { name: 'Simone Robles', work: 'Grandmother’s Kitchen, Third State' },
  'a-lupe': { name: 'Hannah Carr', discipline: 'Cut paper', work: 'Twenty-Four Panels', medium: 'Hand-cut archival paper' },
  'a-carmen': { work: 'Vessels for the Dry Months' },
  'a-ines': { name: 'Ingrid Vale', work: 'Bands for My Daughters' },
  'a-paloma': { name: 'Paula Grant', work: 'Noon' },
  'a-mateo': { name: 'Marcus Cole', discipline: 'Jazz, upright bass', work: 'Nights on Polk Street', statement: 'A trio is a conversation. Everyone gets a chorus.' },
  'a-sofia': { name: 'Sophie Dalton', work: 'Prairie Alphabet', statement: 'Twenty-six letters, twenty-six plants of the High Plains.' },
  'a-tomasa': { name: 'Tess Ruelas', work: 'The Forge' },
  'a-beatriz': { name: 'Beatrice Lowe', work: 'Small Monuments', statement: 'Pocket-sized monuments for modern troubles: a phone, a truck, a diploma.' },
  'a-alma': { name: 'Alma Quinn', work: 'Night Harvest', statement: 'Harvest crews at night under the yard lights, painted like old masters.' },
}

const APPLICANTS: Record<string, Partial<Applicant>> = {
  's-2': { discipline: 'Violin' },
  's-3': { name: 'Chloe Fuentes', discipline: 'Ballet', statement: 'I teach the little ones at our church on Saturdays. A summer intensive would let me bring back new repertoire.' },
  's-5': { name: 'Rachel Sims' },
  's-7': { name: 'Lucy Parker', statement: 'Poems about growing up between a small town and a big one.' },
  's-8': { name: 'Ethan Tovar' },
  's-9': { name: 'Megan Ledford' },
}

/** Restrained colors for committees and programs (navy, slate, oxblood, brass, forest). */
const COMMITTEE_COLORS: Record<string, string> = { exec: '#1c2b45', finance: '#2f5a55', programs: '#7a3b2e', scholar: '#6b2f42', develop: '#9a7a3f', gov: '#4d6150' }
const PROGRAM_COLORS: Record<string, string> = { 'p-806': '#2f5a55', 'p-fest': '#7a3b2e', 'p-schol': '#6b2f42', 'p-work': '#9a7a3f' }

export function localSeed(latino: State): State {
  // Rename people first so the wording pass also fixes their names inside minutes and notes.
  const renames: [string, string][] = []
  const pick = <T extends { id: string; name: string }>(list: T[], over: Record<string, Partial<T>>) => list.map((x) => {
    const o = over[x.id]
    if (o?.name && o.name !== x.name) renames.push([x.name, o.name])
    return o ? { ...x, ...o } : x
  })
  const s: State = {
    ...latino,
    directors: pick(latino.directors, DIRECTORS),
    artists: pick(latino.artists, ARTISTS),
    applicants: pick(latino.applicants, APPLICANTS),
    committees: latino.committees.map((c) => ({ ...c, color: COMMITTEE_COLORS[c.id] ?? c.color })),
    programs: latino.programs.map((p) => ({ ...p, color: PROGRAM_COLORS[p.id] ?? p.color })),
  }
  let json = JSON.stringify(s)
  for (const [from, to] of [...WORDS, ...renames]) json = json.split(JSON.stringify(from).slice(1, -1)).join(JSON.stringify(to).slice(1, -1))
  return JSON.parse(json) as State
}
