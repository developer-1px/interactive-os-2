# Value

> 연속 값(min/max/step) 조작 축. slider, spinbutton이 사용.

## 스펙

| 옵션 | 타입 | 설명 |
|------|------|------|
| min | number | 최소값 |
| max | number | 최대값 |
| step | number | 증감 단위 |
| orientation | 'horizontal' \| 'vertical' | horizontal: ←→↑↓ 전부, vertical: ↑↓만 |

## 키맵

| 키 | 동작 | 조건 |
|---|------|------|
| ArrowUp | +step | 항상 |
| ArrowDown | -step | 항상 |
| ArrowRight | +step | orientation: 'horizontal' |
| ArrowLeft | -step | orientation: 'horizontal' |
| PageUp | +step×10 | 항상 |
| PageDown | -step×10 | 항상 |
| Home | setValue(min) | 항상 |
| End | setValue(max) | 항상 |

## 내부 구조

- meta-entity: `__value__` — `{ value, min, max, step }`
- BehaviorContext: `ctx.value?` (ValueNav optional namespace, grid? 패턴과 동일)
- NodeState: `valueCurrent` — ariaAttributes에서 `aria-valuenow` 렌더링에 사용
- Commands: `valueCommands.setValue()`, `.increment()`, `.decrement()`
- 부동소수점: `roundToStep()` — step 소수점 자릿수 기준 반올림

## 관계

- `composePattern(identity, value({...}))` → AriaBehavior에 valueRange 전파
- AxisConfig.valueRange → AriaBehavior.valueRange → useAria.behaviorCtxOptions → createBehaviorContext
- core plugin에서 VALUE_ID를 META_ENTITY_IDS에 등록 → 외부 데이터 sync 시 보존
