---
id: '2-areas/layout/76-[explain]flat-layout-engine-what-changed'
type: explain
slug: flatLayoutEngineWhatChanged
title: 'FlatLayout 엔진 — 뭐가 달라졌나 — 2026-04-10'
tags: [explain]
created: 2026-04-11
updated: 2026-04-11
legacy:
  status: active
  kind: explain
  topics: [2-areas, explain]
  relates: []
  supersedes: []
---
# FlatLayout 엔진 — 뭐가 달라졌나 — 2026-04-10

## 배경

React JSX 중첩으로 페이지를 조립하던 방식에서, NormalizedData 기반 flat 선언으로 레이아웃을 기술하는 FlatLayout 엔진을 도입했다. PageBookViewer를 Phase 1 검증 대상으로 전환 완료.

## Before vs After

### 페이지 작성 방식

**Before**: pages/에서 ui/ 컴포넌트를 JSX로 중첩 조립
```tsx
<div className={ax({ layout: 'column' })}>
  <div className={ax({ placement: 'relative' })}>
    <SpreadReader onNextBoundary={handleNext}>
      <MarkdownViewer content={page.content} />
    </SpreadReader>
    {tocOpen && (
      <div className={ax({ placement: 'center' })}>
        <TocNavList data={tocStore} />
      </div>
    )}
  </div>
</div>
```

**After**: flat NormalizedData로 선언 → 엔진이 렌더
```tsx
const layout = definePage({
  entities: {
    root:    { data: { type: 'stack' }, children: ['reader', 'pill', 'footer'] },
    reader:  { data: { type: 'widget', widget: 'BookReader' } },
    pill:    { data: { type: 'widget', widget: 'BookPill' } },
    'toc':   { data: { type: 'overlay', overlayType: 'modal', visible: false }, children: ['toc-content'] },
  },
})

<FlatLayout data={layoutData} registry={bookWidgets} />
```

### 레이아웃 어휘

| 타입 | 역할 | CSS 매핑 |
|------|------|---------|
| `split` | 수평/수직 분할 | flex-row/column + flex-basis 비율 |
| `stack` | 세로 적층 | flex-column + gap |
| `overlay` | 모달/팝업/힌트 | placement + 조건부 렌더 |
| `widget` | React 컴포넌트 마운트 | registry에서 resolve |

### 위젯 레지스트리

```tsx
const bookWidgets = createWidgetRegistry({
  BookReader,    // SpreadReader + MarkdownViewer
  BookPill,      // floating toolbar
  BookNav,       // prev/next navigation
  BookFooter,    // breadcrumb + page number
  BookProgress,  // progress bar
  BookTocOverlay,
  BookQuickOpen,
  BookLayerOverlay,
})
```

registry에 없는 위젯은 렌더 불가 → **os 기반 개발이 구조적으로 강제됨**.

### 위젯간 통신

**Before**: props/callbacks로 수동 배선
```tsx
<QuickOpen onActivate={handleQuickOpenActivate} onClose={closeQuickOpen} />
```

**After**: dispatch command (Phase 2 목표. Phase 1은 아직 props 전달)

### 수치 변화

| 지표 | Before | After |
|------|--------|-------|
| PageBookViewer JSX 레이아웃 | ~155줄 중첩 | 1줄 `<FlatLayout />` |
| 파일 전체 | 453줄 | 606줄 (위젯 정의 포함) |
| 레이아웃 선언 | JSX에 흩어짐 | `definePage()` 한 곳에 집중 |
| 위젯 분리 | 0개 | 8개 독립 컴포넌트 |

## 새 파일 구조

```
src/interactive-os/
├── layout/                    ← 신규 레이어
│   ├── flatLayout.ts          ← LayoutNode 타입 + definePage()
│   ├── widgetRegistry.ts      ← type→Component 매핑
│   ├── layoutCommands.ts      ← setVisibility, setGap
│   ├── layoutPlugin.ts        ← workspace() 확장
│   └── index.ts
├── ui/
│   ├── FlatLayout.tsx         ← OCP 렌더러 (split/stack/overlay/widget)
│   └── FlatLayout.module.css  ← split flex sizing
```

## 3가지 핵심 변화

1. **비대칭 해소**: 데이터(store)·인터랙션(engine)·레이아웃(layout) 모두 NormalizedData로 통일
2. **구조적 os 강제**: widgetRegistry에 등록된 컴포넌트만 사용 가능. CLAUDE.md 규칙이 아닌 코드가 강제
3. **LLM 친화**: flat JSON이면 레이아웃 생성 가능. JSX 중첩 이해 불필요

## 다음 행동

- Phase 2: ui/ 내부 컴포넌트도 FlatLayout으로 재귀 적용 (tab, tree 등)
- 위젯 props를 command dispatch로 전환 (콜백 배선 제거)
- 다른 pages/ 점진적 마이그레이션 (PageCms, PageAgentChat)
