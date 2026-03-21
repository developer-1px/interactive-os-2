# Value Axis (6번째 축) — PRD

> Discussion: 축 모델 상한 = 6축. 연속 값(min/max/step)을 meta-entity `__value__`로 관리, CRUD로 도메인 데이터 연동. slider + spinbutton behavior 구현. 사용자 API: `slider({ min, max, step })`, `spinbutton({ min, max, step })` — 내부 축 합성은 은닉.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | slider 위젯이 있고 현재 값이 50 | `__value__: { value: 50, min: 0, max: 100, step: 1 }` | ArrowRight 누름 | 값이 51로 증가, `aria-valuenow="51"` 반영 | `__value__: { value: 51, min: 0, max: 100, step: 1 }` | |
| 2 | slider 값이 100 (최대) | `__value__: { value: 100, min: 0, max: 100, step: 1 }` | ArrowRight 누름 | 값 변화 없음 (상한 클램프) | `__value__: { value: 100, ... }` | |
| 3 | spinbutton이 있고 값이 5 | `__value__: { value: 5, min: 0, max: 10, step: 1 }` | ArrowUp 누름 | 값이 6으로 증가 | `__value__: { value: 6, ... }` | |
| 4 | slider 값 변경 후 | entity.data: `{ value: 50 }` | onChange 콜백 | CRUD update로 entity.data에 반영 | entity.data: `{ value: 51 }` | |
| 5 | slider 값을 올렸다가 | undo stack에 setValue(51) | Mod+Z | 값이 50으로 복원 | `__value__: { value: 50, ... }` | |

상태: 🟢

## 2. 인터페이스

### slider — `slider({ min, max, step })`

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| ArrowRight | `value: N` | N < max | value = N + step | `value: N + step` | |
| ArrowLeft | `value: N` | N > min | value = N - step | `value: N - step` | |
| ArrowUp | `value: N` | N < max | value = N + step | `value: N + step` | |
| ArrowDown | `value: N` | N > min | value = N - step | `value: N - step` | |
| PageUp | `value: N` | N < max | value = N + step*10 (클램프) | `value: min(N + step*10, max)` | |
| PageDown | `value: N` | N > min | value = N - step*10 (클램프) | `value: max(N - step*10, min)` | |
| Home | `value: N` | — | value = min | `value: min` | |
| End | `value: N` | — | value = max | `value: max` | |
| Enter | — | — | N/A | — | |
| Escape | — | — | N/A | — | |
| Space | — | — | N/A | — | |
| Tab | — | — | 위젯 떠남 (natural-tab-order) | — | |
| 클릭 (트랙) | — | UI 컴포넌트 레벨 | value = 클릭 위치 비례 값 (Slider.tsx onClick) | — | |

### spinbutton — `spinbutton({ min, max, step })`

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| ArrowUp | `value: N` | N < max | value = N + step | `value: N + step` | |
| ArrowDown | `value: N` | N > min | value = N - step | `value: N - step` | |
| PageUp | `value: N` | N < max | value = N + step*10 (클램프) | `value: min(N + step*10, max)` | |
| PageDown | `value: N` | N > min | value = N - step*10 (클램프) | `value: max(N - step*10, min)` | |
| Home | `value: N` | — | value = min | `value: min` | |
| End | `value: N` | — | value = max | `value: max` | |
| ArrowRight | — | — | N/A | — | |
| ArrowLeft | — | — | N/A | — | |
| Enter | — | — | N/A | — | |
| Escape | — | — | N/A | — | |
| Space | — | — | N/A | — | |
| Tab | — | — | 위젯 떠남 | — | |

### 인터페이스 체크리스트

- [x] ↑ 키: slider +step, spinbutton +step
- [x] ↓ 키: slider -step, spinbutton -step
- [x] ← 키: slider -step, spinbutton N/A
- [x] → 키: slider +step, spinbutton N/A
- [x] Enter: N/A
- [x] Escape: N/A
- [x] Space: N/A
- [x] Tab: natural-tab-order, 위젯 떠남
- [x] Home/End: min/max
- [x] PageUp/PageDown: ±step*10
- [x] 클릭: slider 트랙 클릭 → UI 컴포넌트 레벨 (behavior 밖)
- [x] 이벤트 버블링: 단일 노드 위젯, 중첩 이슈 없음

상태: 🟢

## 3. 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `axes/value.ts` | value() 축 — increment/decrement/setToMin/setToMax keyMap + valueRange config. orientation 옵션으로 slider/spinbutton 분기 | |
| `plugins/core.ts` 확장 | VALUE_ID (`__value__`) meta-entity, valueCommands (setValue, increment, decrement). focusCommands/selectionCommands와 동일 패턴 | |
| `behaviors/types.ts` 확장 | `ValueNav` 인터페이스, BehaviorContext에 `value?: ValueNav`, AriaBehavior에 `valueRange?: { min, max, step }` | |
| `axes/composePattern.ts` 확장 | AxisConfig에 `valueRange?` 추가, composePattern에서 AriaBehavior로 전파 | |
| `behaviors/createBehaviorContext.ts` 확장 | valueRange 있으면 ctx.value 생성 (grid? 패턴과 동일) | |
| `behaviors/slider.ts` | `slider(opts)` factory — 사용자 API. 내부: composePattern + value 축 합성 | |
| `behaviors/spinbutton.ts` | `spinbutton(opts)` factory — 사용자 API. 내부: composePattern + value 축 합성 | |
| `ui/Slider.tsx` + `ui/slider.css` | 레퍼런스 UI 컴포넌트 (트랙 클릭 → setValue는 여기서 처리) | |
| `ui/Spinbutton.tsx` + `ui/spinbutton.css` | 레퍼런스 UI 컴포넌트 | |
| 데모 페이지 2개 | Navigation 레이어에 slider, spinbutton 페이지 | |
| 통합 테스트 2개 | slider-keyboard.integration.test.tsx, spinbutton-keyboard.integration.test.tsx | |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| value = max일 때 increment | `value: 100, max: 100` | 클램프, 값 변화 없음 | `value: 100` | |
| value = min일 때 decrement | `value: 0, min: 0` | 클램프, 값 변화 없음 | `value: 0` | |
| step이 소수 (0.1) | `value: 0.7, step: 0.1` | 0.8로 증가 (부동소수점 처리) | `value: 0.8` | |
| PageUp이 max 넘을 때 | `value: 95, step: 1, max: 100` | max로 클램프 | `value: 100` | |
| valueRange 없는 behavior | — | ctx.value === undefined, 기존 동작 무변경 | — | |
| undo 후 redo | undo → `value: 50`, redo → | 값 복원 | `value: 51` | |
| 초기 value 미지정 | `valueRange: { min: 0, max: 100, step: 1 }` | value = min으로 초기화 | `value: 0` | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | value를 entity.data에 직접 저장 | meta-entity 패턴 일관성. undo/redo가 Command 스택에서 자동으로 작동해야 함 | |
| 2 | 기존 17개 behavior의 테스트/동작 변경 | valueRange가 없으면 ctx.value === undefined, 영향 0이어야 함 | |
| 3 | BehaviorContext에 value 메서드를 top-level로 추가 | grid?와 동일하게 optional namespace. top-level 오염 금지 | |
| 4 | slider에서 노드 탐색(focusNext/focusPrev) 사용 | slider는 단일 노드. 이산 노드 탐색과 연속 값 변경은 별개 축 | |
| 5 | 클램프 없이 min/max 범위 밖 값 허용 | Command 레벨에서 항상 클램프 | |
| 6 | value() 축의 orientation을 사용자에게 노출 | slider/spinbutton behavior가 내부적으로 합성. 사용자는 behavior factory만 사용 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | slider에서 ArrowRight 5번 | aria-valuenow가 초기값 + 5*step | |
| 2 | slider에서 Home → End | aria-valuenow가 min → max | |
| 3 | slider에서 PageUp | aria-valuenow가 +step*10 (클램프) | |
| 4 | spinbutton에서 ArrowUp/Down | aria-valuenow 증감 | |
| 5 | slider 값 변경 후 Mod+Z | 이전 값으로 복원 | |
| 6 | slider 값 변경 → onChange 호출 확인 | onChange 콜백에 새 store 전달 | |
| 7 | 기존 listbox 테스트 전수 통과 | value 축 추가가 기존 behavior에 영향 0 | |
| 8 | value = max에서 ArrowRight | 값 변화 없음, 에러 없음 | |
| 9 | step: 0.1로 0.1씩 10번 증가 | value = 1.0 (부동소수점 정확) | |
| 10 | axe-core 접근성 검사 통과 | aria-valuenow/min/max/valuetext 정합 | |

상태: 🟢

---

**전체 상태:** 🟢 6/6
