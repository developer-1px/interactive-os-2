---
id: handoffFlatLayoutOcpSrp
type: handoff
slug: handoffFlatLayoutOcpSrp
title: "Handoff: FlatLayout OCP+SRP 리팩토링"
tags: [handoff, flatlayout, ocp, srp, refactor]
created: 2026-04-21
updated: 2026-04-21
status: open
summary: "FlatLayout.tsx 566→111 LOC, slidesWidgets.tsx 653→307 LOC. 로컬 branch refactor/flatlayout-ocp-srp에 2커밋 대기 — origin/main 동기화 후 PR 생성 필요."
pr: ""
merge_commit: ""
---

# Handoff: FlatLayout OCP+SRP 리팩토링

> FlatLayout의 거대 layoutRenderers 맵을 nodes/<type>.tsx로 분산 + slidesWidgets.tsx를 도메인별 4파일로 분리. 로컬 브랜치에 2커밋 대기.

## 완료 (로컬 브랜치)

브랜치: `refactor/flatlayout-ocp-srp` (로컬 only, origin/main 기준)

| 커밋 | 내용 |
|------|------|
| `de855b2e` | refactor(layout): FlatLayout 노드 타입별 분산 + defineLayoutNode registry |
| `9fc1fc25` | refactor(slides): slidesWidgets 653→307 LOC, 도메인별 4파일로 분산 |

### 산출물

**FlatLayout OCP+SRP** (`de855b2e`):
- 신규: `src/interactive-os/layout/defineLayoutNode.ts` (registry + descriptor 타입)
- 신규: `src/interactive-os/layout/defineLayout.ts` (팩토리, flatLayout.ts에서 분리)
- 신규: `src/interactive-os/layout/nodes/` — 12 타입 파일 + `_shared/` 3개
  - `nodes/index.ts` — side-effect import + `_AssertAllRegistered` 타입 커버리지 체크
  - 각 타입 파일: `defineLayoutNode(type, { render, isAppRoot?, fillsChildren?, labelFrom? })`
- 신규: `src/interactive-os/ui/useFlatLayoutSurface.ts` (Context + hook 분리)
- 변경: `FlatLayout.tsx` 566→111 LOC (렌더러·화이트리스트·헬퍼 전부 분산)
- 변경: `flatLayout.ts` 순수 타입 파일로 환원
- 변경: 19개 pages/inspector의 `@os/layout/flatLayout` → `@os/layout/defineLayout` import 이관

**slides SRP** (`9fc1fc25`):
- 신규: `slidesTransform.ts` — SlideRow/computeSlideRows/slidesToNormalizedData
- 신규: `slidesDeckWidgets.tsx` — 5 위젯 (Header/Search/Filter/Canvas/Outline)
- 신규: `slidesChatWidgets.tsx` — 2 위젯 (SuggestionChips/PromptComposer)
- 신규: `slidesOverlayWidgets.tsx` — 1 위젯 (CommentThread)
- 변경: `slidesWidgets.tsx` 653→307 LOC (registry 허브 + 잔류 4개 위젯)
- os 위반 3건 해소: ChatFeed renderItem identifier화, SlideSorter `<Button>` 승격, DeckSettings placement 제거

### Verify 통과
- typecheck: 내 파일 에러 0 (사전 에러 2개: KeyHintBar · gmail/fixtures)
- lint: 내 파일 에러 0 (사전 에러 4개: 타 세션)
- check:deps: 내 신규 위반 0 (slides의 pages-no-primitives는 분리 전에도 존재)

## 남은 것

### 🔴 미완료 (다음 세션 첫 작업) — push + PR

**왜 push 못 했나**: 로컬 main이 origin/main보다 30커밋 앞서 있음 (타 세션들). 이 세션은 로컬 main 위에서 시작해 브랜치를 땄기에 브랜치가 그 30커밋을 포함. push 시도하자 pre-push baseline check가 30커밋의 누적 회귀(typecheck +2, lint +4, test +6)를 이유로 거부. worktree + cherry-pick 루트도 시도했으나 origin/main과 로컬 main 간 파일 구조 차이(예: `src/pages/__mockup__/gmail/layout.ts` deleted on origin, `src/pages/playground/*` 경로 충돌)로 충돌.

**다음 세션 첫 행동 (택1)**:
1. **로컬 main이 origin/main에 PR로 병합된 직후 재시도**: worktree + cherry-pick이 깨끗하게 성공할 것. 명령:
   ```bash
   git worktree add -b tmp/flatlayout-redo ../aria-flatlayout-redo origin/main
   cd ../aria-flatlayout-redo && git cherry-pick de855b2e 9fc1fc25
   # 충돌 없으면 push + PR
   git push -u origin refactor/flatlayout-ocp-srp
   gh pr create --title "refactor(layout): FlatLayout OCP+SRP 리팩토링" --body "..."
   ```
2. **즉시 진행이 필요하면** origin/main 기준으로 충돌 수동 해소:
   - `src/pages/__mockup__/gmail/layout.ts` — origin에서 삭제된 파일, 내 커밋에서 import 경로만 변경 → `git rm` 선택
   - `src/pages/playground/layoutTools.ts` / `playgroundDefaults.ts` — origin에 변경 있음, 내 커밋의 해당 경로 import는 `src/pages/studio/`로 옮겨진 상태일 수 있음 (로컬 main에서 `studio`로 이미 이관됨) — origin/main 쪽 playground 파일로 재적용 필요

### ⚠️ 잔류 부채 (backlog)

**SlideRail @FIXME(os)** — 이번 SRP 세션 범위 밖 os-layer 작업:
- `renderItem` 인라인 함수: SlideThumbItem이 `(props, node, state) => JSX` 시그니처가 아님 (props 객체 1개). ListBox가 `renderItem(props, node, state)`로 호출하므로 불일치.
  → **해결 방향**: `src/interactive-os/ui/items/SlideThumbListItem.tsx` 신설 — `(props, node, state, options?) => JSX` 시그니처로 node에서 titleText/blockTypes/ratio/hidden 추출해 SlideThumbItem에 전달. slidesTransform의 `slidesToNormalizedData`가 entity.data에 이 속성들을 포함시켜야 함.
- `layout:'scroll'` 직접 사용: SlideRail 내부의 `<div layout:'scroll'>` + 하단 "+ Add slide" Button.
  → **해결 방향**: defineLayout의 `slideRail` 노드에 `scroll: 'y'` 부여 + "+ Add slide"를 별도 `SlideAddBar` 위젯으로 분리해 `slidesCol` children에 추가. SlideRail 위젯은 ListBox만 렌더.

**DeckSettings 렌더링 미연결**: widget은 registry에 있으나 `defineLayout` entities에 `widget: 'DeckSettings'` 엔트리가 없음. `openSettings` 콜백이 호출돼도 렌더 대상이 없어 설정 UI가 뜨지 않음.
  → **해결 방향**: `slidesLayout.entities`에 `settings: { data: { type: 'overlay', overlayType: 'modal', visible: settingsOpen, placement: 'center' }, children: ['settingsWidget'] }` + `settingsWidget: { data: { type: 'widget', widget: 'DeckSettings' } }`. `visible`은 현재 static이지만 command + state 노드로 동적화 필요.

### 이후 (backlog — 이번 세션 범위 밖)
- `writer/writerTransform.ts` 순환 복잡도 warning 3건 (타 세션 관심사)
- deps 위반 413건 (`pages-no-primitives` + 순환 import) — 별도 세션 대상
- 타 세션이 도입한 typecheck 에러 2건: `KeyHintBar.tsx:24` (AxTone 타입) + `gmail/fixtures.ts:1` (@faker-js/faker 미설치)

## 컨텍스트

- **OCP 스킬**: `.claude/skills/ocp/SKILL.md` — 이번 리팩토링의 기준 프레임
- **SRP 스킬**: `.claude/skills/srp/SKILL.md`
- **핵심 설계 결정** (로컬 브랜치에만 있음):
  - `defineLayoutNode`는 `definePlugin`/`defineFeature`와 달리 void 반환 + 전역 Map 부작용 (convention discovery). 이유: layout node는 데이터(entity.data.type)로만 존재, co-location이 불가.
  - 렌더러 이주 시 NavLayoutWrapper/WidgetSlot/ContainerIntentContext/resolveScrollLayout/holdsToSlotAx는 `nodes/_shared/`로. split·stack·grid·bar가 ContainerIntentContext.Provider로 holds를 자식에 전달하는 cascade가 유지되는지 확인 필요.
  - 타입 커버리지 체크는 `nodes/index.ts`의 `_AssertAllRegistered`로 컴파일 타임 강제. 새 노드 타입 추가 시 리터럴 union에 추가 안 하면 컴파일 에러.

- **관련 memory**: `project_flatlayout_direction`, `project_flat_layout_engine`, `feedback_flatlayout_first`, `feedback_flatlayout_model`

## 이어받는 법

세션 교체 시 새 세션이 `/handoff`를 치면 Step B가 이 파일을 자동 집어감. `status: consumed`로 전환됨.

**첫 행동**: 옵션 1 또는 2 중 선택해 `refactor/flatlayout-ocp-srp`의 2커밋을 origin/main에 올리기 위한 PR 생성. 그 전에 로컬 main이 origin/main에 PR 머지되었는지 확인 (`git fetch && git log origin/main..main --oneline`).
