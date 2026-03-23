# tab 축 신설 — PRD

> Discussion: CMS에서 Tab = DFS 순회로 모든 포커스 가능 노드를 flat하게 순회. tab 전략 4종(native, flow, loop, escape) 정의. composePattern에서 tab()의 focusStrategy가 navigate()를 override.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS 캔버스에서 콘텐츠를 편집 중 | Tab 키를 누름 | DFS 순서로 다음 포커스 가능 노드에 포커스 이동 | |
| M2 | CMS 캔버스에서 콘텐츠를 편집 중 | Shift+Tab 키를 누름 | DFS 역순으로 이전 포커스 가능 노드에 포커스 이동 | |
| M3 | CMS 캔버스에서 마지막 노드에 포커스 | Tab 키를 누름 | zone 탈출 (브라우저 기본 — 사이드바 등으로 이동) | |
| M4 | behavior에 tab 전략이 명시되지 않은 기존 위젯 (listbox, tree 등) | Tab 키를 누름 | 기존 동작 유지 (escape: zone 탈출) | |
| M5 | 새 behavior를 composePattern으로 조합할 때 | `tab('flow')` 축을 추가 | focusStrategy가 `natural-tab-order`로 설정됨 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/axes/tab.ts` | tab 축. `tab(strategy)` 함수 export. 4개 전략별 focusStrategy + keyMap 반환 | |
| `src/interactive-os/axes/composePattern.ts` 수정 | AxisConfig에 `tabFocusStrategy` 필드 추가. 머지 시 `tabFocusStrategy ?? focusStrategy ?? DEFAULT` 순서로 결정. | |
| `src/interactive-os/behaviors/spatial.ts` 수정 | CMS용이 아닌 spatial 자체는 변경 없음 (escape가 기본) | |
| `src/pages/cms/CmsCanvas.tsx` 수정 | CMS behavior에 `tab('flow')` 축 추가 | |
| `src/interactive-os/__tests__/tab-axis.test.ts` | tab 축 unit 테스트 (4전략별 focusStrategy + keyMap 검증) | |
| `src/interactive-os/__tests__/cms-tab-flow.integration.test.tsx` | CMS 캔버스 Tab DFS 순회 통합 테스트 | |
| 쇼케이스 페이지: `/internals/axis/tab` | routeConfig에 추가, AxisSpec MD 문서 | |

완성도: 🟢

## ③ 인터페이스

### tab() 축 API

```ts
type TabStrategy = 'native' | 'flow' | 'loop' | 'escape'
function tab(strategy: TabStrategy): { keyMap: KeyMap; config: Partial<AxisConfig> }
```

### 4개 전략별 동작

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `tab('native')` | — | keyMap 빈 객체, config 빈 객체 반환 | engine이 Tab에 아무 개입도 하지 않음. focusStrategy도 설정 안 함. 순수 브라우저 기본. | focusStrategy: 미설정 (composePattern 기본값 또는 다른 축의 값 사용) | |
| `tab('flow')` | — | keyMap 빈 객체, `tabFocusStrategy`에 `natural-tab-order` 설정 | 모든 노드 tabIndex=0 → 브라우저가 DOM 순서(=DFS)로 Tab 이동. engine은 tabIndex만 관리. `tabFocusStrategy`이므로 navigate()의 focusStrategy보다 항상 우선. | config.tabFocusStrategy: `{ type: 'natural-tab-order', orientation: 'both' }` | |
| `tab('loop')` | — | Tab/Shift+Tab keyMap + `tabFocusStrategy`에 `natural-tab-order` 설정 | 브라우저 기본 Tab은 끝에서 zone 탈출하므로, 마지막→첫째 순환은 engine이 가로채야 함. | config.tabFocusStrategy: `{ type: 'natural-tab-order', orientation: 'both' }`, Tab keyMap: wrap | |
| `tab('escape')` | — | keyMap 빈 객체, `tabFocusStrategy`에 `roving-tabindex` 설정 | 포커스된 노드만 tabIndex=0, 나머지 -1 → Tab이 zone을 탈출. 현재 기본 동작의 명시적 선언. | config.tabFocusStrategy: `{ type: 'roving-tabindex', orientation }` | |

### CMS 캔버스에서의 Tab 동작

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Tab | section-1에 포커스 | section-1 → heading (자식) | natural-tab-order이므로 모든 노드 tabIndex=0, 브라우저가 DOM 순서로 이동 | heading에 포커스 | |
| Tab | heading에 포커스 | heading → paragraph (다음 형제) | DOM 순서 = DFS | paragraph에 포커스 | |
| Tab | tab-item-A (활성) 내부 마지막 노드 | → tab-item-B (다음 형제) | 비활성 tab-panel은 DOM 미렌더 → 자동 스킵 | tab-item-B에 포커스 | |
| Shift+Tab | tab-item-B에 포커스 | → tab-item-A 내부 마지막 노드 | 역방향 DFS | tab-item-A 내부 마지막에 포커스 | |
| Tab | 캔버스 마지막 노드 | zone 탈출 (사이드바 등) | flow 전략은 끝에서 탈출 (loop가 아님) | 캔버스 밖에 포커스 | |
| Arrow↓ | section-1에 포커스 | 같은 깊이 다음 형제로 이동 | spatial의 Arrow keyMap은 tab()과 독립적으로 동작 | 다음 형제에 포커스 | |
| Enter | section-1에 포커스 | 깊이 진입 (첫 자식으로) | spatial의 expand 축이 담당 | 첫 자식에 포커스 | |
| Escape | heading에 포커스 | 부모로 복귀 | spatial의 expand 축이 담당 | section-1에 포커스 | |

### 인터페이스 체크리스트 (AI 자가 검증용)

- [x] ↑ 키: spatial 형제 이동 (기존 유지)
- [x] ↓ 키: spatial 형제 이동 (기존 유지)
- [x] ← 키: spatial 형제 이동 또는 tab-item 이동 (기존 유지)
- [x] → 키: spatial 형제 이동 또는 tab-item 이동 (기존 유지)
- [x] Enter: 깊이 진입 / 편집 시작 (기존 유지)
- [x] Escape: 깊이 탈출 / 편집 취소 (기존 유지)
- [x] Space: N/A (CMS에서 미사용)
- [x] Tab: flow 전략 — DFS 다음 노드
- [x] Home/End: spatial 첫/마지막 형제 (기존 유지)
- [x] Cmd/Ctrl 조합: Mod+Arrow=DND, Mod+D=복제, Mod+Z=undo (기존 유지)
- [x] 클릭: 노드 포커스 + activate (기존 유지)
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: tab()은 keyMap을 추가하지 않으므로 (flow의 경우) 버블링 이슈 없음

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 비활성 tab-panel의 자식 | tab-item-A 활성, B 비활성 | 비활성 panel은 DOM에 렌더되지 않음 (CmsCanvas 조건부 렌더) | Tab이 B의 내부를 자동 스킵 | tab-item-B에 직접 포커스 | |
| tab()과 navigate() 동시 사용 | behavior에 `tab('flow')` + `navigate({ orientation: 'both' })` | tab()이 focusStrategy 소유자, navigate()는 Arrow keyMap만 담당 | focusStrategy = natural-tab-order, Arrow keyMap = spatial 이동 | 공존 | |
| tab() 없이 navigate()만 사용 | 기존 listbox, tree 등 | tab()이 없으면 navigate()의 focusStrategy가 폴백 | roving-tabindex 유지, 기존 동작 변경 없음 | 하위 호환 | |
| tab('loop') 마지막 노드에서 Tab | 마지막 노드에 포커스 | loop 전략은 zone 내 순환 → engine이 Tab을 가로채서 첫 노드로 | 첫 번째 노드에 포커스 | 순환 | |
| tab('loop') 첫 노드에서 Shift+Tab | 첫 노드에 포커스 | loop 역방향 순환 | 마지막 노드에 포커스 | 순환 | |
| tab('escape') orientation 전달 | `tab('escape')` | escape는 roving-tabindex를 설정하는데 orientation이 필요. navigate()의 orientation과 일치해야 함 | tab('escape')의 orientation은 navigate()에서 가져오거나 기본값 사용 | — | |
| composePattern에서 axes 순서 | `tab('flow')` 뒤에 `navigate()` | tab()은 `tabFocusStrategy`에, navigate()는 `focusStrategy`에 쓰므로 서로 다른 필드. composePattern이 `tabFocusStrategy`를 먼저 확인. | 순서 무관하게 tab()이 항상 우선 | 순서 독립 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | ARIA 표준 용어 우선 (feedback_naming_convention) | tab 축 이름 | ✅ 준수 — "tab" 은 HTML/ARIA 표준 키 이름 | — | |
| P2 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | tab.ts → export function tab | ✅ 준수 | — | |
| P3 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | tab('loop')의 Tab keyMap | ✅ 준수 — 축이 keyMap 소유 | — | |
| P4 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | composePattern 머지 규칙 | ✅ 준수 — "later overwrites" 규칙 변경 없음. `tabFocusStrategy` 전용 필드로 분리하여 순서 무관 우선순위 확보 | — | |
| P5 | 계산은 unit, 인터랙션은 통합 (feedback_test_strategy) | 테스트 | ✅ 준수 — tab() 반환값 unit, CMS Tab 이동 통합 | — | |
| P6 | 테스트 셀렉터: role > data-* (feedback_test_selector_convention) | 통합 테스트 | ✅ 준수 | — | |

### P4 해결: tabFocusStrategy 전용 필드

**문제**: 현재 "later overwrites earlier" 규칙에서 axes 순서에 따라 focusStrategy가 결정됨.

**해결**: tab()은 `tabFocusStrategy` 필드에, navigate()는 `focusStrategy` 필드에 쓴다. 서로 다른 필드이므로 순서와 무관. composePattern이 최종 focusStrategy를 결정할 때 `tabFocusStrategy ?? focusStrategy ?? DEFAULT` 순서로 확인.

- 기존 "later overwrites" 규칙 변경 없음
- tab()이 있으면 항상 우선, 없으면 navigate()의 값 폴백
- AxisConfig에 `tabFocusStrategy?: FocusStrategy` 필드 1개 추가

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | composePattern.ts — AxisConfig 타입 | `tabFocusStrategy` 필드 1개 추가. 기존 `focusStrategy` 필드와 머지 규칙은 변경 없음. | 낮 | 타입 추가만, 기존 동작 무변경 | |
| S2 | CmsCanvas — spatial behavior | CMS behavior 조합에 `tab('flow')` 축 추가. `tabFocusStrategy`가 spatial의 `focusStrategy`(roving-tabindex)를 override. | 낮 | spatial.ts 자체 수정 없음. CmsCanvas에서 축 추가만. | |
| S3 | useAriaView.ts:232 — tabIndex 할당 | natural-tab-order이면 모든 노드에 tabIndex=0. CMS 노드가 많으면 Tab stop이 대량 발생. | 낮 | CMS 노드는 보통 수십 개 수준. 대규모 트리는 CMS 아닌 viewer에서 처리 (escape 전략). | |
| S4 | 기존 behavior (listbox, tree 등) | tab() 축을 사용하지 않으므로 영향 없음 | 없음 | 확인 테스트만 | |
| S5 | grid tabCycle (navigate.ts:29-52) | tab('loop')와 grid tabCycle이 동시에 쓰이면 Tab keyMap 충돌 | 중 | 금지 사항으로 등록 (⑦) | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | composePattern의 기존 "later overwrites" 규칙 변경 | P4 원칙 대조 | 기존 20+ behavior의 동작이 바뀔 수 있음. tabFocusStrategy 전용 필드로 해결했으므로 규칙 변경 불필요. | |
| F2 | tab('loop')와 navigate({ grid: { tabCycle: true } }) 동시 사용 | S5 부작용 | Tab keyMap이 양쪽에서 정의되어 충돌 | |
| F3 | spatial.ts behavior 객체 직접 수정 | S2 부작용 | CMS 전용 behavior는 CmsCanvas에서 조합. spatial은 범용. | |
| F4 | tab('escape')에 orientation 하드코딩 | ④ 경계 | navigate()의 orientation과 불일치 가능. escape는 orientation을 인자로 받거나 기본값 사용. | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | CMS 캔버스에서 Tab 키 → 다음 노드 이동 | DFS 순서로 이동 (section → heading → paragraph → ...) | |
| V2 | M2 | Shift+Tab → 이전 노드 이동 | DFS 역순 이동 | |
| V3 | M3 | 마지막 노드에서 Tab | zone 탈출 (캔버스 밖으로) | |
| V4 | M4 | 기존 listbox에서 Tab | zone 탈출 (기존 동작 유지, regression 없음) | |
| V5 | ④ 비활성 tab-panel | Tab이 비활성 tab-panel 자식을 스킵 | tab-item-B로 직접 이동, B 내부 미방문 | |
| V6 | ④ tab()+navigate() 공존 | Tab=DFS 이동, Arrow=형제 이동 | 두 키가 독립적으로 동작 | |
| V7 | ④ tab() 없이 navigate()만 | 기존 behavior 테스트 전부 pass | regression 0 | |
| V8 | M5 | `tab('flow')` 반환값 검증 | `{ keyMap: {}, config: { tabFocusStrategy: { type: 'natural-tab-order', orientation: 'both' } } }` | |
| V9 | M5 | `tab('loop')` 반환값 검증 | keyMap에 Tab/Shift+Tab 존재, config.tabFocusStrategy = natural-tab-order | |
| V10 | M5 | `tab('escape')` 반환값 검증 | `{ keyMap: {}, config: { tabFocusStrategy: { type: 'roving-tabindex', ... } } }` | |
| V11 | M5 | `tab('native')` 반환값 검증 | `{ keyMap: {}, config: {} }` | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증:**
1. 동기 ↔ 검증: ✅ M1~M5 전부 V1~V11로 커버
2. 인터페이스 ↔ 산출물: ✅ tab.ts·composePattern·CmsCanvas 일치
3. 경계 ↔ 검증: ✅ 비활성 panel·공존·폴백·순서 독립 커버
4. 금지 ↔ 출처: ✅ F1~F4 출처 유효
5. 원칙 대조 ↔ 전체: ✅ P1~P6 준수, P4 tabFocusStrategy로 해결
