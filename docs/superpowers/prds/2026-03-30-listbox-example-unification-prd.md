# ListBox Example → UI 완성품 기반 전환 — PRD

> Discussion: examples/가 ui/ 완성품을 소비하여 APG를 재현. 의존 방향: examples → ui → pattern. drift 제거 + APG 검증 유지.

## ① 동기

### WHY

- **Impact**: pattern/examples/와 ui/가 같은 pattern을 별도 React 컴포넌트로 중복 구현. pattern 변경 시 두 곳 수정 필요, drift 필연.
- **Forces**: APG conformance 검증 필수 vs 중복 유지 보수 비용. examples/→pattern 직접 의존(현재) vs examples/→ui/ 의존(이상).
- **Decision**: examples를 ui/ListBox의 사용 사례로 전환. 3축(data/plugins/renderItem)의 조합으로 APG 변형 재현. 기각: examples 삭제(APG 검증 소멸), 별도 유지(drift 해소 안 됨).
- **Non-Goals**: 전체 60+ examples 전환 (이번은 listbox 3변형만). ui/ListBox API 대규모 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | ListboxScrollable가 Aria + listbox() 직접 사용 | ui/ListBox 기반으로 전환 | `<ListBox data={elements} />` — 동일 APG 키보드, drift 불가 | |
| M2 | ListboxGrouped가 Aria + listboxGrouped 직접 사용 | ui/ListBoxGrouped 별도 완성품 생성 | `<ListBoxGrouped data={grouped} />` — role 구조가 다르므로 별도 | |
| M3 | ListboxRearrangeable이 Aria 2개 + 자체 상태관리 | ui/ListBox 2개 + 외부 toolbar로 전환 | `<ListBox>` × 2 — plugins + renderItem 조합, pattern 동일 | |
| M4 | pattern 변경 발생 | examples/ 수정 불필요 | examples/→ui/→pattern 일직선, 자동 반영 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/ListBoxGrouped.tsx` (신규) | listboxGrouped pattern 기반 완성품. AriaComponentProps extends. 동적 childRole(group/option) | |
| `examples/ListboxScrollable.tsx` (리팩터) | `<ListBox data={...} />` 기반. useAria/Aria 직접 사용 제거 | |
| `examples/ListboxGrouped.tsx` (리팩터) | `<ListBoxGrouped data={...} renderItem={...} />` 기반 | |
| `examples/ListboxRearrangeable.tsx` (리팩터) | `<ListBox>` × 2 + 외부 toolbar. useAria/Aria 직접 사용 제거 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `<ListBox data={flat26} />` | Scrollable | 기본 renderItem + 기본 plugins | listbox()가 vertical nav + multi-select 제공 | APG Scrollable 재현 | |
| `<ListBoxGrouped data={grouped} renderItem={groupRenderer} />` | Grouped | group/option 구분 렌더링 | listboxGrouped가 동적 childRole + group skip 제공 | APG Grouped 재현 | |
| `<ListBox data={zone1} selectionMode="multiple" renderItem={checkRenderer} />` × 2 + toolbar | Rearrangeable | 두 ListBox selected를 외부에서 읽고 toolbar로 이동 | listbox() + 외부 상태 조합 | APG Rearrangeable 재현 | |
| ListBoxGrouped에 plugins 전달 | 기본 grouped | 동일 plugin 메커니즘 | AriaComponentProps 공유 | Write 확장 동일 동작 | |

- `selectionMode` prop: pattern config (role 구조 불변), 완성품 prop으로 노출 OK

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| ListBoxGrouped에 flat 데이터 | grouped pattern, hierarchy 없음 | group 없으면 전부 option 동작 | flat fallback, 일반 listbox처럼 | 포커스/선택 정상 | |
| Rearrangeable 한쪽 빈 배열 | 아이템 전부 이동됨 | 빈 ListBox는 유효 상태 | 빈 컨테이너 렌더, 포커스 없음 | 반대쪽서 이동 가능 | |
| examples/가 ui/ 없는 prop 사용 | TypeScript 컴파일 | examples→ui 의존으로 drift 즉시 감지 | 빌드 실패 | 수정 필요 | |
| ListBoxGrouped renderItem이 group에서 null | group 헤더 렌더링 | group은 시각적 컨테이너 | 기본 group renderer fallback | group 헤더 표시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Pattern 변경 = 별도 완성품 (feedback_pattern_change_means_new_component) | ② ListBoxGrouped 별도 | ✅ 준수 | — | |
| 2 | example은 ui 완성품 소비 (project_example_consumes_ui) | ② examples 리팩터 | ✅ 준수 | — | |
| 3 | Pattern은 정체성 (feedback_pattern_is_identity) | ② ListBox vs ListBoxGrouped | ✅ 준수 | — | |
| 4 | os 기반 개발: pages에서 useAria 금지 (CLAUDE.md) | ② examples가 ui/ 소비 | ✅ 준수 | — | |
| 5 | 테스트 = 데모 = showcase (feedback_test_equals_demo) | ② examples = showcase + APG 검증 | ✅ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | examples/ 3개 파일 | APG conformance test fixture 깨짐 가능 | 중 | conformance test fixture 함께 확인 | |
| 2 | showcase 라우트 | import 경로 변경 | 낮 | import만 변경 | |
| 3 | ui/ 폴더 | ListBoxGrouped 신규 추가, registry 등록 필요 | 낮 | 허용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | examples/에서 useAria/Aria 직접 사용 | ⑤-2 | examples→ui 의존 원칙 | |
| 2 | ListBox에 grouped prop 추가 | ⑤-1 | role 구조 다르면 별도 완성품 | |
| 3 | examples/ CSS 새로 만들기 | ⑥-2 | ui/ 완성품 CSS 사용, renderItem으로 커스텀 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①-M1 | ListboxScrollable이 `<ListBox>` 사용, ArrowDown/Up/Home/End | APG conformance 통과 | |
| V2 | ①-M2 | ListboxGrouped가 `<ListBoxGrouped>` 사용, group 건너뛰기 | APG conformance 통과 | |
| V3 | ①-M3 | ListboxRearrangeable이 `<ListBox>` × 2, toolbar 이동 | APG conformance 통과 | |
| V4 | ①-M4 | listbox pattern 변경 후 examples/ 미수정 | 여전히 정상 동작 | |
| V5 | ④-1 | ListBoxGrouped에 flat 데이터 | 일반 listbox처럼, 에러 없음 | |
| V6 | ④-3 | ui/ListBox prop 변경 후 examples/ 빌드 | TypeScript 에러로 drift 감지 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
