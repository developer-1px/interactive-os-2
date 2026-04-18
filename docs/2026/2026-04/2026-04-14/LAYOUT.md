---
id: LAYOUT
type: note
slug: layout
title: 'FlatLayout — 선언적 페이지 레이아웃'
tags: [untagged]
created: 2026-04-14
updated: 2026-04-14
summary: 'SSOT: `src/interactive-os/layout/`'
legacy:
  status: meta
  kind: note
  topics: []
  relates: []
  supersedes: []
---
# FlatLayout — 선언적 페이지 레이아웃

> SSOT: `src/interactive-os/layout/`

`definePage()`로 페이지 구조를 플랫 선언한다. JSX가 아니라 데이터.

```ts
const layout = definePage({
  entities: {
    root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.2, 'flex'] }, children: ['sidebar', 'main'] },
    sidebar: { data: { type: 'widget', widget: 'Sidebar', scroll: true } },
    main:    { data: { type: 'stack', gap: 'md' }, children: ['toolbar', 'content'] },
    toolbar: { data: { type: 'widget', widget: 'Toolbar' } },
    content: { data: { type: 'widget', widget: 'Content', scroll: true } },
  },
})
```

## LayoutNode 11종

| type | 역할 | 주요 속성 |
|------|------|----------|
| **split** | 수평/수직 분할 | direction, sizes[], resizable |
| **stack** | 세로 쌓기 | gap |
| **bar** | 가로 바 | justify, gap |
| **grid** | 균등 그리드 | columns (2-7), gap |
| **nav** | 사이드바 내비 | sidebarWidth |
| **tab** | 탭 컨테이너 | — |
| **section** | 제목 섹션 | title, count |
| **overlay** | 부유 레이어 | overlayType (modal/popup/hint), placement, visible |
| **floating** | 고정 위치 | anchor (float-*) |
| **widget** | React 컴포넌트 슬롯 | widget (registry key), props, scroll |
| **state** | 공유 상태 (렌더링 안 됨) | 자유 key-value |

## 공통 속성 (LayoutBase)

모든 노드에 적용: `surface`, `hidden`, `padding`.

## 원칙

- **widget = React, layout = 엔진**: widget만 React 컴포넌트. 나머지는 엔진이 렌더.
- **pull 모델**: widget이 `useFlatLayout()`으로 필요한 데이터를 읽는다.
- **XY 배치 + Z 깊이**: split/stack/bar가 XY 배치, surface가 Z 깊이.

#kind/note
