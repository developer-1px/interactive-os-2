# Pipeline Snapshot — Todo 모바일앱 (baseline)

**목적**: 단계별 관측 루프의 baseline 샘플. 요구사항→데이터→컴포넌트→배치→조합 5단계 각각의 산출물을 파일로 저장하여, 문제 발생 시 단계 간 diff로 원인 격리.

**샘플**: Todo 모바일 앱
**Viewport**: 375×812 (iPhone 기본)
**Route**: `/todo`
**Created**: 2026-04-18

## 단계별 아티팩트

| Stage | 아티팩트 | 파일 |
|-------|----------|------|
| 1 Requirement | 자연어 스펙 | `1-requirement.md` |
| 2 Data | NormalizedData JSON | `2-data.json` |
| 3 Components | ui/ 부품 리스트 | `3-components.json` |
| 4 Layout | definePage + 스샷 + DOM | `4-layout.{png,dom.html}` + `src/pages/todo/todoDefinePage.ts` |
| 5 Assembly | store + 인터랙션 + 스샷 + DOM | `5-assembly.{png,dom.html}` + `src/pages/todo/todoStore.ts` + `todoWidgets.tsx` |

## 단계 전이 관측

### Stage 1 → 2 (자연어 → JSON)
- 요구사항 5개 → entities 3개(todo) + 3 commands(add/toggle/remove)
- "완료 N / 전체 M"은 derived (entities filter) — data에 추가 필드 없음
- 관측: 자연어가 구조화되면서 "진행 요약"이 persisted 상태가 아닌 derived임이 드러남 → 데이터 모델 결정

### Stage 2 → 3 (데이터 → 부품)
- 9개 ui/ 부품 선정: PanelHeader, ListBox, ListItem, Checkbox, Button×2, CloseIndicator, TextInput, EmptyState
- 2 gap 기록: PanelHeader subtitle slot, ListItem rightContent slot
- 관측: 실제 조립 단계(4)에서 PanelHeader 대신 직접 role:'control-group'로 구현 — 카탈로그 선정이 완벽 대응하지 않음이 드러남

### Stage 3 → 4 (부품 → 배치)
- definePage(split vertical [auto, flex, auto]): header / list / input
- **관측된 문제 2건**:
  - P1: AppShell ActivityBar가 모바일 뷰에 잔존 (router structure 기인)
  - P2: mobileFrame width:md(400px) > viewport 375 — "추가" 버튼 잘림
- 이것이 Stage 4의 baseline. 문제가 있다는 것 자체가 관측 대상.

### Stage 4 → 5 (배치 → 조합)
- Store + plugin + context 연동 (axPrinciples 패턴 차용)
- Commands: todo:add / toggle / remove
- 인터랙션: input Enter/클릭 → add, checkbox 클릭 → toggle, X 버튼 → remove
- **P1 P2 해소**:
  - P1: AppShell에 `isMobileRoute` 조건부로 ActivityBar 숨김 (`src/AppShell.tsx`)
  - P2: TextInput 을 `flex:1` 래퍼로 감싸 row 내부 수축 허용
- 관측: 해소가 소스 파일 2개 수정(AppShell, todoWidgets)으로 가능 — 원인이 **Stage 4의 레이아웃이 아니라 Shell 레벨**이라는 것이 단계 diff로 드러남

## 결론

- baseline 루프 확립 — 5단계 모두 산출물이 파일로 쌓임
- 단계 전이 diff가 **원인 layer 격리에 유효** 성공: Stage 4에서 발견된 문제가 AppShell(shell layer) 원인이고, Stage 3(부품 선정)·Stage 2(데이터) 원인이 아님을 diff로 증명
- 다음 샘플/도메인에서 이 루프 복제 가능 (sample 이름만 바꿔서)
