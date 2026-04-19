// Chart block renderer — bar/line/pie. 외부 라이브러리 없이 SVG 최소 구현.
import type React from 'react'
import type { BlockData } from '../../deck/deckTypes'
import { ax } from '@styles/ax'
import styles from './ChartBlock.module.css'

type ChartData = Extract<BlockData, { type: 'chart' }>

export interface ChartBlockProps {
  data: ChartData
  editable?: boolean
  onEdit?: (patch: Partial<ChartData>) => void
}

function BarChart({ items }: { items: ChartData['data'] }): React.ReactElement {
  if (items.length === 0) {
    return <span className={ax({ textStyle: 'caption' })}>empty</span>
  }
  const max = Math.max(...items.map(d => d.value), 0) || 1
  return (
    <ul
      className={`${ax({ layout: 'stack', width: 'full', textStyle: 'caption' })} ${ax.raw({ gap: 'xs' })}`}
    >
      {items.map((d, i) => (
        <li
          key={i}
          className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ gap: 'sm' })}`}
        >
          <span className={ax({ flex: 'none', clamp: '1' })}>{d.label}</span>
          <span
            className={`${ax({ role: 'control-group', surface: 'sunken', flex: '1' })} ${ax.raw({ shape: 'xs' })} ${styles.barTrack}`}
            aria-hidden
          >
            <span
              className={`${ax({ role: 'badge', surface: 'display', tone: 'accent' })} ${ax.raw({ shape: 'xs' })} ${styles.barFill}`}
              style={{ '--bar-fill': `${(d.value / max) * 100}%` } as React.CSSProperties}
            />
          </span>
          <span className={ax({ flex: 'none' })}>{d.value}</span>
        </li>
      ))}
    </ul>
  )
}

function LinePlaceholder({ items }: { items: ChartData['data'] }): React.ReactElement {
  const max = Math.max(...items.map(d => d.value), 1)
  const min = Math.min(...items.map(d => d.value), 0)
  const range = max - min || 1
  const W = 320
  const H = 120
  const pts = items.map((d, i) => {
    const x = (i / Math.max(items.length - 1, 1)) * W
    const y = H - ((d.value - min) / range) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <figure className={`${ax({ layout: 'stack', width: 'full' })} ${ax.raw({ gap: 'xs' })}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="line chart preview"
        className={ax({ width: 'full' })}
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} />
      </svg>
      <figcaption className={ax({ textStyle: 'caption' })}>
        차트 미리보기 (line)
      </figcaption>
    </figure>
  )
}

function PiePlaceholder({ items }: { items: ChartData['data'] }): React.ReactElement {
  const total = items.reduce((s, d) => s + d.value, 0) || 1
  const R = 50
  const C = 60
  const offsets = items.reduce<number[]>((arr, d) => {
    const prev = arr.length === 0 ? 0 : arr[arr.length - 1]
    arr.push(prev + d.value)
    return arr
  }, [])
  const segs = items.map((_d, i) => {
    const startAcc = i === 0 ? 0 : offsets[i - 1]
    const endAcc = offsets[i]
    const start = (startAcc / total) * Math.PI * 2
    const end = (endAcc / total) * Math.PI * 2
    const large = end - start > Math.PI ? 1 : 0
    const x1 = C + R * Math.cos(start)
    const y1 = C + R * Math.sin(start)
    const x2 = C + R * Math.cos(end)
    const y2 = C + R * Math.sin(end)
    const path = `M${C},${C} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`
    const hue = (i * 57) % 360
    return <path key={i} d={path} fill={`hsl(${hue} 60% 60%)`} />
  })
  return (
    <figure className={`${ax({ layout: 'stack', width: 'full' })} ${ax.raw({ gap: 'xs' })}`}>
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label="pie chart preview"
        className={ax({ width: 'full', aspect: '1' })}
      >
        {segs}
      </svg>
      <figcaption className={ax({ textStyle: 'caption' })}>
        차트 미리보기 (pie)
      </figcaption>
    </figure>
  )
}

export function ChartBlock({ data, editable: _editable, onEdit: _onEdit }: ChartBlockProps): React.ReactElement {
  return (
    <div
      className={`${ax({ layout: 'stack', width: 'full' })} ${ax.raw({ gap: 'sm', padding: 'sm' })}`}
    >
      {data.kind === 'bar' && <BarChart items={data.data} />}
      {data.kind === 'line' && <LinePlaceholder items={data.data} />}
      {data.kind === 'pie' && <PiePlaceholder items={data.data} />}
    </div>
  )
}
