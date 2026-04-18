---
id: 1-projects/viewer/prds/project-viewer-task
type: plan
slug: projectViewer
title: Project Viewer Task
tags: [untagged]
created: 2026-04-06
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Project Viewer Task

## 목표
전체 프로젝트 조감도를 보여주는 `/project` 라우트. interactive-os + ax()만 사용, custom CSS 없음.

## 산출물

1. `src/pages/project/projectData.ts` — 데이터 추출 (파일 수, 백로그 파싱)
2. `src/pages/project/projectStore.ts` — NormalizedData store
3. `src/pages/project/PageProject.tsx` — 페이지 컴포넌트
4. `src/router.tsx` — 라우트 등록
5. `src/ActivityBar.tsx` — 메뉴 항목 추가

## 데이터 모델

```
Project (ListBox item)
├─ name: string
├─ fileCount: number (src/pages/{name}/ 하위 파일 수)
├─ openBacklogs: number
└─ children: Backlog[]

Backlog (드릴다운 시 표시)
├─ text: string
├─ priority: P0|P1|P2
├─ done: boolean
└─ projectTag: string (자동 매핑)
```

## UI 구조

- 첫 화면: ListBox — 프로젝트 목록 (name, fileCount, openBacklogs)
- 선택 시: 하단 또는 우측에 해당 프로젝트의 백로그 목록
- os 컴포넌트: ListBox, TreeView 또는 Grid

## 데이터 소스

- import.meta.glob(`/src/pages/**/*`) → 프로젝트별 파일 수
- import.meta.glob(`/docs/BACKLOGS.md`, { query: '?raw' }) → 백로그 파싱
- PROGRESS.md → 성숙도 (선택)
