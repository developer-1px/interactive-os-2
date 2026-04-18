---
id: 1-projects/viewer/prds/project-viewer-redesign-task
type: plan
slug: projectViewerRedesign
title: 'Project Viewer 재설계 — 도메인 서비스 UI 언어'
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
# Project Viewer 재설계 — 도메인 서비스 UI 언어

## 목표
TreeView → ListBox 기반 프로젝트 리스트로 재구성. 도메인 서비스(GitHub, Linear, Vercel)의 보편 UI 언어를 따른다.

## 변경 파일
1. `src/pages/project/projectData.ts` — lastActivity 필드 추가 (git log 기반 또는 정적)
2. `src/pages/project/projectStore.ts` — 3계층 트리 → 플랫 리스트 (그룹 없이 kind를 프로퍼티로)
3. `src/pages/project/PageProject.tsx` — TreeView → ListBox, renderItem 재설계

## 장르 관습 (필수 요소)
- 항목당: 이름 + 상태 badge(maturity) + 메트릭(files, backlogs) + 시간
- 검색 가능 (ListBox searchable)
- activate → 라우트 이동

## 프로젝트 디테일
- Maturity 단계 (Concept~Production) → tone badge
- P0 표면화 → danger indicator
- 백로그 카운트 (open/done)
- 파일 수
- kind (os/app/infra) → 텍스트 프로퍼티

## renderItem 구조
```
[StatusIndicator] [Name bold] [Maturity badge] [kind tag]  ··· [metrics] [time]
```
