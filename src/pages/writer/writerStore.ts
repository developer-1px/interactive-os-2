// ② 2026-04-04-md-writer-prd.md
import { useSyncExternalStore } from 'react'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'

const emptyStore = createStore()

let _data: NormalizedData = emptyStore
let _filePath: string | undefined
let _dirty = false
const _listeners = new Set<() => void>()

function notify() { _listeners.forEach(fn => fn()) }

export const writerState = {
  getData: () => _data,
  setData: (next: NormalizedData) => { if (next === _data) return; _data = next; _dirty = true; notify() },
  getFilePath: () => _filePath,
  setFilePath: (p: string | undefined) => { _filePath = p },
  isDirty: () => _dirty,
  markClean: () => { _dirty = false; notify() },
  subscribe: (fn: () => void) => { _listeners.add(fn); return () => { _listeners.delete(fn) } },
  reset: () => { _data = emptyStore; _filePath = undefined; _dirty = false; notify() },
}

export function useWriterData(): [NormalizedData, (d: NormalizedData) => void] {
  const data = useSyncExternalStore(writerState.subscribe, writerState.getData)
  return [data, writerState.setData]
}

export function useWriterDirty(): boolean {
  return useSyncExternalStore(writerState.subscribe, writerState.isDirty)
}
