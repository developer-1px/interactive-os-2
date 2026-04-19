---
title: ax Role Catalog Audit — 의미 역할 파편화 실사 + 신설·수정·통합 판정
type: audit
layer: styles
project: ax
status: draft
created: 2026-04-19
tags: [ax, role, audit, catalog, semantic, variant]
---

# ax Role Catalog Audit

> **원칙**: "시각이 다르면 role을 늘린다" (Radix variant 방식). 파편은 통합 대상이 아니라 **미명명 role의 신호**.
> **실사 범위**: 10 의미 역할 카테고리, 3 에이전트 병렬 조사 (A: 작은 요소·액션, B1: 면 요소, B2: 인터랙티브)
> **산출물**: 카테고리별 공식·파편 + 판정 4분류(신설 / 수정 / 통합 / 유지)

## 현재 ax role (7개)

`control` / `control-group` / `item` / `cell` / `badge` / `tip` / `utility`

## 종합 판정 요약

| 우선순위 | 후보 role (또는 수정) | 대상 | 근거 |
|---------|----------------------|------|------|
| **P0 신설** | `metric` | StatBlock, ToolSummaryBlock count, TestRunner pass/fail | 숫자 강조 — 공식 role 없음 |
| **P0 신설** | `signal` (or `feedback`) | Alert 변종, Toast item, EmptyState | 시스템→사용자 알림 — 공식 없음, motion-only preset만 |
| **P0 신설** | `placeholder` | Skeleton, loading indicators | motion:shimmer 계열의 aria-hidden 전용 명시 (현재 control-group 오용) |
| **P1 신설** | `backdrop` | Drawer 배경, Modal 배경 | `role:'tip'` 의미론적 불일치 (tip은 hint 용도) |
| **P2 수정** | CheckItem/RadioItem/SwitchItem/RatingItem → `role:'control'` | 4 파일 | 현재 `role:'item', interactive:'check'` — list item 시각 충돌 |
| **P2 수정** | ServiceItem `interactive:'button'` → `'item'` | 1 파일 | 버그 (아이템이 버튼 아님) |
| **P3 검토** | `chip` (badge interactive variant 공식화) | FilterBar 필터 칩 | 현재 badge+button 조합으로 커버 — 승격 가치 있음 |
| **P3 검토** | `interactive:'nav'` 값 추가 | TocItem, Breadcrumb | `aria-current` 있는 위치 표시 |
| **P3 통합** | `metric-bar`·`stat-value`·`count-display` | ChartBlock 바, CmsLanding 수치 | `metric`의 variant로 surface×content 조합 |
| **유지** | `card` surface 세분화 | Card.clickable | control/control-group 전환 로직 이미 있음 |
| **유지** | MenubarItem vs MenuItem | 8건 | 시각 분명히 다름 (bar vs spread) |
| **유지** | TreeItem vs ListItem | 10건 | 인덴트 유무로 시각 다름 — 이미 `interactive:'item'`으로 공유 |
| **유지** | StepperItem/TimelineItem/WriterItem | 각자 | 도메인 특수 시각 — 라이브러리 컴포넌트 레벨 |

**결과**: 4 신설(P0 3 + P1 1) / 2 수정(P2) / 3 검토(P3) / 유지 다수 = **role 7 → 약 11~12로 확장 예상**.

## 카테고리별 상세

### 1. Status Indicator
- **공식**: `role:'badge'` × surface(display/ghost/overlay/placeholder)
- **파편**: StatusIndicator(`item-indicator--status` class), dot, `.tn-*-dim` 텍스트
- **판정**: StatusIndicator는 시각 다름(fill/ring variant) → P1 **신설 후보** (가칭 `indicator`). NavList count는 기존 badge로 흡수 가능.

### 2. Action Trigger
- **공식**: `role:'control'` × `interactive:'button'`
- **파편**: FilterBar의 "add filter chip"이 `role:'badge'` + `interactive:'button'`
- **판정**: 대부분 통합 가능. chip만 P3 검토.

### 3. Separator
- **공식**: `bd-top`/`bd-bottom` + gap + ARIA `role:'separator'` (SeparatorIndicator)
- **파편**: `.border-top` module.css 직접 사용 (editorial blocks)
- **판정**: ARIA native 유지. 자체 CSS border-bottom은 last-mile 인정.

### 4. Metric Display
- **공식**: **없음**
- **파편**: StatBlock, ChartBlock bar, CmsLanding 수치, ToolSummary count
- **판정**: **P0 신설 `metric`**. variant로 bar/value/count 흡수.

### 5. Chip Interactive
- **공식**: `role:'badge'` + `interactive:'button'` 조합으로 커버 중
- **파편**: 기존 조합으로 충분
- **판정**: 조합을 **P3 승격 검토** (`role:'chip'`로 분리하면 display 뱃지와 시각 구분 명확화)

### 6. Container Surface
- **공식**: `role:'control-group'` × SurfacePanel(sunken/base/raised/overlay)
- **파편**: 14건, 대부분 정확. **Drawer 매크로 구조만 예외** (backdrop이 `tip` 오용)
- **판정**: **P1 `backdrop` 신설**. 나머지 유지.

### 7. Overlay Anchor
- **공식**: `role:'tip'` × SurfaceTip(inverted/overlay)
- **파편**: 6건, Drawer backdrop 1건 외 전부 정확
- **판정**: Drawer backdrop은 category 6과 통합 해결.

### 8. Feedback Signal
- **공식**: **없음** (motion preset `spin`/`pulse`/`shimmer`만)
- **파편**: Toast(role:'cell' 오용), Alert(item+tone variant), Skeleton(control-group 오용), EmptyState(utility)
- **판정**: **P0 신설 `signal`** (alert/toast/success/danger/info 통합) + **P0 신설 `placeholder`** (skeleton 전용)

### 9. Navigation
- **공식**: `role:'item'` × `interactive:'tab'|'item'`
- **파편**: TocItem/Breadcrumb의 `aria-current` 위치 표시
- **판정**: **P3 `interactive:'nav'`** 값 추가 (role 신설보다 interactive 확장이 경제적)

### 10. Form Input
- **공식**: `role:'control'` × `interactive:'input'|'check'`
- **파편**: CheckItem/RadioItem/SwitchItem/RatingItem 4건이 `role:'item'` 오용
- **판정**: **P2 수정** — role 신설 아니라 **잘못 지정된 역할 정정** (이건 파편이 아니라 버그)

### 11. List Element
- **공식**: `role:'item'|'cell'`
- **파편**: FileTreeItem ⊂ TreeItem (병합 가능), ServiceItem interactive 오류
- **판정**: 대부분 정확. 소규모 정정만.

### 12. Text Hierarchy (제외)
- **공식**: `textStyle` 9단으로 이미 정돈 완료 (ax-textstyle-ssot-prd 이후)

---

## 신설 role Contract 초안

### `role: 'metric'` — 숫자 강조 표시
```ts
| {
    role: 'metric'
    surface?: 'display' | 'ghost' | 'sunken'   // 강조 수준
    tone?: AxTone                              // 수치 의미 색
    textStyle?: AxTextStyle                    // 기본: 'display' (큰 수치)
    content?: 'text' | 'bubble'                // value + label 조합
    layout?: AxLayout                          // stack (value↑ label↓) 또는 bar
    cs?: CsScale  // 제거됨
  }
```
**cascade 신규**: `metric.display.text`, `metric.display.bar`, `metric.ghost.text`

### `role: 'signal'` — 시스템→사용자 알림 (alert/toast/info)
```ts
| {
    role: 'signal'
    surface: 'display' | 'overlay' | 'ghost'   // toast는 overlay
    tone?: AxTone                              // danger/warning/success/info
    textStyle?: AxTextStyle                    // 기본 'body'
    content?: 'text' | 'bubble'
    interactive?: 'button'                     // dismiss 가능 신호
    placement?: AxPlacement                    // toast는 float-*
    layout?: AxLayout
  }
```
**cascade 신규**: `signal.display` (Alert), `signal.overlay` (Toast), `signal.display.button` (dismissable)

### `role: 'placeholder'` — 로딩·Skeleton 전용
```ts
| {
    role: 'placeholder'
    surface?: 'sunken' | 'ghost' | 'display'
    layout?: AxLayout
    width?: AxWidth
    aspect?: AxAspect
    // motion은 rolePreset에서 자동 주입 (shimmer/pulse)
    // aria-hidden="true" 자동 (TS-level 불변식)
  }
```
**cascade 신규**: `placeholder.sunken` (Skeleton), `placeholder.ghost` (inline)

### `role: 'backdrop'` — Modal/Drawer 배경층
```ts
| {
    role: 'backdrop'
    surface?: 'overlay' | 'scrim'              // scrim은 신규 — 반투명 검정
    placement?: 'viewport'                     // 필수
    // interactive: 'button' → 배경 클릭 dismiss
    interactive?: 'button'
    // motion: fade-in 자동
  }
```
**cascade 신규**: `backdrop.overlay`, `backdrop.scrim`. `tip`의 viewport placement 사용처가 이동.

---

## 수정 항목 (P2)

### Form Input 4건 — role:'item' → role:'control'

| 파일 | 현재 | 변경 |
|------|------|------|
| `src/interactive-os/ui/items/CheckItem.tsx:19` | `role:'item', interactive:'check'` | `role:'control', interactive:'check', surface:'ghost'` |
| `src/interactive-os/ui/items/RadioItem.tsx:18` | `role:'item', interactive:'check'` | 동상 |
| `src/interactive-os/ui/items/SwitchItem.tsx:18` | `role:'item', interactive:'check'` | 동상 |
| `src/interactive-os/ui/items/RatingItem.tsx:18` | `role:'item', interactive:'check'` | 동상 |

### ServiceItem — interactive 오류

`src/interactive-os/ui/items/ServiceItem.tsx:33`: `interactive:'button'` → `interactive:'item'`.

---

## 실행 Phase (후속 세션 PRD)

### PR-1 — P0 신설 3 role (metric / signal / placeholder)
- `axPublic.ts`에 3 브랜치 추가 (role 7→10)
- `rolePreset.ts` cascade 엔트리 추가
- `ax.css`에 새 role CSS 블록 (`.rl-metric`, `.rl-signal`, `.rl-placeholder`)
- 기존 파편 callsite 마이그레이션:
  - StatBlock → `role:'metric'`
  - Alert → `role:'signal'`
  - Toaster → `role:'signal', surface:'overlay'`
  - Skeleton → `role:'placeholder'`

### PR-2 — P1 신설 1 role (backdrop)
- `axPublic.ts`에 `role:'backdrop'` 브랜치 (role 10→11)
- Drawer backdrop 부분 마이그레이션
- `scrim` surface 도입 검토

### PR-3 — P2 수정 (Form Input 4건 + ServiceItem)
- 파일 5개 수정, callsite-level
- 시각 회귀 스샷 검증

### PR-4 — P3 검토 (chip / nav)
- 별도 discuss 선행 — 당장 필요 여부 판단 후 진행

---

## 예상 효과

- **role 수**: 7 → 11 (약 57% 증가)
- **파편 수**: 약 32건 → 10건 이하 (공식 role로 흡수)
- **오용 제거**: Form Input 4건, ServiceItem 1건
- **카탈로그 명시성**: Alert/Toast/Empty/Loading/Metric/Backdrop 모두 공식 role 획득

## 리스크

| 리스크 | 완화 |
|--------|------|
| role 수 팽창으로 멘탈 모델 복잡화 | 원칙 유지: "시각이 같으면 variant, 다르면 role" — 11개까지는 Radix 수준 |
| backdrop 신설로 tip 사용처 축소 → 기존 코드 영향 | 마이그레이션 1건(Drawer)만, 범위 작음 |
| metric variant 폭발 (bar/value/count) | rolePreset cascade로 흡수 — 신규 role 3개로 세분화 금지 |
| signal role이 interactive rationale 불명 | dismiss 기능 있는 경우만 `interactive:'button'` 수용, 기본 비상호 |

---

## 결정 필요

**Q1**. 신설 우선순위 — PR-1 (P0 3개) 먼저 진행? 아니면 PR-2~4까지 포함한 대규모 한 번 PRD?
- 제 판단: **PR-1 먼저**. 파편 흡수 효과가 가장 큼. PR-2~4는 별도 세션.

**Q2**. `signal`과 `alert-signal` 이름 — 어느 쪽? 또는 `feedback`?
- 제 판단: **`signal`** — 짧고 의미 명확. alert·toast·empty·loading을 포괄.

**Q3**. `placeholder` vs 기존 surface `placeholder` 충돌 — surface에도 'placeholder'가 있음
- 제 판단: role이 'placeholder'면 surface는 자동 'sunken' 또는 'ghost'로 한정 → 이름 충돌 피함. 또는 `skeleton` 이름 검토.

**Q4**. backdrop의 scrim surface 신설 — 필요한가?
- 제 판단: **별도 결정**. 현재 `overlay`로 Drawer 배경 커버 가능. 추후 실측 필요.

---

**상태**: draft audit. 승인 후 PR-1부터 PRD 분리 실행.
