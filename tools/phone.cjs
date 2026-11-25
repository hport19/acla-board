// Whole-room phone screenshots: load at 390x844, then grow the viewport to the room's scroll height.
// usage: node tools/phone.cjs [path ...]   env BASE, OUT, SCALE (default 1), WAIT
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = process.env.BASE || 'http://127.0.0.1:5317'
const out = process.env.OUT || require('path').join(__dirname, '../shots/p')
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/board', '/meetings', '/votes', '/events', '/artists', '/programs', '/money', '/documents']
;(async () => {
  require('fs').mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: Number(process.env.SCALE || 1), hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  for (const p of paths) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(base + p, { waitUntil: 'networkidle' })
    await page.waitForTimeout(Number(process.env.WAIT || 1800))
    const h = await page.evaluate(() => { const r = document.querySelector('.room'); return r ? r.scrollHeight : 844 })
    const extra = 844 - (await page.evaluate(() => document.querySelector('.room')?.clientHeight || 844))
    await page.setViewportSize({ width: 390, height: Math.min(12000, h + extra) })
    await page.waitForTimeout(700)
    const name = (p === '/' ? 'home' : p.slice(1).replace(/[/?=&]/g, '_')) + '.png'
    await page.screenshot({ path: `${out}/${name}` })
    console.log('shot', name, h)
  }
  if (errs.length) console.log('ERRORS', [...new Set(errs)].slice(0, 8).join('\n'))
  await browser.close()
})()
