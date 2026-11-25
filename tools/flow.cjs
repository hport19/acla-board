// Drive the main flows end to end and screenshot key moments; report page errors.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = process.env.BASE || 'http://127.0.0.1:5317'
const out = require('path').join(__dirname, '../shots')
;(async () => {
  const browser = await chromium.launch()
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()) })
  const shot = (n) => page.screenshot({ path: `${out}/flow-${n}.png` })
  const step = async (label, fn) => { try { await fn(); console.log('ok  ', label) } catch (e) { console.log('FAIL', label, e.message.split('\n')[0]) } }

  await page.goto(base + '/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(base + '/')
  await page.waitForTimeout(1200)
  await step('home: vote aye from attention', async () => { await page.getByRole('button', { name: 'Aye', exact: true }).first().click(); await page.waitForTimeout(600); await shot('home-aye') })
  await step('home: undo from toast', async () => { await page.getByRole('button', { name: /Undo/ }).first().click(); await page.waitForTimeout(400) })
  await step('home: changed tab', async () => { await page.getByRole('button', { name: /things changed/ }).click(); await page.waitForTimeout(700) })
  await step('home: next tab', async () => { await page.getByRole('button', { name: /days to the next meeting/ }).click(); await page.waitForTimeout(700); await shot('home-next') })

  await step('meetings: start live', async () => { await page.goto(base + '/meetings'); await page.waitForTimeout(900); await page.getByRole('button', { name: /Start the meeting/ }).click(); await page.waitForTimeout(900) })
  await step('live: everyone here', async () => { await page.getByRole('button', { name: 'Everyone is here' }).click(); await page.waitForTimeout(500) })
  await step('live: notes', async () => { await page.locator('.live-notes textarea').fill('Called to order at 6:02 PM. All eleven directors present.'); await page.waitForTimeout(700) })
  await step('live: next item', async () => { await page.getByRole('button', { name: /^Next:/ }).click(); await page.waitForTimeout(900) })
  await step('live: put to vote', async () => { await page.getByRole('button', { name: 'Put it to a vote' }).click(); await page.waitForTimeout(600) })
  await step('live: all in favor', async () => { await page.getByRole('button', { name: 'All in favor' }).click(); await page.waitForTimeout(500); await shot('live-vote') })
  await step('live: close vote', async () => { await page.getByRole('button', { name: 'Close the vote' }).click(); await page.waitForTimeout(300); await page.getByRole('button', { name: 'Yes, record it' }).click(); await page.waitForTimeout(1200); await shot('live-result') })
  await step('live: adjourn', async () => { await page.locator('.live-bar').getByRole('button', { name: 'Adjourn' }).click(); await page.waitForTimeout(300); await page.getByRole('button', { name: 'Yes, record it' }).click(); await page.waitForTimeout(1400); await shot('minutes') })

  await step('votes: new motion sheet', async () => { await page.goto(base + '/votes'); await page.waitForTimeout(800); await page.getByRole('button', { name: /Bring a motion/ }).click(); await page.waitForTimeout(500); await page.getByPlaceholder('Adopt the gift acceptance policy').fill('Adopt the gift acceptance policy'); await page.locator('.sheet textarea').fill('Resolved, that the Board adopts the Gift Acceptance Policy as circulated.'); await shot('sheet'); await page.getByRole('button', { name: 'Open the ballot' }).click(); await page.waitForTimeout(900) })
  await step('votes: cast nay', async () => { await page.locator('.bb-nay').click(); await page.waitForTimeout(700); await shot('votes-nay') })

  await step('money: record gift', async () => { await page.goto(base + '/money'); await page.waitForTimeout(900); await page.getByRole('button', { name: 'Record a gift' }).click(); await page.waitForTimeout(400); await page.getByRole('button', { name: '$1,000' }).first().click(); await page.getByRole('button', { name: /Record \$1,000/ }).click(); await page.waitForTimeout(1600); await shot('money-gift') })
  await step('money: grant awarded', async () => { await page.getByRole('button', { name: 'Awarded' }).click(); await page.waitForTimeout(800) })

  await step('board: toggle committee + nominate', async () => { await page.goto(base + '/board/d-nadia'); await page.waitForTimeout(900); await page.getByRole('button', { name: /Finance/ }).last().click(); await page.waitForTimeout(400); await page.getByRole('button', { name: 'Nominate for a second term' }).click(); await page.getByRole('button', { name: 'Yes, record it' }).click(); await page.waitForTimeout(700); await shot('board-nominate') })
  await step('board: committee thread', async () => { await page.locator('.thread').nth(3).click(); await page.waitForTimeout(1000); await shot('board-thread') })

  await step('programs: score', async () => { await page.goto(base + '/programs'); await page.waitForTimeout(900); for (const c of ['Craft', 'Promise', 'Need', 'Community']) await page.getByRole('radiogroup', { name: c }).getByRole('radio').nth(3).click(); await page.getByRole('button', { name: /Save my score/ }).click(); await page.waitForTimeout(700); await shot('programs-score') })
  await step('events: toggle task + add', async () => { await page.goto(base + '/events'); await page.waitForTimeout(900); await page.locator('.ck-item').nth(2).click(); await page.getByPlaceholder(/Add a task/).fill('Order luminarias'); await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(800); await shot('events-task') })
  await step('artists: approve pending', async () => { await page.goto(base + '/artists/a-sofia'); await page.waitForTimeout(900); await page.getByRole('button', { name: 'Approve profile' }).click(); await page.waitForTimeout(600) })
  await step('documents: edit + search', async () => { await page.goto(base + '/documents/doc-gift'); await page.waitForTimeout(900); await page.getByRole('button', { name: 'Edit' }).click(); await page.locator('.rsec-edit').first().fill('Sets which gifts ACLA accepts. Revised by the Secretary.'); await page.getByRole('button', { name: 'Save', exact: true }).click(); await page.waitForTimeout(500); await page.getByPlaceholder('Search every document').fill('quorum'); await page.waitForTimeout(600); await shot('documents-search') })
  await step('home: what changed shows my work', async () => { await page.goto(base + '/'); await page.waitForTimeout(800); await page.getByRole('button', { name: /things changed/ }).click(); await page.waitForTimeout(800); await shot('home-changed') })

  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 15).join('\n') : 'no console errors')
  await browser.close()
})()
