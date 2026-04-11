# Skill Kanban v2 — PRD

> Discussion: 칸반 카드에서 세션의 산출물(파일)과 스킬 여정을 한눈에 보고, 카드 클릭 시 풀스크린 2패널 모달(좌=채팅, 우=파일 프리뷰)로 터미널 없이 리뷰.

## ① 동기

### WHY

- **Impact**: 에이전트 세션이 "뭘 했는지"가 칸반에서 안 보인다. tool count와 경과 시간만으로는 세션의 산출물(PRD, 수정된 파일)과 진행 경로(discuss→prd→go)를 파악할 수 없다. 터미널에서 직접 찾아야 한다.
- **Forces**: (1) 터미널 리뷰는 불편하다 — 세션 결과물을 브라우저에서 바로 봐야 한다. (2) timeline 이벤트에 filePath가 이미 있다 — 데이터는 있는데 노출만 안 됨. (3) 기존 ui/ 부품(SplitPane, FilePreview, TabList, MarkdownViewer)이 전부 있다 — 순수 조립.
- **Decision**: (1) extractSessionCard에서 skills[], files[] 수집 추가. (2) ConversationDialog를 SplitPane 2패널로 교체. 기각: 별도 페이지 이동 — 칸반 맥락이 끊김.
- **Non-Goals**: 파일 편집 기능, 실시간 diff 하이라이팅, 코드 리뷰 기능

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 세션에서 discuss→prd→go를 거쳤다 | 칸반 카드를 본다 | 카드에 `discuss → prd → go` breadcrumb이 보인다 | |
| S2 | 세션에서 3개 파일을 Edit/Write했다 | 칸반 카드를 본다 | 카드에 파일명 3개가 보인다 | |
| S3 | 세션에서 8개 파일을 수정했다 | 칸반 카드를 본다 | 파일명 5개 + "+3 more" 표시 | |
| S4 | 카드를 클릭한다 | 모달이 열린다 | 풀스크린 2패널: 좌=채팅, 우=첫 번째 파일 프리뷰 | |
| S5 | 모달 우측 탭에서 다른 파일 클릭 | 파일 전환 | 해당 파일 내용이 프리뷰에 렌더링 (.md→마크다운, .ts→코드 하이라이팅) | |
| S6 | 모달에서 Esc 또는 닫기 클릭 | 모달 닫힘 | 칸반으로 복귀 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `SkillKanban.tsx` SessionCard 확장 | `skills: string[]`, `touchedFiles: string[]` 필드 추가. extractSessionCard에서 tool_use의 filePath 수집 (Edit/Write/Read 중 filePath 있는 것, dedupe) | |
| `SkillKanban.tsx` 카드 UI 갱신 | 스킬 breadcrumb (discuss → prd → go) + 파일명 목록 (최대 5개 + "+N more") | |
| `SkillKanban.tsx` SessionDetailModal | ConversationDialog를 교체. SplitPane(horizontal) — 좌: 채팅 MarkdownViewer, 우: TabList(파일 목록) + FilePreview(선택 파일) | |
| `SkillKanban.css` 갱신 | dialog max-height:70vh 제거 → 풀스크린. SplitPane 높이 확보 | |

완성도: 🟢

## ③ 인터페이스

### 카드 데이터 수집

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| tool_use 이벤트 (tool=Edit, filePath=/a/b.ts) | extractSessionCard 순회 중 | filePath를 touchedFiles Set에 추가 | TimelineEvent에 filePath 필드가 이미 파싱되어 있음 (groupEvents.ts) | touchedFiles에 b.ts 경로 축적 | |
| tool_use 이벤트 (tool=Skill, text=discuss) | extractSessionCard 순회 중 | skills 배열에 push | 기존 로직과 동일 — v1에서 이미 수집하지만 카드에 노출 안 했음 | skills에 "discuss" 축적 | |
| tool_use 이벤트 (tool=Bash, filePath=null) | extractSessionCard 순회 중 | toolCount++ (filePath 없으므로 파일 수집 안 함) | Bash는 filePath가 없는 경우가 대부분. best-effort | toolCount만 증가 | |

### SSE 실시간 이벤트

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| SSE tool_use (tool=Edit, filePath 있음) | 카드가 Running에 있음 | 해당 카드의 touchedFiles에 추가 (dedupe) | SSE 이벤트도 TimelineEvent 구조 — filePath 포함 | 카드 파일 목록 실시간 갱신 | |
| SSE skill_start (text=prd) | 카드가 Running에 있음 | skills에 push, stage 재판정 | 기존 v1 로직과 동일 | breadcrumb에 prd 추가 | |

### 모달 인터랙션

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 카드 클릭 | 모달 닫힘 | dialog.showModal(), SplitPane 렌더링. 우측 TabList에 touchedFiles 로드. 첫 파일을 /api/fs/file로 fetch→FilePreview | 기존 fvm-dialog 패턴. FilePreview는 content prop으로 렌더링 | 풀스크린 모달, 좌=채팅, 우=첫 파일 프리뷰 | |
| 탭 클릭 (다른 파일) | 모달 열려있고 파일 A 프리뷰 중 | /api/fs/file?path=B로 fetch→FilePreview에 content 교체 | TabList의 onChange가 활성 탭 전환. fetch 후 content 업데이트 | 파일 B 프리뷰로 전환 | |
| Esc 키 | 모달 열림 | dialog.close() | HTML dialog의 기본 Esc 동작 | 모달 닫힘, 칸반 복귀 | |
| SplitPane 드래그 | 패널 비율 3:7 | 비율 변경 | SplitPane의 내장 드래그 리사이즈 | 사용자가 원하는 비율로 변경 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 세션에 스킬 호출 0건 | skills=[] | 모든 세션이 스킬을 쓰지는 않음 | breadcrumb 영역 숨김. 카드에 스킬 정보 없이 기존처럼 표시 | |
| 세션에 파일 수정 0건 | touchedFiles=[] | discuss만 한 세션 가능 | 파일 목록 영역 숨김. 모달 우측에 "No files modified" 표시 | |
| 파일이 삭제/이동됨 | /api/fs/file 404 | 세션 이후 파일이 변경될 수 있음 | FilePreview에 "File not found" 메시지 표시. 탭은 유지 | |
| 파일 20개 이상 수정 | touchedFiles 20+ | 대규모 리팩토링 세션 | 카드: 5개+"+15 more". 모달 TabList: 전부 표시 (스크롤) | |
| 동일 파일 여러 번 Edit | filePath 중복 | 한 파일을 여러 번 수정하는 건 보통 | dedupe — Set으로 관리. 카드/탭에 1번만 표시 | |
| 대용량 파일 (1000줄+) | FilePreview 렌더링 | FilePreview가 500줄 초과 시 VirtualCodeBlock 자동 적용 | 가상화로 성능 유지 | |
| SSE에서 filePath 없는 tool_use | Bash 등 | 모든 tool이 filePath를 갖진 않음 | filePath 없으면 수집 안 함. toolCount만 증가 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | UI 컴포넌트만 노출, primitives 금지 (feedback_ui_over_primitives) | ② SessionDetailModal | ✅ 준수 | SplitPane, FilePreview, TabList, MarkdownViewer — 전부 ui/ 완성품 | |
| 2 | 화면을 가리면 modal (feedback_overlay_is_modal) | ② SessionDetailModal | ✅ 준수 | native dialog.showModal()로 focus trap + 배경 inert | |
| 3 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② 카드 UI, 모달 | ✅ 준수 | |
| 4 | pages에서 useAria 직접 사용 금지 (CLAUDE.md) | ② SessionDetailModal | ✅ 준수 | SplitPane/TabList가 내부에서 useAria 사용 | |
| 5 | renderItem에 ARIA props 전달 필수 (CLAUDE.md) | ② TabList | **주의** | TabList의 renderItem에 getItemProps(id) 결과를 전달해야 함 | |
| 6 | 기존 부품 재활용 (feedback_reuse_existing_impl) | ② 전체 | ✅ 준수 | 새 컴포넌트 0개 — 전부 기존 ui/ 조립 | |
| 7 | surface 소유 속성에 module.css last-mile 금지 (feedback_surface_no_lastmile) | CSS 갱신 | ✅ 준수 | dialog 크기만 변경, surface 속성 건드리지 않음 | |
| 8 | DOM 배치 = 컴포넌트 분리 (feedback_dom_placement_is_component_reason) | ② 모달 내부 | ✅ 준수 | 좌(채팅)와 우(파일)를 별도 컴포넌트로 분리 | |
| 9 | 모든 상태 NormalizedData+Command (feedback_all_state_normalized_command) | ② 모달 상태 | **@useState-hatch** | openCardId, activeFileTab은 dialog 로컬 UI 상태 — OS store 대상 아님 (기존 v1도 동일 패턴) | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | ConversationDialog 교체 | 기존 대화 열람 기능이 바뀜 | 저 | ConversationDialog는 내부 컴포넌트, export 없음. 대화 기능은 좌 패널에 그대로 유지 | |
| 2 | SkillKanban.css max-height:70vh 제거 | dialog가 풀스크린으로 커짐 | 저 | 의도된 변경. fvm-modal에 layout:fill로 풀스크린 확보 | |
| 3 | Dialog 내부 SplitPane — 프로젝트 내 전례 없음 | SplitPane 높이 계산이 dialog overflow와 충돌 가능 | 중 | max-height 제거 + dialog에 명시적 height:100dvh 설정. SplitPane은 flex:1로 남은 공간 채움 | |
| 4 | /api/fs/file 호출 추가 | 모달 열 때마다 파일 fetch | 저 | 파일당 1회. 탭 전환 시에만 추가 fetch. 캐시 불필요 (최신 내용 봐야 함) | |
| 5 | SessionCard 인터페이스 확장 | 메모리 사용 증가 (skills[], touchedFiles[]) | 저 | 문자열 배열, 세션당 최대 수십 항목. 무시 가능 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | pages/에서 useAria 직접 호출 | ⑤#4 | TabList/SplitPane이 내부에서 처리 | |
| 2 | TabList renderItem에 빈 {} 전달 | ⑤#5 | ARIA props(role, aria-selected, tabindex) 누락 | |
| 3 | 파일 내용을 SessionCard에 저장 | ⑤#9 | 파일 내용은 모달 열 때 fetch. 카드에는 경로만 | |
| 4 | module.css로 dialog surface 속성 덮어쓰기 | ⑤#7 | surface 소유 속성(bg/border/shadow)은 ax()에서만 | |
| 5 | Bash 명령어 파싱으로 파일 경로 추출 | ④ 경계 | 불안정. filePath 필드가 있는 이벤트만 수집 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | discuss→prd→go 거친 세션의 카드 | breadcrumb "discuss → prd → go" 표시 | |
| V2 | S2 | 3개 파일 Edit한 세션의 카드 | 파일명 3개 표시 | |
| V3 | S3 | 8개 파일 수정 세션 | 파일명 5개 + "+3 more" | |
| V4 | S4 | 카드 클릭 | 풀스크린 2패널 모달. 좌=채팅, 우=첫 파일 프리뷰 | |
| V5 | S5 | 모달에서 .md 파일 탭 클릭 | 마크다운 렌더링 | |
| V6 | S5 | 모달에서 .ts 파일 탭 클릭 | 코드 하이라이팅 | |
| V7 | S6 | Esc 키 | 모달 닫힘, 칸반 복귀 | |
| V8 | 경계: 파일 0건 | 수정 파일 없는 세션 모달 | 우측에 "No files modified" | |
| V9 | 경계: 파일 삭제됨 | 삭제된 파일 탭 클릭 | "File not found" 메시지 | |
| V10 | 경계: 스킬 0건 | 스킬 없는 세션 카드 | breadcrumb 영역 숨김 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
