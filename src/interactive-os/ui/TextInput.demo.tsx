/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TextInput } from './TextInput'

export const meta = {
  slug: 'text-input',
  category: 'ui',
  label: 'TextInput',
}

export function Demo() {
  return <TextInput placeholder="Type something..." aria-label="Demo input" />
}
