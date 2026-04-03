# Viewer 커맨드 기반 리팩토링 — PRD

> Discussion: tool→viewer 매핑 범용화. FileViewer가 자체 command/state로 하이라이트·애니메이션 재생. 각 viewer 독립, TabGroup으로 탭 관리.

## ① 동기

### WHY

- **Impact**: PageReplay와 LiveSessionPanel에서 tool별 viewer 상태 관리가 각각 구현됨. 새 tool 추가 시 양쪽 수정. viewer 상태(highlights, cursorLine, content, overlay)가 소비측에 6개 useState로 누출.
- **Forces**: FileViewer가 props 주입 방식이라 상태 소유권이 외부에 있음. 기존 editAnimationFrames, useAnimationQueue는 잘 동작하므로 재활용 필수. 프로젝트 패턴은 command 기반 상태 관리.
- **Decision**: 각 viewer(File, Search, Terminal)가 자체 command/state로 동작. TabGroup이 탭만 관리. tool→command 매핑은 한 곳에. 기각: tool별 renderer registry(OCP) — tool 5~6개 고정이라 과도.
- **Non-Goals**: viewer 간 드래그앤드롭, 탭 순서 변경, 멀티 뷰(분할), 가상 커서 고도화

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Live 세션에서 Read 발생 | tool_use Read 이벤트 도착 | 파일 탭 열림, 내용 표시 | |
| S2 | Live 세션에서 Edit 발생 | tool_use Edit 이벤트 도착 | 해당 파일 탭에서 선택→삭제→타이핑 애니메이션 재생 | |
| S3 | Live 세션에서 Grep 발생 | tool_use Grep + tool_result 도착 | 검색 탭 열림, 결과 표시 | |
| S4 | Live 세션에서 Bash 발생 | tool_use Bash + tool_result 도착 | 터미널 탭 열림, 명령+출력 표시 | |
| S5 | 검색 탭이 활성인 상태에서 Edit 발생 | tool_use Edit 도착 | 파일 탭으로 전환, 애니메이션 재생 | |
| S6 | Replay 모드 | replay 재생 | 현재 replay와 동일한 애니메이션 (기존 기능 유지) | |
| S7 | 파일 탭 3개 + 검색 탭 1개 | 사용자가 탭 클릭 | 해당 viewer 활성화 | |

### 디자인 제약

- Terminal 탭: light theme에서도 black bg, white text, monospace 고정. module.css last-mile.

완성도: 🟢

## ② 산출물

| 산출물 | 위치 | 설명 | 역PRD |
|--------|------|------|-------|
| `ViewerTab` 타입 | `src/pages/replay/viewerTypes.ts` | `file \| search \| terminal` discriminated union | |
| `FileViewer` | `src/interactive-os/ui/FileViewer.tsx` | command 기반 파일 뷰어. highlight/editAnimate/clear 커맨드. 내부에 useAnimationQueue + editAnimationFrames 소유 | |
| `SearchResults` | `src/interactive-os/ui/SearchResults.tsx` | (기존) 검색 결과 뷰어 | |
| `TerminalOutput` | `src/interactive-os/ui/TerminalOutput.tsx` | (기존 수정) dark 고정 테마 | |
| `useViewerTabs` | `src/pages/replay/useViewerTabs.ts` | tabs Map + activeTabId 관리. openFile/openSearch/openTerminal 액션 | |
| `toolToCommands` | `src/pages/replay/toolToCommands.ts` | TimelineEvent → viewer 커맨드 매핑. tool별 분기 한 곳 집중 | |
| `PageReplay` 리팩토링 | `src/pages/replay/PageReplay.tsx` | useState 6개 → useViewerTabs + FileViewer command ref | |
| `LiveSessionPanel` 리팩토링 | `src/pages/replay/LiveSessionPanel.tsx` | 동일 패턴 적용 | |

### 구조

```
PageReplay / LiveSessionPanel
  ├── useViewerTabs() → { tabs, activeTab, openFile, openSearch, openTerminal }
  ├── toolToCommands(event, result, fileState) → viewer 액션 호출
  └── TabGroup (탭 바)
       ├── FileViewer (ref.dispatch(command))
       │    ├── useAnimationQueue (내부 소유)
       │    ├── editAnimationFrames (내부 호출)
       │    └── FilePreview (렌더링)
       ├── SearchResults (props만)
       └── TerminalOutput (props만, dark 고정)
```

### FileViewer command

```ts
type FileViewerCommand =
  | { type: 'open'; content: string }
  | { type: 'highlight'; lines: Map<number, HighlightTone> }
  | { type: 'editAnimate'; preContent: string; oldStr: string; newStr: string; range: LineRange }
  | { type: 'clear' }
```

FileViewer는 useImperativeHandle로 dispatch(command) 노출. 부모는 ref로 접근.

완성도: 🟢

## ③ 인터페이스

### FileViewer commands

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `open(content)` | 任意 | 내용 교체, highlight/cursor/animation 클리어 | 새 파일 열기는 이전 상태와 무관 | content 표시, clean 상태 | |
| `highlight(lines, tone)` | content 있음 | 지정 라인에 tone 하이라이트 | Read 후 위치 표시 등 즉시 피드백 | 하이라이트 표시 | |
| `editAnimate(pre, old, new, range)` | content 있음 | editAnimationFrames → useAnimationQueue로 재생 | Edit 과정을 시각적으로 따라가기 위해 | 애니메이션 재생 후 최종 content | |
| `clear()` | 任意 | highlight, cursor 제거 | 다음 커맨드 준비 | clean 상태 | |

### useViewerTabs actions

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `openFile(path, content)` | tabs에 path 없음 | 새 file 탭 추가 + 활성화 | Read로 새 파일 등장 | 탭 추가, activeTab = path | |
| `openFile(path, content)` | tabs에 path 있음 | content 갱신 + 활성화 | Write로 기존 파일 덮어쓰기 | 기존 탭 갱신 | |
| `openSearch(query, output)` | 任意 | 새 검색 탭 추가 + 활성화 | 매 Grep/Glob 호출은 별도 결과 | 새 탭 추가 | |
| `openTerminal(command, output)` | 任意 | 새 터미널 탭 추가 + 활성화 | 매 Bash 호출은 별도 결과 | 새 탭 추가 | |
| 탭 클릭 | 다른 탭 활성 | 클릭한 탭 활성화 | 사용자 탐색 | activeTab 변경 | |

### toolToCommands 매핑

| tool | tool_result 필요 | viewer 액션 | 역PRD |
|------|-----------------|------------|-------|
| Read | ✗ (fetchFile) | `openFile(path, content)` → FileViewer `open` | |
| Edit | ✗ | 탭 활성화 → FileViewer `editAnimate` | |
| Write | ✗ | `openFile(path, content)` → FileViewer `open` | |
| Grep/Glob | ✓ | `openSearch(query, resultText)` | |
| Bash | ✓ | `openTerminal(command, resultText)` | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 역PRD |
|----------|------------------------|----------|-------|
| Read 없이 Edit (fileState에 파일 없음) | JSONL 중간 시작 가능 | editAnimate skip, 탭만 활성화 | |
| Edit old_string이 content에 없음 | 누적 불일치 | highlight 없이 최종 content만 반영 | |
| 연속 Edit 같은 파일, 앞 애니메이션 재생 중 | 큐가 순서 보장 | useAnimationQueue가 순차 재생 | |
| Grep/Bash tool_result 없이 tool_use만 도착 | SSE 지연 | 빈 output으로 새 탭 열기, result 도착 시 새 탭 | |
| 탭 100개+ | 메모리/렌더링 부하 | 탭 바 스크롤 가능, 활성 탭만 렌더 | |
| 같은 query로 Grep 2회 | 각각 독립 결과 | 매번 새 탭 | |
| 같은 파일 Read 2회 | 파일은 path가 ID | 기존 탭 활성화 + content 갱신 | |
| Live↔Replay 탭 전환 | 각각 독립 viewer 상태 | 전환 시 상대 viewer 상태 클리어 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | UI → ui/ 완성품 사용 (CLAUDE.md) | FileViewer는 ui/에 | ✅ 준수 | — | |
| 2 | ax()만 사용, module.css는 last-mile (feedback_style_is_hatch) | Terminal dark 테마 | ✅ 준수 | module.css로 bg/color 고정 | |
| 3 | 기존 구현 재활용 (feedback_reuse_existing_impl) | editAnimationFrames, useAnimationQueue | ✅ 준수 | FileViewer 내부에서 호출 | |
| 4 | 원본 엔티티 보존 (feedback_preserve_raw_entities) | toolToCommands가 TimelineEvent 직접 소비 | ✅ 준수 | — | |
| 5 | pages/에서 useAria/useAriaZone 직접 사용 금지 (CLAUDE.md) | TabGroup | ✅ 준수 | 탭 바는 단순 button, os 패턴 불필요 | |
| 6 | surface 소유 속성에 module.css 금지 (feedback_surface_no_lastmile) | Terminal의 bg/color | ⚠️ 예외 | Terminal은 테마 무관 고정값이므로 surface 축 대상 아님 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | PageReplay.tsx 대폭 리팩토링 | viewer 상태 관리 전면 교체 | 중 | 기존 replay 기능 V6에서 검증 | |
| 2 | LiveSessionPanel.tsx 리팩토링 | onViewerUpdate 시그니처 변경 | 중 | 동일 useViewerTabs 패턴으로 통일 | |
| 3 | editAnimation.ts 위치 이동 없음 | FileViewer가 import | 낮 | 기존 파일 유지, import 경로만 변경 | |
| 4 | ViewerOverlay 타입 제거 | 방금 만든 overlay 방식 폐기 | 낮 | 탭 방식으로 완전 대체 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | FileViewer 외부에서 highlights/cursorLine useState 관리 | ①Impact | 상태 누출이 이 리팩토링의 동기 | |
| 2 | editAnimationFrames 재구현 | ⑤#3 | 기존 구현 재활용 원칙 | |
| 3 | Terminal에 테마 반응형 색상 | ①디자인제약 | light에서도 dark 고정 | |
| 4 | tool별 분기를 PageReplay/LiveSessionPanel에 직접 작성 | ①Decision | toolToCommands 한 곳 집중 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | Read tool_use 도착 | 파일 탭 생성, 내용 표시 | |
| V2 | ①S2 | Edit tool_use 도착 | 선택→삭제→타이핑 애니메이션 | |
| V3 | ①S3 | Grep + tool_result 도착 | 새 검색 탭 열림 | |
| V4 | ①S4 | Bash + tool_result 도착 | 새 터미널 탭 (dark) 열림 | |
| V5 | ①S5 | 검색 탭 활성 중 Edit 도착 | 파일 탭으로 전환 + 애니메이션 | |
| V6 | ①S6 | Replay 전체 재생 | 기존 replay와 동일 동작 | |
| V7 | ①S7 | 탭 클릭 | 해당 viewer 활성화 | |
| V8 | ④E1 | Read 없이 Edit | skip, crash 없음 | |
| V9 | ④E2 | old_string 미매칭 | highlight 없이 진행 | |
| V10 | ④E3 | 연속 Edit 같은 파일 | 순차 애니메이션 재생 | |

완성도: 🟢

---

### 교차 검증

1. **동기 ↔ 검증**: S1~S7 → V1~V7 ✅
2. **인터페이스 ↔ 산출물**: FileViewer command→dispatch, useViewerTabs→tabs, toolToCommands→매핑 ✅
3. **경계 ↔ 검증**: E1→V8, E2→V9, E3→V10 ✅
4. **금지 ↔ 출처**: 4개 모두 ①/⑤ 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음 (Terminal #6은 의도적 예외) ✅

**전체 완성도:** 🟢 8/8
