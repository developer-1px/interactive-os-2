---
id: 0-inbox/handoff-2026-04-17-replay-design-fix
type: handoff
slug: replayDesignFix
title: 'Handoff: /replay 디자인 5 결함 수정'
tags: [untagged]
created: 2026-04-17
updated: 2026-04-18
summary: 'Shorts 스타일 /replay 뷰어의 5개 결함(사이드바·하단UI·하이라이트·scroll/zoom·search)을 수정하고 SlotCtxRegistry 누수를 리팩토링. cf10a6fa로 커밋 완료, 브라우저 시각 재확인 남음.'
legacy:
  created_at: 2026-04-17
  session_id: 2026-04-17-replay-design-fix
  status: inbox
  kind: handoff
  topics: [0-inbox]
  relates: []
  supersedes: []
---
# Handoff: /replay 디자인 5 결함 수정

> Shorts 스타일 /replay 뷰어의 5개 결함(사이드바·하단UI·하이라이트·scroll/zoom·search)을 수정하고 SlotCtxRegistry 누수를 리팩토링. cf10a6fa로 커밋 완료, 브라우저 시각 재확인 남음.

## 완료

| 커밋 | 내용 |
|------|------|
| `cf10a6fa` | fix(replay): Sidebar 고정 + 하단 UI 제거 + ReplaySearchStage + Scroll→Zoom 순차 + 하이라이트 정합 + SlotCtxRegistry 리팩토링 |

세부:
- **Sidebar 항상 표시**: `PageReplay.tsx`의 `{activeCtx && <Sidebar/>}` 조건 분리 → prop 주입, `ReplaySidebarWidget`이 ctx null에서도 Combobox/Replay 버튼 렌더
- **하단 UI 제거**: progress bar(3px) + thinking dots 삭제 (`replayWidgets.tsx` 구 line 257/287)
- **ReplaySearchStage 신규**: 쿼리 히어로 타이포 + 매치 카운트 강조 + 파일 그룹 카드 (lucide `Search` 아이콘)
- **Scroll → Zoom 순차화**: `ZoomPane.zoomToLine` 내부에서 `scrollToLineAwait()` Promise 완료 후 `applyTransform`. scrollend/rAF-3tick/600ms timeout 3중 fallback
- **하이라이트 정합**: `.code-line--*` 클래스를 `padding/border` 없이 `background-image` 2층 layer로 재작성. `--tone-destructive-base` 오타 수정
- **SlotCtxRegistry 리팩토링**: 전역 Map + render 중 `.set()` → `useState + register callback + useEffect cleanup`. stale ctx 읽기/메모리 누수 해소
- **useFlash 훅 추출**: `flashFile` + `toolSplash` 통합

## 남은 것

### 즉시 (다음 세션 첫 작업)

1. **브라우저 시각 smoke** — 이번 세션은 claude-in-chrome extension이 중도 끊어져 Search/Scroll→Zoom 체감 확인 불가. `localhost:5173/replay`에서 재생 30~60초 보며 Search 히어로 타이포, Scroll→Zoom 순차성, 사이드바 유지를 육안 검증
2. **CodeBlock → CodeViewer rename 참조 정리 (세션 외)** — pre-session uncommitted의 rename 미완. 다음 4곳이 `tsc -b` 캐시 stale 에러:
   - `src/interactive-os/ui/index.ts:20,90` (`CodeBlock`, `VirtualCodeBlock` 둘 다 이미 삭제됨)
   - `src/interactive-os/ui/MarkdownViewer.tsx:11` (Vite 런타임은 OK지만 type 레벨)
   - `src/interactive-os/ui/viewerTypes.ts:2` (`HighlightTone` import)
   - `src/pages/creator/creatorWidgets.tsx:7`
   — `CodeBlock` → `CodeViewer`로 치환. 3건은 이미 Vite transform이 처리하지만 tsconfig는 경로 기준이라 수정 필요.

### 이후 (backlog)

- **평가자 디자인 피드백 잔여** — Search 스테이지에서 재생 2회차 이후 Summary 엔드 카드가 공허(큰 빈 공간). 컨텐츠 밀도 보강 필요
- **useFlash 훅을 `src/interactive-os/ui/useFlash.ts`로 분리** — 현재 `replayWidgets.tsx` 내부. 범용 transient flash 훅이라 공유 레이어가 맞음
- **세션 외 pre-session uncommitted** (`SessionDetailModal.tsx +333`, `SkillKanban.css`, `replayStages.css`, `replayContext.ts`, `ChatCodeBlock.tsx`, `styles/ax.css`, `styles/ax.ts`, `styles/reset.css`, `cmsApi.ts`, `keyline/*` 등) — 이 세션과 무관한 변경 다수. 별도 커밋 필요 (용도 분류 후 분리)
- **lint 에러 36건 (프로젝트 전역)** — 이번 세션 파일 외. 누적 부채

## 컨텍스트

- **대화 트리거**: `/discuss http://localhost:5173/replay 디자인 수정` (사용자 지점별 구체 불만 5건)
- **핵심 증거 스크린샷**: `.sidebarHeader` 4줄에 초록 하이라이트가 라인 번호와 어긋난 사용자 제공 이미지 (세션 messages 중)
- **평가자 1라운드 불합격**:
  - #1 Sidebar 침범 → **오독 판정** (실제 스크린샷상 겹침 없음)
  - #2 deleted tone 무효화 → **수정 완료** (`--tone-danger-base` → `--tone-destructive-base` 오타)
  - #3 Search 히어로 타이포 부재 → **브라우저 재검증 필요**
- **발견한 원칙**:
  - `padding-left !important` override가 shiki `text-indent: -3.5em` 과 조합되어 gutter/텍스트 x축 shift → 배경 box가 어긋나 보임. **border-left 대신 background-image 2층 layer**가 정답
  - CSS tone 변수는 `--tone-destructive-*` (not `--tone-danger-*`). `tokens.css:57~60`
  - Shorts UX에서 zoom은 반드시 scroll 완료 **후** 발동. 동시 발동하면 어색
- **주의**:
  - `SlotCtxRegistry` 전역 Map 패턴은 안티패턴 — 다시 부활시키지 말 것. render side-effect + cleanup 부재
  - `useFlash` 내부 effect는 transient 플래시 목적으로 `setState-in-effect`가 의도적. eslint-disable 유지
  - `CodeBlock.*` → `CodeViewer.*` rename은 이 세션 전 시작된 작업 — 완성은 다른 세션 책임

## 이어받는 법

다음 세션에서 `/handoff`를 치면 이 파일을 자동으로 찾아 읽는다.

**구체적 첫 행동**: `pnpm dev`로 서버 확인 후 `localhost:5173/replay` 브라우저 열기. 재생되는 동안 5 지점 시각 smoke (특히 Search 스테이지가 떠야 히어로 타이포 확인 가능 — 세션 2~3 정도 기다릴 것).

#kind/handoff
