# Nested Aria Bubbling — PRD

> Discussion: 중첩 Aria 컨테이너가 DOM 이벤트 버블링으로 자연스럽게 합성되도록 가드 로직 변경 + behavior optional + PageViewer 적용

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | PageViewer에서 트리(os)와 QuickOpen(날코딩)이 공존 | QuickOpen: `addEventListener('keydown')`, `role="combobox"` 하드코딩 | Cmd+P로 QuickOpen 열기 | window.addEventListener 대신 엔진 keyMap으로 선언적 처리 | body Aria의 keyMap에 `Meta+p` 등록 | ✅ keyMap-only `<Aria>` wrapper로 Cmd+P 처리, addEventListener 제거 |
| 2 | 같은 키가 레이어별로 다른 동작 필요 | 중첩 Aria (body → treegrid) | 미처리 키 버블링 | 자식이 처리 안 한 키만 부모가 기회를 얻음 (defaultPrevented 기반) | 부모 keyMap 매칭 시 처리 | ✅ defaultPrevented 가드로 정확히 구현 |
| 3 | 현재 `target !== currentTarget` 가드가 버블링 차단 | 자식 Aria에서 처리 안 된 키 이벤트 | 이벤트가 부모 Aria로 버블링 | 부모의 가드가 차단하여 keyMap 매칭 기회 없음 | 변화 없음 (버그) | ✅ defaultPrevented 가드를 기존 가드 앞에 추가하여 해결 |

> ⚠️ PRD 범위 밖 구현:
> - Combobox Backspace 차단 버그 수정 (dispatchKeyAction boolean 반환)
> - Combobox blur-to-close 구현
> - CMS Zod schema 단일 소스 (cms-schema.ts)

상태: 🟢

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| Cmd+P (트리에 포커스) | QuickOpen 닫힘 | treegrid keyMap에 Meta+p 없음 | treegrid 미처리 → 버블링 → body keyMap 매칭 → QuickOpen 열림 | QuickOpen 열림 | ✅ 테스트 #1로 검증됨 |
| Escape (combobox 드롭다운 열림) | combobox isOpen: true | combobox keyMap에 Escape 있음 | combobox가 처리, preventDefault | isOpen: false, dialog 유지 | 🔀 dialog 레이어 없음 — combobox close가 곧 QuickOpen 닫기 (PRD 동기 2번 행과 일치하나 이 행은 구버전 서술) |
| Escape (combobox 열림) | combobox isOpen: true | combobox Escape → close() | combobox close → onClose 콜백 → QuickOpen 전체 사라짐 | QuickOpen 언마운트 | ✅ onChange에서 isOpen false 감지 → onClose 호출 |
| ArrowDown (combobox 내부) | combobox 포커스 item-2 | combobox keyMap에 ArrowDown 있음 | combobox가 처리, preventDefault → body에 도달 안 함 | 포커스 item-3 | ✅ combobox behavior가 처리, 테스트 #2로 차단 검증 |
| ArrowDown (트리에 포커스) | treegrid 포커스 node-A | treegrid keyMap에 ArrowDown 있음 | treegrid가 처리, preventDefault | 포커스 node-B | ✅ 기존 동작 유지 (defaultPrevented 추가는 영향 없음) |
| `<Aria keyMap={...}>` (behavior 없음) | — | behavior undefined | containerProps에서 role/tabIndex/activedescendant 생략, onKeyDown만 등록 | keyMap 매칭만 동작, DOM에 role 없음 | ✅ EMPTY_BEHAVIOR fallback + isKeyMapOnly 분기 |

상태: 🟢

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useAria.ts` 가드 변경 | 아이템 onKeyDown, 컨테이너 onKeyDown에 `if (event.defaultPrevented) return` 추가 (기존 가드 앞) | ✅ L266, L305에 추가 |
| `useAriaZone.ts` 가드 변경 | 동일 패턴 적용 (L346, L370). L337은 onFocus 가드이므로 변경하지 않음 | ✅ L344, L369에 추가, onFocus 미변경 |
| `useAria.ts` behavior optional | `UseAriaOptions.behavior`를 optional로. behavior 없으면 containerProps에서 role/tabIndex/activedescendant 생략, keyMap onKeyDown만 등록 | ✅ EMPTY_BEHAVIOR sentinel + isKeyMapOnly 분기 |
| `aria.tsx` behavior optional | `AriaProps.behavior`를 optional로. behavior 없으면 `<div>` 래퍼에 role/orientation/style 생략, `data-aria-container`는 유지 | ✅ `behavior?.role \|\| undefined` 패턴 |
| PageViewer QuickOpen → os 전환 | QuickOpen 컴포넌트가 `<Aria behavior={combobox}>` 사용. role/onKeyDown/tabIndex 하드코딩 제거 | ✅ useAria hook 직접 사용 (Combobox.tsx 패턴 동일) |
| PageViewer body Aria 래핑 | 최상위를 `<Aria keyMap={{ 'Meta+p': openQuickOpen }}>` 로 래핑. addEventListener 제거 | ✅ EMPTY_STORE/EMPTY_PLUGINS 모듈 상수 사용 |

> ⚠️ PRD 범위 밖 산출물:
> - `keymapHelpers.ts`: dispatchKeyAction boolean 반환 (조건부 preventDefault)
> - `combobox.tsx`: navigateFiltered, handleBlur, mouseDown preventDefault
> - `cms-schema.ts` (신규): Zod 스키마 단일 소스
> - `clipboard.ts`: idCounter reset, doc comments

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 단일 Aria (비중첩) | 기존 treegrid, listbox 등 | 동작 변화 없음 — defaultPrevented는 false이므로 기존 가드로 진행 | 동일 | ✅ 430 테스트 전부 통과 |
| 아이템 내부 버튼에서 키 이벤트 | 아이템 안에 `<button>` | `defaultPrevented` false + `target !== currentTarget` true → 기존처럼 스킵 | 동일 | ✅ 기존 가드 유지 |
| 중첩 Aria에서 양쪽 다 같은 키 매칭 | 자식/부모 모두 ArrowDown 매칭 | 자식이 먼저 처리 → preventDefault → 부모 스킵 | 자식만 반응 | ✅ 테스트 #2로 검증 |
| behavior 없는 Aria에 data를 넘기면? | `<Aria keyMap={...} data={store}>` | behavior 없으면 data/store 관련 로직 스킵(?) — getNodeProps 등 불필요 | keyMap 매칭만 동작 | ✅ isKeyMapOnly → getNodeProps returns {} |
| QuickOpen 닫힌 상태에서 Escape | combobox 미렌더링 | body keyMap에 Escape 없으면 아무 일 없음 | 변화 없음 | ✅ combobox 미렌더링 시 이벤트 소스 없음 |
| onFocus 가드 (L247) | 아이템 내부 input에서 focus | `target !== currentTarget` → 스킵 (정상) — 이건 keyDown이 아니므로 defaultPrevented 무관 | 동일 | ✅ onFocus 가드 미변경 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | 기존 `target !== currentTarget` 가드 제거 | 아이템 내부 DOM 요소(button, input)의 이벤트 중복 처리 방지 역할 유지 필요 | ✅ 기존 가드 유지, defaultPrevented는 앞에 추가 |
| 2 | onFocus 가드를 defaultPrevented로 변경 | focus 이벤트는 defaultPrevented 패턴이 아님. target 가드가 올바름 | ✅ onFocus 미변경 |
| 3 | behavior 없는 Aria에 role 부여 | keyMap-only 컨테이너는 접근성 트리에 의미 없음, role 추가하면 스크린리더 혼란 | ✅ role 미부여 (테스트 #3) |
| 4 | body Aria에 tabIndex 부여 | 포커스를 받으면 안 되는 패시브 컨테이너 | ✅ tabIndex 미부여 (테스트 #3) |
| 5 | QuickOpen 전환 시 Fuse.js 제거 | 검색 기능은 유지, os는 키보드/ARIA만 담당 | ✅ Fuse.js 유지 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | 기존 treegrid 단독 테스트 전부 통과 | 가드 추가가 기존 동작에 영향 없음 | ✅ 430 테스트 통과 |
| 2 | 기존 listbox, combobox 등 모든 behavior 테스트 통과 | 동일 | ✅ 동일 |
| 3 | 중첩 Aria: 자식이 처리한 키가 부모로 전파되지 않음 | 자식 preventDefault → 부모 스킵 | ✅ nested-aria-bubbling.test #2 |
| 4 | 중첩 Aria: 자식이 미처리한 키가 부모에서 매칭됨 | 버블링 → 부모 keyMap 매칭 → 동작 | ✅ nested-aria-bubbling.test #1 |
| 5 | behavior 없는 Aria: keyMap만으로 이벤트 처리 | role/tabIndex 없이 onKeyDown만 동작 | ✅ nested-aria-bubbling.test #3 |
| 6 | PageViewer: Cmd+P → QuickOpen 열림 | body keyMap 매칭, addEventListener 없음 | ✅ addEventListener 제거 확인 |
| 7 | PageViewer: QuickOpen 내 ArrowDown → 결과 탐색 | combobox behavior 동작 | ✅ useAria + combobox behavior |
| 8 | PageViewer: QuickOpen 내 Escape → QuickOpen 닫힘 | combobox close → onClose → 언마운트 | ✅ onChange에서 isOpen false 감지 |
| 9 | PageViewer: QuickOpen 내 Enter → 파일 선택 후 닫힘 | combobox select + close | ✅ onChange에서 selection 감지 |
| 10 | `pnpm health` 재실행 → PageViewer addEventListener/role/onKeyDown 징후 0건 | health 통과 | ✅ PageViewer 징후 0건 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
