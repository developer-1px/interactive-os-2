# APG Pattern Example Architecture — PRD

> Discussion: pattern/examples(headless)와 ui(완성품) 사이에 APG example React+CSS 구현 레이어가 없어서, UI 완성품의 APG 적합성이 구조적으로 보장되지 않는다. pattern/examples → pattern/roles rename + ui/examples/ 신설로 해소.

## ① 동기

### WHY

- **Impact**: UI 완성품(ui/*.tsx)이 APG를 지키는지 검증할 수단이 없다. pattern 레벨(headless)에서만 conformance를 확인했지, 실제 렌더링되는 컴포넌트에서 role/aria-*/키보드가 정확한지는 미검증. CSS 완성의 기준점도 개별 UI 설계에 의존.
- **Forces**: (1) pattern은 headless — React를 import할 수 없음 (레이어 제약). (2) ui 완성품은 pattern을 하드코딩 — APG example의 variant(grouped, manual, mixed 등)를 커버하지 못함. (3) APG example을 demo용 일회성 컴포넌트로 만들면 낭비.
- **Decision**: ui/examples/에 Aria primitives + role별 공유 CSS로 APG example을 1:1 구현. pattern/examples는 headless export이므로 roles/로 rename하여 역할 명확화. 기각: (a) ui 완성품을 examples에서 import → 순환 의존, (b) 새 레이어 신설 → ui 안에서 해결 가능, (c) primitives/examples/ → primitives 역할 과잉.
- **Non-Goals**: ui/ 완성품 재구성은 이 PRD 범위 밖 (별도 PRD). 이 PRD는 인프라(rename) + ui/examples/ 생성까지.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | pattern/roles/listbox.ts에 headless 패턴이 있고 ui/examples/ListboxScrollable.tsx가 존재할 때 | /internals/pattern/listbox 페이지를 열면 | APG Scrollable Listbox example과 동일한 구성의 인터랙티브 데모가 보인다 | |
| S2 | ui/examples/ListboxGrouped.tsx가 존재할 때 | conformance 테스트를 실행하면 | render된 DOM의 role 계층, aria-* 속성, 키보드 동작이 APG와 일치한다 | |
| S3 | 개발자가 새 APG example을 추가하려 할 때 | ui/examples/에 파일을 만들면 | Aria primitives + pattern/roles import + role CSS 공유로 일관된 구조로 작성할 수 있다 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `pattern/roles/` | pattern/roles/ → pattern/roles/ rename. 모든 import 경로 일괄 변경 (82개 파일) | |
| `ui/examples/` | 신설 폴더. APG example 1:1 React+CSS 구현 | |
| `ui/examples/{PatternName}.tsx` | 각 APG example별 React 컴포넌트. Aria primitives + pattern/roles import. APG 원본 데이터 구성 사용 | |
| `ui/examples/{role}.module.css` | role 기반 공유 CSS. 같은 role의 example들이 공유 (예: listbox.module.css → Scrollable, Grouped 공유) | |
| `ui/examples/index.ts` | 전체 example export barrel | |
| `.dependency-cruiser.cjs` 수정 | pattern/examples → pattern/roles 경로 반영 | |

### 대상 APG example 목록 (🟢 47개 중 고유 패턴 29개)

다수의 APG example이 같은 pattern/roles 파일을 공유하므로 (예: Combobox 4개 → combobox.ts 1개), ui/examples/는 **APG example 단위**로 만든다:

| role CSS | ui/examples/ 파일 | APG # | pattern/roles |
|----------|-------------------|-------|---------------|
| accordion.module.css | Accordion.tsx | #1 | accordion |
| alert.module.css | Alert.tsx | #2 | alert |
| alertdialog.module.css | AlertDialog.tsx | #3 | alertdialog |
| button.module.css | ButtonToggle.tsx | #5 | buttonToggle |
| checkbox.module.css | Checkbox.tsx | #9 | checkbox |
| checkbox.module.css | CheckboxMixed.tsx | #10 | checkboxMixed |
| combobox.module.css | ComboboxSelectOnly.tsx | #11 | combobox |
| combobox.module.css | ComboboxAutocompleteNone.tsx | #12 | combobox |
| combobox.module.css | ComboboxAutocompleteList.tsx | #13 | combobox |
| combobox.module.css | ComboboxAutocompleteBoth.tsx | #14 | combobox |
| dialog.module.css | Dialog.tsx | #17 | dialog |
| disclosure.module.css | DisclosureCard.tsx | #19 | disclosure |
| disclosure.module.css | DisclosureFaq.tsx | #20 | disclosure |
| disclosure.module.css | DisclosureImage.tsx | #21 | disclosure |
| disclosure.module.css | DisclosureNavHybrid.tsx | #22 | disclosure |
| disclosure.module.css | DisclosureNav.tsx | #23 | disclosure |
| feed.module.css | Feed.tsx | #24 | feed |
| grid.module.css | GridData.tsx | #25 | grid |
| grid.module.css | GridLayout.tsx | #26 | grid |
| link.module.css | Link.tsx | #35 | link |
| listbox.module.css | ListboxScrollable.tsx | #36 | listbox |
| listbox.module.css | ListboxGrouped.tsx | #38 | listboxGrouped |
| menu.module.css | MenuButtonActions.tsx | #41 | menu |
| menu.module.css | MenuButtonActivedescendant.tsx | #42 | menuActivedescendant |
| menu.module.css | MenuButtonNav.tsx | #43 | menu |
| meter.module.css | Meter.tsx | #44 | meter |
| radiogroup.module.css | RadioGroup.tsx | #45 | radiogroup |
| radiogroup.module.css | RadioGroupActivedescendant.tsx | #46 | radiogroupActivedescendant |
| radiogroup.module.css | RadioGroupRating.tsx | #47 | radiogroup |
| slider.module.css | SliderColor.tsx | #48 | slider |
| slider.module.css | SliderRating.tsx | #49 | slider |
| slider.module.css | SliderSeek.tsx | #50 | slider |
| slider.module.css | SliderTemperature.tsx | #51 | slider |
| spinbutton.module.css | Spinbutton.tsx | #53 | spinbutton |
| switch.module.css | Switch.tsx | #54 | switchPattern |
| switch.module.css | SwitchButton.tsx | #55 | switchPattern |
| switch.module.css | SwitchCheckbox.tsx | #56 | switchPattern |
| table.module.css | Table.tsx | #57 | table |
| tabs.module.css | TabsAutomatic.tsx | #59 | tabs |
| tabs.module.css | TabsManual.tsx | #60 | tabsManual |
| toolbar.module.css | Toolbar.tsx | #61 | toolbar |
| tree.module.css | TreeComputed.tsx | #63 | tree |
| tree.module.css | TreeDeclared.tsx | #64 | tree |
| tree.module.css | TreeNav.tsx | #65 | tree |
| treegrid.module.css | Treegrid.tsx | #66 | treegrid |
| separator.module.css | WindowSplitter.tsx | #67 | windowSplitter |

> 47개 example → 46 tsx + 19 CSS = 65 파일 신규 생성

완성도: 🟡 ← ① 🟡이므로 잠정

## ③ 인터페이스

> ui/examples/ 컴포넌트의 인터페이스는 APG 키보드 스펙 그대로. 이 PRD의 인터페이스는 **아키텍처 구조의 인터페이스** — 파일 간 import 관계와 데이터 흐름.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ui/examples/ListboxScrollable.tsx | 파일 없음 | Aria + listbox() + APG #36 데이터로 렌더링 | APG example 재현이 목적이므로 Aria primitives 직접 사용. ui/ListBox import하면 순환 의존 | role=listbox, option 5개, 키보드 동작 APG 일치 | |
| pattern/roles/listbox.ts | pattern/roles/listbox.ts에서 rename | import 경로만 변경, export 동일 | headless 역할 명확화 (examples → roles). 코드 변경 없음 | 82개 import 경로 갱신 | |
| ui/examples/listbox.module.css | 파일 없음 | ListboxScrollable, ListboxGrouped 공유 CSS | 같은 role = 같은 디자인 원칙. role 단위 CSS 공유 | option 스타일, focus/selected 상태 표현 | |
| /internals/pattern/listbox MD | ShowcaseDemo + PatternDemo 사용 중 | ui/examples/ 컴포넌트로 교체 | APG 원본 구성을 보여주는 것이 이 페이지의 목적 | APG example 그대로 데모 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| ⛔ multi-zone example (Carousel, Menubar 등 10개) | os 갭으로 불가 | composePattern이 단일 zone만 지원하는 아키텍처 제약 | ui/examples/에 만들지 않는다. 매트릭스 ⛔ 유지 | 대상 47개 중 multi-zone 제외한 것만 구현 | |
| 같은 pattern/roles가 여러 example에 쓰이는 경우 (combobox → 4개) | combobox.ts 하나 | APG example별로 다른 autocomplete 모드/데이터 구성 | 각 example이 별도 tsx. CSS는 공유. 데이터와 plugin 설정만 다름 | 4개 tsx + 1개 CSS | |
| 🟡 Breadcrumb (#4) — pattern/roles 파일 없음 | static HTML | engine 불필요한 시맨틱 구조 | ui/examples/ 대상에서 제외. 🟡 유지 | | |
| 🟡 Sortable Table (#58) — aria-sort 미구현 | table.ts 구조만 동일 | sort 상태 관리는 별도 axis/plugin 필요 | Table.tsx는 #57만 구현. #58은 🟡 유지 | | |
| pattern/roles rename 시 82개 파일 일괄 변경 | examples/ 경로 사용 중 | 원자적 실행 원칙 — 점진적 전환하면 중간 상태에서 빌드 깨짐 | git mv + sed 일괄. 단일 커밋 | 모든 import 정합 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | os 기반 개발: pages/에서 useAria/useAriaZone 직접 사용 금지 (CLAUDE.md) | ui/examples/ | 미위반 | ui/examples/는 ui 레이어이므로 Aria primitives 사용 가능 | |
| P2 | 같은 역할 = 같은 디자인 (feedback_same_role_same_design) | role별 CSS 공유 | 미위반 | listbox.module.css → Scrollable/Grouped 공유로 준수 | |
| P3 | 대규모 rename은 원자적 실행 (feedback_atomic_restructure) | rename 82파일 | 미위반 | 단일 커밋으로 실행 | |
| P4 | Pattern = composePattern + examples/APG (feedback_pattern_apg_only) | rename | 주의 | roles/로 rename 후에도 이 원칙의 "examples"가 가리키는 대상이 바뀜. 원칙 표현 갱신 필요 | |
| P5 | CSS 모든 수치는 토큰 필수 (feedback_all_values_must_be_tokens) | role CSS 작성 | 미위반 | tokens.css 참조 강제 | |
| P6 | module.css 3블록: base→variant→size (feedback_module_css_3block_recipe) | role CSS 구조 | 미위반 | 3블록 레시피 적용 | |
| P7 | 레이어 의존 순서 (CLAUDE.md + dependency-cruiser) | ui/examples/ → pattern/roles, primitives | 미위반 | ui → pattern 정방향 | |
| P8 | 테스트=데모=showcase 수렴 (feedback_test_equals_demo) | ui/examples/ | 미위반 | examples가 데모이자 conformance 테스트 대상 | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | pattern/roles/ import 경로 82개 | 경로 변경 실패 시 빌드 깨짐 | 높 | 원자적 일괄 변경 + typecheck 검증 | |
| B2 | conformance 테스트 37개 | import 경로만 변경, 테스트 로직 불변 | 낮 | rename 후 전체 테스트 실행 | |
| B3 | /internals/pattern 데모 페이지 | 현재 ShowcaseDemo/PatternDemo → ui/examples/ 교체 | 중 | 교체 시 기존 데모 유지 후 전환 | |
| B4 | ui/PatternDemo.tsx | ui/examples/ 완성 후 불필요해짐 | 낮 | examples 완성 후 제거 | |
| B5 | memory feedback_pattern_apg_only | "examples"가 가리키는 대상이 roles/로 바뀜 | 낮 | memory 갱신 | |
| B6 | dependency-cruiser 설정 | pattern/examples → pattern/roles 경로 반영 필요 여부 확인 | 낮 | 설정 확인 후 필요 시 수정 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | ui/examples/에서 ui/ 완성품(ListBox 등) import 금지 | ⑤ 순환 의존 방지 | examples가 완성품에 의존하면 기준점 역할 불가 | |
| F2 | pattern/roles/에 React import 금지 | ⑤ P7 레이어 제약 | pattern은 headless. dependency-cruiser가 차단 | |
| F3 | rename 점진적 전환 금지 | ⑤ P3 원자적 실행 | 중간 상태에서 examples/와 roles/가 혼재하면 혼란 | |
| F4 | ui/examples/에서 APG 원본과 다른 데이터 구성 사용 금지 | ① S1 APG 재현 목적 | APG example 크롤링하여 원본 아이템 구성 사용 | |
| F5 | role CSS에 raw 수치 금지 | ⑤ P5 토큰 필수 | tokens.css 참조만 허용 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | /internals/pattern/listbox 데모에 ListboxScrollable + ListboxGrouped가 보인다 | APG 원본과 동일한 아이템 구성, 키보드 동작 | |
| V2 | ①S2 | ui/examples/ListboxScrollable.tsx render → captureAriaTree | role=listbox > role=option × N, aria-selected 등 APG 일치 | |
| V3 | ①S3 | ui/examples/ 폴더에 일관된 파일 구조 | 모든 example이 Aria + roles/ import + role CSS 공유 | |
| V4 | ④ rename | pnpm typecheck + pnpm test 통과 | 0 new errors | |
| V5 | ④ multi-zone | ⛔ 10개 example이 ui/examples/에 없다 | 매트릭스 ⛔ 유지, 범위 내 46개만 구현 | |
| V6 | ⑤ P7 | pnpm check:deps 통과 | 0 dependency violations | |
| V7 | ④ CSS 공유 | listbox.module.css가 Scrollable, Grouped 양쪽에서 import됨 | 동일 스타일 적용 | |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과.

### 실행 Phase

- **Phase 1**: pattern/examples → pattern/roles rename (원자적, 단일 커밋, 82파일)
- **Phase 2**: ui/examples/ 생성 (패턴 그룹 단위 점진적, APG 원본 데이터 크롤링 포함)
