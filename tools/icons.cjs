// Render the home-screen icons (cempasúchil bloom on night) into public/.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const petals = (n, scale, rot, fill) => Array.from({ length: n }).map((_, i) => `<path transform="rotate(${(i * 360) / n + rot}) scale(${scale})" d="M0,-4 C6,-12 5,-24 0,-29 C-5,-24 -6,-12 0,-4Z" fill="${typeof fill === 'function' ? fill(i) : fill}"/>`).join('')
const svg = (size, inset) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><radialGradient id="g" cx="50%" cy="58%" r="60%"><stop offset="0" stop-color="#3a2f55"/><stop offset=".6" stop-color="#241d3b"/><stop offset="1" stop-color="#1a1530"/></radialGradient>
<radialGradient id="h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e39b1b" stop-opacity=".45"/><stop offset="1" stop-color="#e39b1b" stop-opacity="0"/></radialGradient></defs>
<rect width="${size}" height="${size}" fill="url(#g)"/>
<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.42}" fill="url(#h)"/>
<g transform="translate(${size / 2} ${size / 2}) scale(${(size * (1 - inset * 2)) / 64})">
${petals(12, 1, 0, (i) => (i % 2 ? '#e39b1b' : '#d9822b'))}${petals(12, 0.62, 15, '#f2c14e')}
<circle r="7.5" fill="#b9472a"/><circle r="3" fill="#f6ead8"/></g></svg>`
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  for (const [name, size, inset] of [['apple-touch-icon.png', 180, 0.14], ['icon-192.png', 192, 0.14], ['icon-512.png', 512, 0.14], ['icon-maskable-512.png', 512, 0.24]]) {
    await p.setViewportSize({ width: size, height: size })
    await p.setContent(`<html><body style="margin:0">${svg(size, inset)}</body></html>`)
    await p.screenshot({ path: require('path').join(__dirname, '../public', name), clip: { x: 0, y: 0, width: size, height: size } })
    console.log('icon', name)
  }
  await b.close()
})()
