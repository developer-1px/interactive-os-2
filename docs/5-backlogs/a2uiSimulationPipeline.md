---
id: a2uiSimulationPipeline
type: backlog
slug: a2uiSimulationPipeline
title: 'A2UI simulation pipeline — POC에서 정식 파이프라인으로'
tags: [untagged]
created: 2026-04-19
updated: 2026-04-18
legacy:
  legacy_status: backlog
---
# A2UI simulation pipeline — POC에서 정식 파이프라인으로

## 배경

2026-04-19 POC 에서 "선언만으로 N 화면 스냅 매트릭스" 가 실제 동작함을 증명 (`/cmux/preview?scenario=X` + quickShot 반복). LLM의 시각 구성 미결정성을 FlatLayout + 매트릭스 스냅으로 구조적으로 drain 하는 방향이 유효.

POC 결과:
- 5 시나리오 스냅에서 gap 5개 발견 (사용자 육안 1 + 매트릭스 독립 포착 4)
- G-new-tab 수정 후 매트릭스 재촬영으로 회귀 검증 성공
- "선언 → 스냅 → 평가 → 수정 → 재스냅" 루프가 한 세션 안에서 1사이클 돎

POC 의 임시 구조를 정식 파이프라인으로 승격 필요.

## 내용

### P1. `pnpm preview:matrix <page-module>` CLI

입력: page 모듈의 scenario 배열 (`SCENARIOS` export)
출력: `screenshots/preview/<page>/<scenario>.png` + `matrix.json`

구현: Playwright 기반 (happy-dom 아님 — S3 split 의 DOM rect 측정이 실제 layout 필요)

### P2. Scenario schema 표준화

현재 POC 의 `CmuxScenario { id, label, page, context }` 를 일반화:

```ts
export interface PreviewScenario<Ctx> {
  id: string
  label: string
  page: NormalizedData        // definePage 결과
  context: Ctx                // domain Context value
  acceptance?: AcceptanceSpec // §5 시각 acceptance 조항 (LLM vision 판정용)
}
```

### P3. `/simulate` 스킬

```
/simulate <prd-path>
  ├─ PRD §5 파싱 → scenario 배열 추출
  ├─ LLM: 각 scenario → definePage 초안
  ├─ pnpm preview:matrix 실행 → N PNG
  ├─ LLM vision: 각 PNG vs §5 acceptance 조항 대조
  ├─ 실패 → 선언 수정 → 재루프 (최대 3회)
  └─ 성공 매트릭스 리포트 출력
```

### P4. PRD 템플릿에 `§5.acceptance` 열 추가

각 화면 시나리오 항목에 "스샷에서 무엇이 보여야 pass 인가" 체크리스트. `feedback_slot_existence_vs_intent` 원칙이 PRD 진입시점부터 적용됨.

### P5. 의미 노드 (H1) 승격

POC 의 `widget: 'Transcript'` 같은 구현 이름을 `{ type: 'slot', kind: 'chat-feed', data: {...} }` 같은 의미 선언으로 전환. composite 레지스트리 추가. cmux 케이스부터 seed.

## 검증

- `/cmux/preview` 의 5 scenario 가 새 파이프라인에서도 동일 스냅을 생성
- 새 PRD 하나를 골라 `/simulate` 로 돌렸을 때 acceptance 충족 여부가 기계 판정됨
- `feedback_flatlayout_pull_not_push` · `feedback_slot_existence_vs_intent` 양쪽 규약 준수

## 출처

- 2026-04-19 /discuss 세션에서 사용자 비전:
  > "A2UI를 생각할 정도로 definePage가 있으면 자동으로 화면에 컴포넌트를 뿌릴수가 있는데 prd에 요구되는 모든 화면 프로토타입 시뮬레이션을 바로 바로 찍어 낼 수 있을거라 생각하거든?"
- POC 구현: `src/pages/cmux-preview/` (4 파일, 2026-04-19 생성)
- 선행 메모리: `project_flat_layout_engine`, `project_a2ui_composites`, `project_target_vibe_coding_engine`
