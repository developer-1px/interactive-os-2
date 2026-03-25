# UI Catalog — 2026-03-23

## 배경

UI SDK 고도화 과정에서 NavList → FileIcon/CodeBlock/Breadcrumb 분리를 진행한 직후, 우리 제품(홈페이지, Agent, CMS) + 보편적 서비스(AppKit, VS Code, Figma, Notion, Slack)의 사례를 교차하여 "빼면 앱을 못 만드는" 최소 컴포넌트 세트를 발견.

## 내용

### 원칙

- **실제 용도에서 추출** — behavior 기준이 아니라 앱에서 반복 등장하는 표준 UI 어휘
- **같은 behavior라도 용도가 다르면 별개 완성품** (NavList ≠ ListBox)
- **minimal** — 빼면 앱을 못 만드는 것만

### 카탈로그 (32개)

| 카테고리 | 컴포넌트 | 상태 | 근거 |
|---------|---------|------|------|
| **네비게이션** | | | |
| | NavList | ✅ 완성 | 사이드바, 설정 메뉴, 문서 네비 |
| | TreeView | 🟡 쇼케이스 | 파일 탐색기, docs 사이드바, 설정 트리 |
| | Breadcrumb | ✅ 분리됨 | 경로 표시, 계층 네비 |
| | Tabs | 🟡 쇼케이스 | 에디터 탭, 설정 섹션, 콘텐츠 전환 |
| **레이아웃** | | | |
| | SplitPane | 🔴 미존재 | 3개 제품 전부. 2~3패널 리사이즈. AppKit NSSplitView |
| **데이터** | | | |
| | DataGrid | 🟡 쇼케이스(Grid) | 테이블, 스프레드시트, 관리자 |
| | ListBox | 🟡 쇼케이스 | 선택 목록, 필터, 멀티셀렉트 |
| | Kanban | 🟡 쇼케이스 | 보드 뷰, 상태 관리 |
| **입력** | | | |
| | Combobox | 🟡 쇼케이스 | 검색+선택, 태그, 필터 |
| | CommandPalette | 🔴 미존재(QuickOpen) | Cmd+K. 모든 프로 앱 |
| | Slider | 🟡 쇼케이스 | 값 조절 |
| | Spinbutton | 🟡 쇼케이스 | 숫자 입력 |
| | RadioGroup | 🟡 쇼케이스 | 단일 선택 |
| | Checkbox | 🟡 쇼케이스 | 다중 선택 |
| | Switch | 🟡 쇼케이스 | 온/오프 토글 |
| | Toggle / ToggleGroup | 🟡 쇼케이스 | 모드 전환, 뷰 전환 |
| **액션** | | | |
| | Toolbar | 🟡 쇼케이스 | 서식 도구, 액션 바 |
| | MenuList | 🟡 쇼케이스 | 드롭다운, 컨텍스트 메뉴 |
| | ContextMenu | 🔴 미존재 | 우클릭 메뉴. 데스크탑앱 필수 |
| **오버레이** | | | |
| | Dialog | 🟡 쇼케이스 | 모달 |
| | AlertDialog | 🟡 쇼케이스 | 확인 모달 |
| | Popover | 🔴 미존재 | 툴팁 확장, 인포 패널 |
| | Toaster | 🟡 쇼케이스 | 알림 |
| **콘텐츠** | | | |
| | CodeBlock | ✅ 분리됨 | 코드 표시 |
| | MarkdownViewer | 🔴 미존재(viewer전용) | 콘텐츠 렌더 |
| | FileIcon | ✅ 분리됨 | 파일 타입 아이콘 |
| | Avatar | 🔴 미존재 | 사용자/에이전트 아이덴티티 |
| | Badge | 🔴 미존재 | 상태, 카운트, 라벨 |
| **피드** | | | |
| | Timeline | 🔴 미존재(agent전용) | 채팅, 로그, 활동 피드 |
| | VirtualList | 🔴 미존재(hook만) | 긴 목록 성능 |
| **피드백** | | | |
| | Progress | 🔴 미존재 | 로딩, 업로드 |
| | Accordion | 🟡 쇼케이스 | FAQ, 설정, 접기/펼치기 |
| | DisclosureGroup | 🟡 쇼케이스 | 독립 접기/펼치기 |

### 요약

| 상태 | 수량 |
|------|------|
| ✅ 완성품 | 4 (NavList, CodeBlock, Breadcrumb, FileIcon) |
| 🟡 쇼케이스에만 존재 | 18 |
| 🔴 새로 만들어야 함 | 10 (SplitPane, CommandPalette, ContextMenu, Popover, MarkdownViewer, Avatar, Badge, Timeline, VirtualList, Progress) |

## 다음 행동

- 🟡 쇼케이스 → 완성품 승격: 제품에서 실제로 쓸 때 hook-first로 전환 (NavList 패턴 반복)
- 🔴 미존재 → 우선순위: SplitPane > CommandPalette > MarkdownViewer > Timeline > 나머지
- PROGRESS.md에 UI 카탈로그 행 반영 검토
