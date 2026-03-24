# Typeahead Plugin — PRD

> Discussion: FE에서 당연한 인터랙션 갭 분석 → APG 표준 typeahead가 유일한 핵심 누락

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | listbox/tree/grid에 10개 이상 항목이 있다 | 사용자가 "B"를 누른다 | "B"로 시작하는 첫 번째 항목으로 포커스가 이동한다 | |
| M2 | 방금 "B"를 눌러 "Banana"에 포커스가 있다 | 500ms 이내에 "A"를 추가로 누른다 | 버퍼가 "BA"가 되어 "Banana"(BA로 시작)에 포커스가 유지된다 | |
| M3 | "B"를 눌러 "Banana"에 포커스가 있다 | 500ms 이후 다시 "B"를 누른다 | 버퍼가 리셋되어 다음 "B" 항목(예: "Blueberry")으로 이동한다 | |
| M4 | rename 모드가 활성화되어 있다 | 사용자가 문자를 입력한다 | typeahead가 작동하지 않는다 (rename이 문자 입력을 소비) | |
| M5 | 항목이 없거나 매칭되는 항목이 없다 | 사용자가 문자를 누른다 | 포커스가 변하지 않는다 (no-op) | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `typeahead.ts` | `src/interactive-os/plugins/typeahead.ts` — typeahead plugin. module-level 버퍼 + 타이머. `getLabel` 옵션으로 entity에서 텍스트 추출 | `src/interactive-os/plugins/typeahead.ts`::`export function typeahead`, `export function findTypeaheadMatch`, `export function isPrintableKey` |
| Plugin.onUnhandledKey | Plugin 인터페이스에 optional `onUnhandledKey` 추가. keyMap에 매칭되지 않은 키 이벤트를 처리하는 fallback 핸들러 | `src/interactive-os/core/types.ts`::`onUnhandledKey` (Plugin 인터페이스 optional 필드) |
| useAria onKeyDown 확장 | keyMap 매칭 실패 시 plugin.onUnhandledKey 체인을 호출하는 fallback 경로 추가 | `src/interactive-os/hooks/useAriaView.ts` — `p.onUnhandledKey` 체인 호출 |

**설계 결정: 왜 keyMap이 아닌 onUnhandledKey인가**

typeahead는 "특정 키"가 아닌 "모든 printable 문자"에 반응한다. 현재 keyMap은 `'ArrowDown'`, `'Mod+C'` 등 개별 키 콤보만 매칭한다. keyMap에 와일드카드를 추가하면 기존 매칭 로직의 우선순위가 모호해진다. onUnhandledKey는 keyMap 매칭 실패 후에만 호출되므로 우선순위가 명확하다.

```
키 이벤트 → findMatchingKey(mergedKeyMap)
  ├─ 매칭 성공 → 기존 keyMap 핸들러 실행
  └─ 매칭 실패 → plugin.onUnhandledKey 체인 호출
                   └─ typeahead: printable char? → 버퍼 누적 → 검색 → setFocus
```

**onUnhandledKey 시그니처**: `(event: KeyboardEvent, engine: CommandEngine) => boolean`
- KeyboardEvent를 받아야 pressed character를 알 수 있다
- engine을 받아야 store를 읽고 command를 dispatch할 수 있다
- boolean 반환: true면 event.preventDefault() + 체인 중단

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| printable char "B" (단일 문자, modifier 없음) | 버퍼 비어있음, "Apple"에 포커스 | 버퍼에 "b" 추가 → visible nodes에서 "b"로 시작하는 첫 항목 검색 → "Banana" 발견 → setFocus("banana-id") | APG listbox: "Focus moves to the next item with a name that starts with the typed character" | 버퍼="b", 타이머 500ms 시작, "Banana"에 포커스 | |
| printable char "A" (500ms 이내) | 버퍼="b", "Banana"에 포커스 | 버퍼에 "a" 추가 → "ba"로 시작하는 항목 검색 → "Banana" 유지 | multi-char typeahead: 빠르게 치면 누적하여 더 정확한 매칭 | 버퍼="ba", 타이머 리셋, 포커스 유지 | |
| printable char "B" (500ms 경과 후) | 버퍼 리셋됨, "Banana"에 포커스 | 새 버퍼 "b" 시작 → 현재 포커스(Banana) 이후부터 순환 검색 → "Blueberry" 발견 | 같은 문자 반복 시 다음 매칭으로 순환 (APG 표준) | 버퍼="b", "Blueberry"에 포커스 | |
| Ctrl+B, Alt+B, Meta+B | 어떤 상태든 | typeahead 무시 (modifier 키 있으면 printable로 취급 안 함) | modifier 조합은 단축키이지 문자 입력이 아니다 | 상태 변화 없음 | |
| printable char (rename 활성) | RENAME_ID.active=true | onUnhandledKey 미호출 (rename의 contenteditable이 이벤트 소비) | rename 모드에서는 DOM의 contenteditable이 이미 문자를 처리한다. target !== currentTarget 가드로 버블된 이벤트 필터링 | 상태 변화 없음 | |
| printable char (매칭 없음) | 어떤 상태든 | 검색 실패 → no-op, 버퍼는 누적 | 매칭 없다고 버퍼를 버리면 "xyz" 같은 입력 후 복구 불가 | 버퍼 누적, 포커스 변화 없음 | |
| ↑↓←→, Enter, Escape, Tab, Space, Home, End | 어떤 상태든 | N/A — 이 키들은 keyMap에서 먼저 매칭되므로 onUnhandledKey에 도달하지 않음 | keyMap이 onUnhandledKey보다 우선 | typeahead와 무관 | |

### 인터페이스 체크리스트 (AI 자가 검증)

- [x] ↑↓←→: N/A — keyMap에서 처리됨
- [x] Enter: N/A — keyMap에서 처리됨
- [x] Escape: N/A — keyMap에서 처리됨
- [x] Space: N/A — keyMap에서 처리됨 (Space는 printable이지만 APG에서 selection toggle로 사용)
- [x] Tab: N/A — 브라우저 기본 동작
- [x] Home/End: N/A — keyMap에서 처리됨
- [x] Cmd/Ctrl 조합: modifier 있으면 typeahead 무시
- [x] 클릭: N/A — typeahead는 키보드 전용
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: rename contenteditable → target 가드가 처리

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1. 빈 store (항목 0개) | entities에 meta만 존재 | visible nodes가 비어있으면 검색 대상 없음 | no-op | 변화 없음 | |
| E2. 모든 항목이 collapsed 안에 숨어있음 | visible nodes 비어있음 | typeahead는 visible nodes만 검색 — collapsed 항목은 도달 불가 | no-op | 변화 없음 | |
| E3. entity.data에 label 필드가 없음 | getLabel 반환값 undefined/empty | getLabel이 빈 문자열 반환 → 매칭 불가 | 해당 항목 스킵 | 포커스 변화 없음 | |
| E4. 대소문자: "b" vs "B" | "Banana" 항목 존재 | 대소문자 무시(case-insensitive) — 사용자가 Shift 여부를 신경 쓸 이유 없음 | "b"도 "B"도 "Banana" 매칭 | |
| E5. 한글/CJK/IME 입력 | IME 조합 중 | IME composing 중(isComposing=true)이면 typeahead 무시 — 조합 완성 전에 검색하면 오작동 | no-op | |
| E6. Space 키 | keyMap에 Space 매핑 있음 | Space는 APG에서 selection toggle. keyMap이 먼저 매칭하므로 onUnhandledKey에 도달하지 않음 | keyMap 핸들러 실행 | |
| E7. 숫자 입력 "1", "2" | 항목 라벨이 숫자로 시작 | 숫자도 printable character — 동일 로직 적용 | 해당 숫자로 시작하는 항목으로 이동 | |
| E8. 특수문자 ".", "/" | 항목 라벨이 특수문자로 시작 가능 | keyMap에 매칭되지 않는 printable이면 typeahead 대상 | 매칭 시도 | |
| E9. 순환 검색: 리스트 끝 도달 | "Z"로 시작하는 항목이 리스트 끝에 있고 현재 그 항목에 포커스 | 같은 문자 반복 시 현재 위치 다음부터 검색 → 끝까지 못 찾으면 처음부터 순환 | 리스트 처음의 "Z" 항목으로 이동 (있으면) | |
| E10. combobox 내부 typeahead | combobox open 상태 | combobox는 filter(setFilter)로 문자 처리. typeahead plugin이 있어도 combobox keyMap이 먼저 매칭됨 | combobox 로직 우선 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② onUnhandledKey | ⚠️ 부분 — typeahead는 keyMap이 아닌 onUnhandledKey 사용 | keyMap 체계와 별도 경로이지만, Plugin 인터페이스 내에 포함되므로 소유 원칙 충족. keyMap이 아닌 이유는 ②에 명시 | |
| P2 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 파일명/export명 | ✅ 미위반 | "typeahead"는 APG 공식 용어 ("Type a character") | |
| P3 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② typeahead.ts | ✅ 미위반 | `typeahead.ts` → `export function typeahead` | |
| P4 | focusRecovery 불변 조건 (feedback_focus_recovery_invariant) | ③ setFocus | ✅ 미위반 | typeahead는 focusCommands.setFocus 사용 → focusRecovery 미들웨어와 무관 (focus가 사라지는 게 아님) | |
| P5 | 설계 원칙 > 요구 충족 (feedback_design_over_request) | ② Plugin 인터페이스 확장 | ✅ 미위반 | onUnhandledKey는 기존 keyMap 우선순위를 유지하면서 확장. engine 우회 아님 | |
| P6 | 중첩 렌더링 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ rename 모드 | ✅ 미위반 | useAria의 기존 target !== currentTarget 가드가 rename contenteditable 이벤트를 필터링 | |
| P7 | 테스트: 계산=unit, 인터랙션=통합 (feedback_test_strategy) | ⑧ 검증 | ✅ 미위반 | 검색 로직(순수 함수) = unit, 키보드 → DOM = 통합 | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | Plugin 인터페이스 (types.ts) | onUnhandledKey 추가 — optional이므로 기존 플러그인 영향 없음 | 낮 | 허용 | |
| S2 | useAria onKeyDown (useAria.ts) | keyMap 실패 후 onUnhandledKey 체인 추가 — 기존 keyMap 핸들링 변경 없음 | 낮 | 허용 | |
| S3 | META_ENTITY_IDS (useAria.ts) | typeahead는 meta entity를 사용하지 않음 (module-level state) — 변경 불필요 | 없음 | N/A | |
| S4 | 기존 9개 플러그인 | 기존 플러그인에 onUnhandledKey 없으므로 영향 없음 | 없음 | N/A | |
| S5 | useAriaZone (multi-zone) | useAriaZone이 onUnhandledKey를 포워딩해야 할 수 있음 | 중 | useAriaZone도 동일한 fallback 경로 추가 필요 → ④에 경계 추가 불필요 (useAriaZone은 useAria 래퍼이므로 자동 적용) | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | keyMap에 와일드카드 패턴 추가 금지 | P1 — keyMap 체계 보존 | 기존 findMatchingKey의 우선순위 로직이 복잡해지고, 모든 behavior/plugin keyMap에 영향 | |
| F2 | store에 typeahead 상태(버퍼) 저장 금지 | S3 — meta entity 불필요 | 버퍼는 순간적(500ms). store에 넣으면 undo/redo 대상이 되어 의미 없는 히스토리 오염 | |
| F3 | IME composing 중 typeahead 실행 금지 | E5 — IME 오작동 | event.isComposing=true일 때 문자가 미완성이므로 검색하면 잘못된 결과 | |
| F4 | modifier 키 조합을 typeahead로 처리 금지 | ③ Ctrl+B 행 | Ctrl/Alt/Meta + 문자는 단축키 영역이지 typeahead 아님 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | listbox에서 "b" 입력 | "B"로 시작하는 첫 항목으로 포커스 이동 | `typeahead-keyboard.integration.test.tsx`::`typing "b" moves focus to first B item` |
| V2 | M2 | "b" 입력 후 300ms 이내 "a" 입력 | "ba"로 시작하는 항목으로 포커스 (multi-char) | `typeahead-keyboard.integration.test.tsx`::`typing "bl" quickly narrows to "Blueberry"` |
| V3 | M3 | "b" 입력 → 600ms 대기 → "b" 입력 | 다음 "B" 항목으로 순환 이동 | `typeahead-keyboard.integration.test.tsx`::`buffer resets after timeout, next same-char cycles` |
| V4 | M4 | rename 모드에서 문자 입력 | typeahead 미동작, rename에 문자 입력됨 | `typeahead-keyboard.integration.test.tsx`::`typeahead does not fire during rename mode` |
| V5 | M5 | "z" 입력 (매칭 항목 없음) | 포커스 변화 없음 | `typeahead-keyboard.integration.test.tsx`::`typing "z" with no match does not move focus` |
| V6 | E1 | 빈 리스트에서 문자 입력 | no-op | `typeahead-keyboard.integration.test.tsx`::`typing in empty list does nothing` |
| V7 | E4 | "b" 입력 (소문자) → "Banana" 항목 존재 | 대소문자 무시하고 매칭 | `typeahead-keyboard.integration.test.tsx`::`typing "B" (uppercase) also matches "Banana"` + `typeahead.test.ts`::`is case-insensitive` |
| V8 | E5 | IME로 한글 조합 중 | typeahead 미동작 | `typeahead.test.ts`::`returns false during IME composing` |
| V9 | E9 | 리스트 끝에서 같은 문자 반복 | 리스트 처음으로 순환 | `typeahead-keyboard.integration.test.tsx`::`typing same character wraps around to beginning` + `typeahead.test.ts`::`wraps around to beginning when no match after current` |
| V10 | E10 | combobox open 상태에서 문자 입력 | combobox filter 동작, typeahead 아님 | ❌ 테스트 없음 (combobox 통합 미검증) |
| V11 | P7 | findMatch 순수 함수 unit 테스트 | 버퍼+노드 리스트+현재 포커스 → 올바른 매칭 ID 반환 | `typeahead.test.ts`::`findTypeaheadMatch` describe — 9 unit tests |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안 완료, 사용자 확인 필요)
