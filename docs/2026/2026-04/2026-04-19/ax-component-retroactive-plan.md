---
title: ax 컴포넌트 소급 적용 플랜 — textStyle 이식 + 키라인 일관성 확산
type: plan
layer: styles
project: ax
status: draft
created: 2026-04-19
tags: [ax, textStyle, retroactive, refactor, keyline]
---

# ax 컴포넌트 소급 적용 플랜

> **선행 완료**: ax-textstyle-ssot-prd(L1 Band Zone 구축), L0 tokens 7-bundle, cs 완전 제거, clamp scroll 이관
> **이 플랜**: textStyle 원칙을 기존 컴포넌트 100+ 건에 **소급 적용**하여 키라인 일관성을 구조적으로 달성

## 실사 요약 (2026-04-19)

| 항목 | 건수 | 위험도 |
|------|-----|--------|
| role 있는데 textStyle 없음 | **100+** | 높음 (키라인 불일치) |
| — 중 role='item' + interactive='item' | **74** | 최고 |
| — 중 role='control' (textStyle 없음) | 15~20 | 중 |
| — 중 role='cell' | 10 | 중 |
| — 중 role='badge' | 8 | 중 |
| — 중 role='control-group' | 10~12 | 중 |
| ax.raw padding 직접 지정 | 18 파일 29건 | 중 (회귀 위험) |
| FlatLayout widget textStyle 미지정 | 40+ 건 (~85%) | 중 (점진) |
| ax() 밖 module.css 전용 | 0 | — |

**핵심**: `role='item' + interactive='item'` 74건이 최고 영향·최소 비용. 여기부터 시작.

## Phase 분할 (7 단계)

### R1 — item 기본 band 이식 (74건) ★최우선

**타깃**: `ax({ role: 'item', ... })` 중 textStyle 없는 전수.

**전략**:
- 각 callsite에 `textStyle: 'body'` 추가 (caption/label 쓰는 item은 기존 textStyle 유지)
- 단 **부모 컨테이너가 이미 textStyle 지정했으면 생략** (CSS cascade 상속)
- 판정: 컴포넌트 렌더러 위계 추적 필요

**파일 상위 5**: ListItem, TreeItem, MenuItem, Accordion, TreeGrid, QuickOpen, PageIncidentFlat, incidentBlocks, Grid

**검증**:
- 스샷 diff — 키라인 24/28→28 일치로 통일
- grep `role: 'item'` 중 textStyle 없는 것 0건 (또는 부모 상속 명시된 곳만)

### R2 — control 기본 band 이식 (15~20건)

**타깃**: `ax({ role: 'control', ... })` 중 textStyle 없음.

**전략**:
- 기본 `textStyle: 'body'` 추가
- **icon-only**(content='icon') 버튼은 그대로 두되 ic-* 크기 축 명시 (28×28 정사각 유지 목적)
- **overlay/toast** 안의 작은 버튼은 `textStyle: 'caption'` 검토

**파일**: DatePicker, Card, Carousel, FilterBar, Progress, a2uiRenderers

**검증**:
- 포커스/hover 시각 검사
- icon button aspect-ratio:1 유지 확인

### R3 — control-group + 내부 control 정렬 (10~12건)

**타깃**: panel / spinner / combobox 외곽 + 내부 control 조합.

**전략**:
- control-group 자체에 `textStyle` 지정 → `.rl-control-group > .rl-control` cascade로 자식 상속
- 내부 control의 `min-height: unset; align-self: stretch`는 이미 ax.css에 있음 — 그대로 활용

**파일**: Panel, SidePanel, SubmenuPanel, DatePicker(외곽), Combobox, Spinbutton 계열

**검증**:
- 같은 패널 내부 자식 부품 키라인 완전 일치
- Finder/spinner 증인 케이스

### R4 — cell + 내부 부품 정렬 (10건)

**타깃**: grid cell 컨테이너 + 내부.

**전략**:
- cell에 textStyle 지정 → 자식 control이 `--cs-h` 상속 (interactive.css에서 `--cs-h: var(--cell-cs)`)
- 이미 cell.tsx의 cascade가 W2 Round 2에서 구축됨

**파일**: TreeGrid 편집 cell, Toaster, Lightbox, a2uiRenderers, FlatLayout demo

**검증**:
- 그리드 cell 내부 편집/표시 cell 높이 일관성

### R5 — ax.raw padding 감사 (18 파일 29건)

**타깃**: `ax.raw({ padding: ... })` 직접 지정.

**3 분류**:

| 분류 | 수 | 처리 |
|------|---|------|
| (a) role+padding 조합 | ~10 | **textStyle 이식으로 padding 제거**. role의 Private padding은 이미 0이므로 명시 padding만 남음 → textStyle의 `--cs-py/px` 파생으로 충분 |
| (b) layout-only + padding | ~12 | **role 추가 검토** (container 역할 명시) or 유지 |
| (c) slidesWidgets 계열 특수 | ~7 | 프레젠테이션 전용 레이아웃 — 별도 판정 |

**파일**: slidesWidgets, ChatMessageItem, SlideThumbItem, ActivityBar, slidesPresent, StatBlock, BulletsBlock, ChartBlock

**검증**:
- 시각 회귀 diff
- padding 의도가 유지되는지 확인

### R6 — FlatLayout widget 정규화 (40+ 건)

**타깃**: `src/pages/**/*Widgets.tsx` 내부 widget 함수.

**전략 선택 (별도 discuss 필요)**:

- **(α) widget root에 textStyle 의무화** — definePage 선언부에 강제 prop
- **(β) FlatLayoutSurfaceCtx에 textStyle cascade** — 컨테이너가 자동 공급
- **(γ) widget별 독립 결정** — 현 상태 유지, 이슈 발생 시만 수정

제 판단: **(β)가 정석** — `feedback_contextual_zone_cascade` 원리와 일치. Band Zone을 FlatLayout이 자동 공급.

**검증**: 페이지별 스샷 + widget 경계 키라인

### R7 — 자동 회귀 방지 훅 + 문서

**타깃**: 소급 완료 후 재발 방지.

**작업**:
1. `scripts/scanOsViolations.mjs` 또는 유사 훅에 규칙 추가:
   - `role: 'item'|'control'|'cell'|'badge'` 사용 시 textStyle 지정 또는 **부모 band 명시적 추적** 요구
   - ax.raw padding 사용 시 `textStyle 대체 가능 여부` 감사
2. DESIGN.md §5에 "소급 적용 결과" 섹션 추가 — 완료 후
3. `pnpm score:design`에 키라인 일관성 체크 추가 검토

**검증**: 훅이 새 callsite에서 위반 감지되는지

## 우선순위 & 실행 계획

| Phase | 규모 | 영향 | 비용 | 우선순위 |
|-------|-----|-----|------|---------|
| R1 | 74건 | 최고 | 낮음 | **1 (즉시)** |
| R2 | 15~20건 | 높음 | 낮음 | 2 |
| R3 | 10~12건 | 중 | 중 | 3 |
| R4 | 10건 | 중 | 낮음 | 4 |
| R5 | 29건 | 중 | 중 (판정 필요) | 5 (R1~R4 후) |
| R6 | 40+건 | 중 | 높음 | 6 (discuss 선행) |
| R7 | — | 구조적 | 낮음 | 7 (마지막) |

## 검증 프로토콜

1. **스크린샷 baseline** — 시작 전 `pnpm screenshot`으로 전 라우트 baseline 저장
2. **Phase 종료마다 diff** — 스샷 diff로 회귀 감지 (ImageMagick compare 또는 수동 확인)
3. **자동 테스트 유지** — 각 Phase마다 `pnpm test` 1535 통과
4. **typecheck/lint 통과** — 각 Phase 커밋 전

## 롤백 전략

- Phase 단위로 커밋 분리 → 개별 revert 가능
- 스샷 diff에서 의도되지 않은 회귀 발견 시 해당 Phase revert
- R6 전략(α/β/γ) 결정 전까지 R1~R5 독립 진행

## 리스크

| 리스크 | 완화책 |
|--------|--------|
| 스샷 baseline 부재 시 회귀 감지 불가 | Phase 시작 전 baseline 저장 의무화 |
| 자식 컴포넌트가 부모 band 상속 기대 | 각 Phase에서 CSS cascade 경로 확인 필수 |
| content='icon' 버튼의 aspect 깨짐 | ic-* 크기 축 + aspect 축 명시 |
| FlatLayout cascade 전략 미결정 | R6 전 discuss로 (α/β/γ) 결정 |
| 74건 한 번에 수정 시 리뷰 어려움 | R1 내부를 5개 파일 단위 커밋으로 분할 |

## Exit Criteria (플랜 완료 조건)

- grep `ax({.*role:.*})` 중 textStyle 없는 callsite 0 (또는 부모 band 명시된 경우만)
- grep `ax.raw({.*padding:.*})` 중 textStyle-free role과 조합된 것 0
- FlatLayout widget 중 textStyle 공급 (widget root 또는 context) 100%
- 스크린샷 diff: 의도된 변경(키라인 일관성 개선) 외 회귀 0
- 훅 `guardOsPatterns.mjs`에 소급 방지 규칙 추가

## 오늘 실행 가능 범위

**제안 — R1만 이번 세션에서 실행**:
- 가장 높은 영향 + 최소 비용
- 74건 중 25~30 파일, 커밋 3~5개로 분할
- 스크린샷 baseline은 별도 세션에서 (현재 의도된 변경만 진행)
- R2~R7은 후속 세션

**또는 — 본 플랜 문서만 확정하고 실행은 보류**:
- 이 플랜을 승인받고 다음 세션에서 R1부터 집행
- handoff로 세션 종료

---

**상태**: draft. R1 실행 승인 또는 플랜만 확정 후 handoff 선택 필요.
