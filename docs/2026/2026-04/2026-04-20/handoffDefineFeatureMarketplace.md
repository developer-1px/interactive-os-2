---
id: handoffDefineFeatureMarketplace
type: handoff
slug: handoffDefineFeatureMarketplace
title: "Handoff: defineFeature 마켓플레이스 조립 플랫폼"
tags: [handoff, feature-marketplace, os]
created: 2026-04-20
updated: 2026-04-20
status: open
summary: "ax OS에 defineFeature/defineApp 도입, Finder를 baseline + 4 Feature로 조립, Settings 체크박스로 런타임 install/uninstall UX 증명"
pr: "https://github.com/developer-1px/interactive-os-2/pull/7"
merge_commit: "pending"
---

# Handoff: defineFeature 마켓플레이스 조립 플랫폼

> 깡통 앱 + 수직 기능 슬라이스 조립 플랫폼의 뼈대·런타임·UI를 한 세션에서 전부 만들고 /feature-finder 라우트에서 실사용 검증. PR #7, CI 진행 중.

## 완료

| 커밋 (feature branch) | 내용 |
|---|---|
| `f0778bd5` | defineFeature + defineApp 마켓플레이스 조립 뼈대 |
| `71a0802f` | BookFeature/MillerFeature tsx 전환 + Public ax 축 |
| `d61313d5` | featureRegistryToPlugin 어댑터 (Feature keymap → engine Plugin) |
| `2e4fc921` | BaselineFinderApp + /feature-finder 라우트 |
| `ab91e69b` | Book Prev/Next 버튼, TabList initialFocus 제거 |
| `1933f53a` | Settings 버튼 + Feature install/uninstall 체크박스 |
| `a10253a6` | FavoritesFeature (RECENT + FAVORITES 사이드바 기여) |
| `31786fb8` | lint fix (react-refresh + setState-in-effect) |

- PR: https://github.com/developer-1px/interactive-os-2/pull/7
- CI: pending → 사용자 확인 후 squash merge 권장 (구현 커밋들이 iterative 검증 히스토리)

## 남은 것

### 미완료 (다음 세션 첫 작업)
1. **PR #7 CI 통과 확인 + squash merge** — `gh pr checks 7` 통과 시 `gh pr merge 7 --squash --delete-branch`, 이후 worktree `git worktree remove .worktrees/feature-runtime --force`
2. **Feature keymap 실런타임 통합** — featureRegistryToPlugin 어댑터는 완성이지만 BaselineFinderApp이 이 plugin을 실제 엔진에 주입하지 않음. 현재 Book ←/→는 Prev/Next 버튼으로 대체. 통합 시 viewMode별 keymap이 자동 활성.
3. **view-state plugin 메커니즘** — BookFeature.currentPage를 useState-hatch로 유지 중. engine plugin 차원의 view-state 축 필요.

### 이후 (backlog 후보)
- `config` 주입 지원: `defineApp({ features: [{ feature: FsFeature, config: { rootPath } }] })` — FsFeature가 rootPath를 설정으로 받도록
- 나머지 Finder Feature화: Sort / Filter / QuickOpen / Knowledge / Timeline / UrlSync
- toolbar / commandPalette / previewRenderer 기여 타입 런타임 소비 (현재는 선언만)
- dataSource 여러 개일 때의 전환 UX (현재는 첫 번째만 사용)

## 컨텍스트

- **관련 memory**: `project_define_feature_marketplace.md` — 7 기여 타입, 자동 파생 원칙, props-first 압력
- **검증 파일**: `src/interactive-os/feature/__tests__/feature.test.ts` (9 테스트)
- **실사용 라우트**: `/feature-finder`
- **주의**:
  - os 훅이 `addEventListener('key*')`·`onKeyDown` 모두 차단 → keymap은 반드시 engine plugin 경로로
  - 파일 파일명 convention: Feature export 파일이 component도 함께 export할 때 `/* eslint-disable react-refresh/only-export-components */` 필요
  - TabList `initialFocus` 지정 시 React 재렌더마다 focus 리셋되는 현상 있음 → 사용 지양

## 이어받는 법

세션 교체 시 새 세션이 `/handoff`를 치면 Step B가 이 파일을 자동 집어간다.

구체적 첫 행동:
```bash
gh pr checks 7  # CI 통과 확인
gh pr merge 7 --squash --delete-branch
git worktree remove /Users/user/Desktop/aria/.worktrees/feature-runtime --force
```
