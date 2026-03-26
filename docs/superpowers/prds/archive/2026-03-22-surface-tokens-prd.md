# Surface 기반 CSS 토큰 체계 — PRD

> Discussion: surface(6단계 번들) + semantic color(primary/focus/selection/destructive)로 UI 디자인 최소화. `data-surface` 속성 하나로 bg+border+shadow 자동. alias 점진적 마이그레이션.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | tokens.css에 `--surface-0~4`가 bg만 담당하고, border/shadow는 별도 변수 | 컴포넌트에 시각적 깊이를 입힐 때 | 개발자가 bg + border + shadow 3개를 개별 조합해야 함 → 일관성 깨짐 위험 | |
| M2 | `--accent`이 primary(버튼/CTA)와 focus(키보드 포커스)를 겸하고 있음 | focus ring 색상만 바꾸고 싶을 때 | primary도 같이 바뀌어서 독립 제어 불가 | |
| M3 | surface level이 숫자(0~4)로 명명됨 | 코드에서 `--surface-3`을 볼 때 | "이게 카드인지 모달인지" 의미를 알 수 없음 | |
| M4 | 테마 전환 시 surface별 border/shadow 대응이 수동 | light↔dark 테마를 전환할 때 | surface level에 맞는 border/shadow를 각 파일에서 개별 관리 → 누락 발생 | |

완성도: 🟢

## ② 산출물

> tokens.css 내부 구조 변경. 새 파일 생성 없음.

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| **Surface 토큰 6단계** | `--surface-base`, `--surface-sunken`, `--surface-default`, `--surface-raised`, `--surface-overlay` (bg 값). `--surface-outlined`는 bg transparent | `tokens.css::--surface-base/sunken/default/raised/overlay` |
| **`[data-surface]` 셀렉터 블록** | 각 level별 `background`, `border`, `box-shadow` 번들 적용. `:root`(dark) + `[data-theme="light"]` 양쪽에 정의 | `tokens.css::[data-surface="*"]` |
| **Surface별 번들 매핑** | base: bg만 / sunken: bg만 / default: bg만 / raised: bg+border+shadow / overlay: bg+border+shadow / outlined: transparent bg+border | `tokens.css::[data-surface="*"]` |
| **Semantic color 토큰** | `--primary`, `--primary-foreground`, `--primary-dim` / `--focus` / `--selection` / `--destructive`, `--destructive-foreground` | `tokens.css::--primary/--focus/--selection/--destructive` |
| **하위호환 alias** | `--surface-0` → `--surface-base`, `--accent` → `--primary`, `--bg-focus` → `--primary-dim`, `--bg-select` → `--selection` 등 | ❌ alias 미구현 (구 변수 참조 0건, 직접 마이그레이션 완료) |

완성도: 🟢

## ③ 인터페이스

> 이 작업은 CSS 토큰 리팩터링이므로 사용자 인터랙션이 아닌 **개발자 API 인터페이스**를 정의한다.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| HTML 요소에 `data-surface="raised"` 추가 | 스타일 없음 | bg(zinc-800) + border(1px solid border-subtle) + shadow(shadow-md) 자동 적용 | `[data-surface="raised"]` 셀렉터가 3속성을 번들로 선언하므로 | 요소가 raised 깊이로 렌더링 | |
| HTML 요소에 `data-surface="outlined"` 추가 | 스타일 없음 | bg transparent + border(1px solid border-default) 적용, shadow 없음 | outlined는 깊이를 주장하지 않고 선으로만 경계 표현. bg transparent로 부모 surface 상속 | 부모 배경 위에 선으로만 구분된 요소 | |
| CSS에서 `var(--primary)` 참조 | — | indigo-500 (dark) / indigo-600 (light) 반환 | semantic color로 브랜드/CTA 전용 색상 | 버튼, 링크 등에 primary color 적용 | |
| CSS에서 `var(--focus)` 참조 | — | primary에서 파생된 focus 전용 값 반환 | focus는 primary와 같은 hue이되 별도 제어 가능 | 포커스 링에 focus color 적용 | |
| CSS에서 `var(--selection)` 참조 | — | green 계열 (#1A3A2A dark / #E8F5E9 light) 반환 | selection은 primary와 독립된 축 | 선택된 아이템 배경에 selection color 적용 | |
| CSS에서 `var(--accent)` 참조 (기존 코드) | 기존 코드 | `var(--primary)` 값 반환 (alias) | 하위호환 alias가 신 변수로 위임 | 기존 코드 동작 불변 | |
| CSS에서 `var(--surface-3)` 참조 (기존 코드) | 기존 코드 | `var(--surface-raised)` 값 반환 (alias) | 하위호환 alias가 신 변수로 위임 | 기존 코드 동작 불변 | |
| `[data-theme="light"]` 활성화 | dark 테마 | 모든 surface + semantic color 값이 light 세트로 전환 | 테마별 토큰 블록이 변수 값을 재정의 | 전체 UI가 light 테마로 렌더링 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| `data-surface="outlined"` 요소가 sunken surface 위에 있음 | 부모가 sunken bg | outlined는 깊이를 주장하지 않으므로 부모 배경을 상속해야 함 | bg transparent → sunken 배경 보임 + border만 표시 | sunken 위에 선으로 구분된 요소 | |
| `data-surface` 중첩: raised 안에 sunken | 외부 raised, 내부 sunken | surface는 각 요소에 독립 적용. 중첩 상속이 아닌 개별 선언 | 내부 요소는 sunken bg로 렌더링 (raised와 무관) | raised 카드 안에 들어간 인셋 영역 | |
| alias 변수와 신 변수를 같은 파일에서 혼용 | 마이그레이션 중간 상태 | alias가 신 변수를 가리키므로 값은 동일 | 시각적 차이 없음 | 동일 렌더링 | |
| `data-surface` 없이 bg만 직접 지정 | 마이그레이션 전 코드 | 기존 코드는 alias를 통해 동일 값 참조 | 기존 동작 불변 | 시각적 변화 없음 | |
| 새로운 surface level 추가 요청 | 6단계 존재 | 6단계가 실용적 상한. Material의 24단계가 과잉이었음 | 추가하지 않고 기존 level로 해결. 불가능하면 별도 논의 | 6단계 유지 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | ARIA 표준 용어 우선, 자체 이름 발명 금지 (feedback_naming_convention) | ② surface 이름 | ✅ 미위반 — base/sunken/raised/overlay는 Atlassian 표준, outlined는 Material 용어 | — | |
| P2 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 산출물 | ✅ 미위반 — tokens.css 파일 변경 없음, 새 파일 없음 | — | |
| P3 | 설계 원칙 > 사용자 요구, engine 우회 금지 (feedback_design_over_request) | ③ alias 하위호환 | ✅ 미위반 — alias는 마이그레이션 경로이지 설계 우회가 아님 | — | |
| P4 | 정규화 트리 순회로 UI 패턴 해결, 타입별 분기 금지 (feedback_normalization_solves_ui) | ② `[data-surface]` 셀렉터 | ✅ 미위반 — surface level은 컴포넌트 타입이 아닌 깊이 속성 | — | |
| P5 | CMS에서 디자인 변경 불가 (feedback_no_design_in_cms) | ③ 테마 전환 | ✅ 미위반 — 테마 토큰은 앱 수준 설정이지 CMS 편집 대상이 아님 | — | |
| P6 | 중첩 렌더링에서 이벤트 버블링 가드 필수 (feedback_nested_event_bubbling) | ④ surface 중첩 | ✅ 미위반 — CSS 속성이므로 이벤트 버블링 무관 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `--accent` 참조 (21개 파일, ~80회) | alias로 `--primary` 위임 → 값 동일하므로 시각적 변화 없음 | 낮 | alias 하위호환 | |
| S2 | `--surface-0~4` 참조 (17개 파일, 88회) | alias로 신 변수 위임 → 값 동일하므로 시각적 변화 없음 | 낮 | alias 하위호환 | |
| S3 | `--bg-focus`, `--bg-select`, `--bg-press` 참조 | alias로 `--primary-dim`, `--selection` 위임 | 낮 | alias 하위호환 | |
| S4 | `--accent-dim`, `--accent-mid`, `--accent-bright` 참조 | alias로 `--primary-dim`, `--primary-mid`, `--primary-bright` 위임 | 낮 | alias 하위호환 | |
| S5 | `*:focus-visible` 글로벌 스타일 (tokens.css:182) | `var(--accent)` → `var(--focus)`로 변경 필요. alias 경유 시 focus=primary가 되어 분리 의미 없음 | 중 | Phase 1에서 `--focus` 참조로 직접 변경 | |
| S6 | light 테마 블록 (`[data-theme="light"]`) | 신 변수에 대응하는 light 값 누락 시 dark 값 유지 | 중 | light 블록에도 동일 구조 반영 필수 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | alias 없이 기존 변수명을 일괄 삭제하지 않는다 | ⑥ S1~S4 | 21개 파일 88+회 참조가 한 번에 깨짐 | |
| F2 | `--focus`를 `--accent` alias로 연결하지 않는다 | ⑥ S5 | focus와 primary 분리가 이 작업의 핵심 동기(M2). alias로 연결하면 분리 의미 없음 | |
| F3 | surface의 border/shadow를 개별 CSS 변수로 노출하지 않는다 | ② 번들 설계 | `--surface-raised-border` 같은 변수를 만들면 소비자가 다시 개별 조합하게 됨. 번들의 의미 상실 | |
| F4 | light 테마 블록 갱신을 빠뜨리지 않는다 | ⑥ S6 | dark만 바꾸고 light를 빠뜨리면 테마 전환 시 깨짐 | |
| F5 | 6단계를 초과하는 surface level을 추가하지 않는다 | ④ 경계 | Material의 24단계가 증명한 과잉 설계. 4~5단계가 업계 합의 상한 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | `.card`에서 `data-surface="raised"` 적용 후 bg/border/shadow 개별 선언 제거 | 시각적 동일. bg(zinc-800) + border(border-subtle) + shadow(shadow-md) 자동 적용 | (시각 확인 — `tokens.css::[data-surface="raised"]`) |
| V2 | ①M2 | `--focus` 값만 변경 (primary 유지) | 포커스 링 색상만 변경, 버튼/링크 색상 불변 | (시각 확인 — `tokens.css::--focus`) |
| V3 | ①M3 | 코드에서 `data-surface="raised"` 검색 | 이름만으로 "떠 있는 카드/패널"임을 알 수 있음 | (grep 검증 — 24개 파일에서 data-surface 사용) |
| V4 | ①M4 | `[data-theme="light"]` 전환 | surface별 bg/border/shadow가 light 값으로 자동 전환 | (시각 확인 — tokens.css light 블록 정의) |
| V5 | ④경계1 | outlined 요소를 sunken surface 위에 배치 | sunken 배경이 투과되고 border만 표시 | (시각 확인) |
| V6 | ④경계2 | raised 안에 sunken 중첩 | 내부는 sunken bg, 외부는 raised bg — 독립 적용 | (시각 확인) |
| V7 | ④경계3 | 마이그레이션 전 코드(`var(--surface-3)`)와 후 코드(`var(--surface-raised)`) 혼재 | alias 덕분에 양쪽 동일 값, 시각적 차이 없음 | (구 변수 참조 0건 — 직접 마이그레이션 완료) |
| V8 | ⑥S5 | `*:focus-visible` outline이 `var(--focus)` 참조 | focus 전용 색상으로 렌더링, `--primary` 변경에 영향받지 않음 | `tokens.css::focus-visible` → `var(--focus)` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

---

## 부록: 토큰 구체 값

### Surface 번들

| surface | bg (dark) | border (dark) | shadow (dark) |
|---------|-----------|---------------|---------------|
| base | `--zinc-950` | 없음 | 없음 |
| sunken | `--zinc-900` | 없음 | 없음 |
| default | `--zinc-850` | 없음 | 없음 |
| raised | `--zinc-800` | `1px solid var(--border-subtle)` | `var(--shadow-md)` |
| overlay | `--zinc-700` | `1px solid var(--border-default)` | `var(--shadow-lg)` |
| outlined | `transparent` | `1px solid var(--border-default)` | 없음 |

| surface | bg (light) | border (light) | shadow (light) |
|---------|------------|----------------|----------------|
| base | `--zinc-100` | 없음 | 없음 |
| sunken | `--zinc-50` | 없음 | 없음 |
| default | `--zinc-0` | 없음 | 없음 |
| raised | `--zinc-0` | `1px solid var(--border-subtle)` | `var(--shadow-md)` |
| overlay | `--zinc-0` | `1px solid var(--border-default)` | `var(--shadow-lg)` |
| outlined | `transparent` | `1px solid var(--border-default)` | 없음 |

### Semantic Color

| 토큰 | dark | light |
|------|------|-------|
| `--primary` | `var(--indigo-500)` | `var(--indigo-600)` |
| `--primary-foreground` | `var(--zinc-0)` | `var(--zinc-0)` |
| `--primary-dim` | `#1E1E3A` | `var(--indigo-50)` |
| `--primary-mid` | `#252550` | `var(--indigo-100)` |
| `--primary-bright` | `#2D2D6B` | `var(--indigo-200)` |
| `--focus` | `var(--primary)` | `var(--primary)` |
| `--selection` | `#1A3A2A` | `#E8F5E9` |
| `--destructive` | `var(--red-500)` | `var(--red-500)` |
| `--destructive-foreground` | `var(--zinc-0)` | `var(--zinc-0)` |

### Alias 매핑

| 구 변수 | 신 변수 |
|---------|---------|
| `--surface-0` | `var(--surface-base)` |
| `--surface-1` | `var(--surface-sunken)` |
| `--surface-2` | `var(--surface-default)` |
| `--surface-3` | `var(--surface-raised)` |
| `--surface-4` | `var(--surface-overlay)` |
| `--accent` | `var(--primary)` |
| `--accent-hover` | `var(--primary-hover)` |
| `--accent-dim` | `var(--primary-dim)` |
| `--accent-mid` | `var(--primary-mid)` |
| `--accent-bright` | `var(--primary-bright)` |
| `--bg-focus` | `var(--primary-dim)` |
| `--bg-select` | `var(--selection)` |
| `--bg-press` | `var(--primary-bright)` |
| `--red` | `var(--destructive)` |
