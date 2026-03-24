import React from 'react'
import styles from './Slider.module.css'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { slider } from '../pattern/slider'
import { core, valueCommands } from '../plugins/core'
import { history } from '../plugins/history'
import { getAriaActions } from '../primitives/ariaRegistry'

let sliderIdCounter = 0

interface SliderProps {
  id?: string
  data: NormalizedData
  min: number
  max: number
  step: number
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
}

export function Slider({
  id: idProp,
  data,
  min,
  max,
  step,
  plugins = [core(), history()],
  onChange,
}: SliderProps) {
  const id = React.useRef(idProp ?? `slider-${++sliderIdCounter}`).current
  const trackRef = React.useRef<HTMLDivElement>(null)
  const behavior = React.useMemo(() => slider({ min, max, step }), [min, max, step])

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
    const label = (item.data as Record<string, unknown>)?.label as string ?? item.id as string

    return (
      <div className={styles.sliderItem} data-focused={state.focused || undefined}>
        {label && <span className={styles.sliderLabel}>{label}</span>}
        <div className={styles.sliderTrack} ref={trackRef} onClick={handleTrackClick}>
          <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
          <div className={styles.sliderThumb} style={{ left: `${pct}%` }} />
        </div>
        <span className={styles.sliderValue}>{current}</span>
      </div>
    )
  }

  return (
    <Aria id={id} behavior={behavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
