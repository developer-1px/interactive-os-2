# Axis v2: 5축 모델 — 2026-03-20

## 배경

axis decomposition v1에서 11개 축 + metadata grab bag으로 구현. 검토 결과:
- `activateFollowFocus` ≡ `activate` (코드 100% 동일, 유령 축)
- metadata의 행동 플래그(followFocus, activateOnClick, selectionMode, expandable, colCount)가 축 밖에 존재
- 축 조합만으로 pattern을 완전 정의할 수 없는 구조

근본 원인: Axis = `Record<string, keyHandler>` — 키보드 핸들러만 담는 타입 제한. 행동 플래그가 축 옵션이 아니라 metadata에 분산.

## 내용

### 핵심 결정

**metadata의 행동 플래그를 해당 축의 옵션으로 흡수한다.**

- metadata에 남는 것: `role`, `childRole`, `ariaAttributes` (정체성 + 렌더링)
- 나머지 전부 → 해당 축의 옵션

### 5축 (APG 표준 용어 정렬)

| 축 | 질문 | 옵션 | 흡수한 metadata |
|---|---|---|---|
| `navigate()` | 어떻게 이동? | `orientation`, `wrap`, `grid: { columns }` | focusStrategy, colCount |
| `select()` | 어떻게 선택? | `mode: 'single' \| 'multiple'`, `extended` | selectionMode |
| `activate()` | 어떻게 실행? | `onClick`, `followFocus`, `toggleExpand` | activateOnClick, followFocus |
| `expand()` | 어떻게 깊이 탐색? | `mode: 'arrow' \| 'enter-esc'` | expandable |
| `trap()` | 어떻게 가두고 빠져나가? | `escape`, `tabCycle`, `lightDismiss` | (신규) |

### 11축 → 5축 매핑

| v1 (11개) | v2 (5개) |
|---|---|
| navV | `navigate({ orientation: 'vertical' })` |
| navH | `navigate({ orientation: 'horizontal' })` |
| navVhUniform | `navigate({ orientation: 'both', wrap: true })` |
| navGrid | `navigate({ orientation: 'vertical', grid: { columns: N } })` |
| depthArrow | `expand({ mode: 'arrow' })` |
| depthEnterEsc | `expand({ mode: 'enter-esc' })` |
| selectToggle | `select({ mode: 'multiple' })` |
| selectExtended | `select({ mode: 'multiple', extended: true })` |
| activate | `activate()` |
| activateFollowFocus | `activate({ followFocus: true })` — **삭제, 옵션으로 통합** |
| focusTrap | `trap({ escape: true })` |

### Pattern Usage (ideal)

```ts
// Listbox
composePattern({ role: 'listbox', childRole: 'option', ariaAttributes: ... },
  navigate({ orientation: 'vertical' }),
  select({ mode: 'multiple', extended: true }),
  activate({ onClick: true }),
)

// Tabs
composePattern({ role: 'tablist', childRole: 'tab', ariaAttributes: ... },
  navigate({ orientation: 'horizontal' }),
  activate({ onClick: true, followFocus: true }),
)

// Tree
composePattern({ role: 'tree', childRole: 'treeitem', ariaAttributes: ... },
  navigate({ orientation: 'vertical' }),
  select({ mode: 'multiple', extended: true }),
  activate({ onClick: true }),
  expand({ mode: 'arrow' }),
)

// Dialog
composePattern({ role: 'dialog', childRole: 'group', ariaAttributes: ... },
  trap({ escape: true, tabCycle: true }),
)

// RadioGroup
composePattern({ role: 'radiogroup', childRole: 'radio', ariaAttributes: ... },
  navigate({ orientation: 'both', wrap: true }),
  select({ mode: 'single' }),
)
```

### Axis 타입 확장

```ts
// v1
type Axis = Record<string, (ctx: BehaviorContext) => Command | void>

// v2
interface Axis {
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  config?: Partial<PatternConfig>
}
```

축 factory가 keyMap + config를 함께 반환. composePattern이 config를 머지.

### 네이밍 근거 (W3C APG)

| 축 | APG 용어 |
|---|---|
| navigate | "moves focus to next/previous" |
| select | "selection", "single-select/multi-select" |
| activate | "activates the tab/menuitem", "automatic activation" |
| expand | "expanded/collapsed", "open/closed node" |
| trap | 개발자 de facto 표준 (APG는 "focus contained within") |

## 다음 행동

1. Axis 타입 확장 (keyMap + config)
2. 5축 factory 구현 (navigate, select, activate, expand, trap)
3. 17개 behavior를 5축 모델로 재작성
4. 기존 11축 deprecate → 삭제
5. 쇼케이스 재설계 (5축 × 옵션 토글)
6. activateFollowFocus 삭제
