import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type ButtonHTMLAttributes, type PointerEvent as RPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, animate, useInView, useDragControls, type Variants } from 'framer-motion'
import { usePhone } from '../lib'
import { undo } from '../store/store'
import { Icon } from './Icons'

/* ---------- buttons ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'accent' | 'quiet' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode }

export function Button({ tone = 'primary', size = 'md', icon, children, className = '', ...rest }: BtnProps) {
  return (
    <button className={`btn btn-${tone} btn-${size} ${className}`} {...rest}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  )
}

/**
 * An honest two-step confirmation for actions that write the record
 * (closing a vote, approving minutes, ending a meeting). The first press
 * states the consequence in place; the second press commits.
 */
export function ConfirmButton({ children, confirm, onConfirm, tone = 'primary', size = 'md', icon, disabled }: { children: ReactNode; confirm: ReactNode; onConfirm: () => void; tone?: BtnProps['tone']; size?: BtnProps['size']; icon?: ReactNode; disabled?: boolean }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 6000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <span className="confirm">
      <AnimatePresence mode="popLayout" initial={false}>
        {armed ? (
          <motion.span key="armed" className="confirm-armed" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
            <span className="confirm-text">{confirm}</span>
            <Button tone="ghost" size={size} onClick={() => setArmed(false)}>Not yet</Button>
            <Button tone={tone} size={size} icon={<Icon.check />} onClick={() => { setArmed(false); onConfirm() }}>Yes, record it</Button>
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
            <Button tone={tone} size={size} icon={icon} disabled={disabled} onClick={() => setArmed(true)}>{children}</Button>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/* ---------- toasts: every action shows its result ---------- */

type Toast = { id: number; text: ReactNode; undoable?: boolean; tone?: 'ok' | 'info' }
let toasts: Toast[] = []
const tl = new Set<() => void>()
let tid = 0
export function toast(text: ReactNode, opts: { undoable?: boolean; tone?: Toast['tone'] } = {}) {
  const t = { id: ++tid, text, ...opts }
  toasts = [...toasts.slice(-2), t]
  tl.forEach((l) => l())
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== t.id); tl.forEach((l) => l()) }, opts.undoable ? 6500 : 4200)
}

export function Toasts() {
  const list = useSyncExternalStore((f) => { tl.add(f); return () => tl.delete(f) }, () => toasts)
  const d = usePhone() ? -1 : 1
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <motion.div key={t.id} layout className="toast" initial={{ opacity: 0, y: 24 * d, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 * d, scale: 0.98, transition: { duration: 0.2 } }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
            <span className="toast-mark"><Icon.check size={16} /></span>
            <span className="toast-text">{t.text}</span>
            {t.undoable && (
              <button className="toast-undo" onClick={() => { if (undo()) { toasts = toasts.filter((x) => x.id !== t.id); tl.forEach((l) => l()); toast('Undone') } }}>
                <Icon.undo size={15} /> Undo
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ---------- numbers that count up when they arrive ---------- */

export function Count({ value, format = (n) => Math.round(n).toLocaleString('en-US'), duration = 1.1, className }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || !ref.current) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = prev.current
    prev.current = value
    if (reduce) { ref.current.textContent = format(value); return }
    const c = animate(from, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v) } })
    return () => c.stop()
  }, [value, inView]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={`num ${className ?? ''}`}>{format(0)}</span>
}

/* ---------- hand-drawn accents ---------- */

export function Brush({ color = 'var(--room)', width = 180, className }: { color?: string; width?: number; className?: string }) {
  return (
    <svg className={`brush ${className ?? ''}`} width={width} height="14" viewBox="0 0 180 14" preserveAspectRatio="none" aria-hidden>
      <motion.path
        d="M3 9.5C28 6 54 4.6 82 5.4c26 .7 52 2.7 76 1.6 6-.3 12-1 19-2"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
      <path d="M12 11.5c30-2.4 70-3 120-1.4" stroke={color} strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** A soft radial wash of the room colour that sits behind each room. */
export function Wash({ color, x = '85%', y = '0%' }: { color: string; x?: string; y?: string }) {
  return <div className="wash" style={{ background: `radial-gradient(900px 520px at ${x} ${y}, color-mix(in srgb, ${color} 15%, transparent), transparent 70%)` }} aria-hidden />
}

/** Calm room entrance: the title, one sentence of context, and the room's primary actions. */
export function RoomHead({ title, lede, children, color }: { title: ReactNode; lede?: ReactNode; children?: ReactNode; color?: string }) {
  return (
    <header className="room-head">
      <div className="room-head-text">
        <motion.h1 className="display room-title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          {title}
        </motion.h1>
        <Brush color={color} />
        {lede && <motion.p className="room-lede" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>{lede}</motion.p>}
      </div>
      {children && <motion.div className="room-actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>{children}</motion.div>}
    </header>
  )
}

/** Reveal children one after another as a room enters. */
export const EASE = [0.22, 1, 0.36, 1] as const
export const stagger: { parent: Variants; child: Variants } = {
  parent: { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } },
  child: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } },
}

export function Segmented<T extends string>({ value, options, onChange, layoutId }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; layoutId: string }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={`seg-opt ${value === o.value ? 'on' : ''}`} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={layoutId} className="seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Overlays live on the window, outside the moving room, so they cover the whole screen. */
const host = () => document.querySelector('.window') ?? document.body

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])
}

/** Pull-down-to-close: drag from the grip, or from the top of the content when it is scrolled to the top. */
function useSwipeDown(onClose: () => void) {
  const controls = useDragControls()
  const start = (e: RPointerEvent, body?: HTMLElement | null) => {
    if (e.pointerType === 'mouse') return
    if (body && body.scrollTop > 0) return
    const y0 = e.clientY
    const target = e.currentTarget as HTMLElement
    // Only take over once the finger clearly moves down, so taps and horizontal swipes still work.
    const move = (ev: PointerEvent) => {
      if (ev.clientY - y0 > 8 && (!body || body.scrollTop <= 0)) { cleanup(); controls.start(ev) }
      else if (y0 - ev.clientY > 8) cleanup()
    }
    const cleanup = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', cleanup); target.removeEventListener('pointercancel', cleanup) }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', cleanup)
    target.addEventListener('pointercancel', cleanup)
  }
  const drag = {
    drag: 'y' as const, dragListener: false, dragControls: controls,
    dragConstraints: { top: 0, bottom: 0 }, dragElastic: { top: 0, bottom: 0.85 }, dragMomentum: false,
    onDragEnd: (_: unknown, i: { offset: { y: number }; velocity: { y: number } }) => { if (i.offset.y > 110 || i.velocity.y > 520) onClose() },
  }
  return { start, drag, controls }
}

/** A sheet that slides over the stage for focused entry (new event, record donation…). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  useEscape(open, onClose)
  const phone = usePhone()
  const { start, drag } = useSwipeDown(onClose)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
            initial={phone ? { y: '100%' } : { y: 40, opacity: 0, scale: 0.98 }} animate={phone ? { y: 0 } : { y: 0, opacity: 1, scale: 1 }} exit={phone ? { y: '100%' } : { y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: phone ? 380 : 320, damping: phone ? 40 : 32 }} onClick={(e) => e.stopPropagation()}
            {...(phone ? drag : {})}>
            {phone && <div className="grip" onPointerDown={(e) => start(e)}><i /></div>}
            <div className="sheet-head" onPointerDown={phone ? (e) => start(e) : undefined}>
              <h2 className="display sheet-title">{title}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.close /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    host(),
  )
}

/**
 * The detail half of a room. On a wide screen it sits beside the room as it always has.
 * On a phone it rises as a sheet over the room, and a swipe down or the back button closes it.
 */
export function Drawer({ open, onClose, label, className = '', children }: { open: boolean; onClose: () => void; label: string; className?: string; children: ReactNode }) {
  const phone = usePhone()
  if (!phone) return <>{children}</>
  return <PhoneDrawer open={open} onClose={onClose} label={label} className={className}>{children}</PhoneDrawer>
}

function PhoneDrawer({ open, onClose, label, className, children }: { open: boolean; onClose: () => void; label: string; className: string; children: ReactNode }) {
  useEscape(open, onClose)
  const { start, drag } = useSwipeDown(onClose)
  const body = useRef<HTMLDivElement>(null)
  // Keep showing what was open while the sheet slides away.
  const last = useRef<ReactNode>(children)
  if (open) last.current = children
  return createPortal(
    <AnimatePresence>
      {open && <motion.div key="veil" className="drawer-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />}
      {open && (
        <motion.div key="drawer" className={`drawer ${className}`} role="dialog" aria-modal="true" aria-label={label}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 40 }} {...drag}>
          <div className="drawer-head" onPointerDown={(e) => start(e)}>
            <i className="grip-bar" />
            <button className="drawer-close" onClick={onClose} aria-label={`Close ${label}`}><Icon.down size={20} /></button>
            <span className="drawer-label">{label}</span>
          </div>
          {/* At the top of its content the sheet only scrolls one way, so a pull down is free to close it. */}
          <div className="drawer-body at-top" ref={body} onPointerDown={(e) => start(e, body.current)}
            onScroll={(e) => e.currentTarget.classList.toggle('at-top', e.currentTarget.scrollTop <= 0)}>{last.current}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    host(),
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
