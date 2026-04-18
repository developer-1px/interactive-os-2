---
id: 2-areas/pattern/prds/modal-key-trap-prd
type: prd
slug: modalKeyTrap
title: 'Modal Key Trap — PRD'
tags: [untagged]
created: 2026-04-09
updated: 2026-04-09
summary: 'Discussion: Book 라우트의 ArrowUp/Down이 TOC 모달을 뚫고 페이지를 넘김. keyMap에 등록된 키만 trap되고 나머지가 leak. findMatchingKey에 `''*''` 와일드카드 fallback을 추가하여 모달이 모든 키를 소비하게 한다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Modal Key Trap — PRD

> Discussion: Book 라우트의 ArrowUp/Down이 TOC 모달을 뚫고 페이지를 넘김. keyMap에 등록된 키만 trap되고 나머지가 leak. findMatchingKey에 `'*'` 와일드카드 fallback을 추가하여 모달이 모든 키를 소비하게 한다.

## ① 동기

### WHY

- **Impact**: Modal이 열려있는데 뒤쪽 Route의 ArrowUp/Down이 동작하여 사용자가 의도치 않게 페이지를 넘김. 모달의 기본 계약(키보드 격리) 위반.
- **Forces**: AriaRoute는 `document.addEventListener`로 동작하여 DOM stopPropagation이 무력. `e.defaultPrevented` 가드만 유효. 현재 keyMap은 명시적 키만 등록하는 구조.
- **Decision**: `findMatchingKey`에 `'*'` 와일드카드 fallback 추가. 기각 대안: (A) AriaRoute에서 모달 상태 체크 — Route↔Modal 커플링, (B) trap 플래그 — keyMap 패러다임 밖 새 개념 불필요.
- **Non-Goals**: 브라우저 시스템 단축키(Cmd+C/V 등) 차단 안 함. modifier 키 조합은 와일드카드에서 제외.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | Book 페이지에서 TOC 모달이 열려있다 | ArrowDown을 누른다 | 페이지가 넘어가지 않고 모달 내부에서만 동작한다 | |
| 2 | Dialog 패턴을 사용하는 모달이 열려있다 | keyMap에 없는 아무 키를 누른다 | 키가 모달 밖으로 전파되지 않는다 (preventDefault) | |
| 3 | 모달이 열려있다 | Cmd+C를 누른다 | 브라우저 복사가 정상 동작한다 (modifier 키 조합은 통과) | |
| 4 | 모달이 없는 일반 listbox 패턴 | ArrowDown을 누른다 | 기존과 동일하게 동작한다 (`'*'` 미사용 패턴에 영향 없음) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useKeyboard.ts::findMatchingKey` 수정 | 명시 키 매칭 실패 후 `'*'` in keyMap이면 modifier 없는 키에 한해 `'*'` 반환 | |
| `dialog.ts` keyMap에 `'*'` 추가 | `'*': key(['core:trap'], () => trapCommand)` — trap용 command 반환 | |
| `alertdialog.ts` keyMap에 `'*'` 추가 | dialog와 동일 | |
| `keymapHelpers.ts` 또는 별도 — trap command 정의 | `{ type: 'core:trap', payload: {} }` — engine이 dispatch하되 아무 상태 변경 없음 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 모달 내에서 ArrowDown | 모달 열림, 포커스 모달 내부 | `findMatchingKey` → 명시 키 매칭 실패 → `'*'` fallback 매칭 → handler 호출 → trap command 반환 → `dispatchKeyAction` true → `preventDefault` | `'*'`가 modifier 없는 모든 키를 catch하고, command를 반환하므로 useAriaView가 preventDefault 호출. AriaRoute의 `defaultPrevented` 가드에 걸림 | 키 소비됨, 외부 전파 차단 | |
| 모달 내에서 Escape | 모달 열림 | `findMatchingKey` → `Escape` 명시 매칭 → `pop.close` 실행 | 명시 키가 `'*'`보다 우선 매칭 (for 루프에서 먼저 발견) | 모달 닫힘 | |
| 모달 내에서 Cmd+C | 모달 열림 | `findMatchingKey` → 명시 키 매칭 실패 → `'*'` fallback 체크 → `event.metaKey === true` → 제외 → `undefined` 반환 | modifier 키 조합은 `'*'` 매칭 조건에서 제외. 브라우저 기본 동작 보존 | 복사 정상 동작 | |
| 모달 내에서 Tab | 모달 열림, 포커스 모달 내부 | `findMatchingKey` → Tab은 navigate axis keyMap에 있으면 명시 매칭, 없으면 `'*'` fallback | natural navigate에 Tab이 없으면 `'*'`가 잡음. `<dialog>.showModal()` 네이티브 Tab trap과는 별개 레이어 | Tab도 외부 전파 차단 | |
| 일반 listbox에서 ArrowDown | 모달 아님 | `findMatchingKey` → ArrowDown 명시 매칭 → navigate handler 실행 | `'*'`가 keyMap에 없으므로 fallback 자체가 발동하지 않음 | 기존과 동일 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 중첩 Aria: 모달 안에 listbox가 있고, listbox에 ArrowDown 핸들러 있음 | 모달 열림, listbox 포커스 | 내부 listbox의 onKeyDown이 DOM 버블링에서 먼저 실행. `defaultPrevented` 체크로 이중 처리 방지 | listbox가 ArrowDown 처리 → preventDefault → 모달의 `'*'`는 발동하지 않음 | listbox 정상 동작 | |
| Shift+ArrowDown (modifier 있는 복합키) | 모달 열림 | Shift는 modifier. 현재 `'*'` 조건에서 shiftKey도 제외해야 하는가? | Shift+Arrow는 텍스트 선택 등 브라우저 동작. 제외가 안전 | Shift+Arrow 통과 | |
| `'*'` handler가 command를 반환하지 않으면 | 모달 열림 | `dispatchKeyAction`이 false 반환 → `preventDefault` 미호출 → trap 실패 | **반드시 command를 반환해야 함** — noop이면 안 됨 | N/A (설계 제약) | |
| input/textarea 안에서 문자 입력 | 모달 내 input에 포커스 | `isEditableElement` 체크가 useAriaView에 있으면 `'*'`보다 먼저 걸러짐 | input 내 문자 입력 정상 동작 | 입력 정상 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 키바인딩 → KeyMap 선언 (CLAUDE.md) | ② findMatchingKey 수정 | ✅ 준수 — `'*'`도 keyMap에 선언하는 것. addEventListener 추가 아님 | — | |
| 2 | 선언적 OCP: 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② findMatchingKey 수정 | 🟡 경계 — findMatchingKey에 `'*'` 특별 처리 추가는 런타임 변경. 단, `'*'`를 keyMap에 안 넣으면 기존 동작 100% 불변. `'*'`를 넣은 패턴만 영향. 확장은 keyMap 행 추가로 이루어짐 | 허용: `'*'` 유무에 따른 분기 1줄. 새 패턴에 trap이 필요하면 keyMap에 `'*'` 행 추가만으로 해결 (OCP 준수) | |
| 3 | 축 SSOT, 패턴 정체성 (feedback_axis_pattern_principles) | ② dialog 패턴 수정 | ✅ 준수 — trap은 dialog 패턴의 정체성(모달 키 격리)에 부합 | — | |
| 4 | defaultPrevented가 target 가드보다 범용 (feedback_nested_bubbling_guard) | ③ 인터페이스 | ✅ 준수 — AriaRoute가 이미 defaultPrevented 체크. trap도 같은 메커니즘 활용 | — | |
| 5 | 중첩 렌더링 이벤트 버블링 가드 필수 (feedback_nested_event_bubbling) | ④ 중첩 Aria 경계 | ✅ 준수 — 내부 Aria가 먼저 처리하면 defaultPrevented로 모달 `'*'` 비발동 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `findMatchingKey` — 모든 패턴의 핵심 키 매칭 | `'*'`가 keyMap에 없는 기존 패턴은 영향 0. 있는 패턴만 fallback 발동 | 낮음 | keyMap에 `'*'`가 없으면 기존 코드패스와 100% 동일 | |
| 2 | `useAriaView` — dispatchKeyAction 호출 | trap command가 engine에 dispatch됨. middleware가 unknown command를 만남 | 낮음 | `core:trap`은 상태 변경 없이 통과. history plugin이 undo 스택에 넣지 않도록 meta 처리 필요 여부 확인 | |
| 3 | 중첩 Aria 구조에서 의도치 않은 `'*'` capture | 모달 안 listbox가 ArrowDown을 처리 안 하면(비활성 등) `'*'`가 잡아서 preventDefault | 중간 | 이건 의도된 동작 — 모달이 모든 키를 가두는 게 목적 | |
| 4 | `useControlledAria` — 항상 preventDefault | `'*'` 매칭 시에도 항상 preventDefault (기존과 동일 패턴) | 낮음 | 영향 없음 | |

완성도: 🟡 (⑥-2 history plugin 영향 확인 필요하나 실행 시 검증 가능)

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | `'*'` handler가 command를 반환하지 않는 noop으로 구현 | ④ 경계 — dispatchKeyAction false → preventDefault 미호출 | useAriaView에서 trap이 실패함 | |
| 2 | modifier 키 조합(Cmd/Ctrl/Alt/Shift+키)을 `'*'`로 잡기 | ① Non-Goals | 브라우저 시스템 단축키 파괴 | |
| 3 | `matchKeyEvent` 함수 자체를 수정하여 `'*'` 매칭 | ⑤-2 OCP — 모든 키 매칭 로직에 영향 | findMatchingKey의 fallback으로만 처리. matchKeyEvent는 불변 유지 | |
| 4 | dialog 외 패턴(listbox, treegrid 등)에 `'*'` 추가 | ⑤-3 패턴 정체성 | trap은 모달 패턴의 고유 책임. 비모달 패턴은 키 통과가 정상 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①-1 | Dialog 열림 상태에서 ArrowDown 입력 | `defaultPrevented === true`, 외부 AriaRoute handler 미실행 | |
| 2 | ①-2 | Dialog 열림 상태에서 keyMap에 없는 키(예: PageUp) 입력 | `'*'` fallback 매칭, preventDefault 호출 | |
| 3 | ①-3 | Dialog 열림 상태에서 Cmd+C 입력 | `'*'` 매칭 안 됨 (modifier), 브라우저 복사 정상 | |
| 4 | ①-4 | `'*'` 없는 listbox 패턴에서 기존 키 동작 | findMatchingKey 기존 동작 100% 동일 | |
| 5 | ④-1 | 모달 안 중첩 listbox에서 ArrowDown | listbox가 먼저 처리, 모달 `'*'` 비발동 | |
| 6 | ④-2 | Dialog 열림 상태에서 Shift+ArrowDown | modifier 있으므로 `'*'` 매칭 안 됨 | |
| 7 | ④-4 | 모달 내 input에서 문자 'a' 입력 | isEditableElement 체크로 keyMap 핸들러 스킵, 입력 정상 | |

완성도: 🟢

---

**전체 완성도:** 🟢 7/8 (⑥만 🟡 — history plugin 영향은 실행 시 검증)

#kind/prd #topic/pattern
