import { ax } from '@styles/ax'

interface EnumCellProps {
  value: string
}

/** Enumerated-value display cell (JSON type labels, schema enums).
 * Editing = cycle through options via keyMap dispatcher (jsonEditor:setType/setValue).
 * chrome 없이 plain caption + dim tone — 편집 시에만 cycle indicator 필요 시 추가.
 */
export function EnumCell({ value }: EnumCellProps) {
  return <span className={`${ax({ textStyle: 'caption' })} tn-neutral-dim`}>{value}</span>
}
