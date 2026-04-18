var e=`import { ArrowRight } from 'lucide-react'
import { ax } from '@styles/ax'
import type { Behavior } from '../storyTypes'
import { StatusDot } from './StatusDot'
import styles from './BehaviorTable.module.css'

interface BehaviorTableProps {
  behaviors: Behavior[]
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className={ax({ textStyle: 'label', weight: 'semi', text: 'secondary', padding: 'sm', content: 'text', surface: 'sunken' })}>
      {children}
    </th>
  )
}

function BubbleCell({ children }: { children: React.ReactNode }) {
  return (
    <td className={ax({ padding: 'xs' })}>
      <span className={ax({ surface: 'sunken', shape: 'md', padding: 'sm', textStyle: 'caption', content: 'text' })}>
        {children}
      </span>
    </td>
  )
}

export function BehaviorTable({ behaviors }: BehaviorTableProps) {
  return (
    <table className={\`\${ax({ width: 'full' })} \${styles.table}\`}>
      <thead>
        <tr>
          <HeaderCell>Given</HeaderCell>
          <HeaderCell>When</HeaderCell>
          <HeaderCell>Then</HeaderCell>
          <HeaderCell>Status</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {behaviors.map((b, i) => (
          <tr key={i}>
            <BubbleCell>{b.given}</BubbleCell>
            <BubbleCell>{b.when}</BubbleCell>
            <td className={ax({ padding: 'xs' })}>
              <span className={ax({ surface: 'sunken', shape: 'md', padding: 'sm', textStyle: 'caption', content: 'text', layout: 'row', gap: 'xs' })}>
                <ArrowRight className={ax({ icon: 'xs', text: 'muted', flex: 'none' })} />
                {b.then}
              </span>
            </td>
            <td className={ax({ padding: 'xs' })}>
              <StatusDot status={b.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
`;export{e as default};