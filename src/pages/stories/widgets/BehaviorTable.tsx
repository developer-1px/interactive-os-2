import { ArrowRight } from 'lucide-react'
import { ax } from '@styles/ax'
import type { Behavior } from '../storyTypes'
import { StatusDot } from './StatusDot'
import styles from './BehaviorTable.module.css'

interface BehaviorTableProps {
  behaviors: Behavior[]
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className={ax({
        role: 'control-group',
        textStyle: 'label', content: 'text', surface: 'sunken' })}>
      {children}
    </th>
  )
}

function BubbleCell({ children }: { children: React.ReactNode }) {
  return (
    <td className={ax({ })}>
      <span className={ax({
          role: 'control-group',
        surface: 'sunken', textStyle: 'caption', content: 'text' })}>
        {children}
      </span>
    </td>
  )
}

export function BehaviorTable({ behaviors }: BehaviorTableProps) {
  return (
    <table className={`${ax({ width: 'full' })} ${styles.table}`}>
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
            <td className={ax({ })}>
              <span className={ax({
                  role: 'control-group',
                surface: 'sunken', textStyle: 'caption', content: 'text', layout: 'row' })}>
                <ArrowRight className={ax({ flex: 'none' })} />
                {b.then}
              </span>
            </td>
            <td className={ax({ })}>
              <StatusDot status={b.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
