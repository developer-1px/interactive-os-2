/** @catalog 컨텍스트 키바인딩 힌트 바 — 하단 풋터 배치 */
import type { ReactElement } from 'react'
import { ax } from '@styles/ax'
import { Kbd } from './Kbd'

export interface KeyHint {
  keys: string[]
  label: string
}

export interface KeyHintBarProps {
  hints: readonly KeyHint[]
  'aria-label'?: string
}

export function KeyHintBar({ hints, 'aria-label': ariaLabel }: KeyHintBarProps): ReactElement {
  return (
    <div
      role="group"
      aria-label={ariaLabel ?? 'Keyboard shortcuts'}
      className={ax({ role: 'control-group', surface: 'sunken', layout: 'bar', width: 'full' })}
    >
      {hints.map((hint) => (
        <span key={hint.label} className={ax({ layout: 'row', textStyle: 'caption', tone: 'neutral-dim' })}>
          {hint.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
          <span>{hint.label}</span>
        </span>
      ))}
    </div>
  )
}
