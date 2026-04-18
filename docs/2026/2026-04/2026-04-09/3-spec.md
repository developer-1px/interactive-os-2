---
id: 1-projects/viewer/stories/doc-browsing/features/miller-columns/3-spec
title: 'Miller Columns — Spec'
created: 2026-04-09
updated: 2026-04-09
legacy:
  status: active
  kind: note
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Miller Columns — Spec

## 배경

AI 생성 문서(docs/)를 편하게 탐색·열람할 Finder 스타일 Miller Columns UI.

## 구현 파일

| 파일 | 역할 |
|------|------|
| `src/interactive-os/ui/millerPreset.ts` | 키보드 패턴 (↑↓←→) |
| `src/interactive-os/ui/MillerColumns.tsx` | UI 컴포넌트 |
| `src/interactive-os/ui/MillerColumns.css` | last-mile CSS |
| `src/pages/docs/PageDocs.tsx` | /docs 라우트 페이지 |

## 키보드

| 키 | 동작 |
|----|------|
| ↑↓ | 컬럼 내 이동 |
| → | drill-in (자식 컬럼 열기) |
| ← | drill-out (부모 컬럼으로) |
| Home/End | 컬럼 내 처음/끝 |

## 상태

- 빈 트리: EmptyState 표시
- 로딩: SpinnerIndicator 표시
- 파일 선택: 프리뷰 패널 활성
- 폴더 선택: 자식 컬럼 생성

#kind/note #topic/viewer
