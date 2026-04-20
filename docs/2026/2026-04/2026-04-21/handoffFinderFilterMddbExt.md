---
id: handoffFinderFilterMddbExt
type: handoff
slug: handoffFinderFilterMddbExt
title: "Handoff: finder kind filter가 mddb title 치환으로 오작동하던 문제 수정"
tags: [handoff, finder, filter, mddb]
created: 2026-04-21
updated: 2026-04-21
status: closed
summary: "kindFilters=[code,doc,config] 활성 시 docs 하위 폴더/파일이 대거 누락되던 버그 수정. filter가 display name 대신 path에서 확장자 추출하도록 변경."
pr: "https://github.com/developer-1px/interactive-os-2/pull/8"
merge_commit: "3f5ddb1ae794e50e5187e99f8ca61326f11accbd"
---

# Handoff: finder kind filter × mddb title 확장자 소실

> Finder의 `/` 사이드바로 docs를 열고 필터(Code/Doc/Config)를 켜면 2026-03 하위 14개 날짜 폴더 중 1개(2026-03-27)만 노출되던 버그. mddb frontmatter `title`이 파일 display name을 대체하면서 확장자가 사라져 filter의 `getExt(name)`이 빈 문자열을 리턴하는 게 원인.

## 완료

| 커밋 | 내용 |
|------|------|
| `3f5ddb1a` (PR #8) | fix(finder): mddb title 치환 시 확장자 소실로 filter 오작동 |

- PR: https://github.com/developer-1px/interactive-os-2/pull/8 (MERGED)
- Merge strategy: squash (--admin 사용자 인가)

## 남은 것

### 미완료 (다음 세션 첫 작업)
없음.

### 이후 (backlog)
- 다른 세션의 uncommitted 변경이 많음 (layout refactor, persist plugin, FavoritesFeature 등). 이 세션 책임 아님 — 해당 세션들이 스스로 정리.

## 컨텍스트

- **변경 파일**: `src/pages/finder/finderFilter.ts:39-49`
- **원인**: `src/pages/finder/treeTransform.ts:14` — `titleMap?.get(node.id) ?? node.name`가 mddb title로 display name을 대체하며 확장자가 사라짐. title 예: "interactive-os — Architecture Map".
- **수정 전략**: filter matches()가 `entity.data.path`(원본 id=fullpath)의 basename에서 확장자 추출. path 없으면 name 폴백.
- **재현 시나리오**: URL `/finder/docs/2026/2026-03/2026-03-27/node-editing.story.yaml`, localStorage `finder-kind-filters='["config","code","doc"]'`, viewmode=columns.
- **주의**: name에도 period가 있을 수 있으나(`.v2`, `node-editing.story.yaml`) path 우선이 더 안전. 테스트 케이스로 mddb title 친 .md 파일 + yaml 파일 공존 폴더를 사용.

## 이어받는 법

세션 교체 시 새 세션이 `/handoff`를 치면 Step B가 이 파일을 집어간다.
구체적 첫 행동: **PR #8를 GitHub UI에서 수동 squash merge**. 그 후 `docs/2026/2026-04/2026-04-21/handoffFinderFilterMddbExt.md`의 `merge_commit` 필드를 실제 merge hash로 업데이트.
