// Screenshot rooms at desktop and phone sizes using Playwright (set PLAYWRIGHT_PATH to use a copy outside this project).
// usage: node tools/shoot.cjs [path ...]   (default: every room)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = process.env.BASE || 'http://127.0.0.1:5317'
const out = process.env.OUT || require('path').join(__dirname, '../shots')
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/board', '/meetings', '/votes', '/events', '/artists', '/programs', '/money', '/documents']
const sizes = (process.env.SIZES || 'desk,phone').split(',')
const dims = { desk: { width: 1440, height: 900 }, phone: { width: 390, height: 844 }, small: { width: 1180, height: 760 }, laptop: { width: 1366, height: 768 } }
;(async () => {
  require('fs').mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: dims[s], deviceScaleFactor: s === 'phone' ? 2 : 1, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
    for (const p of paths) {
      await page.goto(base + p, { waitUntil: 'networkidle' })
      await page.waitForTimeout(Number(process.env.WAIT || 2200))
      const name = (p === '/' ? 'home' : p.slice(1).replace(/[/?=&]/g, '_')) + '-' + s + '.png'
      await page.screenshot({ path: `${out}/${name}`, fullPage: s === 'phone' && process.env.FULL === '1' })
      console.log('shot', name)
    }
    if (errs.length) console.log('ERRORS', s, [...new Set(errs)].slice(0, 8).join('\n'))
    await ctx.close()
  }
  await browser.close()
})()
