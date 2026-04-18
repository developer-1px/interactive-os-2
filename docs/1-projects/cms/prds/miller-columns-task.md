---
id: 1-projects/cms/prds/miller-columns-task
title: 'Miller Columns — Finder 스타일 문서 탐색기'
status: active
kind: plan
created: 2026-04-09
updated: 2026-04-09
topics: [1-projects]
relates: []
supersedes: []
---
# Miller Columns — Finder 스타일 문서 탐색기

## 배경
AI 생성 문서(docs/)를 편하게 탐색·열람할 Finder 스타일 Miller Columns UI.
기존 Kanban(가로 컬럼 + ↑↓←→ 키보드)을 포크하여 구현.

## 액션 플랜

1. **millerPreset.ts** — kanbanPreset 포크
   - ↑↓: 컬럼 내 이동 (kanbanNavV 재활용)
   - →: drill-in (폴더 선택 시 자식 컬럼 생성 + 첫 아이템 포커스)
   - ←: drill-out (부모 컬럼으로 복귀)
   - CRUD/DnD 플러그인 제거 (읽기 전용)

2. **ui/MillerColumns.tsx** — Kanban.tsx 포크
   - 선택 경로(path)에 따라 동적 컬럼 생성
   - 마지막 선택이 파일 → 프리뷰 컬럼(renderPreview prop)
   - 가로 스크롤, 컬럼 고정 너비

3. **Viewer 액티비티바** — PageViewer 수정
   - 하단 액티비티바: Explorer(기존) / Docs(MillerColumns) 모드 전환
   - Docs 모드: docs/ 폴더를 MillerColumns로 탐색

4. **/docs 라우트** — PageDocs.tsx 신규
   - 독립 라우트로 docs/ Miller Columns + 마크다운 프리뷰

## 파일 목록
- `src/interactive-os/ui/millerPreset.ts` (신규)
- `src/interactive-os/ui/MillerColumns.tsx` (신규)
- `src/interactive-os/ui/MillerColumns.css` (신규, last-mile)
- `src/pages/viewer/PageViewer.tsx` (수정)
- `src/pages/docs/PageDocs.tsx` (신규)
- `src/router.tsx` (수정)
