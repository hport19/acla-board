# ACLA Board OS

A working platform for the Board of Directors of the **Amarillo Council for the Latino Arts (ACLA)**: meetings, votes, events, artists, scholarships, money and records in one place. It is built for phones first, because that is where most directors will use it.

> **Prototype.** All people, numbers and documents are **invented demo data**. Changes are saved only in your browser (`localStorage`). There is no sign-in or backend yet.

## Run it

```bash
pnpm install          # or npm install
npx vite --port 5317  # http://127.0.0.1:5317
```

Build: `npx tsc -p . && npx vite build` writes a static site to `dist/`. Any static host works if unknown paths fall back to `index.html`, because the app does its own routing.

To try the phone layout, open the browser's device toolbar at a width of 820 px or less. You can also add the app to a phone's home screen; it is an installable PWA.

**Demo data** in the More sheet (phone) or the sidebar foot (desktop) resets everything to the seed.

## Two editions

One build serves two looks, chosen by the address:

| Address | Edition |
|---|---|
| `/` | **Amarillo Council for the Latino Arts**: warm atelier, papel picado, Fraunces |
| `/local/` | **Amarillo Council for the Local Arts** (the assumed name): navy, ivory and brass, Newsreader and Inter |

Only look, wording and demo data change; every room, rule and action is shared. See `src/edition.ts` (the switch), `src/styles/local.css` (the theme) and `src/store/seed-local.ts` (the demo data retold). Each edition keeps its own saved data in the browser.

## The rooms

| Room | What it is |
|---|---|
| **Home** | What needs my attention, what changed, what happens next |
| **Board** | Directors, officers, terms and committees, with each director's profile |
| **Meetings** | Agenda builder, a live meeting mode (roll call, quorum, motions on the floor) and minutes drafted automatically from the meeting |
| **Votes** | Open motions with a live tally, the bylaws' majority and two-thirds rules, and the resolutions book |
| **Events** | The season as a timeline, with a checklist for each event |
| **Artists** | A gallery wall of artists and their profiles for 806.art |
| **Programs** | Scholarship applicants scored against a rubric by the committee |
| **Money** | Budget against actual, the fundraising campaign, donations, thank-yous and grants |
| **Documents** | Bylaws, policies and the minutes archive, with search |

## Code map

- `src/App.tsx`: the shell (sidebar or phone dock, topbar, transitions between rooms)
- `src/rooms/*`: one component and one stylesheet per room. Each room has its own interface by design, not a shared template.
- `src/store/`
  - `types.ts`: the data model
  - `seed.ts`: the demo data; bump `VERSION` in `store.ts` to reseed
  - `derive.ts`: quorum, tallies, outcomes and the attention list
  - `actions.ts`: votes, closing motions, ending meetings, drafting minutes
- `src/ui/kit.tsx`: shared pieces (Sheet, the swipe-down Drawer for details on phones, toasts, confirmations)
- `src/lib.ts`: the router (`navigate`, `useRoute`), date and money formatting, phone helpers
- `tools/*.cjs`: Playwright scripts for screenshots and click-through checks. They need `playwright`; set `PLAYWRIGHT_PATH` if it is installed somewhere else.

Stack: Vite 7, React 19, TypeScript (strict) and framer-motion. Fonts are self-hosted through Fontsource: Fraunces and Instrument Sans, or Newsreader and Inter in the Local Arts edition.

## Planned next

- Per-director sign-in and a real database
- A link to the website's Directus content
- A possible Spanish toggle
