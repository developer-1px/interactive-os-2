/** @catalog 범위 값 슬라이더 */
import React from 'react'
import { ax } from '@styles/ax'
import './Slider.css'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { slider } from '../pattern/roles/slider'
import { valueCommands } from '../axis/value'
import { history } from '../plugins/history'
import { getAriaActions } from '../primitives/ariaRegistry'

interface SliderProps extends AriaComponentProps {
  id?: string
  min: number
  max: number
  step: number
}

export function Slider({
  id: idProp,
  data,
  min,
  max,
  step,
  plugins = [history()],
  onChange,
}: SliderProps) {
  const reactId = React.useId()
  const id = idProp ?? reactId
  const trackRef = React.useRef<HTMLDivElement>(null)
  const pattern = React.useMemo(() => slider({ min, max, step }), [min, max, step])

  const handleTrackClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const raw = min + pct * (max - min)
    const snapped = Math.round(raw / step) * step
    getAriaActions(id)?.dispatch(valueCommands.setValue(snapped, { min, max, step }))
  }, [id, min, max, step])

  const renderItem = (_props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
    const current = state.valueCurrent ?? min
    const pct = max > min ? ((current - min) / (max - min)) * 100 : 0
    const label = getNodeLabel(item)

    return (
      <div className={`${ax({ recipe: 'item', layout: 'spread', text: state.focused ? 'bright' : undefined })}`} data-focused={state.focused || undefined}>
        {label && <span className={`slider-label ${ax({ textStyle: 'body', weight: 'medium', text: 'primary' })}`}>{label}</span>}
        <div className={`slider-track ${ax({ flex: '1' })}`} ref={trackRef} onClick={handleTrackClick}>
          <div className="slider-fill" style={{ width: `${pct}%`, height: '100%' }} />
          <div className={`slider-thumb outline-none ${ax({ shape: 'pill' })}`} style={{ left: `${pct}%` }} />
        </div>
        <span className={`slider-value tabular-nums ${ax({ textStyle: 'body', weight: 'medium', text: 'secondary' })}`}>{current}</span>
      </div>
    )
  }

  return (
    <Aria id={id} pattern={pattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
