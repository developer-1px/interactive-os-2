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

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `overlay/types.ts` | `OverlayType("modal"\|"popup"\|"hint")`, `OverlayOptions`, `OverlayHandle(open/close/toggle/isOpen)` 타입 정의 | |
| `overlay/layerStack.ts` | 전역 오버레이 스택. 등록/해제, 최상위 판별, Escape 라우팅 | |
| `overlay/useOverlay.ts` | 핵심 훅. type별 렌더 전략 분기(dialog.showModal / popover=auto / popover=hint), 포커스 복원, backdrop click 처리 | |
| `overlay/useAnchorPosition.ts` | CSS Anchor Positioning 유틸 훅. anchor-name 설정 + position-area/fallback 생성. Safari JS fallback 포함 | |
| `axis/dismiss.ts` (확장) | 기존 Escape 전용 → `clickOutside`, `focusOut` 옵션 추가. layerStack 연동으로 최상위만 수신 | |
| `axis/triggerPopup.ts` (신규) | trigger↔popup 축. 트리거 이벤트(click/hover/focus/manual) → overlay open. ARIA 속성 자동 생성(aria-haspopup, aria-expanded, aria-controls) | |
| `overlay/overlay.css` | 오버레이 공통 CSS. `::backdrop` 스타일, anchor positioning 기본값, enter/exit transition, Safari `@supports` fallback | |

### 관계

```
triggerPopup(axis) ──opens──▶ useOverlay(hook)
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
               modal         popup         hint
            <dialog>      popover=auto  popover=hint
                    │            │
                    ▼            ▼
              layerStack ◀── dismiss(axis, 확장)
                                 │
                                 ▼
                        useAnchorPosition
```

- `triggerPopup`은 Aria 축 → 기존 composePattern에 합성 가능
- `useOverlay`는 Aria 엔진 밖 — DOM 렌더링 전담, command/store 무관
- `layerStack`은 모듈 스코프 싱글턴 — useOverlay가 mount/unmount 시 자동 등록/해제
- `dismiss` 확장은 기존 Escape keyMap 유지 + 새 옵션은 useOverlay가 DOM 이벤트로 처리 (축은 키보드만, DOM dismiss는 훅이 담당)

완성도: 🟢

## ③ 인터페이스

### 트리거 → 오버레이 열기 (triggerPopup axis)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter/Space | trigger 포커스, overlay 닫힘 | overlay 열림, popup 첫 항목 포커스 | APG: button이 popup을 제어할 때 Enter/Space로 토글 (S5) | overlay 열림, trigger에 aria-expanded=true | |
| ArrowDown | trigger 포커스, overlay 닫힘, openOn=click | overlay 열림, popup 첫 항목 포커스 | APG combobox/menu-button: ArrowDown이 드롭다운을 열고 첫 항목으로 이동 | overlay 열림 | |
| ArrowUp | trigger 포커스, overlay 닫힘, openOn=click | overlay 열림, popup 마지막 항목 포커스 | APG menu-button: ArrowUp은 마지막 항목으로 — 역방향 탐색 의도 | overlay 열림 | |
| Click | trigger 위, overlay 닫힘, openOn=click | overlay 열림 | 직접 조작: 클릭은 가장 기본적인 트리거 행위 | overlay 열림, trigger에 aria-expanded=true | |
| Hover in | trigger 위, overlay 닫힘, openOn=hover | 300ms 딜레이 후 overlay 열림 | 즉시 열면 의도치 않은 표시 빈발 — 딜레이가 의도적 hover를 필터링 (hint/tooltip) | overlay 열림 | |
| Focus in | trigger 위, overlay 닫힘, openOn=focus | overlay 열림 | 키보드 사용자에게 hover 등가 경험 제공 (tooltip) | overlay 열림 | |

### 오버레이 닫기 (dismiss 확장 + useOverlay)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Escape | overlay 열림 (스택 최상위) | 최상위 overlay만 닫힘, 포커스 복원 | layerStack이 최상위만 Escape 수신 — 중첩 시 한 겹씩 벗겨짐 (S1, S4) | 스택에서 제거, 포커스 → 트리거 or 이전 overlay | |
| Escape | overlay 열림 (스택 최상위 아님) | 무시 | 하위 overlay가 Escape를 소비하면 안 됨 — 최상위 우선 원칙 | 변화 없음 | |
| Click outside | popup 열림 | popup 닫힘, 클릭 대상 활성화 | popover="auto"의 light dismiss — 브라우저 네이티브 동작 (S2) | popup 스택에서 제거 | |
| Click outside | modal(Dialog, dismissOnBackdrop=true) 열림 | Dialog 닫힘, 포커스 복원 | FileViewerModal 패턴 계승 — 정보성 modal은 backdrop click으로 닫을 수 있어야 (S3a) | modal 닫힘 | |
| Click outside | modal(AlertDialog, dismissOnBackdrop=false) 열림 | 무시 | 확인 행위 강제 — 실수로 닫히면 안 되는 중요 결정 (S3b) | 변화 없음 | |
| Tab | popup 열림 | popup 닫힘, 포커스 → 트리거 다음 tabbable | popup은 focus trap 아님 — Tab은 자연스러운 탈출 수단 (S6) | popup 스택에서 제거 | |
| Tab | modal 열림 | 포커스 trap 내 순환 | modal은 뒤 콘텐츠 inert — Tab이 탈출하면 접근성 위반 | modal 내 포커스 순환 | |
| Hover out | hint 열림, openOn=hover | 딜레이 후 hint 닫힘 | 커서가 벗어나면 hint 불필요 — 브라우저 hint 동작 위임 (S7) | hint 닫힘 | |
| Blur | hint 열림, openOn=focus | hint 닫힘 | 포커스 이탈 = hover out 등가 — 키보드 사용자 일관성 | hint 닫힘 | |

### 포커스 복원 (useOverlay)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| overlay 닫힘 | trigger 존재 | 포커스 → trigger | APG: overlay 닫힐 때 포커스는 호출 원점으로 — 사용자 위치 감각 유지 (S10) | trigger 포커스 | |
| overlay 닫힘 | trigger가 DOM에서 제거됨 | 포커스 → body 또는 가장 가까운 focusable | trigger 소멸 시 포커스 유실 방지 — focusRecovery 플러그인 패턴과 동일 | fallback 포커스 | |

### ARIA 속성 자동 생성 (triggerPopup axis)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| overlay mount | trigger + content 연결 | trigger에 aria-haspopup, aria-controls 설정 | 스크린리더가 "이 버튼은 popup을 가짐"을 알려야 — APG 필수 속성 | trigger에 ARIA 속성 부여 | |
| overlay open | trigger 연결됨 | aria-expanded=true | 스크린리더에게 popup 열림 상태 전달 | trigger aria-expanded=true | |
| overlay close | trigger 연결됨 | aria-expanded=false | 닫힘 상태 전달 | trigger aria-expanded=false | |

### 키보드/마우스 체크리스트

- [x] ↑ 키: ArrowUp → popup 열기 (마지막 항목 포커스)
- [x] ↓ 키: ArrowDown → popup 열기 (첫 항목 포커스)
- [x] ← 키: N/A (overlay 자체에는 해당 없음, 내부 콘텐츠는 기존 축이 담당)
- [x] → 키: N/A (동상)
- [x] Enter: trigger → popup 열기
- [x] Escape: 최상위 overlay 닫기
- [x] Space: trigger → popup 열기
- [x] Tab: popup 닫기 + 포커스 이동 / modal 내 순환
- [x] Home/End: N/A (overlay 레이어에서는 해당 없음)
- [x] Cmd/Ctrl 조합: N/A
- [x] 클릭: trigger click → 열기, click-outside → popup 닫기, backdrop click → modal 옵션
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: 중첩 overlay 내부 클릭이 외부 overlay의 click-outside로 전파되면 안 됨 — layerStack이 자식 overlay 클릭을 필터링

완성도: 🟡

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

**전체 완성도:** 🟡 3/8 (①② 🟢, ③ 초안)
