# checked axis 신설 + heterogeneous childRole — PRD

> Discussion: expand axis의 checked/pressed 오용 해소 + 레벨별 childRole 지원

## ① 동기

### WHY

- **Impact**: checkbox/switch/buttonToggle 패턴이 `aria-checked`/`aria-pressed`를 표현하기 위해 expand axis를 오용 중. `aria-checked="mixed"` tri-state가 불가능하여 APG #10(Checkbox Mixed) 포팅 불가. childRole이 단일 문자열이라 `listbox>group>option`, `table>rowgroup>row>cell` 같은 다계층 role 구조 포팅 불가 (#38, #57, #58).
- **Forces**: 축=ARIA 상태 속성 매핑 원칙 vs 기존 expand 재사용 관성. ARIA 표준에서 `aria-checked`(true/false/mixed)와 `aria-expanded`(true/false)는 완전히 다른 의미 축.
- **Decision**: checked axis 신설 + childRole 함수 확장. expand에 mixed 추가하는 안은 의미 오염(aria-expanded는 tri-state 아님)으로 기각. checked/pressed 분리 안은 행동 동일(toggle + tri-state)하므로 기각.
- **Non-Goals**: multi-zone 갭 해소 (별도 세션), radiogroup/toolbar 리팩터링 (이들은 select axis가 올바름)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | checkbox 패턴 사용 | Space로 toggle | `aria-checked`가 true↔false 전환 | |
| S2 | mixed-state checkbox 그룹 | 자식 일부만 checked | 부모의 `aria-checked="mixed"` | |
| S3 | switch 패턴 사용 | Space로 toggle | `aria-checked` 전환 (expand 미사용) | |
| S4 | buttonToggle 사용 | Space로 toggle | `aria-pressed` 전환 (expand 미사용) | |
| S5 | table 패턴 | 렌더링 | level 1=rowgroup, level 2=row, level 3=cell | |
| S6 | listbox grouped | 렌더링 | level 1=group, level 2=option | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/axis/checked.ts` | checked axis: `CHECKED_ID` 메타 엔티티, `checkedCommands`, `checked()` 함수 | |
| `src/interactive-os/pattern/types.ts` 수정 | `NodeState.checked?: boolean \| 'mixed'`, `AriaPattern.checkedTracking?` | |
| `src/interactive-os/axis/types.ts` 수정 | `PatternContext.isChecked`, `ctx.check()`, `ctx.uncheck()`, `ctx.toggleCheck()` | |
| `src/interactive-os/pattern/createPatternContext.ts` 수정 | checked context 메서드 구현 | |
| `src/interactive-os/primitives/useAriaView.ts` 수정 | `NodeState.checked` 계산 + childRole 함수 지원 | |
| `src/interactive-os/primitives/useAriaZone.ts` 수정 | checked 메타커맨드 처리 | |
| `src/interactive-os/pattern/composePattern.ts` 수정 | `checkedTracking` config 전달 + `childRole` 함수 타입 허용 | |
| `src/interactive-os/pattern/roles/checkbox.ts` 마이그레이션 | expand → checked axis | |
| `src/interactive-os/pattern/roles/switch.ts` 마이그레이션 | expand → checked axis | |
| `src/interactive-os/pattern/roles/buttonToggle.ts` 마이그레이션 | expand → checked axis | |
| `src/interactive-os/pattern/roles/checkboxMixed.ts` 신설 | mixed-state checkbox 패턴 (#10) | |
| `src/interactive-os/pattern/roles/table.ts` 신설 | table 패턴 (#57) — childRole 함수 사용 | |
| `src/interactive-os/pattern/roles/listboxGrouped.ts` 신설 | grouped listbox 패턴 (#38) — childRole 함수 사용 | |

완성도: 🟢

## ③ 인터페이스

### checked axis

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Space/Enter | checked=false | toggleCheck | activate axis가 checked 패턴이면 toggleCheck로 위임 | checked=true | |
| Space/Enter | checked=true | toggleCheck | 동일 toggle | checked=false | |
| Space/Enter (parent) | children 일부 checked | check all | mixed 상태에서 toggle = 전체 선택 (APG 명세) | 모든 children checked=true, parent checked=true | |
| Space/Enter (parent) | children 전부 checked | uncheck all | 전부 선택 → toggle = 전부 해제 | 모든 children checked=false, parent checked=false | |

### checked 저장 구조

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| check(nodeId) | `__checked__` 엔티티 | nodeId를 checkedIds에 추가 | expand의 expandedIds 패턴과 동일한 저장 구조 | `{ checkedIds: [..., nodeId] }` | |
| uncheck(nodeId) | checkedIds에 nodeId 있음 | nodeId 제거 | 동일 | `{ checkedIds: without(nodeId) }` | |
| toggleCheck(nodeId) | — | 있으면 제거, 없으면 추가 | 동일 | 반전 | |

### checked NodeState 계산

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| getNodeState(leaf) | leaf가 checkedIds에 있음 | checked=true | 직접 조회 | `{ checked: true }` | |
| getNodeState(leaf) | leaf가 checkedIds에 없음 | checked=false | 직접 조회 | `{ checked: false }` | |
| getNodeState(parent) | 자식 전부 checked | checked=true | 자식 상태 집계 — 전부 true면 true | `{ checked: true }` | |
| getNodeState(parent) | 자식 전부 unchecked | checked=false | 자식 상태 집계 — 전부 false면 false | `{ checked: false }` | |
| getNodeState(parent) | 자식 일부만 checked | checked='mixed' | 자식 상태 집계 — 혼합이면 'mixed' | `{ checked: 'mixed' }` | |

### heterogeneous childRole

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| childRole='option' (string) | 기존 | 모든 노드에 role='option' | 하위 호환 — 문자열이면 기존 동작 | 변화 없음 | |
| childRole=fn(entity, state) | level=1 노드 | fn 호출 → 'group' 반환 | 함수면 노드별 호출 | role='group' | |
| childRole=fn(entity, state) | level=2 노드 | fn 호출 → 'option' 반환 | 함수면 노드별 호출 | role='option' | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| checkedTracking=false인 패턴 | __checked__ 엔티티 없음 | checked axis 미사용 패턴에 영향 없어야 | NodeState.checked = undefined | 기존 동작 유지 | |
| childRole 함수가 undefined 반환 | 특정 노드 | 기본값 폴백 | role='row' (기존 기본값) | | |
| empty store에서 mixed 계산 | 자식 0개인 parent | 자식이 없으면 집계 불가 | checked=직접 조회 (leaf처럼) | | |
| useAriaZone에서 checked | zone-local state | meta command 분리 원칙 | `core:check`, `core:uncheck`, `core:toggle-check`가 zone-local | | |
| 기존 checkbox 테스트 | expand 기반 | 마이그레이션 후에도 동일 결과 | aria-checked 동작 불변 | | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ARIA 표준 용어 우선 (feedback) | checked axis 이름 | ✅ 준수 | — | |
| 2 | 축=ARIA 상태 속성 매핑 (이번 discuss) | checked axis 신설 | ✅ 준수 | — | |
| 3 | 선언적 OCP (feedback) | childRole 함수 | ✅ 준수 — 기존 string도 동작, 함수로 확장 | — | |
| 4 | Pattern은 조립 블록 (feedback) | checkboxMixed | ✅ composePattern 사용 | — | |
| 5 | 테스트: 인터랙션 통합 (CLAUDE.md) | 기존 테스트 마이그레이션 | ✅ 기존 테스트 결과 불변 | — | |
| 6 | Plugin은 keyMap 소유 (feedback) | activate의 toggleExpand | ⚠️ 검토 필요 — activate에서 checked 분기 추가 | activate가 checked 패턴이면 toggleCheck 호출 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | checkbox.ts — expand → checked 전환 | 기존 APG 테스트 실패 가능 | 중 | 테스트 내부 구현은 변경 없이 결과만 동일 확인 | |
| 2 | switch.ts — 동일 | 동일 | 중 | 동일 | |
| 3 | buttonToggle.ts — 동일 | 동일 | 중 | 동일 | |
| 4 | activate axis — toggleExpand와 toggleCheck 분기 | ctx.activate() 로직 변경 | 중 | checkedTracking이면 toggleCheck, expandable이면 toggleExpand | |
| 5 | useAriaZone META_COMMAND_TYPES — 새 커맨드 추가 | zone에서 checked 미처리 | 중 | `core:check`, `core:uncheck`, `core:toggle-check` 추가 | |
| 6 | useAriaView getNodeState — checked 필드 추가 | 기존 소비자에 새 필드 노출 | 낮 | optional이므로 영향 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | expand axis에 mixed 상태 추가 | ⑤#2 축=ARIA 매핑 | aria-expanded는 tri-state 아님 (ARIA 표준) | |
| 2 | radiogroup/toolbar를 checked로 전환 | ① Non-Goals | 이들은 select axis가 의미적으로 올바름 | |
| 3 | childRole에 level만 전달하는 시그니처 | ⑤#3 OCP | entity+state 전달해야 level 외 조건도 가능 | |
| 4 | checked와 expanded를 동시에 하나의 NodeState에서 undefined로 만들기 | ⑥#6 | 독립 축이므로 각자의 tracking flag로 독립 판정 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | checkbox Space toggle → aria-checked 전환 | 기존 테스트 통과 (결과 불변) | |
| V2 | S2 | mixed-state checkbox: 자식 일부 check → 부모 aria-checked="mixed" | 부모 노드 aria-checked="mixed" | |
| V3 | S2 | mixed-state: 부모 Space → 전체 check | 모든 자식+부모 aria-checked="true" | |
| V4 | S3 | switch Space toggle | aria-checked 전환, expand axis 미사용 | |
| V5 | S4 | buttonToggle Space toggle | aria-pressed 전환, expand axis 미사용 | |
| V6 | S5 | table 렌더링 — level별 role | level 1 노드 role=rowgroup, level 2 role=row | |
| V7 | S6 | listbox grouped — level별 role | level 1 role=group, level 2 role=option | |
| V8 | ④ | checkedTracking=false 패턴 | NodeState.checked===undefined | |
| V9 | ④ | 기존 tree/treegrid/accordion 테스트 | 전부 통과 (expand 무관) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
