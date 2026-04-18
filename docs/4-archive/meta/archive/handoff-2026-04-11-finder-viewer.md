---
id: 4-archive/meta/archive/handoff-2026-04-11-finder-viewer
title: Handoff: Finder Viewer
status: archived
kind: handoff
created: 2026-04-11
updated: 2026-04-11
summary: 'consumed_by: 7a4c6d1d (FilePreview OCP 통합)'
topics: [4-archive]
relates: []
supersedes: []
---
# Handoff: Finder Viewer

consumed_by: 7a4c6d1d (FilePreview OCP 통합)

> 2026-04-11 세션에서 viewer를 Finder 스타일로 전면 리팩토링 + List X-ray 기능 추가

## 완료

| 커밋 | 내용 |
|------|------|
| `4cde8631` | feat: Finder 스타일 viewer — NavList 사이드바 + viewmode 전환 |
| `b11d1a13` | fix: Quick Look Space 키 매칭 |
| `1c676ad2` | feat: follow-focus 파일 프리뷰 (SidePanel + renderPreview) |
| `719ad522` | fix: 디자인 안티패턴 3건 (FAVORITES 중복, toolbar border, EmptyState) |
| `4702fba0` | feat: List X-ray — TreeGrid 메타데이터 컬럼 + 정렬 + 필터 |
| `9a6ba846` | refactor: TreeGrid column→simple mode — 행 단위 네비게이션 |
| `33d8180f` | fix: 정렬/필터 바 Button ui 부품 사용 |
| `484acf90` | fix: 파일 아이콘 복원 |
| `dff1d085` | refactor: 리스트/컬럼뷰 FileIcon + item-sm 통일 |
| `75e46e0c` | refactor: Quick Look 제거 — previewPath가 대체 |
| `e5af8d1d` | refactor: simplify |
| `6253a1c5` | docs: close — PROGRESS 갱신 |

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **사이드바 확장** — Recents(최근 파일 8개), Layers(axis/pattern/ui 단축), PARA Sections(docs 하위 바로 진입). 기획 3명 합의 완료. sidebarData에 그룹 추가 + localStorage 기록. — `src/pages/viewer/PageViewer.tsx`

### 이후
- **MillerColumns onActivate 미발동** — miller preset에 Enter/Space activate 바인딩 없음. 파일 더블클릭으로 activate가 안 됨. 현재는 follow-focus preview로 대체했지만 근본 해결 필요 — `src/interactive-os/ui/millerPreset.ts`
- **dark 모드 아이콘 대비** — FileIcon이 dark 배경에서 묻힘. 테마 레벨 작업
- **viewerWorkspace.ts 삭제** — Quick Look 제거로 dead code. import 없으므로 파일 삭제 가능

## 컨텍스트

- **PRD**: `docs/1-projects/finder-viewer/prds/finder-viewer-prd.md` (초기 Finder 구조)
- **PRD**: `docs/1-projects/finder-viewer/prds/list-xray-prd.md` (List X-ray)
- **기획 결과**: 기획 에이전트 3명 (개발자/IA/디자이너) 아이디어 — Recents/Layers/Smart Filters 등

## 다음 행동 제안

`/go`로 시작하면 이 handoff를 자동으로 픽업한다.
구체적으로: 사이드바 Recents + Layers 추가 (기획 합의 완료, sidebarData 확장만으로 구현 가능)
