---
id: cmuxUiResidualGaps
type: backlog
slug: cmuxUiResidualGaps
title: 'cmux UI 잔여 gap (매트릭스 기반)'
tags: [untagged]
created: 2026-04-19
updated: 2026-04-18
legacy:
  legacy_status: backlog
---
# cmux UI 잔여 gap (매트릭스 기반)

## 배경

2026-04-19 cmux preview POC 에서 5 시나리오 스냅 매트릭스로 발견된 gap 중 **G-new-tab 은 해소**됐고, 나머지 4개가 미처리. 매트릭스 파이프라인이 없으면 이 4개는 사용자 실사용 시점에만 드러남.

## 내용

### G-overflow — 탭바 오버플로 처리 부재

**증상**: S4 multi (6 tabs, 긴 레이블 1개) 시나리오에서 마지막 탭 "Logs — refactor..." 가 탭바 오른쪽으로 잘려 화면 밖. scroll/ellipsis 처리 없음. 같은 이유로 + 버튼도 가려짐.

**위치**: `src/interactive-os/ui/ViewerTabList.tsx` 또는 FlatLayout tabgroup renderer의 탭바 wrapper

**방향**:
- Option A: 각 탭 `max-width` + `text-overflow: ellipsis`
- Option B: 탭바 `overflow-x: auto` + 스크롤 UI
- Option C: 탭이 많아지면 "More" 드롭다운으로 몰아넣기 (chrome 스타일)

**증거**: `screenshots/cmux-preview/multi.png`

### G-active-content — 탭 전환이 본문에 반영 안 됨

**증상**: S4 multi 에서 active tab=t2 ("Chat — CMS flat refactor")인데 본문은 여전히 session-1 transcript. `Transcript` widget이 Context의 고정 값만 보고 tab의 `contentRef` 를 pull 하지 않음.

**위치**: `src/pages/cmux-preview/cmuxPreviewWidgets.tsx:TranscriptWidget`, 근본적으로는 widget 내부 가시성 보증 gap (의미 노드 논의 H1)

**방향**: `useFlatLayoutSurface()` 로 ancestor tab의 `contentRef` pull → 세션별 transcript 렌더. 이 패턴을 composite 레이어로 승격.

### G-tab-width — 탭 flex-grow 과다

**증상**: S2 single, S3 split 에서 탭이 사용 가능 공간을 균등 분배하여 과하게 길게 늘어남. 크롬/cmux 관행과 다름 — 탭은 콘텐츠 폭 기반 + 최대 폭 제한.

**위치**: FlatLayout tabgroup renderer의 탭 wrapper CSS 또는 ViewerTabList

**방향**: `max-width: 240px` 수준 + 콘텐츠 기반 폭

### G-empty-state — NavList initialFocus='' 의미

**증상**: S5 empty 에서 `activeSessionId: ''` 를 넘겼는데도 sidebar 첫 세션이 여전히 하이라이트됨. NavList의 `initialFocus` 가 빈 문자열을 무시하고 첫 항목으로 fallback.

**위치**: `src/interactive-os/ui/NavList.tsx` 또는 `useNavList`

**방향**: `initialFocus` 가 빈 문자열/null이면 initial focus 없음으로 처리. "선택 없음"을 시각으로 표현.

## 검증

- `screenshots/cmux-preview/{single,split,multi,empty}.png` 재촬영
- 각 gap 해소를 해당 시나리오에서 확인
- gap fix 이후 전체 매트릭스 5장 재촬영, 회귀 없음 확인

## 출처

- 2026-04-19 cmux preview POC 매트릭스 평가
- G-new-tab 과 동일 배치에서 발견. G-new-tab 만 이번 세션에서 해소.
