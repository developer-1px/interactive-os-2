# Overlay Core Layer — PRD

> Discussion: 오버레이 컴포넌트(Dialog, Menu, Tooltip 등)가 각자도생으로 구현되어 z-index 충돌, dismiss 미통일, 중첩 미대응 — 브라우저 네이티브 top-layer 기반 통합 코어 레이어 제안

## ① 동기

### WHY

- **Impact**: 오버레이를 조합하는 개발자가 z-index 하드코딩(100, 200, 9999), click-outside 수동 구현, 중첩 순서 충돌을 매번 겪는다. 새 오버레이(ContextMenu, DatePicker)를 추가할 때마다 dismiss/positioning/stacking을 처음부터 만들어야 한다.
- **Forces**: (1) 브라우저 top-layer API(dialog, popover)가 z-index 문제를 원천 해결하지만, 오버레이 종류마다 렌더링 전략이 다르다(modal vs popup vs hint). (2) 기존 Aria 엔진은 키보드 축 기반이라 DOM 렌더링/위치잡기를 다루지 않는다 — 축과 오버레이 라이프사이클의 경계가 명확해야 한다. (3) CSS Anchor Positioning은 Chromium만 완전 지원 — Safari fallback 필요.
- **Decision**: 브라우저 네이티브 top-layer를 최대 활용하여 z-index 자체를 제거한다. 오버레이 유형을 3종(modal/popup/hint)으로 분류하고, 각각 `<dialog>.showModal()` / `popover="auto"` / `popover="hint"`에 매핑. 기각 대안: (a) React Portal + z-index 토큰 계층 — 브라우저가 이미 해결한 문제를 JS로 재구현, (b) 단일 popover 전략 — modal의 inert/focus-trap을 수동 구현해야 함.
- **Non-Goals**: (1) Toast는 overlay stack에 불참 — aria-live 영역으로 별도 채널. (2) CSS Anchor Positioning의 완전 polyfill은 범위 밖 — Safari는 최소한의 JS fallback만. (3) 기존 Aria 엔진의 command/store 구조 변경 없음 — 오버레이는 Aria 밖의 DOM 레이어.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | AlertDialog가 열려 있다 | 사용자가 AlertDialog 안의 버튼으로 확인 Menu를 연다 | Menu가 AlertDialog 위에 표시되고, Escape는 Menu만 닫는다 | |
| S2 | Menu(popup)가 열려 있다 | 사용자가 Menu 밖 영역을 클릭한다 | Menu가 닫히고, 클릭 대상이 다른 인터랙티브 요소면 그 요소가 활성화된다 | |
| S3a | Dialog(modal, dismissOnBackdrop=true)가 열려 있다 | 사용자가 backdrop을 클릭한다 | Dialog가 닫히고, 포커스가 트리거로 복원된다 | |
| S3b | AlertDialog(modal, dismissOnBackdrop=false)가 열려 있다 | 사용자가 backdrop을 클릭한다 | AlertDialog는 닫히지 않는다 (확인 행위 강제) | |
| S4 | Combobox의 dropdown(popup)이 열려 있다 | 사용자가 Escape를 누른다 | dropdown만 닫히고, input에 포커스가 유지된다 | |
| S5 | 트리거 버튼이 포커스되어 있다 | 사용자가 Enter/Space를 누른다 | 연결된 popup이 열리고, popup 첫 항목에 포커스가 이동한다 | |
| S6 | Menu(popup)가 열려 있다 | 사용자가 Tab을 누른다 | Menu가 닫히고 포커스가 트리거 다음 tabbable 요소로 이동한다 | |
| S7 | Tooltip(hint)가 표시 중이다 | 사용자가 Escape를 누른다 | Tooltip이 사라진다 (브라우저 hint light dismiss) | |
| S8 | 아무 오버레이도 없다 | 개발자가 `type="modal"` 오버레이를 연다 | `<dialog>.showModal()`이 호출되고, 뒤의 콘텐츠에 inert가 적용된다 | |
| S9 | popup이 뷰포트 하단에 가까운 트리거에 연결되어 있다 | popup이 열린다 | CSS Anchor Positioning의 flip-block으로 위쪽에 표시된다 | |
| S10 | Dialog(modal)가 열려 있다 | Dialog가 닫힌다 | 포커스가 원래 트리거 요소로 복원된다 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| — | — | |

완성도: 🔴  ← ① 🟢 후 착수

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| — | — | — | — | — | |

완성도: 🔴  ← ② 🟢 후 착수

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| — | — | — | — | — | |

완성도: 🔴  ← ③ 🟢 후 착수

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| — | — | — | — | — | |

완성도: 🔴  ← ①~④ 🟢 후 착수

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| — | — | — | — | — | |

완성도: 🔴  ← ⑤ 🟢 후 착수

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| — | — | — | — | |

완성도: 🔴  ← ⑤⑥ 🟢 후 착수

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| — | — | — | — | |

완성도: 🔴  ← ①~⑦ 🟢 후 착수

---

**전체 완성도:** 🟡 1/8 (① 초안)
