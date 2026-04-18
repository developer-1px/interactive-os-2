// Slide thumbnail row for the slide list (Slides app).
// 왼쪽 숫자 + 오른쪽 미리보기 카드 + 하단 인디케이터 라인.
// 정보 전달(번호/구성/상태)이 목적 — 픽셀 완벽 아님.
import type React from 'react'
import type { BlockType } from '../../../entities/deck/deckTypes'
import type { AxInteractive } from '@styles/ax'
import { ax } from '@styles/ax'
import { CheckIndicator, StatusIndicator } from '../indicators'
import styles from './SlideThumbItem.module.css'

export interface SlideThumbItemProps {
  index: number
  slideId: string
  titleText?: string
  blockTypes: BlockType[]
  ratio: '16:9' | '4:3'
  hidden?: boolean
  selected?: boolean
  hasComment?: boolean
  interactive?: AxInteractive
  // Rest — ARIA props from getItemProps(id)
  [key: string]: unknown
}

export function SlideThumbItem({
  index,
  slideId,
  titleText,
  blockTypes,
  ratio,
  hidden = false,
  selected = false,
  hasComment = false,
  interactive = 'item',
  ...rest
}: SlideThumbItemProps): React.ReactElement {
  return (
    <div
      {...rest}
      data-slide-id={slideId}
      data-selected={selected || undefined}
      data-hidden={hidden || undefined}
      className={`${ax({
        role: 'item',
        interactive,
        surface: selected ? 'display' : undefined,
        layout: 'bar',
        width: 'full',
      })} ${ax.raw({ gap: 'sm', padding: 'xs' })}`}
    >
      {/* 큰 번호 */}
      <span
        className={`${ax({ flex: 'none', textStyle: 'label' })} ${styles.slideThumbNumber}`}
      >
        {index}
      </span>

      {/* 프리뷰 카드 — 비율 고정 */}
      <span
        data-ratio={ratio}
        className={`${styles.slideThumbPreview} ${ax({
          flex: '1',
          layout: 'stack',
          width: 'full',
        })} ${ax.raw({ padding: 'xs', gap: 'xs', border: 'subtle', shape: 'sm' })}`}
      >
        {/* 제목 있으면 제목을 첫 mini block 으로 */}
        {titleText !== undefined && (
          <span className={styles.miniBlock} data-kind="title" />
        )}
        {blockTypes
          .filter(t => t !== 'title')
          .slice(0, 4)
          .map((t, i) => (
            <span
              key={`${t}-${i}`}
              className={styles.miniBlock}
              data-kind={t}
            />
          ))}
      </span>

      {/* 하단 상태 바 — hidden / comment */}
      <span
        className={`${ax({ flex: 'none', layout: 'bar' })} ${ax.raw({ gap: 'xs' })}`}
      >
        {hidden && <CheckIndicator />}
        {hasComment && <StatusIndicator tone="info" variant="ring" />}
      </span>
    </div>
  )
}
