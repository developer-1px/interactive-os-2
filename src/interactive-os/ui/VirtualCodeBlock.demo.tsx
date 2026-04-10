/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { VirtualCodeBlock } from './VirtualCodeBlock'

export const meta = {
  slug: 'virtual-code-block',
  category: 'ui',
  label: 'VirtualCodeBlock',
}

const sampleCode = `import { createStore } from './createStore'
import type { NormalizedData } from './types'

export function makeData(): NormalizedData {
  return createStore({
    entities: {
      root: { id: 'root', data: { label: 'Root' } },
    },
    relationships: {},
  })
}`

export function Demo() {
  return <VirtualCodeBlock code={sampleCode} filename="example.ts" />
}
