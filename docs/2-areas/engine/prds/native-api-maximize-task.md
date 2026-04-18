---
id: 2-areas/engine/prds/native-api-maximize-task
title: 'Native CSS/DOM API 극대화'
status: active
kind: plan
created: 2026-04-09
updated: 2026-04-09
topics: [2-areas]
relates: []
supersedes: []
---
# Native CSS/DOM API 극대화

## 목적
브라우저가 공짜로 주는 것을 JS로 재구현하지 않는다.

## 변경 목록

### 1. `@layer` 도입 — ax.css
- ax.css 전체를 `@layer ax { }` 안에 래핑
- 캐스케이드 순서 명시적 선언

### 2. QuickOpen → `<dialog>`
- 커스텀 backdrop div → `<dialog>` + showModal()
- z-index:100 제거, focus trap/backdrop/ESC 네이티브 위임

### 3. DatePicker → `popover`
- dialog div → `popover=manual` 속성
- z-index:10 제거, top-layer 네이티브
- 외부 클릭 핸들러(document mousedown) 제거 → popover light dismiss 또는 유지

### 4. Combobox dropdown → `popover`
- dropdown div → `popover=manual`
- top-layer 스태킹 네이티브

### 5. `@starting-style` 진입 애니메이션
- sf-overlay, popover, dialog에 진입 전환 추가
- `transition-behavior: allow-discrete` for display:none→block

### 6. `scrollend` event
- useVirtualScroll.ts: scroll+rAF → scrollend
- autoscroll.ts: scroll listener에 scrollend 활용
- StreamFeed/useStreamFeed: 동일

### 7. `field-sizing: content`
- rename input에 자동 크기 CSS 추가
