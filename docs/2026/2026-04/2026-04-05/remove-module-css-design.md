---
id: 2-areas/design/prds/remove-module-css-design
type: note
slug: removeModuleCssDesign
title: 'module.css 전면 제거 — ax() 디자인 언어 고도화'
tags: [untagged]
created: 2026-04-05
updated: 2026-04-08
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# module.css 전면 제거 — ax() 디자인 언어 고도화

## 목표

61개 module.css 파일(3,662줄)을 전부 제거하고 ax() 축 시스템만으로 모든 스타일링을 표현한다.

## 현황

- 22개 축, module.css는 "last-mile" 예외로 허용 중
- 실제로는 축 갭 때문에 module.css가 비대해짐

## 축 변경 계획

### 1. motion 축 확장

현재: `'pulse' | 'spin' | 'fade-in' | 'slide-up'`

추가할 이름 (module.css에서 추출):

| 이름 | 효과 | 출처 |
|------|------|------|
| `fade-slide-in` | opacity 0→1 + translateY(8px→0) | StreamFeed, QuickOpen |
| `blink` | opacity 0→1→0, step-end 0.8s | StreamFeed (cursor) |
| `scale-in` | scale(0.95→1) + opacity | PageBookViewer (modal) |
| `slide-in` | translateY(-8px→0) + opacity | QuickOpen |
| `shimmer` | opacity shimmer 1.5s | indicators |

기존 `fade-in`, `slide-up`은 이미 있음 — 중복 @keyframes 제거.
chevron rotate, switch toggle 등 transform은 **컴포넌트**가 담당 (축 아님).

### 2. scroll 축 신설

overflow 제어 전용 축.

```typescript
scroll?: 'hidden' | 'y' | 'x' | 'auto'
```

| 값 | CSS | 용도 |
|---|---|---|
| `hidden` | `overflow: hidden` | 컨테이너 경계 클리핑 (Book, SpreadReader) |
| `y` | `overflow-y: auto; overflow-x: hidden` | 세로 스크롤 리스트 (Kanban column, Composer) |
| `x` | `overflow-x: auto; overflow-y: hidden` | 가로 스크롤 (테이블, 코드블록) |
| `auto` | `overflow: auto` | 양방향 |

기존 `layout: 'scroll' | 'scroll-x'`와 관계: layout은 flex+overflow 번들이고, scroll은 순수 overflow만. layout scroll은 scroll 축으로 마이그레이션 후 폐기 검토.

### 3. z-index → surface/placement에 내포

별도 축 없음. 규칙:

| surface/placement | z-index | 예시 |
|---|---|---|
| 일반 콘텐츠 | auto | 기본 |
| `placement: 'sticky'` | 1 | FAB, submenu |
| `surface: 'overlay'` | 10 | popover, dropdown |
| `placement: 'viewport'` | 100 | modal, QuickOpen |

→ axes.css에서 해당 클래스에 z-index 포함. 20/30 같은 중간값은 불필요 — 3단계(1/10/100)로 정규화.

### 4. pointer-events → surface에 흡수

- `surface: 'ghost'` → `pointer-events: none` (이미 비상호작용 의미)
- `opacity: 'hidden'` → `pointer-events: none` 번들
- 상호작용 복원은 data-attribute 상태 전환으로 (기존 패턴 유지하되 module.css 대신 axes.css에서)

### 5. 컴포넌트로 해결하는 것들 (축 아님)

- **transform** (chevron rotate, switch toggle, spread nav) → 각 UI 컴포넌트 내부
- **pseudo-element** (::before, ::after) → DOM indicator 컴포넌트로 대체
- **cursor** → surface가 암시 (action→pointer, input→text, display→default)
- **outline/focus-ring** → state: 'focused'가 이미 담당
- **text-decoration** → tone/text 조합 또는 컴포넌트
- **letter-spacing** → textStyle에 번들 (overline 등)
- **caret-color** → surface: 'input'에 번들

### 6. 남은 last-mile 속성 처리

| 속성 | 처리 |
|------|------|
| `column-count/gap/fill` | layout 축에 `'columns-2' \| 'columns-3'` 추가 |
| `vertical-align` | layout에 `'baseline'` 추가 검토, 또는 컴포넌트 |
| `composes` | CSS Modules 메타 — 제거 대상 |
| `resize: none` | surface: 'input'에 번들 |
| `filter: brightness()` | tone 확장 또는 컴포넌트 |

## 마이그레이션 전략

1. axes.css에 새 축/값 추가 + ax.ts 타입 확장
2. UI 컴포넌트(ui/)부터 module.css → ax() 전환
3. pages/ 전환
4. pattern/examples/ 전환
5. 각 module.css 파일 삭제
6. vite config에서 CSS Modules 설정 제거 검토

## 성공 기준

- `src/**/*.module.css` = 0개
- typecheck, lint, lint:css, test 모두 통과
- 시각적 regression 없음 (score:design 점수 유지 또는 상승)
