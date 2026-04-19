import { BadgeCell } from './BadgeCell'

interface ToggleCellProps {
  value: boolean
}

/** Boolean display cell. Editing handled by jsonEditor:toggleBoolean dispatched via keyMap. */
export function ToggleCell({ value }: ToggleCellProps) {
  return <BadgeCell tone={value ? 'success' : 'neutral-dim'}>{value ? 'true' : 'false'}</BadgeCell>
}
