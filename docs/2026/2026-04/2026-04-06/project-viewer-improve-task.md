---
id: 1-projects/viewer/prds/project-viewer-improve-task
title: Project Viewer /improve Task
created: 2026-04-06
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Project Viewer /improve Task

## Feature 1: 시각 계층 — 그룹 분리 + 크기/긴급도 시각화

### 1-1. 그룹 헤더 시각 분리
- `PageProject.tsx` renderItem group → `border: 'bottom'` 추가
- 그룹 간 구분감 확보

### 1-2. P0 표면화
- `projectStore.ts` — 프로젝트 data에 `hasP0` 플래그 추가
- `PageProject.tsx` — hasP0인 프로젝트에 `tone: 'danger'` 또는 `text: 'danger'` 표시

### 1-3. open 있는 프로젝트 강조
- `PageProject.tsx` — openBacklogs > 0인 프로젝트의 이름 색상을 accent로

## Feature 2: 프로젝트 Activate → 라우트 이동

### 2-1. path 필드 추가
- `projectData.ts` — ProjectInfo에 `path?: string` 추가
- APP_DISPLAY_NAMES 옆에 경로 매핑 (cms→'/', viewer→'/viewer', etc.)

### 2-2. onActivate 연결
- `PageProject.tsx` — TreeView에 `onActivate` prop
- 프로젝트 노드 activate → `navigate(path)`
- 백로그/그룹 노드는 무시

## 검증
- 브라우저 스크린샷: 그룹 분리, P0 강조, open 강조 확인
- Enter로 프로젝트 이동 확인
- typecheck 통과

#kind/plan #topic/viewer
