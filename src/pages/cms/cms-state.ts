import { useSyncExternalStore } from 'react'
import { cmsStore } from './cms-store'
import type { NormalizedData } from '../../interactive-os/core/types'

let _data: NormalizedData = cmsStore
const _listeners = new Set<() => void>()

function notify() { _listeners.forEach(fn => fn()) }

export const cmsState = {
  getData: () => _data,
  setData: (next: NormalizedData) => { _data = next; notify() },
  subscribe: (fn: () => void) => { _listeners.add(fn); return () => { _listeners.delete(fn) } },
}

export function useCmsData(): [NormalizedData, (d: NormalizedData) => void] {
  const data = useSyncExternalStore(cmsState.subscribe, cmsState.getData)
  return [data, cmsState.setData]
}
