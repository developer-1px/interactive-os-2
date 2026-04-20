---
id: handoffUseThemeRemountFix
type: handoff
slug: handoffUseThemeRemountFix
title: "Handoff: useTheme 불안정 콜백 → 전체 앱 remount 차단 + createModuleStore OS 승격"
tags: [handoff, appshell, module-store, antipattern]
created: 2026-04-20
updated: 2026-04-20
status: open
summary: Finder 파일 선택 시 "새로고침" 증상의 실제 원인은 AppShell 전체 remount였음. useTheme을 createModuleStore로 승격하고 동일 안티패턴 3종을 훅 규칙(39/40/41)으로 차단.
---

# Handoff: useTheme 불안정 콜백 → 전체 앱 remount 차단 + createModuleStore OS 승격

> Finder 파일 선택 시 "새로고침" 체감의 실제 원인은 `useTheme.toggle`이 useCallback 없이 매 렌더마다 새 참조라, navigate의 useLocation 재렌더 때 AppShell registry useMemo가 무효화되어 ShellActivityBar/ShellContent가 전체 remount되던 것. MCP 브라우저로 MutationObserver 계측하여 확정.

## 완료

| 커밋 | 내용 |
|------|------|
| `f1f05145` | fix(appshell): useTheme remount 차단 + createModuleStore 도입 + 규칙 39~41 |
| `469948c` (skills submodule) | antipattern 체크리스트 #10/#11 + 규칙 39~41 기록 |

주요 산출물:
- `src/interactive-os/store/createModuleStore.ts` (신규) — 단일 값 전역 상태용 경량 OS primitive. `{ get, set, subscribe, use }` 모듈-스코프 stable reference + localStorage 자동 persist.
- `src/hooks/useTheme.ts` — createModuleStore 기반으로 재작성. 공개 API 동일.
- `src/pages/cms/cmsState.ts`, `src/pages/writer/writerStore.ts` — 수동 pub/sub 패턴 소급 마이그레이션.
- `src/pages/finder/widgets/FilePanel.tsx` — setContent('') 깜빡임 제거 + 스크롤 리셋 분리 effect.
- `.claude/hooks/guardOsPatterns.mjs` 규칙 39/40/41.
- `docs/2026/2026-04/2026-04-20/explainFinderPreviewRefresh.md` — 원인 체인 해설.

브라우저 검증: ActivityBar NAV의 data-marker가 파일 3회 연속 선택 후에도 유지(= remount 없음). FlatLayout WidgetSlot 교체 0회.

## 남은 것

### 미완료 (지금 세션에서 이어가도 되는)
1. **main push 사용자 승인** — `git log @{u}..` 에 unpushed 9커밋 (내 1 + 타 세션 8). 내 커밋 f1f05145만 포함되면 `git push` 즉시 가능하나 타 세션 커밋이 섞여 있어 사용자 확인 필요.
2. **pre-existing test 실패 3건** (`src/__tests__/route-json-editor.screen.test.tsx`) — 타 세션 작업. 내 변경과 무관하므로 여기선 방치. handoff로 남겨 둠.

### 이후 (이번 세션 외부로 미룸)
- **finderStore / chatStore의 createCommandEngine 승격** — 현재 수동 pub/sub 상태. moduleStore로는 눌러담기 어렵고(HMR hot.data, SSE, Map 세션 관리 등) 도메인이 커서 command engine + plugin 조합이 맞다. 별도 세션에서 다룰 것.
- **bookNavStore** — 모듈 let + getter/setter 패턴인데 구독이 없어 오늘은 버그 아님. 미래에 UI 실시간 반영 필요해지면 createModuleStore 승격. 체크리스트 #11 후보.
- **useState + localStorage 전수 감사 (pages/)** — 규칙 41은 hooks/ 한정. pages/ 내부 동일 패턴은 정적 판정 경계가 흐려 체크리스트로 남김 (#10 승격 신호).

## 컨텍스트

- **관련 진단 문서**: `docs/2026/2026-04/2026-04-20/explainFinderPreviewRefresh.md`
- **antipattern 스킬 체크리스트**: `.claude/skills/antipattern/SKILL.md` 항목 #10, #11
- **주의**:
  - createModuleStore는 **단일 값 토글·설정 전용**. 여러 필드 상호 의존/validator/undo/로깅 필요해지면 createCommandEngine으로 승격해야 한다 (체크리스트 #10에 결정 트리 있음).
  - 규칙 40이 `useSyncExternalStore` 직접 호출을 차단하므로 새 hook/page에서 수동 구현 시도가 즉시 막힌다. OS 내부는 isExempt로 허용.
  - useTheme 공개 API(`{ theme, toggle }`)는 동일하게 유지 — 기존 consumer(ActivityBar, PublicShell, PageThemeCreator) 변경 불필요.

## 이어받는 법

세션 교체 시 이 handoff를 집어가면:
1. `git log @{u}..HEAD` 확인하여 미push 상태 파악. main이고 타 세션 커밋 섞여 있으면 사용자에게 push 여부 재확인.
2. 필요 시 `pnpm dev` 띄우고 `/finder`에서 파일 여러 개 연속 선택해 "새로고침" 재현 안 됨을 눈으로 확인.
3. "이후" 섹션 중 finderStore/chatStore createCommandEngine 승격이 필요해지면 별도 세션으로 분리 제안 (큰 작업).
