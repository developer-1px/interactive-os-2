# UI SDK 카탈로그 장기 플랜 — 2026-03-23

## 배경

interactive-os v1이 과도한 추상화로 실패한 교훈을 바탕으로, v2에서는 "실제 용도에서 추출한 완성품"을 하나씩 만들어가는 전략. NavList(첫 번째 완성품) + FileIcon/CodeBlock/Breadcrumb(뷰어 부품 분리)를 완료한 시점에서, 전체 카탈로그를 정리하고 장기 플랜으로 관리한다.

## 내용

### 원칙
1. 같은 behavior라도 용도가 다르면 별개 완성품
2. 분류 기준 = 실제 앱의 표준 UI 어휘 (ARIA spec도 아니고 프로젝트 전용도 아님)
3. hook-first: 용도별 hook + 편의 컴포넌트
4. 쇼케이스 → 완성품 승격은 제품에서 실제로 쓸 때 진행
5. v1 교훈: 범용 추상화 금지, 적절한 컴포넌트를 발견하려는 노력 필수

### 🟡 쇼케이스 → 완성품 승격 (18개)

제품에서 실제로 쓸 때 hook-first로 전환. NavList 패턴 반복.

- [x] TreeView — Viewer 사이드바, AreaSidebar에서 사용 중 (2026-03-23)
- [ ] Tabs — CMS tab-group, 에디터 탭
- [ ] DataGrid (Grid) — CMS I18n Sheet에서 사용 중
- [ ] Toolbar — CMS FloatingToolbar, ActivityBar
- [ ] ListBox — 셀렉션 용도 (NavList와 별개)
- [ ] Combobox — QuickOpen 내부, 태그 선택
- [ ] MenuList — 드롭다운 메뉴
- [ ] Dialog — 모달
- [ ] AlertDialog — 확인 모달
- [ ] Toaster — 알림
- [ ] Accordion — FAQ, 설정 패널
- [ ] DisclosureGroup — 독립 접기/펼치기
- [ ] RadioGroup — 단일 선택
- [ ] Checkbox — 다중 선택
- [ ] Switch — 온/오프 토글
- [ ] Slider — 값 조절
- [ ] Spinbutton — 숫자 입력
- [ ] Toggle / ToggleGroup — 모드 전환
- [ ] Kanban — 보드 뷰

### 🔴 새로 만들어야 할 것 (10개)

우선순위 순.

- [ ] **SplitPane** — 3개 제품 전부에서 사용. 레이아웃 뼈대. AppKit NSSplitView
- [ ] **CommandPalette** — QuickOpen을 승격. Cmd+K 검색+액션. VS Code, Raycast, Notion
- [ ] **MarkdownViewer** — viewer/에서 분리 필요. Viewer + Agent에서 사용
- [ ] **Timeline** — Agent 뷰어 핵심. 채팅/로그/활동 피드
- [ ] **ContextMenu** — 우클릭 메뉴. MenuList + popover + trigger (BACKLOGS.md에도 등록됨)
- [ ] **VirtualList** — useVirtualScroll hook → 완성품. 긴 목록 성능
- [ ] **Popover** — 툴팁 확장, 인포 패널, 드롭다운 컨테이너. AppKit NSPopover
- [ ] **Avatar** — 사용자/에이전트 아이덴티티
- [ ] **Badge** — 상태, 카운트, 라벨
- [ ] **Progress** — 로딩, 업로드, 태스크 완료

### ✅ 완성품 (4개, 완료)

- [x] NavList — 네비게이션 리스트 (hook-first 패턴 확립)
- [x] CodeBlock — Shiki 구문 하이라이팅
- [x] Breadcrumb — 경로 표시
- [x] FileIcon — 파일 타입 아이콘

## 검증

- 각 완성품 완료 시 이 문서에서 체크 (`- [x]`)
- 쇼케이스 승격 시 hook-first 전환 + 제품 교체로 검증
- 전체 진행률: ✅ 5/32

## 출처

- UI SDK discussion + NavList 구현 세션 (2026-03-23)
- 카탈로그 발견 테이블: docs/0-inbox/27-[vision]ui-catalog.md
