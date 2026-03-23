# Hooks

> React 통합. store + engine + behavior를 React 컴포넌트에 연결하는 훅.

## 주기율표

| 훅 | 함수 | 역할 | 상태 |
|----|------|------|------|
| useEngine | `useEngine()` | store + commandEngine 생성, React 상태 동기화 | 🟢 |
| useAria | `useAria()` | engine + behavior → DOM 속성 + 키보드 핸들링. behavior optional → keyMap-only 모드 | 🟢 |
| useAriaZone | `useAriaZone()` | 하나의 engine을 여러 위젯이 공유 (multi-zone) | 🟢 |
| useControlledAria | `useControlledAria()` | 외부 상태와 연동 (controlled component 패턴) | 🟢 |
| useKeyboard | `parseKeyCombo()`, `matchKeyEvent()`, `findMatchingKey()` | 키보드 이벤트 파싱 유틸리티 | 🟢 |
| useSpatialNav | `useSpatialNav()`, `findNearest()`, `findAdjacentGroup()` | 공간 네비게이션 (TV리모컨식 방향 탐색) + cross-boundary fallback + sticky cursor | 🟢 |
| keymapHelpers | `isEditableElement()`, `dispatchKeyAction(): boolean` | keyMap 실행 헬퍼 (multi-export). 반환값으로 조건부 preventDefault | 🟢 |

## 핵심 관계

```
useEngine (store + engine)
  ↓
useAria (engine + behavior → DOM)
  ├── useAriaZone (engine 공유, 위젯 분리)
  └── useControlledAria (외부 상태 연동)

useKeyboard (독립 유틸리티)
useSpatialNav (독립, spatial plugin과 쌍)
keymapHelpers (useAria 내부에서 사용)
```

## Pointer Interaction

> 최종 갱신: 2026-03-22 (retro: pointer-interaction)

useAria의 `getNodeProps()`가 `onPointerDown` + `onClick` 핸들러를 반환한다.

- **selectOnClick**: `select()` 축이 자동 설정. Click→select, Shift+Click→range, Ctrl/Cmd+Click→toggle
- **activateOnClick**: `activate({ onClick: true })` 옵션. Click→activate (expand/select by children)
- **onPointerDown**: `selectOnClick` 시 BehaviorContext를 `useRef`로 캡처. onFocus→setFocus→anchorResetMiddleware가 앵커를 클리어하기 때문에, focus 전 상태를 보존하여 Shift+Click 범위 계산에 사용
- **modifier 클릭 시 activate 억제**: Shift/Ctrl/Meta+Click은 selection 전용 — activate를 건너뜀
- **event.defaultPrevented 가드**: 중첩 Aria 인스턴스에서 이중 처리 방지 (Nested Aria Bubbling과 동일 메커니즘)

## Nested Aria Bubbling

> 최종 갱신: 2026-03-21 (retro: nested-aria-bubbling)

모든 onKeyDown 핸들러에 `if (event.defaultPrevented) return` 가드가 기존 `target !== currentTarget` 앞에 위치. 중첩 `<Aria>` 컨테이너가 DOM 이벤트 버블링으로 자연스럽게 합성됨.

- **behavior optional**: `<Aria keyMap={...}>` — behavior 생략 시 role/tabIndex 없이 keyMap onKeyDown만 등록
- **글로벌/지역 단축키 통합**: 같은 메커니즘, 차이는 keyMap이 걸린 레이어 위치뿐
- **EMPTY_BEHAVIOR sentinel**: `isKeyMapOnly` 플래그로 분기, getNodeProps → `{}`

## 갭

(없음)
