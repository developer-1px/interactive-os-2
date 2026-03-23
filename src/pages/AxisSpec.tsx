import { navigate } from '../interactive-os/axes/navigate'
import { select } from '../interactive-os/axes/select'
import { activate } from '../interactive-os/axes/activate'
import { expand } from '../interactive-os/axes/expand'
import { trap } from '../interactive-os/axes/trap'
import { tab } from '../interactive-os/axes/tab'
import type { KeyMap, AxisConfig } from '../interactive-os/axes/composePattern'

const axisRegistry: Record<string, () => { keyMap: KeyMap; config: Partial<AxisConfig> }> = {
  navigate: () => navigate(),
  'navigate-horizontal': () => navigate({ orientation: 'horizontal' }),
  'navigate-both': () => navigate({ orientation: 'both' }),
  'navigate-grid': () => navigate({ grid: { columns: 3 } }),
  select: () => select(),
  'select-extended': () => select({ mode: 'multiple', extended: true }),
  activate: () => activate(),
  expand: () => expand(),
  'expand-enter-esc': () => expand({ mode: 'enter-esc' }),
  trap: () => trap(),
  'tab-native': () => tab('native'),
  'tab-flow': () => tab('flow'),
  'tab-loop': () => tab('loop'),
  'tab-escape': () => tab('escape'),
}

export default function AxisSpec({ axis }: { axis?: string }) {
  if (!axis || !axisRegistry[axis]) {
    return <div style={{ color: 'var(--color-destructive)' }}>Unknown axis: {axis}</div>
  }

  const { keyMap } = axisRegistry[axis]()
  const keys = Object.keys(keyMap)

  if (keys.length === 0) {
    return <p>No key bindings.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>키</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((key) => (
          <tr key={key}>
            <td><kbd>{key}</kbd></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
