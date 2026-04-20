/**
 * cmux preview domain context — pull 모델.
 * defineLayout는 구조만 담고, widget이 이 Context에서 값을 pull 한다.
 * 이 Context의 value를 바꾸면 동일 defineLayout가 다른 시나리오 상태로 렌더된다
 * → 시뮬레이션 매트릭스(N variant × 1 defineLayout → N 스냅)의 근거.
 */
import { createDomainContext } from '@os/layout'

export interface CmuxPreviewContextValue {
  /** 좌측 사이드바에서 active로 표시될 세션 id */
  activeSessionId: string
  /** Composer placeholder */
  composerPlaceholder: string
  /** Files 탭 빈 상태 메시지 */
  filesEmptyTitle: string
  /** Entities 탭 빈 상태 메시지 */
  entitiesEmptyTitle: string
}

export const [CmuxPreviewProvider, useCmuxPreview] =
  createDomainContext<CmuxPreviewContextValue>('CmuxPreview')
