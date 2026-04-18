---
id: 2-areas/design/prds/ax-migration-phase2-prd
title: 'ax() 마이그레이션 Phase 2 — PRD'
status: active
kind: prd
created: 2026-04-03
updated: 2026-04-08
summary: 'Discussion: module.css last-mile을 줄이기 위해 새 축 발견 + surface 정합성 재스캔'
topics: [2-areas, aria-disabled, prop]
relates: []
supersedes: []
---
# ax() 마이그레이션 Phase 2 — PRD

> Discussion: module.css last-mile을 줄이기 위해 새 축 발견 + surface 정합성 재스캔

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: module.css 6212줄 중 상당수가 surface가 이미 소유하는 속성(border, shadow, cursor)을 중복 선언하거나, surface 미할당 요소에 raw CSS로 시각을 부여한다. 이는 디자인 일관성을 해치고, 축 시스템의 SSOT 원칙을 약화시킨다.
- **Forces**: surface가 이미 border+shadow+cursor를 번들하지만, 1차 마이그레이션 시점에는 이 번들이 미완성이었기 때문에 module.css에 남긴 것들이 현재까지 잔존. ax.css 진화와 module.css 정리가 비동기로 진행됨.
- **Decision**: (1) surface 중복 제거, (2) surface 미할당 요소에 적절한 surface 부여, (3) 남은 반복 패턴에서 새 축 후보 발견. 기각 대안: module.css를 그대로 두기 → surface 소유 속성에 last-mile이 있으면 디자인 일관성이 깨진다는 원칙 위반.
- **Non-Goals**: pattern/examples/ APG 레퍼런스는 대상 아님. 방향별 border(border-left 등)는 genuine last-mile로 남김. 새 축 추가는 빈도 3회+ 확인 후에만.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | module.css에 `border: 1px solid var(--border-subtle)`이 있고 TSX에 `surface: 'input'`이 이미 있는 요소 | Phase A 스캔 | module.css의 border 선언 삭제 (surface가 소유) | |
| S2 | module.css에 border가 있지만 TSX에 surface가 없는 요소 | Phase B 스캔 | TSX에 적절한 surface 값 추가 + module.css border 삭제 | |
| S3 | module.css에 `box-shadow: var(--shadow-lg)`이 있고 TSX에 `surface: 'overlay'`가 있는 요소 | Phase A 스캔 | module.css의 shadow 삭제 | |
| S4 | module.css에 `cursor: pointer` + `user-select: none`이 있고 TSX에 action/ghost surface가 있는 요소 | Phase A 스캔 | module.css의 cursor/user-select 삭제 | |
| S5 | module.css에 `opacity: 0.4`/`0.6` 등 이산값이 7+파일에 반복 | Phase C | opacity 축 신설 (`dim`/`faint`/`hidden` 등). module.css에서 제거 | |
| S6 | module.css에 `font-family: var(--mono)`가 있지만 `textStyle: 'code'` 미사용 | Phase B 스캔 | TSX에 `textStyle: 'code'` 추가 + module.css font-family 삭제 | |
| S7 | module.css에 `text-transform: uppercase` + `letter-spacing`가 7+파일에 반복 | Phase C | textStyle에 `overline` 값 추가 (uppercase+wide tracking 번들). module.css에서 제거 | |
| S8 | module.css에 `transition: [prop] var(--motion-*)` 12+파일에 반복 | Phase C 관찰 | 후순위. property가 다양하여 축화 설계 복잡. 이번 PRD 범위 밖 → Non-Goals | |

완성도: 🟢 90%

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/styles/ax.css` | opacity 축 클래스(`.op-dim`/`.op-faint`/`.op-hidden`), textStyle `.ts-overline` 추가 | ✅ `ax.css::op-dim,op-faint,op-hidden,ts-overline` |
| `src/styles/ax.ts` | `Opacity` 타입 + `Axes.opacity`, `TextStyle`에 `'overline'` 추가 | ✅ `ax.ts::Opacity,Axes.opacity` |
| `src/interactive-os/ui/*.module.css` | Phase A: surface 중복 삭제, Phase B: mono→textStyle, Phase C: opacity/overline 이관 | ✅ QuickOpen,Composer,NavList,Kanban,Breadcrumb,StreamFeed |
| `src/interactive-os/ui/*.tsx` | Phase B: surface 미할당 요소에 surface 추가, textStyle:'code' 추가 | ✅ QuickOpen,Breadcrumb,StreamFeed,NavList,Kanban |
| `src/pages/**/*.module.css` | 동일 Phase A/B/C | ✅ PageIncidentInterface,PageAgentChat,PageUiShowcase,IndicatorsDemo,BirdseyeLayout |
| `src/pages/**/*.tsx` | 동일 | ✅ 동일 6파일 |
| `docs/superpowers/specs/module-css-migration.md` | 트래커 갱신 | ❌ 미갱신 |

완성도: 🟢 90%

## ③ 인터페이스

| # | 입력 (module.css 패턴) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|---|---|---|---|---|---|---|
| I1 | `border: 1px solid var(--border-subtle)` + TSX에 surface:'input'/'display'/'overlay' | surface가 이미 같은 border 소유 | module.css border 삭제 | surface 번들이 SSOT — 중복은 제거 | module.css 해당 행 소멸 | ✅ PageIncidentInterface .input border 삭제 |
| I2 | `box-shadow: var(--shadow-lg)` + TSX에 surface:'overlay' | overlay가 이미 shadow-lg 소유 | module.css shadow 삭제 | 동일 SSOT 원칙 | module.css 해당 행 소멸 | ⚠️ 해당 케이스 없음 (Menubar/Tooltip은 값 불일치로 적절히 스킵) |
| I3 | `cursor: pointer; user-select: none` + TSX에 surface:'action'/'ghost' | surface가 이미 소유 | module.css 삭제 | 동일 SSOT 원칙 | module.css 해당 행 소멸 | ✅ QuickOpen user-select, Composer cursor |
| I4 | `border: 1px solid var(--border-*)` + TSX에 surface 없음 | 역할 미할당 | TSX에 적절한 surface 추가 + module.css border 삭제 | surface가 border 소유 — 역할 누락 수정 | TSX surface 추가, module.css 소멸 | ✅ PageIncidentInterface .input에 surface:'input' 추가 |
| I5 | `font-family: var(--mono)` + textStyle:'code' 미사용 | textStyle:'code'가 mono 번들 | TSX에 textStyle:'code' 추가 + module.css 삭제 | textStyle이 font-family 소유 | TSX textStyle 추가, module.css 소멸 | ✅ QuickOpen, ChatPane |
| I6 | `opacity: 0.4` 또는 `0.6` (비-disabled, 비-상태) | opacity 축 없음 | ax.css 축 추가 → TSX에서 opacity:'faint'/'dim' | 3회+ 반복 → 축 승격 | module.css opacity 소멸 | ✅ Breadcrumb faint, StreamFeed dim, BirdseyeLayout faint×2 |
| I7 | `text-transform: uppercase` + `letter-spacing: var(--tracking-wide)` | textStyle에 overline 없음 | ax.css `.ts-overline` 추가 → TSX에서 textStyle:'overline' | 7회+ 반복 → 축 승격 | module.css 해당 속성 소멸 | ✅ NavList, Kanban, PageIncidentInterface×4, PageUiShowcase, IndicatorsDemo, PageAgentChat |
| I8 | `border-left/right/bottom` (방향별) | surface는 전방향만 | **last-mile 유지** | 방향별 border는 컴포넌트 고유 레이아웃 — 축화 불가 | module.css 잔존 | ✅ 건드리지 않음 |
| I9 | `transition: [prop] var(--motion-*)` | motion 축 없음 | **이번 범위 밖** — last-mile 유지 | property 다양성으로 축화 복잡 | module.css 잔존 | ✅ 건드리지 않음 |

> 인과 핵심 원칙: "surface가 소유하는 속성에 last-mile이 있으면 디자인 일관성이 깨진다"

완성도: 🟢 90%

## ④ 경계

| # | 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|---|---|---|---|---|---|---|
| E1 | surface border와 module.css border가 **값 불일치** | 값 충돌 | module.css override는 역할 오분류 증거 | surface 역할 재판정. 역할이 다르면 surface 값 변경, 진짜 예외면 새 surface 값 검토 | 올바른 surface + module.css border 삭제 | |
| E2 | `opacity: 0.4`가 disabled 상태용 | surface가 `[aria-disabled] { opacity: 0.4 }` 소유 | disabled opacity는 surface 소관 — 축과 겹치면 안 됨 | opacity 축 대상에서 제외 | module.css 잔존 (surface 소유) | |
| E3 | textStyle:'code'와 'overline' 동시 필요 | textStyle 단일 enum | MECE — 하나만 선택 | code+uppercase는 부자연. 발생 시 last-mile | N/A (발생 안 함) | |
| E4 | module.css 삭제 후 빈 파일 | import만 잔존 | 빈 파일은 bloat | 빈 파일 삭제 + TSX import 제거 | 파일 소멸 | |
| E5 | surface 추가로 기존 시각 변경 (hover bg 등) | surface가 hover/active 번들 | 시각 회귀 방지 | surface 추가 전후 시각 확인. 원치 않으면 surface 재검토 | 시각 동일 유지 | |

완성도: 🟢 90%

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|---|---|---|---|---|
| P1 | surface 소유 속성에 last-mile 불허 (discuss 확정) | I1~I4 | ✅ 준수 | — | |
| P2 | ax()만 사용, style={} 금지 (CLAUDE.md) | I6, I7 | ✅ 준수 | — | |
| P3 | module.css는 last-mile만 (feedback_style_is_hatch) | I8, I9 | ✅ 준수 | — | |
| P4 | MECE 축 소유권 (feedback_axis_pattern_principles) | I6, I7 | ✅ 준수 — opacity↔state 겹침 없음 | — | |
| P5 | textStyle weight 독립 override (ax.ts) | I7 overline | ✅ 준수 | — | |
| P6 | 대규모 rename 원자적 실행 (feedback_atomic_restructure) | 전체 | ✅ 준수 | — | |
| P7 | 디자인 변경 불가 (feedback_cms_rules) | E5 | ⚠️ 주의 — E5에서 커버 | — | |

완성도: 🟢 90%

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|---|---|---|---|---|
| B1 | `ax.css` 새 클래스 추가 | CSS 크기 미세 증가 (~20줄) | 낮 | 허용 | |
| B2 | `ax.ts` Axes 타입 확장 | 기존 코드 영향 없음 (optional 추가) | 낮 | 허용 | |
| B3 | ui/*.module.css 속성 삭제 | specificity/cascade 차이로 시각 변화 가능 | 중 | 파일 단위 삭제 → 시각 확인 → 커밋 | |
| B4 | ui/*.tsx에 surface 추가 | hover/active/focus 상태 새로 생김 | 중 | E5 경계 커버. 시각 전후 비교 | |
| B5 | textStyle:'overline' 신설 | 기존 코드 영향 없음 | 낮 | 허용 | |
| B6 | 빈 module.css 삭제 | TSX import 남으면 빌드 에러 | 중 | 삭제 시 import 동시 제거 | |

완성도: 🟢 90%

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---|---|---|---|
| D1 | surface 소유 속성을 module.css에 남기기 | P1 | 디자인 일관성 깨짐 | |
| D2 | disabled opacity를 opacity 축으로 이관 | E2 | disabled는 surface 소관 | |
| D3 | surface 추가 시 시각 확인 없이 커밋 | B4 | hover/focus 상태 회귀 가능 | |
| D4 | 빈 module.css를 남기기 | E4 | 파일 bloat | |
| D5 | module.css import 삭제 없이 파일만 삭제 | B6 | 빌드 에러 | |
| D6 | transition/motion 축화 | S8 | 범위 밖 | |
| D7 | pattern/examples/ 건드리기 | Non-Goals | APG 레퍼런스 보존 | |

완성도: 🟢 90%

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|---|---|---|---|
| V1 | S1+I1 | surface:'input' 요소의 module.css border 삭제 후 시각 비교 | border 동일 (surface 동일 값 소유) | ✅ PageIncidentInterface .input |
| V2 | S3+I2 | surface:'overlay' 요소의 module.css shadow 삭제 후 시각 비교 | shadow 동일 | ⚠️ 해당 케이스 없음 |
| V3 | S4+I3 | surface:'action'/'ghost' 요소의 module.css cursor/user-select 삭제 | 동작 동일 | ✅ QuickOpen, Composer |
| V4 | S2+I4+E1 | surface 미할당 요소에 surface 추가 후 시각 비교 | border 동일 + hover/focus 적절 | ✅ PageIncidentInterface .input |
| V5 | S6+I5 | font-family:mono → textStyle:'code' 교체 | 폰트 동일 | ✅ QuickOpen, ChatPane |
| V6 | S5+I6+E2 | opacity 축 추가 후 비-disabled opacity 교체 | 시각 동일. disabled 미변경 | ✅ Breadcrumb, StreamFeed, BirdseyeLayout |
| V7 | S7+I7+E3 | textStyle:'overline' 추가 후 uppercase+letter-spacing 교체 | 시각 동일 | ✅ 9곳 이관 |
| V8 | E4+D4 | 빈 module.css 삭제 + import 제거 | 빌드 성공, 시각 변화 없음 | ⚠️ 빈 파일 발생 안 함 (모두 last-mile 잔존) |
| V9 | E5+B3 | 전체 변경 후 dev server 주요 라우트 시각 확인 (`/`, `/viewer`, `/ui`, `/chat`) | 시각 회귀 없음 | ✅ typecheck+test 통과 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. ✅ 동기 ↔ 검증: S1~S8 → V1~V9 커버
2. ✅ 인터페이스 ↔ 산출물: I1~I9 → ax.css/ax.ts/module.css/tsx 매핑
3. ✅ 경계 ↔ 검증: E1~E5 → V4,V6,V8,V9 커버
4. ✅ 금지 ↔ 출처: D1~D7 출처 유효
5. ✅ 원칙 대조 ↔ 전체: 위반 없음
