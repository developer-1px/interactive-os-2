import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'

export const listData = createStore({
  entities: {
    ts: { id: 'ts', data: { label: 'TypeScript', desc: 'Typed superset of JavaScript' } },
    react: { id: 'react', data: { label: 'React 19', desc: 'UI component library' } },
    vite: { id: 'vite', data: { label: 'Vite 8', desc: 'Next-gen build tool' } },
    vitest: { id: 'vitest', data: { label: 'Vitest', desc: 'Unit test framework' } },
    pnpm: { id: 'pnpm', data: { label: 'pnpm', desc: 'Fast package manager' } },
    axe: { id: 'axe', data: { label: 'axe-core', desc: 'Accessibility engine' } },
  },
  relationships: {
    [ROOT_ID]: ['ts', 'react', 'vite', 'vitest', 'pnpm', 'axe'],
  },
})
