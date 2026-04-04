# Chroma Ladder — Selection 3토큰 분리 — PRD

> Discussion: accent 최소화 — chroma=행동 긴급도, hue 250 고정 5단계 사다리

## ① 동기

### WHY

- **Impact**: grid에서 커서 셀·선택 행·multi-select가 모두 같은 blue-100 배경 → 사용자가 "지금 어디서 행동하는지" 시각적으로 구분 불가. 행이 셀보다 눈에 띄어서 위계가 역전됨.
- **Forces**: `--selection` 토큰 1개가 cursor/selection/context 3역할 겸용. aria-selected는 W3C 표준이라 시맨틱 변경 불가. 기존 25+ 사용처 호환 필요.
- **Decision**: hue 250 고정, chroma만 3단계 분리(0.015→0.034→0.070). 같은 파란 계열에서 강약으로 읽히도록. 기각: stone(무채색) context → hue 연결 끊겨 선택 계열 인지 약화.
- **Non-Goals**: tone: 'accent'(CTA 버튼, chroma 0.17) 변경 없음. grid 외 패턴(listbox/treeview)의 기존 selection 변경 없음.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | grid에 여러 행이 있다 | 한 행의 셀에 커서를 둔다 | 커서 셀(blue-200)이 행 배경(blue-50)보다 확실히 눈에 띈다 | |
| S2 | grid에서 커서가 있는 행 | 다른 행을 본다 | 커서 행은 blue-50 틴트, 나머지 행은 배경색 없음 → 위치 안내 | |
| S3 | grid에서 multi-select로 3행 선택 | 선택된 행들을 본다 | 선택 행은 blue-100, 커서 셀은 blue-200 → 3단 위계 구분 가능 | |
| S4 | listbox에서 항목 선택 | 선택된 항목을 본다 | 기존 blue-100 유지 (변경 없음) | |
| S5 | 다크 모드에서 grid 조작 | 커서 셀과 행을 본다 | 라이트와 동일한 3단 위계가 chroma 차이로 구분됨 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `tokens.css` — `--selection-context` | grid row용 약한 선택 배경 (light: blue-50, dark: oklch(24% 0.020 250)) | |
| `tokens.css` — `--selection-cursor` | focused+selected용 강한 선택 배경 (light: blue-200, dark: tone-primary-mid) | |
| `tokens.css` — `--selection` | 기존 유지 (light: blue-100, dark: oklch(28% 0.037 250)) | |
| `interactive.css` — grid row 셀렉터 | `[role="row"][aria-selected]` → `--selection-context` | |
| `interactive.css` — cursor 셀렉터 | focused+selected → `--selection-cursor` | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑↓ 키 | 커서가 row A에 있다 | row B로 이동 | cursor 위치 변경 → context가 따라감 | row B = context(blue-50), row A = 배경 없음 | |
| ←→ 키 | 커서가 col 1에 있다 | col 2로 이동 | cell cursor 이동 → cursor(blue-200)가 따라감 | col 2 셀 = cursor(blue-200), col 1 셀 = row context(blue-50) | |
| Shift+Click | 커서가 row 1, 선택 없음 | row 3을 Shift+Click | range select → 선택된 아이템은 selection 레벨 | row 1~3 = selection(blue-100), 커서 셀 = cursor(blue-200) | |
| Click | 커서가 row 1 | row 5 클릭 | 단일 선택 이동 → context 이동 | row 5 = context(blue-50), row 1 = 배경 없음 | |
| 테마 전환 | 라이트 모드 | 다크 모드로 전환 | 같은 hue 250, 다크 palette에서 chroma 비율 유지 | 3단 위계 동일하게 보임 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| treegrid row | treegrid에서 row 선택 | treegrid도 role="row" → 같은 grid 계열 | context(blue-50) 적용 | grid와 동일 | |
| tab selected | 탭바에서 탭 선택 | tab은 이미 별도 규칙(border+color, bg transparent) | 변경 없음 | 기존 유지 | |
| listbox option | listbox에서 항목 선택 | role="option"에는 row 규칙 미적용 | --selection(blue-100) 유지 | 기존 유지 | |
| disabled+selected row | grid row가 disabled이면서 selected | disabled opacity + context 배경 중첩 | context(blue-50) + opacity 0.4 | 기존 disabled 처리와 동일 구조 | |
| focus 이탈 | 컨테이너에서 focus 빠짐 | cursor는 시각 피드백 약해야(idle) | cursor 셀 → focus-idle, 행 context는 유지 | focus-within 없으면 outline만 제거 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 색=강조 목적만, 그 외 무채색 (feedback_design_css_principles) | ② 토큰 설계 | ✅ 준수 — chroma ladder가 "강조"의 강도를 기계적으로 정의 | — | |
| 2 | surface 소유 속성에 module.css last-mile 금지 (feedback_surface_no_lastmile) | ② CSS 셀렉터 | ✅ 준수 — interactive.css에서 처리, module.css 불필요 | — | |
| 3 | 같은 역할=같은 디자인 (feedback_design_css_principles) | ④ treegrid | ✅ 준수 — 모든 grid 계열 role="row"가 동일 규칙 | — | |
| 4 | focus/selection/activation 별개 개념 (feedback_apg_three_concepts) | ③ 인터페이스 | ✅ 준수 — cursor(focus+select)와 selection이 시각적으로 분리됨 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | interactive.css [aria-selected] 규칙 | grid row만 분기, 나머지 동일 → 영향 없음 | 낮 | 허용 | |
| 2 | tokens.css 토큰 2개 추가 | 토큰 수 증가 | 낮 | 허용 — 의미론적 구분이 있으므로 정당 | |
| 3 | focused+selected 복합 규칙 변경 | 모든 패턴의 focused+selected bg가 blue-200으로 변경 | 중 | 허용 — cursor가 더 눈에 띄는 것은 모든 패턴에서 바람직 | |
| 4 | pattern examples CSS (25+ 파일) | 대부분 `var(--selection)` 사용 → 토큰 값 변경 없으므로 영향 없음 | 낮 | 허용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | listbox/treeview의 --selection을 --selection-context로 바꾸기 | ⑥-3 범위 통제 | grid 계열만 row/cell 구분이 있음. 다른 패턴은 기존 유지 | |
| 2 | module.css에서 --selection-* 토큰 오버라이드 | ⑤-2 surface 원칙 | selection은 interactive.css가 소유. last-mile 금지 | |
| 3 | hue를 250이 아닌 값으로 변경 | 설계 원칙 | 단일 스케일 읽기 위해 hue 고정 필수 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | grid에서 셀에 커서 → 해당 셀 배경이 blue-200, 행 배경이 blue-50 | 셀 chroma > 행 chroma | |
| V2 | S3 | multi-select 3행 + 커서 → 선택 행 blue-100, 커서 셀 blue-200 | 3단 위계 시각 구분 | |
| V3 | S4 | listbox 선택 → 배경 blue-100 | 기존과 동일 | |
| V4 | S5 | 다크 모드 grid → 커서/선택/행 3단 위계 | chroma 비율 동일 | |
| V5 | ④-treegrid | treegrid row 선택 → blue-50 context | grid와 동일 규칙 | |
| V6 | ④-focus이탈 | focus 이탈 시 cursor outline 제거, context 유지 | 위치 안내는 유지 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
