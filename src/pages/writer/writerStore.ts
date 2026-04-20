// ② 2026-04-04-writer-chat-prd.md
import { createModuleStore } from '@os/store/createModuleStore'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { mdToStore, storeToMd } from './writerTransform'
import { expandCommands } from '@os/axis/expand'

interface WriterState {
  data: NormalizedData
  mdText: string
  mdStale: boolean
  filePath: string | undefined
  dirty: boolean
}

const emptyStore = createStore()

const store = createModuleStore<WriterState>({
  initial: { data: emptyStore, mdText: '', mdStale: false, filePath: undefined, dirty: false },
})

export const writerState = {
  getData: () => store.get().data,
  setData: (next: NormalizedData) => {
    const s = store.get()
    if (next === s.data) return
    store.set({ ...s, data: next, mdStale: true, dirty: true })
  },
  getMd: () => {
    const s = store.get()
    if (s.mdStale) {
      const mdText = storeToMd(s.data)
      store.set({ ...s, mdText, mdStale: false })
      return mdText
    }
    return s.mdText
  },
  setMd: (md: string) => {
    const s = store.get()
    store.set({
      ...s,
      mdText: md,
      mdStale: false,
      data: expandCommands.expandAll.reduce(mdToStore(md, s.filePath)),
      dirty: true,
    })
  },
  getFilePath: () => store.get().filePath,
  setFilePath: (p: string | undefined) => { store.set({ ...store.get(), filePath: p }) },
  isDirty: () => store.get().dirty,
  markClean: () => { store.set({ ...store.get(), dirty: false }) },
  subscribe: store.subscribe,
  reset: () => { store.set({ data: emptyStore, mdText: '', mdStale: false, filePath: undefined, dirty: false }) },
}

export function useWriterData(): [NormalizedData, (d: NormalizedData) => void] {
  const s = store.use()
  return [s.data, writerState.setData]
}

export function useWriterDirty(): boolean {
  return store.use().dirty
}
