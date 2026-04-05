import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './Slider.module.css'
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
      <div className={`${ax({ layout: 'bar', gap: 'md', text: state.focused ? 'bright' : undefined, padding: 'xs', content: 'text' })}`} data-focused={state.focused || undefined}>
        {label && <span className={`${ax({ textStyle: 'body', weight: 'medium', text: 'primary' })} ${styles.sliderLabel}`}>{label}</span>}
        <div className={`${ax({ flex: '1' })} ${styles.sliderTrack}`} ref={trackRef} onClick={handleTrackClick}>
          <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
          <div className={`outline-none ${ax({ shape: 'pill' })} ${styles.sliderThumb}`} style={{ left: `${pct}%` }} />
        </div>
        <span className={`tabular-nums ${ax({ textStyle: 'body', weight: 'medium', text: 'secondary' })} ${styles.sliderValue}`}>{current}</span>
      </div>
    )
  }

  return (
    <Aria id={id} pattern={pattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
