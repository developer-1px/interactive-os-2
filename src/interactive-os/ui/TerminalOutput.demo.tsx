/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TerminalOutput } from './TerminalOutput'

export const meta = {
  slug: 'terminal-output',
  category: 'ui',
  label: 'TerminalOutput',
}

export function Demo() {
  return (
    <TerminalOutput
      command="pnpm typecheck"
      output="src/index.ts - no errors found"
    />
  )
}
