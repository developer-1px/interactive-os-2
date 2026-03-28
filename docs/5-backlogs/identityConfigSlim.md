# Identity Config 축소 — 2026-03-29

## 배경

v3 마이그레이션 중 config 설계 점검. APG 원문과 비교한 결과, 현재 Identity의 대부분 필드가 "이미 결정된 것을 다시 말하는" 중복 선언이었다. handler 존재 자체가 행동을 선언하므로, Identity에는 구조적 사실만 남겨야 한다.

## 내용

### 남기는 필드 (APG 구조적 사실)

| 필드 | 성격 | 예시 |
|------|------|------|
| `role` | 위젯 역할 | `'listbox'`, `'grid'` |
| `childRole` | 자식 역할 | `'option'`, `'row'` |
| `panel` | 연관 패널 역할 (optional) | `'region'`, `'tabpanel'` |
| `colCount` | 그리드 열 수 (grid only) | `3` |
| `valueRange` | 슬라이더 범위 (slider/spinbutton only) | `{ min: 0, max: 100, step: 1 }` |

### 제거하는 필드 (handler 존재로 자동 추론)

| 필드 | 대체 방법 |
|------|----------|
| `expandTracking` | inputMap에 toggleExpand/expandOrFocusChild 있으면 자동 감지 |
| `checkedTracking` | inputMap에 toggleCheck 있으면 자동 감지 |
| `selectionMode` | inputMap에 select handler 있으면 자동 감지, multi는 extendSelection 존재로 |
| `focusStrategy` | handler metadata (focusNext.strategy) 또는 키 바인딩 패턴으로 추론 |
| `visibilityFilter` | expand handler에 자동 부착 |
| `middleware` | selectionFollowsFocus는 middleware로 유지, 나머지 자동화 |
| `panelVisibility` | expandable + panel → 'expanded', selectable + panel → 'selected' |
| `ariaAttributes` | auto ARIA가 state에서 자동 생성 (aria-expanded, aria-selected, aria-checked 등) |

### 조건부 패턴 (grid 등)

Identity에 옵션 안 넣고, 패턴을 함수로 감싸서 inputMap 생성 시점에 분기:

```ts
export function grid(columns: number, tabCycle = false): AriaPattern {
  return composePattern(
    { role: 'grid', childRole: 'row', colCount: columns },
    { ArrowRight: focusNextCol, ...(tabCycle && { Tab: gridTabCycleNext }) },
  )
}
```

### 핵심 원칙

- Identity = "이 위젯의 물리적 구조가 뭐냐" (APG 구조 선언)
- inputMap = "어떤 키가 뭘 하느냐" (APG 키보드 인터랙션 1:1)
- 분기 옵션 0개 — 선언적 OCP, 중간 해석 계층 없음

## 검증

1. 기존 30개 pattern/roles/ 파일이 새 Identity 형태로 변환 가능
2. 제거된 필드의 자동 추론이 기존 테스트 통과
3. composePattern이 inputMap에서 handler metadata를 스캔하여 인프라 자동 구성

## 출처

2026-03-29 세션 — APG 원문 비교 + config 설계 점검 discuss
