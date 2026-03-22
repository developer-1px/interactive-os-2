# Agent Viewer — PRD

> Discussion: Agent의 세션별 파일 읽기/수정 내역을 실시간 3패널로 표시하는 뷰어. PostToolUse hook → NDJSON 로그 → SSE → React UI.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | Agent(Claude Code)가 코드를 읽고 수정하는 세션이 진행 중이고 follow mode가 ON이다 | Agent가 파일을 Edit/Write한다 | 좌측 "수정 목록"에 해당 파일이 즉시 추가되고, 콘텐츠 패널이 그 파일로 자동 전환된다 | |
| M1b | follow mode가 OFF이다 | Agent가 파일을 Edit/Write한다 | 좌측 "수정 목록"에 추가되지만 콘텐츠 패널은 현재 파일 유지 | |
| M2 | Agent 세션이 진행 중이다 | Agent가 파일을 Read한다 | 우측 "읽기 스트림"에 타임스탬프 + 파일 경로가 한 줄 추가된다 (자동 이동 없음) | |
| M3 | 수정 목록 또는 읽기 스트림에 항목이 있다 | 사용자가 항목을 클릭한다 | 콘텐츠 패널에 해당 파일 내용이 표시된다 (Viewer와 동일한 렌더링) | |
| M4 | Agent Viewer가 열려 있다 | 새 세션이 시작된다 | 가장 최근 세션의 로그를 자동으로 표시한다 (활성 세션 자동 선택) | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| PostToolUse hook script | `.claude/hooks/log-agent-ops.sh` — `Read\|Edit\|Write` 매칭, stdin JSON에서 `session_id`, `tool_name`, `file_path` 추출 → `.claude/agent-ops/{session_id}.ndjson`에 append | |
| `.claude/settings.json` 훅 등록 | PostToolUse에 matcher `"Read\|Edit\|Write"` + command로 hook script 실행 | |
| SSE endpoint (`/api/agent-ops/stream`) | `vite-plugin-fs.ts`에 추가. chokidar로 `.claude/agent-ops/` watch → 가장 최근 파일의 새 줄을 SSE로 push | |
| 초기 로드 endpoint (`/api/agent-ops/latest`) | 가장 최근 세션의 NDJSON 전체 반환 (뷰어 진입 시 기존 데이터 로드용) | |
| NDJSON 스키마 | `{ "ts": "ISO8601", "tool": "Read\|Edit\|Write", "file": "/abs/path" }` 한 줄 | |
| `PageAgentViewer.tsx` | 3패널 레이아웃: 좌(수정 목록 — 상대 경로 + 수정 횟수 뱃지, e.g. `src/App.tsx ×3`) \| 중(콘텐츠) \| 우(읽기 스트림). follow mode 토글 포함 | |
| `PageAgentViewer.module.css` | 3패널 CSS. 기존 PageViewer.module.css 패턴 재활용 | |
| App.tsx 라우트 등록 | `/agent/*` 경로, navItems에 추가 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| SSE: Edit/Write 이벤트 수신 | follow ON, 좌측 수정 목록 N개 | 좌측 목록 맨 위에 파일 추가 (중복이면 맨 위로 이동 + 횟수 증가) + 콘텐츠 자동 전환 | 수정 파일이 주 관심사, follow ON이면 최신 수정을 즉시 확인 | 목록 갱신, 콘텐츠 = 새 파일 | |
| SSE: Edit/Write 이벤트 수신 | follow OFF | 좌측 목록만 갱신, 콘텐츠 유지 | 사용자가 특정 파일을 집중 리뷰 중이면 방해하지 않음 | 목록 갱신, 콘텐츠 불변 | |
| SSE: Read 이벤트 수신 | 우측 읽기 스트림 M줄 | 우측 스트림 맨 아래에 `HH:MM:SS src/path/file.ts` 한 줄 추가, 자동 스크롤 to bottom | 읽기는 참고용 타임라인, 시간 순서가 맥락 | 스트림 M+1줄 | |
| 클릭: 좌측 수정 목록 항목 | 콘텐츠 = 파일 A | 콘텐츠 패널이 클릭한 파일로 전환 | 사용자가 과거 수정 파일을 다시 보고 싶음 | 콘텐츠 = 클릭한 파일 | |
| 클릭: 우측 읽기 스트림 항목 | 콘텐츠 = 파일 A | 콘텐츠 패널이 클릭한 파일로 전환 | 참고용이지만 내용 확인 필요할 때 | 콘텐츠 = 클릭한 파일 | |
| ↑/↓ 키 | 좌측 목록에 포커스 | 포커스 이동 + followFocus로 콘텐츠 전환 | listbox 패턴 — 세로 목록 탐색 | 포커스 이동, 콘텐츠 전환 | |
| ↑/↓ 키 | 우측 스트림에 포커스 | 포커스 이동만 | 읽기 스트림은 followFocus 아님, 빈도가 높아 자동 전환하면 과도 | 포커스만 이동 | |
| Enter | 우측 스트림 항목에 포커스 | 해당 파일을 콘텐츠 패널에 표시 | 명시적 선택으로만 콘텐츠 전환 | 콘텐츠 = 선택한 파일 | |
| Tab | 좌측/콘텐츠/우측 간 | 패널 간 포커스 이동 | 3패널 각각이 독립 탭스톱, 표준 키보드 탐색 | 다음 패널로 포커스 | |
| Cmd+P | Agent Viewer 어디서든 | QuickOpen 열림 (기존 Viewer 재활용) | 파일명으로 빠른 이동 — 기존 UX 일관성 | QuickOpen 오버레이 표시 | |
| follow 토글 클릭 | follow ON | follow OFF로 전환 | 사용자가 수동 탐색 모드로 전환 | follow OFF | |
| ←/→ 키 | 어디서든 | N/A | 3패널 모두 세로 목록, 좌우 키 역할 없음 | — | |
| Home/End | 좌측 또는 우측 패널 | 목록 첫/끝으로 이동 | listbox 표준 | 포커스 첫/끝 항목 | |
| Escape | QuickOpen 열려있음 | QuickOpen 닫힘 | 모달 패턴 | QuickOpen 닫힘 | |
| Space | 어디서든 | N/A | 목록 항목에 토글할 것 없음 | — | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 같은 파일을 연속 3회 Edit | 수정 목록에 해당 파일 이미 있음 | 수정 횟수가 아니라 "어떤 파일을 고쳤는가"가 관심사 | 기존 항목을 목록 맨 위로 이동 + 뱃지 ×3 (중복 추가 안 함) | 목록 순서 변경 + 횟수 갱신 | |
| 세션 로그 파일이 아직 없음 (첫 실행) | 빈 화면 | 아직 Agent가 아무것도 안 했으면 안내가 필요 | "Waiting for agent activity..." 빈 상태 표시 | 빈 상태 유지, SSE 연결은 살아있음 | |
| SSE 연결 끊김 | 실시간 갱신 중 | 네트워크/서버 재시작 시 데이터 유실 방지 | 자동 재연결 (EventSource 기본 동작) + 재연결 시 `/api/agent-ops/latest`로 전체 재로드 | 기존 목록 유지 + 누락분 보충 | |
| 로그 파일에 100+ 항목 | 긴 수정 목록 | 성능 — flat list는 항목 수 늘어도 DOM 부담 적음 | 전부 표시, 스크롤 가능 | 정상 렌더링 | |
| 읽기 스트림 1000+ 줄 | 긴 로그 | 무한 스크롤은 과도 — 적당한 제한 필요 | 최근 200줄만 유지, 오래된 것은 버림 | 메모리 안정 | |
| Agent Viewer 열기 전에 이미 세션 진행 중 | 로그 파일에 기존 데이터 있음 | 뷰어를 늦게 열어도 세션 전체를 봐야 함 | `/api/agent-ops/latest`로 전체 로드 후 SSE로 실시간 전환 | 기존 + 실시간 모두 표시 | |
| follow ON 상태에서 사용자가 좌측 항목 클릭 | 다른 파일 리뷰 중 | 사용자가 명시적으로 선택한 건 존중해야 함 | 클릭한 파일로 전환. follow는 ON 유지 — 다음 Edit 이벤트가 오면 다시 자동 전환 | 콘텐츠 = 클릭 파일, follow 유지 | |
| hook script에 jq 없음 | macOS 기본 환경 | 외부 의존성 최소화 | 순수 bash + sed/awk로 JSON 파싱하거나, node 한 줄 스크립트 사용 | hook 정상 동작 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② `PageAgentViewer.tsx` | ✅ 준수 | — | |
| P2 | 레이어 = 라우트 그룹 (feedback_layer_equals_route) | ② App.tsx 라우트 | ✅ 준수 | Agent Viewer는 아키텍처 5층에 속하지 않는 독립 앱. Viewer/CMS처럼 navItems에 standalone 항목으로 추가 | |
| P3 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② PageAgentViewer | ✅ 준수 | 좌/우 패널 모두 Aria listbox 사용. 서로 다른 데이터(수정 목록 vs 읽기 스트림)이므로 각각 독립 store — 동기화 불필요하므로 위반 아님 | |
| P4 | ARIA 표준 용어 우선 (feedback_naming_convention) | ③ 인터페이스 | ✅ 준수 | 좌측 listbox, 우측 log — 표준 role 사용 | |
| P5 | barrel export 금지 (CLAUDE.md) | ② 산출물 | ✅ 준수 | 새 파일 모두 직접 import | |
| P6 | 중첩 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ 3패널 구조 | ✅ 해당 없음 | 3패널이 중첩 Aria가 아닌 병렬 배치 — 버블링 이슈 없음 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `vite-plugin-fs.ts` — SSE endpoint 추가 | 기존 `/api/fs/*` 엔드포인트에 영향 없음 (새 경로 추가만). chokidar watcher 추가로 dev server 메모리 미세 증가 | 낮 | 허용 | |
| S2 | `App.tsx` — navItems에 항목 추가 | ActivityBar에 아이콘 하나 추가. 기존 라우트에 영향 없음 | 낮 | 허용 | |
| S3 | `.claude/settings.json` — PostToolUse hook 추가 | 모든 Read/Edit/Write마다 hook script 실행. 느린 hook은 Claude Code 응답 지연 가능 | 중 | hook을 async로 등록하여 blocking 방지 | |
| S4 | `.claude/agent-ops/` 디렉토리 — NDJSON 파일 누적 | 세션마다 파일 생성, 정리하지 않으면 누적 | 낮 | MVP에서는 수동 정리. 나중에 자동 정리 고려 | |
| S5 | dev mode 전용 — 프로덕션 빌드 시 SSE endpoint 없음 | Agent Viewer 페이지가 빌드에 포함되면 SSE 연결 실패 | 중 | dev mode 전용 명시. 빌드 시 Agent Viewer 라우트 제외하거나 빈 상태 표시 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | 날코딩 (interactive-os 없이 순수 HTML/React로 목록 구현) | ⑤ P3, P4 | 이 프로젝트는 interactive-os showcase — Aria listbox 사용 필수 | |
| F2 | hook을 sync로 등록 | ⑥ S3 | Claude Code 응답 지연 유발. 반드시 `async: true` | |
| F3 | 외부 의존성 추가 (jq 등) | ④ 경계 | Node 환경만으로 해결. hook script는 `node -e` 사용 | |
| F4 | 별도 서버 프로세스 | ⑥ S5 | dev mode 전용 — vite dev server 안에서 모든 것 처리 | |
| F5 | 프로덕션 빌드에 Agent Viewer SSE 의존 | ⑥ S5 | SSE는 dev server에만 존재 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | Claude Code에서 파일 Edit → Agent Viewer 확인 | 좌측 수정 목록에 상대 경로 나타남, follow ON이면 콘텐츠 자동 전환 | |
| V2 | ①M1b | follow OFF 상태에서 Edit 이벤트 수신 | 좌측 목록에 추가되지만 콘텐츠 불변 | |
| V3 | ①M2 | Claude Code에서 파일 Read → Agent Viewer 확인 | 우측 읽기 스트림에 `HH:MM:SS src/path/file.ts` 추가, 자동 스크롤 | |
| V4 | ①M3 | 우측 읽기 스트림 항목 클릭 | 콘텐츠 패널에 해당 파일 내용 표시 | |
| V5 | ①M4 | Agent Viewer를 열었을 때 이미 세션 진행 중 | `/api/agent-ops/latest`로 기존 데이터 로드 후 SSE 실시간 전환 | |
| V6 | ④ 중복 Edit | 같은 파일 3회 Edit | 수정 목록에 1개 항목, 맨 위, 뱃지 ×3 | |
| V7 | ④ 빈 상태 | 세션 로그 없이 Agent Viewer 진입 | "Waiting for agent activity..." 표시, SSE 연결 유지 | |
| V8 | ④ 읽기 1000+ | Read 이벤트 대량 수신 | 최근 200줄만 유지, 이전 줄 자동 제거 | |
| V9 | ④ SSE 재연결 | dev server 재시작 후 Agent Viewer | EventSource 자동 재연결 + 전체 재로드로 데이터 복원 | |
| V10 | ⑥ S3 | hook async 동작 확인 | Claude Code 응답 지연 없이 hook 비동기 실행, NDJSON 정상 append | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
