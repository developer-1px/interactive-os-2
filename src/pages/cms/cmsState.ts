import { createModuleStore } from '@os/store/createModuleStore'
import { cmsStore } from './cmsStore'
import type { NormalizedData } from '@os/store/types'

const store = createModuleStore<NormalizedData>({ initial: cmsStore })

export function useCmsData(): [NormalizedData, (d: NormalizedData) => void] {
  return [store.use(), store.set]
}

export function resetCmsData() { store.set(cmsStore) }
