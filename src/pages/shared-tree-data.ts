import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'

export const treeData = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src', type: 'folder' } },
    components: { id: 'components', data: { name: 'components', type: 'folder' } },
    app: { id: 'app', data: { name: 'App.tsx', type: 'file' } },
    main: { id: 'main', data: { name: 'main.tsx', type: 'file' } },
    button: { id: 'button', data: { name: 'Button.tsx', type: 'file' } },
    input: { id: 'input', data: { name: 'Input.tsx', type: 'file' } },
    lib: { id: 'lib', data: { name: 'lib', type: 'folder' } },
    utils: { id: 'utils', data: { name: 'utils.ts', type: 'file' } },
    readme: { id: 'readme', data: { name: 'README.md', type: 'file' } },
    pkg: { id: 'pkg', data: { name: 'package.json', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['src', 'lib', 'readme', 'pkg'],
    src: ['components', 'app', 'main'],
    components: ['button', 'input'],
    lib: ['utils'],
  },
})

export function getFileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot) : ''
}
