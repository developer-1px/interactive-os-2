/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { BadgeCell } from './BadgeCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'badge-cell',
  category: 'cell' as const,
  label: 'BadgeCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar' })}>
      <BadgeCell tone="accent">Feature</BadgeCell>
      <BadgeCell tone="success">Done</BadgeCell>
      <BadgeCell tone="warning">WIP</BadgeCell>
      <BadgeCell tone="danger">Bug</BadgeCell>
      <BadgeCell tone="neutral">Note</BadgeCell>
    </div>
  )
}
