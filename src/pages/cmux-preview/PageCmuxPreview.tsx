/**
 * /cmux/preview?scenario=<id> — 오로지 defineLayout 선언만으로 cmux 화면을 구성.
 *
 * Why (project_flat_layout_engine · project_a2ui_composites):
 *   LLM이 시각 요소를 결정적으로 구성하지 못하는 문제를 FlatLayout으로 풀어왔다.
 *   이 페이지는 "선언(defineLayout) → 픽셀"의 경로가 실제로 닫히는지 증명한다.
 *   pages 본체 = scenario 선택 + Provider + <FlatLayout/> 1회.
 *
 * Pull 모델 (feedback_flatlayout_pull_not_push):
 *   defineLayout에는 widget node의 구조/id만. 값(activeSessionId, placeholder 등)은
 *   CmuxPreviewContext로 공급. 시나리오 variant만 바꾸면 동일 registry로 N 상태
 *   렌더 → 시뮬레이션 매트릭스의 근거.
 *
 * Scenario 스위치:
 *   ?scenario=default | single | split | multi | empty
 *   (URL 쿼리로 받아 SCENARIOS에서 pick. 잘못된 id면 default.)
 */
import { FlatLayout } from '@os/ui/FlatLayout'
import { CmuxPreviewProvider } from './cmuxPreviewContext'
import { cmuxPreviewWidgets } from './cmuxPreviewWidgets'
import { getScenario } from './cmuxPreviewScenarios'

export default function PageCmuxPreview() {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const scenarioId = new URLSearchParams(search).get('scenario')
  const scenario = getScenario(scenarioId)

  return (
    <CmuxPreviewProvider value={scenario.context}>
      <FlatLayout
        data={scenario.page}
        registry={cmuxPreviewWidgets}
        aria-label={`cmux preview — ${scenario.label}`}
      />
    </CmuxPreviewProvider>
  )
}
