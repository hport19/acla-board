// Phone interactions: open each room's sheet, the rooms sheet and a live meeting; screenshot each state.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = process.env.BASE || 'http://127.0.0.1:5317'
const out = process.env.OUT || require('path').join(__dirname, '../shots/pf')
;(async () => {
  require('fs').mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  const shot = async (n) => { await page.waitForTimeout(900); await page.screenshot({ path: `${out}/${n}.png` }); console.log('shot', n) }
  const step = async (n, fn) => { try { await fn(); } catch (e) { console.log('FAIL', n, e.message.split('\n')[0]) } }
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'networkidle' })

  await step('more', async () => { await page.click('.dock-room:last-child'); await shot('more') ; await page.click('.rooms-row:has-text("Board")'); await page.waitForTimeout(600) })
  await step('board', async () => { await page.click('.seat:has-text("Nadia"), .seat:has-text("Natalie")'); await shot('board-drawer'); await page.locator('.drawer-body').evaluate((e) => e.scrollTo(0, 9999)); await shot('board-drawer-end'); await page.click('.drawer-close'); await page.waitForTimeout(500); console.log('url after close', page.url()) })
  await step('votes', async () => { await page.goto(base + '/votes', { waitUntil: 'networkidle' }); await page.click('.vb.open >> nth=0'); await shot('votes-drawer'); await page.click('.drawer .bb-aye'); await shot('votes-voted'); await page.goBack(); await page.waitForTimeout(600); console.log('url after back', page.url(), await page.locator('.drawer').count()) })
  await step('events', async () => { await page.goto(base + '/events', { waitUntil: 'networkidle' }); await page.click('.sl-row >> nth=0'); await shot('events-drawer'); await page.locator('.drawer-body').evaluate((e) => e.scrollTo(0, 700)); await shot('events-drawer-2') })
  await step('artists', async () => { await page.goto(base + '/artists', { waitUntil: 'networkidle' }); await page.click('.frame >> nth=10'); await shot('artists-drawer') })
  await step('programs', async () => { await page.goto(base + '/programs', { waitUntil: 'networkidle' }); await page.click('.lr >> nth=1'); await shot('programs-drawer'); await page.locator('.drawer-body').evaluate((e) => e.scrollTo(0, 9999)); await shot('programs-drawer-2') })
  await step('documents', async () => { await page.goto(base + '/documents', { waitUntil: 'networkidle' }); await page.click('.spine >> nth=6'); await shot('documents-drawer'); await page.click('.drawer-close'); await page.fill('.dc-search input', 'quorum'); await shot('documents-search') })
  await step('newmotion', async () => { await page.goto(base + '/votes', { waitUntil: 'networkidle' }); await page.click('.vt-new'); await shot('votes-new') })
  await step('live', async () => { await page.goto(base + '/meetings', { waitUntil: 'networkidle' }); await page.click('.pl-actions .btn-accent'); await shot('live-roll'); await page.click('.live-all'); await shot('live-roll-all'); await page.click('.live-begin'); await shot('live-item'); await page.click('.ls >> nth=1'); await page.waitForTimeout(400); await shot('live-item2') })
  if (errs.length) console.log('ERRORS', [...new Set(errs)].slice(0, 8).join('\n')); else console.log('no console errors')
  await browser.close()
})()
