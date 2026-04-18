---
id: COMPONENTS
title: Universal Component Domain Dictionary
status: meta
kind: note
created: 2026-04-14
updated: 2026-04-14
summary: 'aria-os 컴포넌트와 7개 주요 라이브러리의 교차 매핑 사전. 생성일: 2026-04-14'
topics: []
relates: []
supersedes: []
---
# Universal Component Domain Dictionary

> aria-os 컴포넌트와 7개 주요 라이브러리의 교차 매핑 사전.
> 생성일: 2026-04-14

**라이브러리 약어**: S=shadcn/ui, R=Radix, M=MUI, A=AntD, C=Chakra, N=Mantine, H=HeadlessUI

---

## Layout

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| AspectRatio | layout | 자식 요소의 종횡비 고정 | ❌ | S R (2/7) | |
| Box | layout | 범용 레이아웃 래퍼 | ❌ | M (1/7) | CSS primitive |
| Card | layout | 그룹화된 콘텐츠 표면 | ❌ | S M A C N (5/7) | aria-os는 surface ax()로 대체 |
| Container | layout | 최대 너비 제한 래퍼 | ❌ | M N (2/7) | |
| Divider/Separator | layout | 시각적 구분선 | ✅ Divider | S R M A N (5/7) | |
| FlatLayout | layout | 선언적 페이지 레이아웃 엔진 | ✅ | (0/7) | aria-os 고유 |
| Grid (Layout) | layout | 2D 그리드 레이아웃 | ❌ | M A N (3/7) | CSS Grid 유틸 |
| Group/Stack/Flex | layout | 1D 정렬 레이아웃 | ❌ | M A C N (4/7) | CSS Flex 유틸 |
| ImageList/Masonry | layout | 이미지/카드 그리드 배치 | ❌ | M (1/7) | |
| Paper/Surface | layout | 엘리베이션 표면 | ❌ | M N (2/7) | aria-os는 ax() surface |
| Resizable/Splitter | layout | 리사이즈 가능한 패널 분할 | ✅ SplitPane, WindowSplitter | S A C (3/7) | |
| ScrollArea | layout | 커스텀 스크롤바 영역 | ✅ | S R N (3/7) | |
| SplitPane | layout | 분할 패널 | ✅ | (0/7) | aria-os 고유 이름 |

## Navigation

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| Anchor | navigation | 페이지 내 앵커 네비게이션 | ❌ | A (1/7) | |
| AppBar/Header | navigation | 최상단 앱 바 | ❌ | M (1/7) | aria-os는 PanelHeader |
| BottomNavigation | navigation | 모바일 하단 탭 바 | ❌ | M (1/7) | |
| Breadcrumb | navigation | 경로 탐색 | ✅ | S R M A C N (6/7) | |
| Link | navigation | 하이퍼링크 | ✅ | S M A (3/7) | |
| Menubar | navigation | 수평 메뉴 바 | ✅ | S R M A (4/7) | |
| NavigationMenu | navigation | 다단계 네비게이션 메뉴 | ❌ | S R (2/7) | aria-os는 NavList로 부분 커버 |
| NavList/NavLink | navigation | 사이드바 네비게이션 목록 | ✅ NavList | N (1/7) | |
| Pagination | navigation | 페이지 번호 이동 | ❌ | S M A C N (5/7) | |
| Sidebar/AppShell | navigation | 앱 사이드바/셸 | ❌ | S N (2/7) | |
| SpeedDial | navigation | 플로팅 액션 모음 | ❌ | M (1/7) | |
| Stepper/Steps | navigation | 단계별 진행 표시 | ❌ | M A C N (4/7) | aria-os에 StepWizard(composite) |
| Tabs | navigation | 탭 전환 | ✅ TabGroup, TabList, ViewerTabList | S R M A C N H (7/7) | |
| TocNavList | navigation | 목차 네비게이션 | ✅ | (0/7) | aria-os 고유 |
| Tour | navigation | 가이드 투어 | ❌ | A (1/7) | |

## Input

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| Autocomplete/Combobox | input | 자동완성 입력 | ✅ Combobox | S R M A C N H (7/7) | |
| Button | input | 클릭 트리거 | ✅ | S R M A C N H (7/7) | |
| ButtonGroup/ButtonToolbar | input | 버튼 그룹 | ✅ ButtonToolbar | M A (2/7) | |
| Cascader | input | 다단계 선택 | ❌ | A (1/7) | |
| Checkbox | input | 체크 선택 | ✅ Checkbox, CheckboxMixed | S R M A C N H (7/7) | |
| ColorPicker/ColorInput | input | 색상 선택 | ❌ | A C N (3/7) | |
| DatePicker | input | 날짜 선택 | ✅ | S M A C N (5/7) | |
| Editable | input | 인라인 텍스트 편집 | ❌ | C (1/7) | |
| Fieldset | input | 필드 그룹 래퍼 | ❌ | H N (2/7) | |
| FileUpload/FileButton | input | 파일 업로드 | ❌ | C N (2/7) | |
| Form | input | 폼 컨테이너/검증 | ✅ | S R M A (4/7) | |
| Input/TextInput | input | 단일 행 텍스트 입력 | ✅ TextInput | S M A N H (5/7) | |
| InputOTP/PinInput | input | OTP/PIN 코드 입력 | ❌ | S C N (3/7) | |
| Label | input | 필드 레이블 | ❌ | S R (2/7) | aria-os는 자동 연결 |
| Mentions | input | @멘션 입력 | ❌ | A (1/7) | |
| NumberInput/Spinbutton | input | 숫자 입력/스피너 | ✅ Spinbutton | A C N (3/7) | |
| PasswordInput | input | 비밀번호 입력 | ❌ | N (1/7) | |
| RadioGroup | input | 라디오 단일 선택 | ✅ RadioGroup, RadioGroupActivedescendant | S R M A C N H (7/7) | |
| Rating/Rate | input | 별점 평가 | ❌ | M A C N (4/7) | |
| RichTextEditor | input | 리치 텍스트 편집기 | ❌ | C (1/7) | aria-os는 Composer |
| SearchResults | input | 검색 결과 표시 | ✅ | (0/7) | aria-os 고유 |
| SegmentedControl | input | 세그먼트 선택 | ❌ | A C N (3/7) | |
| Select | input | 드롭다운 선택 | ❌ | S R M A C N H (7/7) | aria-os는 Combobox로 커버 |
| Slider | input | 범위 슬라이더 | ✅ | S R M A C N (6/7) | |
| Switch | input | 토글 스위치 | ✅ SwitchGroup | S R M A C N H (7/7) | |
| TagsInput/PillsInput | input | 태그 입력 | ❌ | C N (2/7) | |
| Textarea | input | 다중 행 텍스트 입력 | ❌ | S A C N H (5/7) | aria-os TextInput으로 커버 가능 |
| Toggle | input | 토글 버튼 | ✅ Toggle, ButtonToggle | S R (2/7) | |
| ToggleGroup | input | 토글 버튼 그룹 | ✅ | S R (2/7) | |
| Transfer | input | 좌우 이동 선택 | ❌ | A (1/7) | |
| TreeSelect | input | 트리형 선택 | ❌ | A (1/7) | |
| Upload | input | 파일 업로드 | ❌ | A (1/7) | |

## Display

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| Accordion/Collapsible | display | 접기/펼치기 | ✅ Accordion, DisclosureGroup | S R M A C N (6/7) | |
| Avatar | display | 사용자 아바타 | ✅ | S R M A C N (6/7) | |
| Badge | display | 숫자/상태 배지 | ✅ | S M A C N (5/7) | |
| Blockquote | display | 인용 블록 | ❌ | N (1/7) | |
| Calendar/CalendarGrid | display | 달력 그리드 | ✅ CalendarGrid | S M A C N (5/7) | |
| Card (display) | display | 정보 카드 | ❌ | S M A C N (5/7) | ax() surface로 대체 |
| Carousel | display | 슬라이드 캐러셀 | ❌ | S A C N (4/7) | |
| Chart | display | 차트/그래프 | ❌ | S M (2/7) | |
| Tag/Chip | display | 태그/칩 라벨 | ❌ | M A (2/7) | |
| Clipboard/CopyButton | display | 클립보드 복사 | ❌ | C N (2/7) | |
| CodeBlock | display | 코드 하이라이팅 | ✅ CodeBlock, VirtualCodeBlock | N (1/7) | |
| DataList/Descriptions | display | 키-값 쌍 표시 | ❌ | A C (2/7) | aria-os는 PropertyRow |
| EmptyState | display | 빈 상태 안내 | ✅ | C (1/7) | |
| Feed | display | 무한 스크롤 피드 | ✅ Feed, StreamFeed | (0/7) | aria-os 고유 |
| FileIcon | display | 파일 아이콘 | ✅ | (0/7) | aria-os 고유 |
| FilePreview | display | 파일 미리보기 | ✅ FilePreview, FileViewer | (0/7) | aria-os 고유 |
| FrontmatterCard | display | 프론트매터 카드 | ✅ | (0/7) | aria-os 고유 |
| Heading/Title | display | 제목 텍스트 | ❌ | C N (2/7) | |
| Highlight/Mark | display | 텍스트 하이라이트 | ❌ | N (1/7) | |
| Icon/ThemeIcon | display | 아이콘 표시 | ❌ | M N (2/7) | aria-os indicators/ |
| Image | display | 이미지 표시 | ❌ | A N (2/7) | |
| Kbd | display | 키보드 단축키 표시 | ✅ | N (1/7) | |
| List | display | 목록 표시 | ✅ ListBox, ListBoxGrouped | M A N (3/7) | |
| MarkdownViewer | display | 마크다운 렌더링 | ✅ | (0/7) | aria-os 고유 |
| Meter | display | 측정값 표시 | ✅ | (0/7) | aria-os 고유 |
| QRCode | display | QR 코드 생성 | ❌ | A C (2/7) | |
| Spoiler | display | 스포일러 토글 | ❌ | N (1/7) | |
| Statistic/Stat | display | 통계 수치 표시 | ❌ | A C (2/7) | aria-os StatGrid(composite) |
| Table/DataGrid | display | 테이블/데이터 그리드 | ✅ Table, Grid, TreeGrid, WriterTreeGrid | S M A C N (5/7) | |
| Timeline | display | 타임라인 표시 | ❌ | M A C N (4/7) | |
| Tooltip | display | 툴팁 | ✅ | S R M A C N (6/7) | |
| Tree/TreeView | display | 트리 구조 표시 | ✅ TreeView, FileTreeView | M A C N (4/7) | |
| Typography/Text | display | 타이포그래피 유틸 | ❌ | M A C N (4/7) | |

## Feedback

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| Alert | feedback | 정적 알림 메시지 | ✅ | S M A C N (5/7) | |
| Loader/Spinner/Spin | feedback | 로딩 스피너 | ❌ | A C N (3/7) | |
| LoadingOverlay/Backdrop | feedback | 전체 로딩 오버레이 | ❌ | M N (2/7) | |
| Progress (bar) | feedback | 진행률 바 | ✅ | S R M A C N (6/7) | |
| Result | feedback | 작업 결과 페이지 | ❌ | A (1/7) | |
| RingProgress | feedback | 원형 진행률 | ❌ | N (1/7) | |
| Skeleton | feedback | 로딩 스켈레톤 | ✅ | S M A C N (5/7) | |
| Toast/Snackbar/Notification | feedback | 임시 알림 | ✅ Toaster | S M A C N (5/7) | |
| Watermark | feedback | 워터마크 | ❌ | A (1/7) | |

## Overlay

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| AlertDialog | overlay | 확인/취소 다이얼로그 | ✅ | S R (2/7) | |
| Command/QuickOpen | overlay | 커맨드 팔레트 | ✅ QuickOpen | S (1/7) | |
| ContextMenu | overlay | 우클릭 메뉴 | ❌ | S R (2/7) | aria-os는 MenuList |
| Dialog/Modal | overlay | 모달 다이얼로그 | ✅ Dialog, RouteModal, FileViewerModal | S R M A C N H (7/7) | |
| Drawer/Sheet | overlay | 슬라이드 패널 | ❌ | S M A C N (5/7) | |
| DropdownMenu | overlay | 드롭다운 메뉴 | ✅ MenuButton, MenuList, MenuActivedescendant | S R A H (4/7) | |
| FloatButton/Fab | overlay | 플로팅 액션 버튼 | ❌ | M A (2/7) | |
| HoverCard | overlay | 호버 카드 | ❌ | S R C (3/7) | |
| Lightbox | overlay | 이미지 라이트박스 | ✅ | (0/7) | aria-os 고유 |
| Popconfirm | overlay | 확인 팝오버 | ❌ | A (1/7) | |
| Popover | overlay | 팝오버 | ❌ | S R M A C N (6/7) | |
| SelectionOverlay | overlay | 선택 오버레이 | ✅ | (0/7) | aria-os 고유 |

## Data

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| FilterBar | data | 필터 도구 모음 | ✅ | (0/7) | aria-os 고유 |
| Kanban | data | 칸반 보드 | ✅ | (0/7) | aria-os 고유 |
| MillerColumns | data | 밀러 컬럼 탐색 | ✅ | (0/7) | aria-os 고유 |
| PipelineGrid | data | 파이프라인 그리드 | ✅ | (0/7) | aria-os 고유 |
| SpatialView | data | 공간 뷰 | ✅ | (0/7) | aria-os 고유 |
| SpreadReader | data | 스프레드시트 리더 | ✅ | (0/7) | aria-os 고유 |
| Workspace | data | 워크스페이스 레이아웃 | ✅ | (0/7) | aria-os 고유 |
| ZoomPanCanvas | data | 줌/팬 캔버스 | ✅ | (0/7) | aria-os 고유 |

## Utility

| Concept | Category | 용도 | 보유 | 출현 | 비고 |
|---------|----------|------|------|------|------|
| Indicator/FloatingIndicator | utility | 상태 표시 인디케이터 | ✅ (22 indicators) | N (1/7) | |
| Portal | utility | DOM 포탈 렌더링 | ❌ | N (1/7) | |
| Toolbar | utility | 도구 모음 컨테이너 | ✅ Toolbar, ButtonToolbar | R M (2/7) | |
| Transition | utility | 전환 애니메이션 | ❌ | M H (2/7) | |
| VisuallyHidden | utility | 시각적 숨김 (접근성) | ❌ | N (1/7) | |

---

## GAP Summary

### 4+ 라이브러리에 존재하지만 aria-os 미보유

| Concept | 출현 | 평가 | 사유 |
|---------|------|------|------|
| ~~Select~~ | 7/7 | ✅ 완료 | select 패턴 + SelectItem |
| ~~Pagination~~ | 5/7 | ✅ 완료 | toolbar 패턴 + PaginationItem |
| ~~Card~~ | 5/7 | ✅ 완료 | ax() surface 경량 컨테이너 |
| ~~Drawer~~ | 5/7 | ✅ 완료 | dialog 기반 슬라이드 패널 |
| ~~Popover~~ | 6/7 | ✅ 완료 | Popover API + anchor positioning |
| ~~Carousel~~ | 4/7 | ✅ 완료 | tabs 패턴 + CarouselItem |
| ~~Stepper~~ | 4/7 | ✅ 완료 | tabsManual + StepperItem |
| ~~Rating~~ | 4/7 | ✅ 완료 | radiogroup + StarIndicator |
| ~~Timeline~~ | 4/7 | ✅ 완료 | listbox + TimelineItem |
| Typography/Text | 4/7 | 선택 | ax() 텍스트 축으로 대체 가능 |
| Group/Stack/Flex | 4/7 | 선택 | CSS 유틸, ax() layout 축으로 대체 |
| ~~Textarea~~ | 5/7 | ✅ 완료 | 자동 리사이즈 다중 행 입력 |

### 3 라이브러리에 존재하지만 aria-os 미보유

| Concept | 출현 | 평가 | 사유 |
|---------|------|------|------|
| **ColorPicker** | 3/7 | 선택 | 디자인 도구에서 필요 |
| **HoverCard** | 3/7 | 선택 | 프로필 프리뷰 등 |
| **InputOTP/PinInput** | 3/7 | 선택 | 인증 UI |
| **Loader/Spinner** | 3/7 | 권장 | 기본 로딩 표시, indicators로 부분 커버 |
| **SegmentedControl** | 3/7 | 권장 | ToggleGroup과 유사하나 다른 시각 |
| **Grid (Layout)** | 3/7 | 선택 | CSS Grid 유틸, FlatLayout으로 대체 |

---

## Coverage Stats

| Category | 전체 | 보유 | 커버리지 |
|----------|------|------|----------|
| Layout | 13 | 6 | 46% |
| Navigation | 15 | 9 | 60% |
| Input | 33 | 19 | 58% |
| Display | 29 | 19 | 66% |
| Feedback | 9 | 5 | 56% |
| Overlay | 12 | 9 | 75% |
| Data | 8 | 8 | 100% |
| Utility | 5 | 2 | 40% |
| **Total** | **124** | **75** | **60%** |

> **Note**: 2026-04-14 — 10개 GAP 컴포넌트 일괄 구현으로 52% → 60% 달성. 남은 GAP은 ax()로 대체 가능한 CSS 유틸(Typography, Stack)뿐.
