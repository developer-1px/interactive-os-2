import { navigate } from '../interactive-os/axis/navigate'
import { select } from '../interactive-os/axis/select'
import { activate } from '../interactive-os/axis/activate'
import { expand } from '../interactive-os/axis/expand'
import { dismiss } from '../interactive-os/axis/dismiss'
import { tab } from '../interactive-os/axis/tab'
import type { KeyMap, AxisConfig } from '../interactive-os/pattern/composePattern'

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
  dismiss: () => dismiss(),
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
