import { memo } from 'react'
import type { ArtStyle } from '../store/types'
import { rng } from '../lib'
import { isLocal } from '../edition'

/*
 * Generative stand-ins for artworks. Each artist gets a piece drawn from a
 * visual tradition (papel picado, serape, sun, milpa, the caprock mesas,
 * burnished clay, son jarocho rhythm, mural blocks, relief ink) so the
 * gallery wall feels hung with work, not filled with placeholders.
 */

const PAL = isLocal ? {
  terracotta: '#8b4a3a', marigold: '#b39554', rosa: '#7a4a5a', teal: '#2d5853', indigo: '#1e2e4d', cobalt: '#3b5679',
  agave: '#56685a', cream: '#ece8e0', bone: '#e6e2d9', ink: '#141d2b', sand: '#c9bfae', clay: '#8a6a55', sky: '#9fb3c4',
} : {
  terracotta: '#b9472a', marigold: '#e39b1b', rosa: '#c8366e', teal: '#1d5e5c', indigo: '#2b2d6b', cobalt: '#2f57a6',
  agave: '#5e7f3f', cream: '#f4e8d4', bone: '#efe3cc', ink: '#221c2c', sand: '#d9c19a', clay: '#a5583a', sky: '#9ec3c7',
}

function Papel({ r }: { r: () => number }) {
  const cols = [PAL.rosa, PAL.marigold, PAL.teal, PAL.cobalt, PAL.terracotta, PAL.agave]
  const flags = 4
  return (
    <g>
      <rect width="300" height="400" fill={PAL.bone} />
      {Array.from({ length: flags }).map((_, i) => {
        const c = cols[Math.floor(r() * cols.length)]
        const y = 30 + i * 92
        return (
          <g key={i} transform={`translate(0 ${y})`}>
            <path d={`M10,0 L290,0 L290,74 ${Array.from({ length: 14 }).map((_, k) => `L${290 - (k + 0.5) * 20},${82} L${290 - (k + 1) * 20},74`).join(' ')} Z`} fill={c} />
            {Array.from({ length: 6 }).map((_, k) => {
              const cx = 35 + k * 46
              const s = 7 + r() * 6
              return r() > 0.5
                ? <path key={k} d={`M${cx},${30 - s} L${cx + s},30 L${cx},${30 + s} L${cx - s},30Z`} fill={PAL.bone} />
                : <g key={k}><circle cx={cx} cy={32} r={s * 0.8} fill={PAL.bone} /><path d={`M${cx - s * 1.4},${14} q${s * 1.4},${10} ${s * 2.8},0`} stroke={PAL.bone} strokeWidth="3" fill="none" /></g>
            })}
            <path d={`M10,58 h280`} stroke={PAL.bone} strokeWidth="2" strokeDasharray="4 6" />
          </g>
        )
      })}
    </g>
  )
}

function Serape({ r }: { r: () => number }) {
  const cols = [PAL.terracotta, PAL.marigold, PAL.rosa, PAL.teal, PAL.indigo, PAL.cream, PAL.agave, PAL.ink]
  const bands: React.ReactNode[] = []
  let y = 0
  let i = 0
  while (y < 400) {
    const h = r() > 0.75 ? 26 + r() * 30 : 4 + r() * 12
    const c = cols[Math.floor(r() * cols.length)]
    bands.push(<rect key={i++} x="0" y={y} width="300" height={h + 0.5} fill={c} />)
    if (h > 24) {
      // a woven diamond row inside a wide band
      for (let x = 15; x < 300; x += 30) bands.push(<path key={i++} d={`M${x},${y + 4} l${h / 2 - 4},${h / 2 - 4} l${-(h / 2 - 4)},${h / 2 - 4} l${-(h / 2 - 4)},${-(h / 2 - 4)}Z`} fill={PAL.cream} opacity=".85" />)
    }
    y += h
  }
  return <g>{bands}{Array.from({ length: 60 }).map((_, k) => <line key={k} x1={k * 5} y1="0" x2={k * 5} y2="400" stroke="#000" strokeOpacity=".05" />)}</g>
}

function Sol({ r }: { r: () => number }) {
  const rays = 18 + Math.floor(r() * 10)
  const bg = r() > 0.5 ? PAL.indigo : PAL.terracotta
  return (
    <g>
      <rect width="300" height="400" fill={bg} />
      <g transform="translate(150 180)">
        {Array.from({ length: rays }).map((_, i) => {
          const a = (i / rays) * 360
          const l = 110 + (i % 2) * 30
          return <path key={i} transform={`rotate(${a})`} d={`M-9,0 L0,${-l} L9,0Z`} fill={i % 2 ? PAL.marigold : '#f2c14e'} />
        })}
        <circle r="66" fill="#f2c14e" />
        <circle r="66" fill="none" stroke={bg} strokeWidth="3" strokeDasharray="2 7" />
        <path d="M-26,-10 q8,-8 16,0 M10,-10 q8,-8 16,0 M-18,22 q18,14 36,0" stroke={bg} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </g>
      <path d={`M0,${330 + r() * 20} C80,300 200,${360 + r() * 20} 300,320 L300,400 L0,400Z`} fill={PAL.ink} opacity=".85" />
    </g>
  )
}

function Milpa({ r }: { r: () => number }) {
  return (
    <g>
      <rect width="300" height="400" fill={PAL.cream} />
      <circle cx={70 + r() * 160} cy={70} r={34} fill={PAL.marigold} />
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 30 + i * 40 + r() * 10
        const h = 180 + r() * 120
        return (
          <g key={i}>
            <path d={`M${x},400 C${x - 8},${400 - h / 2} ${x + 8},${400 - h * 0.8} ${x},${400 - h}`} stroke={PAL.agave} strokeWidth="5" fill="none" />
            {Array.from({ length: 4 }).map((_, k) => {
              const yy = 400 - h * (0.25 + k * 0.18)
              const dir = k % 2 ? 1 : -1
              return <path key={k} d={`M${x},${yy} q${dir * 30},${-10} ${dir * 52},${14}`} stroke={k % 2 ? PAL.agave : '#7f9f55'} strokeWidth="6" fill="none" strokeLinecap="round" />
            })}
            {r() > 0.4 && <ellipse cx={x + 9} cy={400 - h * 0.55} rx="7" ry="20" fill={i % 2 ? PAL.marigold : PAL.rosa} transform={`rotate(18 ${x + 9} ${400 - h * 0.55})`} />}
          </g>
        )
      })}
      <rect y="372" width="300" height="28" fill={PAL.clay} />
    </g>
  )
}

function Mesa({ r }: { r: () => number }) {
  const layers = [PAL.sand, '#c99a6a', PAL.clay, '#7a3f2c', PAL.ink]
  return (
    <g>
      <rect width="300" height="400" fill="#c88a62" />
      <rect width="300" height="260" fill="#46557a" />
      <rect y="120" width="300" height="140" fill="#b07a69" opacity=".7" />
      <rect y="190" width="300" height="70" fill="#e2a46b" opacity=".85" />
      <circle cx={80 + r() * 140} cy={210} r="20" fill="#f6d79a" />
      {layers.map((c, i) => {
        const y = 230 + i * 34
        const pts = Array.from({ length: 7 }).map((_, k) => `${k * 50},${y - (r() * 30) * (i === 0 ? 2 : 1)}`).join(' L')
        return <path key={i} d={`M0,${y} L${pts} L300,${y} L300,400 L0,400Z`} fill={c} />
      })}
    </g>
  )
}

function Barro({ r }: { r: () => number }) {
  const pots = 3
  return (
    <g>
      <rect width="300" height="400" fill="#e9dcc6" />
      <rect y="300" width="300" height="100" fill="#d8c5a4" />
      {Array.from({ length: pots }).map((_, i) => {
        const cx = 60 + i * 90 + r() * 10
        const w = 34 + r() * 18
        const h = 90 + r() * 80
        const base = 320
        const top = base - h
        return (
          <g key={i}>
            <path d={`M${cx - w * 0.35},${top} C${cx - w * 0.3},${top + h * 0.2} ${cx - w * 1.3},${top + h * 0.35} ${cx - w * 1.05},${top + h * 0.75} C${cx - w * 0.9},${base} ${cx + w * 0.9},${base} ${cx + w * 1.05},${top + h * 0.75} C${cx + w * 1.3},${top + h * 0.35} ${cx + w * 0.3},${top + h * 0.2} ${cx + w * 0.35},${top}Z`} fill={i === 1 ? PAL.clay : i ? '#8c4a32' : '#b8683f'} />
            <path d={`M${cx - w},${top + h * 0.5} q${w},${12} ${w * 2},0`} stroke={PAL.cream} strokeWidth="2.5" fill="none" opacity=".7" />
            <path d={`M${cx - w * 0.9},${top + h * 0.6} q${w * 0.9},${10} ${w * 1.8},0`} stroke={PAL.ink} strokeWidth="1.5" fill="none" strokeDasharray="3 5" opacity=".5" />
            <ellipse cx={cx - w * 0.4} cy={top + h * 0.45} rx={w * 0.18} ry={h * 0.16} fill="#fff" opacity=".14" />
          </g>
        )
      })}
    </g>
  )
}

function Son({ r }: { r: () => number }) {
  const lines = 26
  return (
    <g>
      <rect width="300" height="400" fill={PAL.ink} />
      {Array.from({ length: lines }).map((_, i) => {
        const y = 40 + i * 13
        const amp = Math.sin((i / lines) * Math.PI) * (18 + r() * 26)
        const f = 2 + r() * 2
        let d = `M20,${y}`
        for (let x = 20; x <= 280; x += 6) d += ` L${x},${y + Math.sin((x / 260) * Math.PI * f + i * 0.4) * amp * Math.sin(((x - 20) / 260) * Math.PI)}`
        return <path key={i} d={d} stroke={i % 5 === 0 ? PAL.marigold : i % 3 === 0 ? PAL.rosa : PAL.cream} strokeOpacity={i % 5 === 0 ? 1 : 0.55} strokeWidth={i % 5 === 0 ? 2.2 : 1.2} fill="none" />
      })}
    </g>
  )
}

function Mural({ r }: { r: () => number }) {
  const cols = [PAL.terracotta, PAL.marigold, PAL.teal, PAL.cobalt, PAL.rosa, PAL.agave, PAL.cream]
  const shapes: React.ReactNode[] = []
  for (let i = 0; i < 22; i++) {
    const x = r() * 300
    const y = r() * 400
    const s = 40 + r() * 120
    const c = cols[Math.floor(r() * cols.length)]
    const t = r()
    shapes.push(t < 0.35
      ? <circle key={i} cx={x} cy={y} r={s / 2} fill={c} />
      : t < 0.7
        ? <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s * 0.7} fill={c} transform={`rotate(${r() * 40 - 20} ${x} ${y})`} />
        : <path key={i} d={`M${x},${y - s / 2} L${x + s / 2},${y + s / 2} L${x - s / 2},${y + s / 2}Z`} fill={c} />)
  }
  return <g><rect width="300" height="400" fill={PAL.indigo} />{shapes}<path d="M0,250 C90,210 160,300 300,240" stroke={PAL.cream} strokeWidth="10" fill="none" /></g>
}

function Tinta({ r }: { r: () => number }) {
  const lines: React.ReactNode[] = []
  for (let i = 0; i < 46; i++) {
    const y = 60 + i * 6.5
    const wob = r() * 6
    lines.push(<path key={i} d={`M40,${y} C110,${y - wob} 190,${y + wob} 260,${y}`} stroke={PAL.ink} strokeWidth={0.9 + r() * 1.3} fill="none" />)
  }
  return (
    <g>
      <rect width="300" height="400" fill="#f3ead8" />
      <g clipPath="url(#tintaClip)">{lines}</g>
      <defs>
        <clipPath id="tintaClip"><path d="M150,70 C210,70 240,130 230,190 C222,250 180,320 150,340 C120,320 78,250 70,190 C60,130 90,70 150,70Z" /></clipPath>
      </defs>
      <path d="M150,70 C210,70 240,130 230,190 C222,250 180,320 150,340 C120,320 78,250 70,190 C60,130 90,70 150,70Z" fill="none" stroke={PAL.ink} strokeWidth="3" />
      <circle cx="150" cy="190" r="34" fill={PAL.terracotta} />
      <path d="M118,190 h64 M150,158 v64" stroke="#f3ead8" strokeWidth="5" />
      <text x="150" y="380" textAnchor="middle" fill={PAL.terracotta} style={{ font: 'italic 13px var(--serif)' }}>{(1 + Math.floor(r() * 30))}/30</text>
    </g>
  )
}

function Milagro({ r }: { r: () => number }) {
  const metal = r() > 0.5 ? ['#c9ccd1', '#8d929a'] : ['#d79a6a', '#9c5a35']
  const bg = r() > 0.5 ? PAL.indigo : '#3a2a2a'
  return (
    <g>
      <rect width="300" height="400" fill={bg} />
      {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={20 + r() * 260} cy={20 + r() * 360} r={1 + r() * 1.6} fill={PAL.cream} opacity=".35" />)}
      <g transform="translate(150 215)">
        {Array.from({ length: 9 }).map((_, i) => <path key={i} transform={`rotate(${-60 + i * 15})`} d="M-5,-92 Q0,-130 5,-92Z" fill={PAL.marigold} opacity=".9" />)}
        <path d="M0,70 C-90,10 -95,-60 -45,-72 C-20,-78 -5,-60 0,-48 C5,-60 20,-78 45,-72 C95,-60 90,10 0,70Z" fill={metal[0]} stroke={metal[1]} strokeWidth="5" />
        <path d="M0,52 C-62,8 -66,-44 -36,-54 C-18,-60 -4,-46 0,-36 C4,-46 18,-60 36,-54 C66,-44 62,8 0,52Z" fill="none" stroke={metal[1]} strokeWidth="2" strokeDasharray="2 5" />
        <path d="M-10,-78 L10,-78 L6,-104 L-6,-104Z" fill={metal[1]} />
        <circle r="10" cy="-6" fill={PAL.rosa} />
        <path d="M-30,10 q30,24 60,0" stroke={metal[1]} strokeWidth="2.5" fill="none" />
      </g>
    </g>
  )
}

/* ---- the Local edition's contemporary pieces, in place of the folk traditions ---- */

/** Color field: two or three soft rectangles floating on a ground. */
function Field({ r }: { r: () => number }) {
  const grounds = [PAL.indigo, PAL.clay, PAL.agave, PAL.ink]
  const fields = [PAL.terracotta, PAL.marigold, PAL.cobalt, PAL.sand, PAL.rosa, PAL.teal]
  const n = r() > 0.5 ? 3 : 2
  const g = grounds[Math.floor(r() * grounds.length)]
  const gap = 18, top = 30, h = (400 - top * 2 - gap * (n - 1)) / n
  return (
    <g>
      <rect width="300" height="400" fill={g} />
      {Array.from({ length: n }).map((_, i) => <rect key={i} x={26} y={top + i * (h + gap)} width={248} height={h} rx={6} fill={fields[Math.floor(r() * fields.length)]} opacity={0.82 + r() * 0.15} />)}
    </g>
  )
}

/** Fine ruled bands on a pale ground. */
function Bands({ r }: { r: () => number }) {
  const ground = r() > 0.5 ? PAL.bone : PAL.cream
  const ink = r() > 0.5 ? PAL.indigo : PAL.clay
  const step = 9 + Math.floor(r() * 6)
  return (
    <g>
      <rect width="300" height="400" fill={ground} />
      {Array.from({ length: Math.floor(340 / step) }).map((_, i) => <line key={i} x1="30" x2="270" y1={30 + i * step} y2={30 + i * step} stroke={ink} strokeOpacity={0.18 + (i % 4 === 0 ? 0.25 : 0)} strokeWidth={i % 4 === 0 ? 1.4 : 0.8} />)}
      <rect x="30" y={60 + r() * 200} width="240" height={step * 3} fill={PAL.marigold} opacity=".35" />
    </g>
  )
}

/** A single orb over a horizon: geometric and quiet. */
function Orb({ r }: { r: () => number }) {
  const bg = r() > 0.5 ? PAL.indigo : PAL.ink
  const y = 140 + r() * 60
  return (
    <g>
      <rect width="300" height="400" fill={bg} />
      <rect y={y + 70} width="300" height={400 - y - 70} fill={PAL.cobalt} opacity=".55" />
      <circle cx={110 + r() * 80} cy={y} r={58 + r() * 16} fill={PAL.marigold} />
      <line x1="0" x2="300" y1={y + 70} y2={y + 70} stroke={PAL.cream} strokeOpacity=".5" />
    </g>
  )
}

/** A modernist grid of planes. */
function Grid({ r }: { r: () => number }) {
  const cols = [PAL.bone, PAL.bone, PAL.cream, PAL.indigo, PAL.terracotta, PAL.marigold, PAL.sand]
  const xs = [0, 70 + r() * 60, 170 + r() * 60, 300]
  const ys = [0, 90 + r() * 70, 220 + r() * 80, 400]
  const cells: React.ReactNode[] = []
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push(<rect key={`${i}${j}`} x={xs[i]} y={ys[j]} width={xs[i + 1] - xs[i]} height={ys[j + 1] - ys[j]} fill={cols[Math.floor(r() * cols.length)]} stroke={PAL.ink} strokeWidth="5" />)
  return <g>{cells}</g>
}

/** An abstract bronze form on a plinth. */
function Form({ r }: { r: () => number }) {
  const bg = r() > 0.5 ? '#2a2f38' : PAL.indigo
  const tilt = -18 + r() * 36
  return (
    <g>
      <rect width="300" height="400" fill={bg} />
      <defs><radialGradient id={`fm${Math.round(tilt)}`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#d9bf86" /><stop offset=".55" stopColor="#9c7b43" /><stop offset="1" stopColor="#3f2f17" /></radialGradient></defs>
      <ellipse cx="150" cy="180" rx="62" ry="96" transform={`rotate(${tilt} 150 180)`} fill={`url(#fm${Math.round(tilt)})`} />
      <ellipse cx="150" cy="180" rx="22" ry="44" transform={`rotate(${tilt} 150 180)`} fill={bg} opacity=".85" />
      <rect x="95" y="290" width="110" height="110" fill={PAL.bone} opacity=".9" />
    </g>
  )
}

const painters: Record<ArtStyle, (p: { r: () => number }) => React.ReactNode> = isLocal
  ? { milagro: Form, papel: Field, serape: Bands, sol: Orb, milpa: Grid, mesa: Mesa, barro: Barro, son: Son, mural: Grid, tinta: Tinta }
  : { milagro: Milagro, papel: Papel, serape: Serape, sol: Sol, milpa: Milpa, mesa: Mesa, barro: Barro, son: Son, mural: Mural, tinta: Tinta }

export const Art = memo(function Art({ style, seed, className, title }: { style: ArtStyle; seed: number; className?: string; title?: string }) {
  const r = rng(seed * 97 + 13)
  const Painter = painters[style]
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={title}>
      <Painter r={r} />
    </svg>
  )
})
