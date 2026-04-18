---
id: 2-areas/engine/prds/plugin-default-keymap-task
type: plan
slug: pluginDefaultKeymap
title: Plugin Default KeyMap + CMS Sidebar Cleanup
tags: [untagged]
created: 2026-04-02
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Plugin Default KeyMap + CMS Sidebar Cleanup

## 배경
crud/dnd/clipboard 플러그인이 commands만 갖고 keyMap이 없어서, 사용처마다 수동 키바인딩을 반복. 사회적으로 약속된 키(Delete, Mod+Arrow 등)를 플러그인 기본 keyMap으로 올린다.

## 작업 순서

1. **crud 플러그인** — `Delete`, `Backspace` → remove(focused) keyMap 추가
2. **dnd 플러그인** — `Mod+ArrowUp`, `Mod+ArrowDown` → moveUp/moveDown keyMap 추가
3. **clipboard 플러그인** — `Mod+D` → copy+paste (duplicate) keyMap 추가
4. **CmsLayout sharedPlugins** — `crud()`, `dnd()` 추가
5. **CmsSidebar sidebarKeyMap** — 플러그인이 처리하는 키 제거 (Enter/Escape만 남김)
6. **Verify** — typecheck, lint, test, check:deps 통과

## 수정 파일
- `src/interactive-os/plugins/crud.ts`
- `src/interactive-os/plugins/dnd.ts`
- `src/interactive-os/plugins/clipboard.ts`
- `src/pages/cms/CmsLayout.tsx`
- `src/pages/cms/CmsSidebar.tsx`

#kind/plan #topic/engine
