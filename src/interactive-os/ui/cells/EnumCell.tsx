import { BadgeCell } from './BadgeCell'

interface EnumCellProps {
  value: string
}

/** Enumerated-value display cell (JSON type labels, schema enums).
 * Editing = cycle through options via keyMap dispatcher (jsonEditor:setType/setValue).
 */
export function EnumCell({ value }: EnumCellProps) {
  return <BadgeCell tone="neutral-dim">{value}</BadgeCell>
}
