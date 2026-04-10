/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { CodeBlock } from './CodeBlock'

export const meta = {
  slug: 'code-block',
  category: 'ui',
  label: 'CodeBlock',
}

const code = `import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

const data = createStore({
  entities: { a: { id: 'a', data: { label: 'Hello' } } },
  relationships: { [ROOT_ID]: ['a'] },
})`

export function Demo() {
  return <CodeBlock code={code} filename="example.ts" />
}
