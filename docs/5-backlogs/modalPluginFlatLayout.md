---
id: 5-backlogs/modalPluginFlatLayout
title: 'Modal을 os plugin + FlatLayout overlay로 통일 — 2026-04-11'
status: backlog
kind: note
created: 2026-04-11
updated: 2026-04-11
topics: [5-backlogs]
relates: []
supersedes: []
---
# Modal을 os plugin + FlatLayout overlay로 통일 — 2026-04-11

## 배경

Lightbox에서 dialog close 시 inline style 잔재 버그를 발견하면서, 4곳(Lightbox, FileViewerModal, QuickOpen, SkillKanban)이 각자 showModal/close/addEventListener('close')/focus recovery를 수동 관리하고 있음을 확인. useOverlay hook이 있지만 0곳이 사용 중. React hook이라 os 패러다임과 불일치.

## 내용

- `definePlugin('modal')` — open/close를 command로 관리. focus trap, focus recovery, backdrop dismiss, ESC dismiss가 plugin 책임
- FlatLayout overlay 레이어에 modal content를 widget으로 선언. dialog DOM 생성/파괴도 엔진이 관리
- modal content(Lightbox, FileViewer, QuickOpen 등)는 FlatLayout widget registry에 등록하고 modal plugin이 widgetId로 참조
- 개별 컴포넌트는 `engine.dispatch(modalCommands.open({ widget: 'lightbox', props: {...} }))` 만 호출

## 검증

- 4곳 모두 직접 showModal/close 호출 제거
- useOverlay hook 폐기 가능 여부 확인
- ESC dismiss, backdrop click, focus recovery 동작 유지
- inline style 잔재 문제 구조적 불가능

## 출처

Lightbox mermaid lightbox 구현 세션에서 발견 (2026-04-11). FlatLayout Phase2(ui/) 범위.
