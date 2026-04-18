---
id: 0-inbox/handoff-2026-04-16-cms-llm-friendly
type: handoff
slug: cmsLlmFriendly
title: 'Handoff: CMS LLM 친화적 접근성 개선'
tags: [untagged]
created: 2026-04-16
updated: 2026-04-18
summary: 'LLM 브라우저 자동화 에이전트가 CMS를 효율적으로 조작할 수 있도록 aria-label, field name, breadcrumb, window.cms API 4가지를 추가했다.'
legacy:
  created_at: 2026-04-16
  status: inbox
  kind: handoff
  topics: [0-inbox]
  relates: []
  supersedes: []
---
# Handoff: CMS LLM 친화적 접근성 개선

> LLM 브라우저 자동화 에이전트가 CMS를 효율적으로 조작할 수 있도록 aria-label, field name, breadcrumb, window.cms API 4가지를 추가했다.

## 완료

| 커밋 | 내용 |
|------|------|
| `972895fc` | feat(cms): LLM 친화적 접근성 개선 — aria-label, field name, breadcrumb, window.cms API |

### 상세

1. **섹션 aria-label** — 사이드바 썸네일에 `Section 1: hero — Keyboard-first` 형식의 의미 있는 라벨
2. **필드 name 속성** — input/textarea에 `name="nodeId.field"` 형식 (예: `hero-title.value`)
3. **편집 breadcrumb** — 우측 패널에 `section: hero › text: Keyboard-first` 경로 표시, `aria-label="Edit path"`
4. **window.cms API** — `get/update/updateText/list/inspect/export/import` 7개 메서드, Command 패턴 사용

### simplify 적용

- `getParentId` 중복 제거 → 기존 `getParent` from `@os/store/createStore` 사용
- `buildBreadcrumb` useMemo 래핑
- 사이드바 aria-label 계산을 memoized `computeSectionGrouping`으로 이동
- PageCms useEffect deps 안정화 (useRef 패턴)

## 남은 것

### 즉시 (다음 세션 첫 작업)

없음 — 이번 요구사항 5건 모두 완료.

### 이후 (개선 가능)

- `cms.import()` 트랜잭션 보장 — 현재 field별 개별 dispatch, 부분 실패 시 상태 불일치 가능 (undo로 복구는 가능)
- `cms.search(query)` — 노드를 텍스트로 검색하는 편의 API 추가 가능

## 컨텍스트

- **관련 파일**: `src/pages/cms/cmsApi.ts` (새), `CmsSidebar.tsx`, `CmsDetailPanel.tsx`, `PageCms.tsx`
- **주의**: `window.cms`는 CMS 페이지(`/`) 마운트 시에만 사용 가능. 다른 라우트에서는 undefined.

## 이어받는 법

다음 세션에서 `/handoff`를 치면 이 파일을 자동으로 찾아 읽는다.
구체적 첫 행동: `window.cms.list()` 콘솔 실행으로 API 동작 확인
