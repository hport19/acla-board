import { initials, rng } from '../lib'

/**
 * A painted monogram instead of a photo: an irregular, hand-cut shape in
 * a colour seeded per person, with the initials set in the display serif.
 * No real faces are used anywhere in the prototype.
 */
export function Portrait({ name, hue, size = 44, ring, dim, className }: { name: string; hue: number; size?: number; ring?: string; dim?: boolean; className?: string }) {
  const r = rng(hue * 31 + name.length * 7)
  const pts = 9
  const path: string[] = []
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2
    const rad = 42 + r() * 7
    path.push(`${50 + Math.cos(a) * rad},${50 + Math.sin(a) * rad}`)
  }
  // smooth closed curve through the points
  const p = path.map((s) => s.split(',').map(Number))
  let d = `M${(p[0][0] + p[pts - 1][0]) / 2},${(p[0][1] + p[pts - 1][1]) / 2}`
  for (let i = 0; i < pts; i++) {
    const c = p[i]
    const nx = p[(i + 1) % pts]
    d += ` Q${c[0]},${c[1]} ${(c[0] + nx[0]) / 2},${(c[1] + nx[1]) / 2}`
  }
  const sat = 52
  const fill = `hsl(${hue} ${sat}% ${dim ? 78 : 44}%)`
  const fill2 = `hsl(${(hue + 24) % 360} ${sat + 10}% ${dim ? 86 : 58}%)`
  const id = `pg-${hue}-${name.length}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label={name} style={{ flex: 'none', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fill2} />
          <stop offset="1" stopColor={fill} />
        </linearGradient>
      </defs>
      {ring && <path d={d} fill="none" stroke={ring} strokeWidth="7" transform="translate(50 50) scale(1.16) translate(-50 -50)" />}
      <path d={d} fill={`url(#${id})`} />
      <path d={`M${22 + r() * 10},${70 + r() * 6} q20,${-6 - r() * 6} ${46 + r() * 8},${-2}`} stroke="rgba(255,255,255,.22)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fill={dim ? 'rgba(34,28,44,.55)' : '#fff8ec'} style={{ font: `italic 400 ${initials(name).length > 1 ? 36 : 44}px var(--serif)`, letterSpacing: '-1px' }}>
        {initials(name)}
      </text>
    </svg>
  )
}
