---
id: handoffInspectorSourcePreviewScroll
type: handoff
slug: handoffInspectorSourcePreviewScroll
title: "Handoff: Inspector SourcePreview 전체 파일 뷰 + 스크롤"
tags: [handoff, devtools, inspector]
created: 2026-04-20
updated: 2026-04-20
status: open
summary: "Debug Inspector lock 시 뜨는 SourcePreview를 720×560로 확장하고 파일 전체를 스크롤 가능하게 전환"
---

# Handoff: Inspector SourcePreview 전체 파일 뷰 + 스크롤

> ⇧⌘D Inspector에서 컴포넌트를 lock하면 뜨는 코드 미리보기가 ±2줄·480×140 고정에 스크롤 불가였던 것을, 720×560 + 파일 전체 + 자동 라인 정렬로 확장.

## 완료

| 커밋 | 내용 |
|------|------|
| `ba317a21` | feat(inspector): SourcePreview lock 시 전체 파일 뷰 + 스크롤 |

- `src/devtools/inspector/SourcePreview.tsx`
  - `PREVIEW_WIDTH 480→720`, `PREVIEW_HEIGHT 140→560`
  - `extractSnippet` 제거, 파일 원문 그대로 `CodePreview`에 전달
  - 내부 스크롤 컨테이너 `ref`로 `[data-line="N"]` 찾아 중앙 정렬
  - 외곽 `pointerEvents: 'auto'`로 휠 입력 수용
- `.claude/hooks/guardOsPatterns.mjs`
  - `INSPECTOR_OVERLAY_FILES`에 `SourcePreview` 추가 (기존 `InspectorOverlay`·`MarqueeSelect`와 동일한 overlay 성격)

## 남은 것

### 미완료
- 없음 — 기능 완결.

### 이후
- 기존부터 dirty 상태인 파일들은 이 세션과 무관: `.claude/skills`, `src/interactive-os/ui/Tooltip.tsx`, `src/styles/ax.css`, `src/interactive-os/ui/cells/{EnumCell,SearchableCell}.tsx` (TS2322 AxTone 에러 2건 기존), untracked `guardMockupFidelity.mjs`·`MockupBar.tsx`·`gmailContext.ts` 외 mockup 관련 파일들. 해당 세션에서 마무리 필요.

## 컨텍스트

- **관련 파일**: `src/devtools/inspector/{SourcePreview,InspectorOverlay,ComponentInspector}.tsx`, `src/interactive-os/ui/CodePreview.tsx` (`data-line` 속성 생성자)
- **주의**:
  - `InspectorOverlay` 루트가 `pointerEvents: 'none'`이라 SourcePreview에서 명시적으로 `'auto'`를 켜야 휠 이벤트가 잡힌다.
  - `fileCache`(module-scope Map)가 파일 원문을 캐싱한다 — 같은 파일 재lock 시 재요청 없음.
  - `Mod+O`의 `QuickLookModal` 전체 보기는 그대로 유지.

## 이어받는 법

추가 작업 없음. 세션을 그대로 닫아도 된다. 검증은 `pnpm dev` → ⇧⌘D → 아무 컴포넌트 lock → 박스 스크롤·라인 중앙 정렬 확인.
