import { useSyncExternalStore } from 'react'
import { createSeed } from './seed'
import type { State, Activity, RoomKey } from './types'

const KEY = 'acla-board-os'
const VERSION = 4

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (parsed.version === VERSION) return parsed
    }
  } catch {
    /* storage unavailable: run from the seed */
  }
  return createSeed()
}

let state: State = load()
const listeners = new Set<() => void>()
let history: State[] = []

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
}

export function getState() { return state }

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Subscribe to the whole state (stable reference per change) and select in render. */
export function useStore<T>(select: (s: State) => T): T {
  const s = useSyncExternalStore(subscribe, getState, getState)
  return select(s)
}

let n = 0
export const uid = (p = 'x') => `${p}-${Date.now().toString(36)}${(n++).toString(36)}`

/**
 * Apply a change. When `log` is given, the change is also written to the
 * activity stream, which is what "what changed" on Home reads.
 */
export function update(recipe: (draft: State) => void, log?: { text: string; room: RoomKey; link?: string; who?: string }) {
  history = [state, ...history].slice(0, 30)
  const draft = structuredClone(state)
  recipe(draft)
  if (log) {
    const entry: Activity = { id: uid('act'), at: new Date().toISOString(), who: log.who ?? 'd-hector', text: log.text, room: log.room, link: log.link }
    draft.activity = [entry, ...draft.activity].slice(0, 80)
  }
  state = draft
  persist()
  listeners.forEach((l) => l())
}

export function undo() {
  const prev = history.shift()
  if (!prev) return false
  state = prev
  persist()
  listeners.forEach((l) => l())
  return true
}

export function resetDemo() {
  history = []
  state = createSeed()
  persist()
  listeners.forEach((l) => l())
}

export const ME = 'd-hector'
